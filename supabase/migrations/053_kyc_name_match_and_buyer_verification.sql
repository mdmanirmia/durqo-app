-- ============================================================
-- Durqo — KYC policy (site owner, Sep 2026):
--   1. Identity Verification (KYC) is required before a seller's first
--      withdrawal.  <- ALREADY true (profiles.payout_verified,
--      045_payout_policy_v2.sql). Nothing to add here.
--   2. Buyers may be asked to complete identity or funds verification
--      when required by the selected payment provider, transaction
--      value, or Durqo's risk review.  <- NEW. No buyer-side
--      verification system exists at all today.
--   3. A seller's verified name must match their payout account
--      holder name.  <- NEW. Today there is no structured "legal
--      name" captured at verification time, and payout_details is a
--      single free-text blob — nothing to reliably compare.
--
-- Owner's explicit decisions (both "admin manual review", never an
-- automatic block):
--   - Name-match: shown side-by-side to the admin reviewing a
--     withdrawal; admin puts the request on hold / asks for action if
--     it looks wrong. No DB-level enforcement — the mismatch check
--     itself is computed client-side in AdminWithdrawalsTable.tsx, not
--     here, so it can be refined without a migration.
--   - Buyer verification: admin flags a specific order (high value,
--     risk signal, or provider requirement), buyer uploads documents,
--     admin reviews. Payout for that order is held (excluded from
--     create_withdrawal_request()'s claimable set) until resolved —
--     mirrors the escrow_com exclusion pattern (035) rather than
--     touching checkout or the Asset Transfer flow at all.
-- ============================================================

-- ---- 1. Structured name fields ----------------------------------------

-- Captured once, at seller-verification submission time (see
-- submitVerification() in dashboard/seller/verification/actions.ts) —
-- "exactly as it appears on the ID document", distinct from
-- profiles.full_name (which is just whatever the seller typed at
-- signup and can be changed freely from Account Settings).
alter table public.profiles
  add column if not exists legal_name text;

-- Captured once per withdrawal request, at submission time. The seller
-- earnings form already collects an "Account Name"/"Account Holder
-- Name" field per payout method (bank/bKash/Rocket/Nagad already had
-- one; PayPal/Wise are extended in the same app change to have one
-- too) and folds it into the existing payout_details free-text blob —
-- this column duplicates just that one value in structured form so it
-- can be shown next to legal_name without parsing payout_details.
alter table public.withdrawal_requests
  add column if not exists payout_account_holder_name text;

-- ---- 2. Buyer identity/funds verification ------------------------------

create table if not exists public.order_verifications (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id),
  status text not null default 'requested' check (status in ('requested', 'submitted', 'verified', 'rejected')),
  -- Why the admin flagged this order — shown to the buyer so they know
  -- what's being asked of them (e.g. "Order value over $50,000",
  -- "Payment provider requires ID verification for this transaction").
  reason text,
  document_paths text[] not null default '{}',
  requested_by uuid references public.profiles(id),
  requested_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now()
);

create index if not exists order_verifications_buyer_idx on public.order_verifications(buyer_id);

alter table public.order_verifications enable row level security;

-- Read-only for the people involved in the order — mirrors the asset
-- transfer system's own read policies. No client insert/update/delete
-- policy at all: every write goes through requestBuyerVerification()/
-- reviewBuyerVerification() (admin/actions.ts, service-role client) or
-- submit_buyer_verification() below (SECURITY DEFINER RPC) — same
-- "zero permissive client-write policy" choice the Asset Transfer
-- System made for its own tables, deliberately not reusing the more
-- permissive orders_update_involved pattern already flagged as a gap
-- elsewhere.
drop policy if exists "order_verifications_select_involved" on public.order_verifications;
create policy "order_verifications_select_involved" on public.order_verifications for select
  using (
    buyer_id = auth.uid()
    or exists (select 1 from public.orders o where o.id = order_id and o.seller_id = auth.uid())
  );

insert into storage.buckets (id, name, public)
values ('buyer-verification', 'buyer-verification', false)
on conflict (id) do nothing;

