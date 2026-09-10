-- ============================================================
-- Durqo — seller withdrawal system.
--
-- Product decision (site owner, Sep 10 2026): a seller's withdrawable
-- balance is every `completed` order regardless of payment_channel,
-- INCLUDING escrow_com orders. That's a deliberate, flagged trade-off —
-- Escrow.com pays the seller directly once it releases funds, so an
-- escrow_com order counting toward a Durqo-approved withdrawal too is a
-- real double-payment risk. There is no automatic reconciliation against
-- Escrow.com here; the mitigation is that every withdrawal is a fully
-- manual admin approval (same pattern as seller identity verification —
-- see 007_seller_verification.sql / setVerificationStatus()), and the
-- admin review UI (AdminWithdrawalsTable) surfaces the escrow_com vs.
-- other-channel split of every request so admin can see that risk before
-- approving. Not solved here — the owner chose to proceed past it rather
-- than build automated Escrow.com payout reconciliation.
--
-- Success Fee (src/lib/fees.ts) was previously display/marketing-copy
-- only — this is the first place it's actually deducted from real money,
-- per the same Sep 10 decision. The tiered flat-lookup rate is
-- duplicated here in SQL (rather than called from TypeScript) because the
-- claiming step below must be atomic and server-side; keep this in sync
-- with SUCCESS_FEE_TIERS in src/lib/fees.ts if that policy ever changes.
-- ============================================================

create table if not exists public.withdrawal_requests (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references public.profiles(id),
  gross_amount numeric(12,2) not null,
  success_fee_amount numeric(12,2) not null,
  net_amount numeric(12,2) not null,
  order_count int not null,
  payout_method text not null check (payout_method in ('bank_transfer', 'paypal', 'other')),
  payout_details text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'paid')),
  admin_note text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  paid_at timestamptz
);

-- Links a completed order to the withdrawal request it was claimed by, so
-- the same order can never be counted toward two withdrawal requests at
-- once. Set atomically by create_withdrawal_request() below when a
-- request is submitted; cleared back to null by the admin "reject" action
-- (setWithdrawalStatus() in dashboard/admin/actions.ts) so a rejected
-- request's orders return to the seller's available balance.
alter table public.orders add column if not exists withdrawal_id uuid references public.withdrawal_requests(id);

alter table public.withdrawal_requests enable row level security;

-- Sellers can see their own requests. There is deliberately no insert/
-- update policy for regular users — the only way to create one is the
-- SECURITY DEFINER function below (identity taken from auth.uid(), not a
-- client-supplied id), and the only way to change status is the
-- service-role admin client (src/lib/supabase/admin.ts), exactly like
-- every other money- or verification-adjacent flow in this app.
--
-- Postgres has no CREATE POLICY IF NOT EXISTS, so this migration
-- re-running against a database that already has the policy (e.g. this
-- file was already applied once) would otherwise fail with "policy ...
-- already exists" even though every other statement here is safely
-- re-runnable (create table if not exists, create or replace function,
-- grant). Drop-then-create makes the whole file idempotent.
drop policy if exists "withdrawal_requests_select_own" on public.withdrawal_requests;
create policy "withdrawal_requests_select_own" on public.withdrawal_requests for select
  using (auth.uid() = seller_id);

-- Atomically claims every unclaimed `completed` order owned by the caller,
-- computes the tiered Success Fee per-order (a flat lookup on that order's
-- own sale price, never marginal — see successFeeRate() in
-- src/lib/fees.ts), inserts the withdrawal_requests row, and stamps
-- withdrawal_id on the claimed orders — all in one statement-level lock so
-- two concurrent submissions (e.g. a double-click, two open tabs) can
-- never both claim the same order.
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
  if p_payout_method not in ('bank_transfer', 'paypal', 'other') then
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
