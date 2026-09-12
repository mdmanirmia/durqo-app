-- ============================================================
-- Durqo — reverse the Sep 10, 2026 decision to include Escrow.com orders
-- in a seller's withdrawable balance.
--
-- 028_withdrawals.sql knowingly accepted a double-payment risk: Escrow.com
-- pays the seller directly once it releases funds, so an escrow_com order
-- counting toward a Durqo-approved withdrawal too meant a seller could
-- get paid twice for the same sale, with no automatic reconciliation
-- against Escrow.com's own records. The only mitigation was a fully
-- manual admin review that could see the escrow_com split before
-- approving (AdminWithdrawalsTable).
--
-- The Asset Transfer System v2 spec (Sep 2026) requires the opposite:
-- "Durqo must not create another seller payout" for escrow-settled
-- orders — the licensed provider's own release is the only payout event,
-- full stop. Site owner confirmed reversing the Sep 10 decision rather
-- than carving out an exception in the new spec (see the Asset Transfer
-- System v2 feasibility report, Section 2.1).
--
-- This is a going-forward change only. It does NOT touch any existing
-- withdrawal_requests / withdrawal_request_orders rows — an escrow_com
-- order that was already claimed by a past withdrawal (approved or paid)
-- stays claimed; unwinding an already-approved/paid withdrawal is a real
-- money reconciliation decision for the site owner to make by hand
-- (via the existing Admin > Withdrawals view, which already surfaces the
-- escrow_com-vs-other-channel split per request), not something this
-- migration attempts to script. Before relying on the "no escrow_com
-- exposure left" assumption anywhere, check that view for any pre-
-- existing escrow_com-tagged claims.
--
-- Two places currently decide what counts toward a seller's balance, and
-- both need the same exclusion or they'd disagree with each other:
--   1. order_remaining_balances (033) — the read-side view
--      getAvailableBalance() (earnings.client.ts) uses to show a seller
--      their available balance and drive escrowComOrderCount (which,
--      after this migration, will always be 0 going forward — the
--      Escrow.com risk banners in AdminWithdrawalsTable and
--      dashboard/seller/earnings/page.tsx simply stop firing for any
--      NEW request, and can be treated as dead code for new data, though
--      they're left in place since they still describe pre-existing
--      claims correctly).
--   2. create_withdrawal_request() (033) — the write-side RPC that
--      actually claims orders into a new withdrawal request. This is the
--      one that matters most: even if the view were somehow bypassed,
--      this function is the only path that can ever create a new claim.
-- ============================================================

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
  where wro.order_id = o.id and wr.status <> 'rejected'
) c on true
where o.status = 'completed'
  and o.payment_channel <> 'escrow_com';

grant select on public.order_remaining_balances to authenticated;

-- Same signature as 033 — straight create or replace, no migration to
-- callers needed.
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

  -- Lock every completed, non-escrow_com order this seller has — same
  -- locking shape as 033, with the new exclusion so a concurrent call
  -- can't race to claim an escrow_com order between this lock and the
  -- claiming loop below.
  perform 1 from public.orders
    where seller_id = v_seller_id and status = 'completed' and payment_channel <> 'escrow_com'
    for update;

  if v_is_mfs then
    select coalesce(sum(net_amount), 0) into v_daily_usd
      from public.withdrawal_requests
      where seller_id = v_seller_id
        and payout_method = p_payout_method
        and status <> 'rejected'
        and requested_at >= date_trunc('day', now());

    select coalesce(sum(net_amount), 0) into v_monthly_usd
      from public.withdrawal_requests
      where seller_id = v_seller_id
        and payout_method = p_payout_method
        and status <> 'rejected'
        and requested_at >= date_trunc('month', now());

    v_cap_usd := least(
      greatest(0, 50000 - v_daily_usd * p_bdt_rate) / p_bdt_rate,
      greatest(0, 300000 - v_monthly_usd * p_bdt_rate) / p_bdt_rate
    );

    if v_cap_usd <= 0 then
      raise exception 'You have reached your % withdrawal limit for today or this month — please try again later.', v_method_label;
    end if;
  end if;

  -- Oldest orders first (FIFO), excluding escrow_com — Escrow.com's own
  -- release is the only payout event for those orders; Durqo must never
  -- create a second one.
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
        where wro.order_id = o.id and wr.status <> 'rejected'
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

  insert into public.withdrawal_requests (seller_id, gross_amount, success_fee_amount, net_amount, order_count, payout_method, payout_details)
  values (v_seller_id, v_gross, v_fee, v_net, v_count, p_payout_method, trim(p_payout_details))
  returning * into v_request;

  insert into public.withdrawal_request_orders (withdrawal_id, order_id, gross_amount, fee_amount, net_amount)
  select v_request.id, t.oid, t.g, t.f, t.n
  from unnest(v_claim_order_ids, v_claim_gross_arr, v_claim_fee_arr, v_claim_net_arr) as t(oid, g, f, n);

  return v_request;
end;
$$;

grant execute on function public.create_withdrawal_request(text, text, numeric) to authenticated;
