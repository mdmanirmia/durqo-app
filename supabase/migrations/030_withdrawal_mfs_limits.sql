-- ============================================================
-- Durqo — daily/monthly withdrawal caps for bKash, Rocket, and Nagad.
--
-- Product decision (site owner, Sep 10 2026): sellers paying out through
-- the Bangladeshi mobile financial services (bKash, Rocket, Nagad) are
-- capped at ৳50,000 per day and ৳300,000 per month, combined across all
-- three MFS methods and across every withdrawal_requests row that isn't
-- rejected (pending/approved/paid all count — a seller can't dodge the
-- cap by stacking pending requests ahead of admin review, and a rejected
-- request already frees its orders back up, so it shouldn't count).
-- Bank Transfer, PayPal and Wise are not capped by this rule.
--
-- Every amount in withdrawal_requests is stored in USD (this app prices
-- everything in USD — see 028_withdrawals.sql), but the caps here are
-- BDT figures, and plain Postgres has no live USD->BDT rate of its own.
-- The caller (requestWithdrawal() in
-- src/app/dashboard/seller/earnings/actions.ts) fetches the same
-- USD->BDT market rate already used for SSLCommerz checkout
-- (src/lib/currency.ts's getUsdToBdtMarketRate() — the live
-- open.er-api.com lookup, or its fallback constant if that's
-- unreachable) and passes it in as p_bdt_rate; this function does the
-- actual sum-and-compare atomically so two concurrent submissions from
-- the same seller can't both slip under the cap. That's safe to do here
-- (not just in the caller) because the existing `for update` lock on
-- this seller's unclaimed orders, just below, already serializes
-- concurrent calls to this function for the same seller — a second
-- call blocks until the first commits, then sees no unclaimed orders
-- left (or a fresh batch, against which it recomputes the running
-- totals including what the first call just inserted).
--
-- This replaces the (text, text) function from 028/029 with a new
-- (text, text, numeric) overload — the old two-arg signature is
-- explicitly dropped first so it doesn't linger as a dead overload.
-- ============================================================

drop function if exists public.create_withdrawal_request(text, text);

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
  -- sees withdrawal_id already set, finding nothing left to claim) — this
  -- also serializes the daily/monthly cap check below for this seller.
  perform 1 from public.orders
    where seller_id = v_seller_id and status = 'completed' and withdrawal_id is null
    for update;

  for r in
    select amount from public.orders
    where seller_id = v_seller_id and status = 'completed' and withdrawal_id is null
  loop
    v_count := v_count + 1;
    v_gross := v_gross + r.amount;
    v_fee := v_fee + round(
      r.amount * (case
        when r.amount < 50000 then 0.10
        when r.amount <= 250000 then 0.07
        else 0.05
      end)::numeric,
    2);
  end loop;

  if v_count = 0 then
    raise exception 'No completed orders are available to withdraw.';
  end if;

  v_net := v_gross - v_fee;

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

    if (v_daily_usd + v_net) * p_bdt_rate > 50000 then
      raise exception 'Daily withdrawal limit for bKash/Rocket/Nagad is ৳50,000. You have ৳% left today.',
        greatest(0, round(50000 - v_daily_usd * p_bdt_rate));
    end if;

    if (v_monthly_usd + v_net) * p_bdt_rate > 300000 then
      raise exception 'Monthly withdrawal limit for bKash/Rocket/Nagad is ৳300,000. You have ৳% left this month.',
        greatest(0, round(300000 - v_monthly_usd * p_bdt_rate));
    end if;
  end if;

  insert into public.withdrawal_requests (seller_id, gross_amount, success_fee_amount, net_amount, order_count, payout_method, payout_details)
  values (v_seller_id, v_gross, v_fee, v_net, v_count, p_payout_method, trim(p_payout_details))
  returning * into v_request;

  update public.orders set withdrawal_id = v_request.id
  where seller_id = v_seller_id and status = 'completed' and withdrawal_id is null;

  return v_request;
end;
$$;

grant execute on function public.create_withdrawal_request(text, text, numeric) to authenticated;
