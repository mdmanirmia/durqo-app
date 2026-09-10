-- ============================================================
-- Durqo — allow partial withdrawals for bKash, Rocket, and Nagad instead
-- of blocking the whole request when the balance exceeds the cap.
--
-- Product decision (site owner, Sep 10 2026): "bkash/Nagad/Rocket e
-- withdraw korar somoi maximum 50,000 BDT withdraw kore jabe at a time"
-- — a seller can withdraw at most ৳50,000 in a single bKash/Rocket/Nagad
-- request. 030_withdrawal_mfs_limits.sql already capped the *cumulative*
-- daily (৳50,000) and monthly (৳300,000) totals, but it enforced that cap
-- by raising an exception and rejecting the ENTIRE request the moment the
-- available balance would push either total over the line — so a seller
-- sitting on, say, ৳80,000 worth of completed orders could never
-- withdraw anything via bKash/Rocket/Nagad at all, since their balance
-- only grows and never drops back under the cap on its own.
--
-- This migration changes that to a partial claim: it walks the seller's
-- unclaimed completed orders oldest-first (FIFO) and claims as many whole
-- orders as fit under whatever's left of the ৳50,000/day and
-- ৳300,000/month allowance, leaving the rest unclaimed for a future
-- request. Because the daily allowance is itself capped at ৳50,000, this
-- also mechanically enforces "at most ৳50,000 per request" without a
-- separate constant — the smaller of the daily-remaining and
-- monthly-remaining windows is always <= ৳50,000.
--
-- Orders are claimed whole, never split — if even the single oldest
-- order's converted net value already exceeds what's left of the
-- allowance, nothing is claimed and a clear exception is raised instead
-- (telling the seller to use another payout method or wait for the
-- window to reset), rather than silently withdrawing ৳0.
--
-- Same signature as 030's function — (text, text, numeric) — so this is
-- a straight `create or replace`, no drop/overload cleanup needed.
-- Bank Transfer, PayPal and Wise are unaffected: they still claim every
-- available order in one request, exactly as before.
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
    select coalesce(sum(net_amount), 0) into v_daily_usd
      from public.withdrawal_requests
      where seller_id = v_seller_id
        and payout_method in ('bkash', 'rocket', 'nagad')
        and status <> 'rejected'
        and requested_at >= date_trunc('day', now());

    select coalesce(sum(net_amount), 0) into v_monthly_usd
      from public.withdrawal_requests
      where seller_id = v_seller_id
        and payout_method in ('bkash', 'rocket', 'nagad')
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
      raise exception 'You have reached your bKash/Rocket/Nagad withdrawal limit for today or this month — please try again later.';
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
      -- the ৳50,000/day or ৳300,000/month MFS allowance — stop here.
      -- This order and everything after it (in FIFO order) stays
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
      raise exception 'Your available orders are too large to withdraw via bKash/Rocket/Nagad right now — even the smallest one would exceed the ৳50,000/day or ৳300,000/month limit. Try Bank Transfer, PayPal or Wise instead, or try again once your limit resets.';
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

-- Signature is unchanged from 030, but re-grant defensively in case this
-- migration is ever run standalone against a database that somehow
-- doesn't already have the grant.
grant execute on function public.create_withdrawal_request(text, text, numeric) to authenticated;