-- Path convention: buyer-verification/<uid>/<timestamp>-<filename> —
-- identical owner-scoped pattern to seller-verification (007).
create policy "buyer_verification_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'buyer-verification'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "buyer_verification_owner_select"
  on storage.objects for select
  using (
    bucket_id = 'buyer-verification'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "buyer_verification_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'buyer-verification'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Buyer submits their documents. Only ever moves a 'requested' row to
-- 'submitted' for the order's own buyer — cannot be used to
-- self-verify, re-open a decided review, or touch anyone else's order.
create or replace function public.submit_buyer_verification(
  p_order_id uuid,
  p_document_paths text[]
) returns public.order_verifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid := auth.uid();
  v_row public.order_verifications;
begin
  if v_buyer_id is null then
    raise exception 'Not signed in.';
  end if;
  if not public.is_account_active(v_buyer_id) then
    raise exception 'Your account has been blocked. Contact Durqo support for help.';
  end if;
  if p_document_paths is null or array_length(p_document_paths, 1) is null then
    raise exception 'At least one document is required.';
  end if;

  select * into v_row from public.order_verifications where order_id = p_order_id;
  if v_row.id is null then
    raise exception 'No verification request found for this order.';
  end if;
  if v_row.buyer_id <> v_buyer_id then
    raise exception 'This verification request does not belong to you.';
  end if;
  if v_row.status <> 'requested' then
    raise exception 'This verification request is not awaiting submission (status=%).', v_row.status;
  end if;

  update public.order_verifications
  set document_paths = p_document_paths, status = 'submitted', submitted_at = now()
  where order_id = p_order_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.submit_buyer_verification(uuid, text[]) from public;
grant execute on function public.submit_buyer_verification(uuid, text[]) to authenticated;

-- ---- 3. create_withdrawal_request(): account-holder name + hold orders
--        whose buyer verification isn't resolved yet ------------------
--
-- Full function body copied from 052_block_prevents_writes.sql with two
-- changes: (a) a new p_payout_account_holder_name parameter, appended
-- with a default so this remains the same function (not a new
-- overload) — required going forward, validated below; (b) both order-
-- selection queries (the row-lock and the actual claim loop) now also
-- exclude any order with an unresolved buyer-verification request, the
-- same way they already exclude escrow_com orders (035). A seller isn't
-- penalized for this — the order's balance simply isn't claimable until
-- the buyer's verification is resolved, exactly like an escrow_com
-- order is never claimable at all.

create or replace function public.create_withdrawal_request(
  p_payout_method text,
  p_payout_details text,
  p_bdt_rate numeric default null,
  p_payout_account_holder_name text default null
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
  if not public.is_account_active(v_seller_id) then
    raise exception 'Your account has been blocked. Contact Durqo support for help.';
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
  if p_payout_account_holder_name is null or length(trim(p_payout_account_holder_name)) = 0 then
    raise exception 'Account holder name is required.';
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

  perform 1 from public.orders o
    where o.seller_id = v_seller_id and o.status = 'completed' and o.payment_channel <> 'escrow_com'
      and not exists (
        select 1 from public.order_verifications ov where ov.order_id = o.id and ov.status in ('requested', 'submitted')
      )
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
        and not exists (
          select 1 from public.order_verifications ov where ov.order_id = o.id and ov.status in ('requested', 'submitted')
        )
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

  insert into public.withdrawal_requests (seller_id, gross_amount, success_fee_amount, net_amount, order_count, payout_method, payout_details, payout_account_holder_name, status)
  values (v_seller_id, v_gross, v_fee, v_net, v_count, p_payout_method, trim(p_payout_details), trim(p_payout_account_holder_name), 'requested')
  returning * into v_request;

  insert into public.withdrawal_request_orders (withdrawal_id, order_id, gross_amount, fee_amount, net_amount)
  select v_request.id, t.oid, t.g, t.f, t.n
  from unnest(v_claim_order_ids, v_claim_gross_arr, v_claim_fee_arr, v_claim_net_arr) as t(oid, g, f, n);

  insert into public.withdrawal_status_history (withdrawal_id, previous_status, new_status, reason)
  values (v_request.id, null, 'requested', null);

  return v_request;
end;
$$;

revoke execute on function public.create_withdrawal_request(text, text, numeric, text) from public;
grant execute on function public.create_withdrawal_request(text, text, numeric, text) to authenticated;
