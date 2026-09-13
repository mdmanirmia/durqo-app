-- ============================================================
-- Durqo — payout-processing policy v2 (site owner, Sep 13 2026).
--
-- Three independent additions, bundled in one migration since they all
-- touch the same withdrawal system:
--
-- 1. Expand withdrawal_requests.status from the 4-value model
--    (pending/approved/rejected/paid) to the 9-value model the owner
--    specified: requested, under_review, action_required, approved,
--    processing, paid, on_hold, rejected, cancelled. Existing rows are
--    migrated 1:1 (pending -> requested, everything else keeps its name)
--    so no historical data is reinterpreted or lost.
--
-- 2. An append-only audit trail (withdrawal_status_history), mirroring
--    the asset_transfer_events pattern (036_asset_transfer_system_tables.sql)
--    that withdrawals never had — every status change records who did it,
--    what it was before/after, why, and any provider reference, instead of
--    just overwriting reviewed_at/paid_at/admin_note in place. Also adds
--    reviewed_by and payout_reference columns directly on the row for
--    convenient display without a join to the latest history entry.
--
-- 3. A payout-verification gate, deliberately SEPARATE from the existing
--    public "Verified" badge (profiles.is_verified /
--    verification_status — 007_seller_verification.sql). The owner's
--    policy explicitly distinguishes "optional, for the public badge" from
--    "required, before withdrawal" — reusing is_verified for both would
--    collapse that distinction, so this adds its own
--    profiles.payout_verified flag instead. Both flags currently share the
--    same underlying identity-document submission (there's no separate
--    upload flow being built here — see the plan doc's open question #2);
--    an admin can grant/revoke payout_verified independently of the badge
--    decision from the existing verification review screen.
-- ============================================================

-- ---- 1. Status enum expansion ----------------------------------------

alter table public.withdrawal_requests drop constraint if exists withdrawal_requests_status_check;

update public.withdrawal_requests set status = 'requested' where status = 'pending';

alter table public.withdrawal_requests
  add constraint withdrawal_requests_status_check
  check (status in (
    'requested', 'under_review', 'action_required', 'approved',
    'processing', 'paid', 'on_hold', 'rejected', 'cancelled'
  ));

alter table public.withdrawal_requests alter column status set default 'requested';

-- ---- 2. Audit trail + convenience columns -----------------------------

alter table public.withdrawal_requests
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists payout_reference text,
  add column if not exists hold_reason text;

create table if not exists public.withdrawal_status_history (
  id uuid primary key default uuid_generate_v4(),
  withdrawal_id uuid not null references public.withdrawal_requests(id) on delete cascade,
  admin_id uuid references public.profiles(id),
  previous_status text,
  new_status text not null,
  reason text,
  payout_reference text,
  created_at timestamptz not null default now()
);

create index if not exists withdrawal_status_history_withdrawal_idx on public.withdrawal_status_history(withdrawal_id, created_at);

alter table public.withdrawal_status_history enable row level security;

-- Sellers can see the history of their own requests (read-only, mirrors
-- withdrawal_requests_select_own); only the service-role admin client
-- (setWithdrawalStatus() in dashboard/admin/actions.ts) ever writes here.
drop policy if exists "withdrawal_status_history_select_own" on public.withdrawal_status_history;
create policy "withdrawal_status_history_select_own" on public.withdrawal_status_history for select
  using (exists (
    select 1 from public.withdrawal_requests wr
    where wr.id = withdrawal_id and wr.seller_id = auth.uid()
  ));

-- Backfill one history row per existing request so the audit trail isn't
-- empty for pre-migration data — best-effort only (no admin_id exists for
-- these historical rows, since that wasn't tracked before this migration).
insert into public.withdrawal_status_history (withdrawal_id, previous_status, new_status, reason, created_at)
select id, null, status, admin_note, coalesce(reviewed_at, paid_at, requested_at)
from public.withdrawal_requests wr
where not exists (
  select 1 from public.withdrawal_status_history h where h.withdrawal_id = wr.id
);

-- ---- 3. Payout-verification gate --------------------------------------

alter table public.profiles
  add column if not exists payout_verified boolean not null default false,
  add column if not exists payout_verified_at timestamptz;

-- Grandfather: a seller who was already paid out at least once under the
-- old (no-gate) system has already been manually reviewed by an admin
-- (setWithdrawalStatus()) and proven able to receive funds — gating them
-- retroactively the moment this migration runs would lock out an
-- already-active, already-trusted seller with no warning. New sellers (and
-- anyone whose only requests are still pending/rejected) go through the
-- gate normally. Idempotent: only ever turns this on, never off, and only
-- for sellers not already payout_verified.
update public.profiles p
set payout_verified = true, payout_verified_at = now()
where not p.payout_verified
  and exists (
    select 1 from public.withdrawal_requests wr
    where wr.seller_id = p.id and wr.status = 'paid'
  );

-- Every non-rejected order still excludes escrow_com (035) — this only adds
-- the payout-verification check on top, so a seller with no completed
-- balance still gets "nothing to withdraw" rather than a confusing
-- verification error, and a seller who isn't payout-verified gets a clear,
-- specific message rather than a generic RPC failure.
create or replace function public.create_withdrawal_request(
  p_payout_method text,
  p_payout_details text,
  p_bdt_rate numeric default null
) returns public.withdrawal_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid := auth.uid();
  v_payout_verified boolean;
  v_gross numeric(12,2) := 0;
  v_fee numeric(12,2) := 0;
  v_count int := 0;
  v_net numeric(12,2) := 0;
  v_request public.withdrawal_requests;
  v_is_mfs boolean;
  v_method_label text;
  v_daily_usd numeric(12,2);
  v_monthly_usd numeric(12,2);
  v_cap_usd numeric(12,2);
  v_remaining_cap numeric(12,2);
  v_rate numeric;
  v_claim_gross numeric(12,2);
  v_claim_fee numeric(12,2);
  v_claim_net numeric(12,2);
  v_claim_order_ids uuid[] := '{}';
  v_claim_gross_arr numeric(12,2)[] := '{}';
  v_claim_fee_arr numeric(12,2)[] := '{}';
  v_claim_net_arr numeric(12,2)[] := '{}';
  r record;
begin
  if v_seller_id is null then
    raise exception 'Not signed in.';
  end if;

  select payout_verified into v_payout_verified from public.profiles where id = v_seller_id;
  if not coalesce(v_payout_verified, false) then
    raise exception 'Payout verification is required before your first withdrawal. Submit your identity documents from the Verification page and our team will review them.';
  end if;

  if p_payout_method not in ('bank_transfer', 'bkash', 'rocket', 'nagad', 'paypal', 'wise', 'other') then
    raise exception 'Invalid payout method.';
  end if;
  if p_payout_details is null or length(trim(p_payout_details)) = 0 then
    raise exception 'Payout details are required.';
  end if;

  v_is_mfs := p_payout_method in ('bkash', 'rocket', 'nagad');
  v_method_label := case p_payout_method
    when 'bkash' then 'bKash'
    when 'rocket' then 'Rocket'
    when 'nagad' then 'Nagad'
    else p_payout_method
  end;
  if v_is_mfs and (p_bdt_rate is null or p_bdt_rate <= 0) then
    raise exception 'Could not verify the current exchange rate — please try again.';
  end if;

  perform 1 from public.orders
    where seller_id = v_seller_id and status = 'completed' and payment_channel <> 'escrow_com'
    for update;

  if v_is_mfs then
    select coalesce(sum(net_amount), 0) into v_daily_usd
      from public.withdrawal_requests
      where seller_id = v_seller_id
        and payout_method = p_payout_method
        and status <> 'rejected' and status <> 'cancelled'
        and requested_at >= date_trunc('day', now());

    select coalesce(sum(net_amount), 0) into v_monthly_usd
      from public.withdrawal_requests
      where seller_id = v_seller_id
        and payout_method = p_payout_method
        and status <> 'rejected' and status <> 'cancelled'
        and requested_at >= date_trunc('month', now());

    v_cap_usd := least(
      greatest(0, 50000 - v_daily_usd * p_bdt_rate) / p_bdt_rate,
      greatest(0, 300000 - v_monthly_usd * p_bdt_rate) / p_bdt_rate
    );

    if v_cap_usd <= 0 then
      raise exception 'You have reached your % withdrawal limit for today or this month — please try again later.', v_method_label;
    end if;
  end if;

  for r in
    select * from (
      select
        o.id,
        o.created_at,
        o.amount as gross_amount,
        public.order_success_fee(o.amount) as fee_amount,
        o.amount - public.order_success_fee(o.amount) as net_amount,
        o.amount - coalesce(c.gross, 0) as remaining_gross,
        public.order_success_fee(o.amount) - coalesce(c.fee, 0) as remaining_fee,
        (o.amount - public.order_success_fee(o.amount)) - coalesce(c.net, 0) as remaining_net
      from public.orders o
      left join lateral (
        select sum(wro.gross_amount) as gross, sum(wro.fee_amount) as fee, sum(wro.net_amount) as net
        from public.withdrawal_request_orders wro
        join public.withdrawal_requests wr on wr.id = wro.withdrawal_id
        where wro.order_id = o.id and wr.status <> 'rejected' and wr.status <> 'cancelled'
      ) c on true
      where o.seller_id = v_seller_id and o.status = 'completed' and o.payment_channel <> 'escrow_com'
    ) x
    where x.remaining_net > 0
    order by x.created_at asc, x.id asc
  loop
    if v_is_mfs then
      v_remaining_cap := v_cap_usd - v_net;
      exit when v_remaining_cap <= 0;

      if r.remaining_net <= v_remaining_cap then
        v_claim_gross := r.remaining_gross;
        v_claim_fee := r.remaining_fee;
        v_claim_net := r.remaining_net;
      else
        v_rate := r.fee_amount / r.gross_amount;
        v_claim_net := v_remaining_cap;
        v_claim_gross := round(v_claim_net / (1 - v_rate), 2);
        v_claim_fee := v_claim_gross - v_claim_net;

        if v_claim_gross > r.remaining_gross then
          v_claim_gross := r.remaining_gross;
          v_claim_fee := r.remaining_fee;
          v_claim_net := r.remaining_net;
        end if;
      end if;
    else
      v_claim_gross := r.remaining_gross;
      v_claim_fee := r.remaining_fee;
      v_claim_net := r.remaining_net;
    end if;

    if v_claim_net <= 0 then
      continue;
    end if;

    v_claim_order_ids := v_claim_order_ids || r.id;
    v_claim_gross_arr := v_claim_gross_arr || v_claim_gross;
    v_claim_fee_arr := v_claim_fee_arr || v_claim_fee;
    v_claim_net_arr := v_claim_net_arr || v_claim_net;

    v_count := v_count + 1;
    v_gross := v_gross + v_claim_gross;
    v_fee := v_fee + v_claim_fee;
    v_net := v_net + v_claim_net;
  end loop;

  if v_count = 0 then
    raise exception 'No completed orders are available to withdraw.';
  end if;

  insert into public.withdrawal_requests (seller_id, gross_amount, success_fee_amount, net_amount, order_count, payout_method, payout_details, status)
  values (v_seller_id, v_gross, v_fee, v_net, v_count, p_payout_method, trim(p_payout_details), 'requested')
  returning * into v_request;

  insert into public.withdrawal_request_orders (withdrawal_id, order_id, gross_amount, fee_amount, net_amount)
  select v_request.id, t.oid, t.g, t.f, t.n
  from unnest(v_claim_order_ids, v_claim_gross_arr, v_claim_fee_arr, v_claim_net_arr) as t(oid, g, f, n);

  insert into public.withdrawal_status_history (withdrawal_id, previous_status, new_status, reason)
  values (v_request.id, null, 'requested', null);

  return v_request;
end;
$$;

grant execute on function public.create_withdrawal_request(text, text, numeric) to authenticated;

-- order_remaining_balances (035) already filters on wr.status <> 'rejected'
-- for claimed-amount exclusion — 'cancelled' must be excluded the same way
-- (a cancelled request releases its claimed orders back to the seller,
-- same as a rejected one), so this view needs the same status list.
create or replace view public.order_remaining_balances
with (security_invoker = true) as
select
  o.id as order_id,
  o.seller_id,
  o.created_at,
  o.payment_channel,
  o.amount as gross_amount,
  public.order_success_fee(o.amount) as fee_amount,
  o.amount - public.order_success_fee(o.amount) as net_amount,
  coalesce(c.gross, 0) as claimed_gross,
  coalesce(c.fee, 0) as claimed_fee,
  coalesce(c.net, 0) as claimed_net,
  o.amount - coalesce(c.gross, 0) as remaining_gross,
  public.order_success_fee(o.amount) - coalesce(c.fee, 0) as remaining_fee,
  (o.amount - public.order_success_fee(o.amount)) - coalesce(c.net, 0) as remaining_net
from public.orders o
left join lateral (
  select sum(wro.gross_amount) as gross, sum(wro.fee_amount) as fee, sum(wro.net_amount) as net
  from public.withdrawal_request_orders wro
  join public.withdrawal_requests wr on wr.id = wro.withdrawal_id
  where wro.order_id = o.id and wr.status <> 'rejected' and wr.status <> 'cancelled'
) c on true
where o.status = 'completed'
  and o.payment_channel <> 'escrow_com';

grant select on public.order_remaining_balances to authenticated;

-- A seller can cancel their own request, but only before an admin has
-- started acting on it (requested/under_review) — once it's approved/
-- processing/paid/action_required/on_hold, only an admin can move it
-- (setWithdrawalStatus() in dashboard/admin/actions.ts). Releases claimed
-- orders back to the seller's balance automatically via the view/RPC
-- exclusion above, same mechanism as a rejection.
create or replace function public.cancel_withdrawal_request(p_request_id uuid) returns public.withdrawal_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid := auth.uid();
  v_request public.withdrawal_requests;
begin
  if v_seller_id is null then
    raise exception 'Not signed in.';
  end if;

  select * into v_request from public.withdrawal_requests where id = p_request_id and seller_id = v_seller_id;
  if v_request.id is null then
    raise exception 'Withdrawal request not found.';
  end if;
  if v_request.status not in ('requested', 'under_review') then
    raise exception 'This request is already being processed and can no longer be cancelled yourself — contact support@durqo.com.';
  end if;

  update public.withdrawal_requests set status = 'cancelled' where id = p_request_id returning * into v_request;
  insert into public.withdrawal_status_history (withdrawal_id, previous_status, new_status, reason)
  values (p_request_id, 'requested', 'cancelled', 'Cancelled by seller');

  return v_request;
end;
$$;

grant execute on function public.cancel_withdrawal_request(uuid) to authenticated;
