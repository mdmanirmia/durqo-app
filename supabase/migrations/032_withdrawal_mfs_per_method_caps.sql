-- ============================================================
-- Durqo — bKash/Rocket/Nagad withdrawal caps become per-method instead of
-- combined.
--
-- Product clarification (site owner, Sep 11 2026), after being confused by
-- a rejection while testing Rocket: "One people can withdraw 50,00 BDT
-- through bkash, 50,000 bdt through nagad, 50,000 bdt through rocket an
-- any amount through bank transfer or other methods." Confirmed explicitly
-- that the ৳300,000 monthly cap should also be per-method, not shared.
--
-- 030_withdrawal_mfs_limits.sql / 031_withdrawal_mfs_partial_claim.sql
-- summed bKash + Rocket + Nagad together against one shared ৳50,000/day
-- and ৳300,000/month allowance. That was never the intent — each of the
-- three methods should have its own fully independent ৳50,000/day and
-- ৳300,000/month allowance. A seller can now withdraw up to ৳50,000/day
-- via bKash AND up to ৳50,000/day via Rocket AND up to ৳50,000/day via
-- Nagad on the same day (up to ৳150,000/day total spread across all
-- three), not ৳50,000/day shared between them. Bank Transfer, PayPal and
-- Wise remain uncapped, as always.
--
-- The seller-facing copy on /dashboard/seller/earnings has actually read
-- this way ("Rocket withdrawals are limited to ৳50,000 per day and
-- ৳300,000 per month" — naming just the one selected method) since the
-- Sep 11 dynamic-rate update; only the backend enforcement was still
-- pooling all three together. This migration brings the enforcement in
-- line with the copy that was already shown.
--
-- Only functional change from 031: v_daily_usd/v_monthly_usd now filter
-- by `payout_method = p_payout_method` (this request's own method) instead
-- of `payout_method in ('bkash', 'rocket', 'nagad')` (all three pooled).
-- FIFO partial claiming, whole-order claiming, and the "orders too large"
-- exception are otherwise unchanged from 031 — just re-scoped to the one
-- method, and the exception/limit-reached messages now name that method
-- instead of listing all three, since a rejection on Rocket no longer says
-- anything about the seller's bKash or Nagad allowance.
--
-- Same signature as 030/031 — (text, text, numeric) — so this is a
-- straight `create or replace`, no drop/overload cleanup needed.
-- ============================================================

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
  v_order_fee numeric(12,2);
  v_order_net numeric(12,2);
  v_claimed_ids uuid[] := '{}';
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

  -- Row-level lock on every candidate order before we read/aggregate them,
  -- so a second concurrent call blocks until this one commits (and then
  -- sees withdrawal_id already set on whatever this call claimed) — this
  -- also serializes the daily/monthly allowance check below for this
  -- seller.
  perform 1 from public.orders
    where seller_id = v_seller_id and status = 'completed' and withdrawal_id is null
    for update;

  if v_is_mfs then
    -- Per-method, not pooled across bKash/Rocket/Nagad — a request on one
    -- method only counts against that same method's own allowance.
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

    -- Remaining allowance in USD for THIS request — the smaller of the
    -- daily-remaining and monthly-remaining windows. The daily allowance
    -- itself never exceeds ৳50,000, so this also enforces "at most
    -- ৳50,000 per request" with no separate constant needed.
    v_cap_usd := least(
      greatest(0, 50000 - v_daily_usd * p_bdt_rate) / p_bdt_rate,
      greatest(0, 300000 - v_monthly_usd * p_bdt_rate) / p_bdt_rate
    );

    if v_cap_usd <= 0 then
      raise exception 'You have reached your % withdrawal limit for today or this month — please try again later.', v_method_label;
    end if;
  end if;

  -- Oldest orders first (FIFO), so a partial MFS claim always leaves the
  -- newest orders behind for the seller's next request.
  for r in
    select id, amount from public.orders
    where seller_id = v_seller_id and status = 'completed' and withdrawal_id is null
    order by created_at asc, id asc
  loop
    v_order_fee := round(
      r.amount * (case
        when r.amount < 50000 then 0.10
        when r.amount <= 250000 then 0.07
        else 0.05
      end)::numeric,
    2);
    v_order_net := r.amount - v_order_fee;

    if v_is_mfs and (v_net + v_order_net) > v_cap_usd then
      -- Claiming this order would push the request over what's left of
      -- this method's own ৳50,000/day or ৳300,000/month allowance — stop
      -- here. This order and everything after it (in FIFO order) stays
      -- unclaimed for a future request.
      exit;
    end if;

    v_count := v_count + 1;
    v_gross := v_gross + r.amount;
    v_fee := v_fee + v_order_fee;
    v_net := v_net + v_order_net;
    v_claimed_ids := v_claimed_ids || r.id;
  end loop;

  if v_count = 0 then
    if v_is_mfs then
      raise exception 'Your available orders are too large to withdraw via % right now — even the oldest one would exceed its ৳50,000/day or ৳300,000/month limit. Try Bank Transfer, PayPal, Wise, or another mobile financial service instead, or try again once your limit resets.', v_method_label;
    else
      raise exception 'No completed orders are available to withdraw.';
    end if;
  end if;

  insert into public.withdrawal_requests (seller_id, gross_amount, success_fee_amount, net_amount, order_count, payout_method, payout_details)
  values (v_seller_id, v_gross, v_fee, v_net, v_count, p_payout_method, trim(p_payout_details))
  returning * into v_request;

  update public.orders set withdrawal_id = v_request.id
  where id = any(v_claimed_ids);

  return v_request;
end;
$$;

-- Signature is unchanged from 030/031, but re-grant defensively in case
-- this migration is ever run standalone against a database that somehow
-- doesn't already have the grant.
grant execute on function public.create_withdrawal_request(text, text, numeric) to authenticated;

