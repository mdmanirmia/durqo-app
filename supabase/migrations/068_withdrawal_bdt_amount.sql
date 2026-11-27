-- Nov 27, 2026 ("Bangladeshi takai withdraw dile seller withdraw deyar somoi
-- bdt joto dekhate eikhane o toto dekhabe ... mane joto bdt pay korte
-- hobe"): bKash / Rocket / Nagad withdrawals are paid in taka. The seller's
-- Earnings page shows the taka amount at the withdrawal rate (market rate
-- minus 1.50) when they request, but that rate was only used for the daily
-- and monthly caps and never saved, so the admin Withdrawals page could
-- only show dollars. This stores the rate and the taka amount on the
-- request so admin pays exactly what the seller was shown.

alter table public.withdrawal_requests
  add column if not exists bdt_rate numeric(10,4),
  add column if not exists bdt_amount numeric(14,2);

-- Patch create_withdrawal_request() in place: only its INSERT changes, so
-- the rest of the function (caps, order splitting, KYC gate) stays exactly
-- as it is in the database.
do $$
declare
  v_def text;
  v_old text := 'insert into public.withdrawal_requests (seller_id, gross_amount, success_fee_amount, net_amount, order_count, payout_method, payout_details, payout_account_holder_name, status)
  values (v_seller_id, v_gross, v_fee, v_net, v_count, p_payout_method, trim(p_payout_details), trim(p_payout_account_holder_name), ''requested'')';
  v_new text := 'insert into public.withdrawal_requests (seller_id, gross_amount, success_fee_amount, net_amount, order_count, payout_method, payout_details, payout_account_holder_name, status, bdt_rate, bdt_amount)
  values (v_seller_id, v_gross, v_fee, v_net, v_count, p_payout_method, trim(p_payout_details), trim(p_payout_account_holder_name), ''requested'',
          case when v_is_mfs then round(p_bdt_rate, 4) end,
          case when v_is_mfs then round(v_net * p_bdt_rate) end)';
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'create_withdrawal_request';

  if position(v_old in v_def) = 0 then
    raise exception 'create_withdrawal_request insert statement not found; function changed, update this migration';
  end if;
  execute replace(v_def, v_old, v_new);
end;
$$;

-- The one open taka request at the time (Najla Tahseen, bKash, $10.80,
-- requested Nov 27, 2026 15:59 UTC). The open.er-api.com rate the site uses
-- was last updated Nov 27 00:02 UTC (125.320229), so the seller saw
-- 125.320229 - 1.50 = 123.8202 BDT per USD. Older, already-paid requests
-- are left blank: their rates were never recorded.
update public.withdrawal_requests
set bdt_rate = 123.8202,
    bdt_amount = round(net_amount * 123.8202)
where id = '0e4d13d6-862d-42ea-ab79-3d6216978a95'
  and bdt_amount is null;
