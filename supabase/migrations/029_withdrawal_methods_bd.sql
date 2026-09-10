-- ============================================================
-- Durqo — expand seller withdrawal payout methods.
--
-- Product decision (site owner, Sep 10 2026): sellers now choose from
-- Bank Transfer, bKash, Rocket, Nagad, PayPal, or Wise instead of the
-- original Bank Transfer / PayPal / "Other" — the Bangladeshi mobile
-- financial services (bKash, Rocket, Nagad) were added for local sellers,
-- Wise was added alongside PayPal for international ones, and "Other"
-- was too open-ended for a manual admin payout process so it's no longer
-- offered (but still accepted below for any historical row).
--
-- The check constraints below are WIDENED (old values plus new ones),
-- never narrowed, so any withdrawal_requests row already inserted with
-- 'other' keeps validating — this migration only changes what NEW
-- requests may use, never what's already stored. If a stricter
-- constraint is ever wanted, confirm no historical rows use the values
-- being dropped first.
--
-- Mirrored in the app in three places — keep all in sync if this list
-- changes again: src/app/dashboard/seller/earnings/page.tsx
-- (PAYOUT_METHODS, shown to sellers), .../earnings/actions.ts
-- (PAYOUT_METHODS, server-side validation), and
-- src/app/dashboard/admin/withdrawals/AdminWithdrawalsTable.tsx
-- (METHOD_LABEL, display only).
-- ============================================================

alter table public.withdrawal_requests drop constraint if exists withdrawal_requests_payout_method_check;
alter table public.withdrawal_requests add constraint withdrawal_requests_payout_method_check
  check (payout_method in ('bank_transfer', 'bkash', 'rocket', 'nagad', 'paypal', 'wise', 'other'));

create or replace function public.create_withdrawal_request(
  p_payout_method text,
  p_payout_details text
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
  v_request public.withdrawal_requests;
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

  -- Row-level lock on every candidate order before we read/aggregate them,
  -- so a second concurrent call blocks until this one commits (and then
  -- sees withdrawal_id already set, finding nothing left to claim).
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

  insert into public.withdrawal_requests (seller_id, gross_amount, success_fee_amount, net_amount, order_count, payout_method, payout_details)
  values (v_seller_id, v_gross, v_fee, v_gross - v_fee, v_count, p_payout_method, trim(p_payout_details))
  returning * into v_request;

  update public.orders set withdrawal_id = v_request.id
  where seller_id = v_seller_id and status = 'completed' and withdrawal_id is null;

  return v_request;
end;
$$;

grant execute on function public.create_withdrawal_request(text, text) to authenticated;
