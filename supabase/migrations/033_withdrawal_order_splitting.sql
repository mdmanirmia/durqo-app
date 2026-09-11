-- ============================================================
-- Durqo — bKash/Rocket/Nagad withdrawals can now split a single large
-- order across multiple requests.
--
-- Product request (site owner, Sep 11 2026), after confirming the
-- per-method caps (032) are correctly live: "yes to be partially split
-- across multiple bKash/Rocket/Nagad withdrawals so they become usable
-- for bigger balances too." Until now, orders.withdrawal_id was a single
-- nullable column — an order was either 100% claimed by exactly one
-- withdrawal request or 100% unclaimed, with no in-between. That made any
-- order whose net value alone exceeds the ৳50,000/day (~$410) MFS cap
-- structurally impossible to ever withdraw via bKash/Rocket/Nagad, since
-- an order could never be split — this is the exact "your available
-- orders are too large" rejection sellers with $50k-$250k orders were
-- hitting (031/032's v_count = 0 branch).
--
-- This migration replaces the "claim the whole order or nothing" model
-- with a ledger: withdrawal_request_orders records how much of a given
-- order (gross/fee/net) each individual withdrawal request has claimed.
-- An order's remaining claimable balance is its own total minus the sum
-- of every non-rejected ledger claim against it — so a $180,000 order can
-- now be claimed ৳50,000-at-a-time across many separate Rocket requests
-- over time, rather than needing to fit under one request's cap in a
-- single shot. Rejected requests' claims are excluded from that sum (same
-- "release back to the seller's balance" effect the old
-- `update orders set withdrawal_id = null` had on rejection — see
-- setWithdrawalStatus() in dashboard/admin/actions.ts, updated alongside
-- this migration to drop that now-unnecessary write).
--
-- orders.withdrawal_id itself is left in place as a legacy-only column —
-- it's no longer written to by create_withdrawal_request() below (a
-- partially-claimed order can't be represented by a single scalar FK
-- anyway) but old rows keep whatever it was already set to. The backfill
-- below inserts one withdrawal_request_orders row for every order
-- currently claimed that way, so historical whole-order claims are
-- represented identically under the new ledger model before any new
-- partial claim is ever made.
--
-- Partial-claim math for a slice smaller than an order's full remaining
-- balance: given the order's own fixed tier rate (fee_amount /
-- gross_amount, computed once from its ORIGINAL total — the tier a
-- $180,000 order falls into doesn't shift just because part of it was
-- already withdrawn), claim_gross = claim_net_target / (1 - rate),
-- claim_fee = claim_gross - claim_net_target, both rounded to 2 decimals
-- and clamped to the order's actual remaining balance so rounding can
-- never claim a cent more than genuinely exists. This keeps every ledger
-- row internally consistent (gross - fee = net) without proportional/
-- fractional math drifting across many partial claims on the same order —
-- remaining balance is always "total minus sum of raw claimed amounts."
--
-- The 031/032 "your available orders are too large" exception is now
-- unreachable and removed: with partial claiming, any request whose
-- remaining daily/monthly cap is positive can always take SOME slice of
-- the oldest available order, however large that order is. v_count = 0
-- now only ever means there's genuinely nothing left to withdraw at all —
-- same message, same condition, for MFS and non-MFS methods alike.
-- ============================================================

-- Small shared helper so the tiered Success Fee lookup (src/lib/fees.ts)
-- isn't repeated inline four separate times across this migration (the
-- claim loop, the remaining-balance subquery, the view, and the
-- backfill) the way 028-032 repeated it inline. Same flat lookup, same
-- boundaries: < $50,000 -> 10%, $50,000-$250,000 -> 7%, > $250,000 -> 5%.
-- Keep this in sync with SUCCESS_FEE_TIERS in src/lib/fees.ts if that
-- policy ever changes.
create or replace function public.order_success_fee(p_amount numeric) returns numeric
language sql
immutable
as $$
  select round(p_amount * (case
    when p_amount < 50000 then 0.10
    when p_amount <= 250000 then 0.07
    else 0.05
  end)::numeric, 2)
$$;

-- The ledger. One row per (order, withdrawal request) claim — an order
-- can now appear in more than one row (across different requests, never
-- twice in the same request), each recording exactly how much of that
-- order's gross/fee/net this particular request claimed.
create table if not exists public.withdrawal_request_orders (
  id uuid primary key default uuid_generate_v4(),
  withdrawal_id uuid not null references public.withdrawal_requests(id) on delete cascade,
  order_id uuid not null references public.orders(id),
  gross_amount numeric(12,2) not null,
  fee_amount numeric(12,2) not null,
  net_amount numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists withdrawal_request_orders_order_id_idx on public.withdrawal_request_orders(order_id);
create index if not exists withdrawal_request_orders_withdrawal_id_idx on public.withdrawal_request_orders(withdrawal_id);

alter table public.withdrawal_request_orders enable row level security;

-- Same "sellers can see their own, no client insert/update policy" shape
-- as withdrawal_requests_select_own (028) — the only writer is the
-- SECURITY DEFINER function below.
drop policy if exists "withdrawal_request_orders_select_own" on public.withdrawal_request_orders;
create policy "withdrawal_request_orders_select_own" on public.withdrawal_request_orders for select
  using (exists (
    select 1 from public.withdrawal_requests wr
    where wr.id = withdrawal_id and wr.seller_id = auth.uid()
  ));

-- Backfill: every order currently claimed the old (whole-order) way gets
-- exactly one ledger row referencing that same withdrawal_id, so historical
-- claims are represented identically under the new model. Guarded by
-- `not exists` so re-running this migration is a no-op the second time.
-- (Orders whose withdrawal was rejected already had withdrawal_id cleared
-- back to null by the pre-033 setWithdrawalStatus(), so there's nothing
-- to backfill for those — consistent with the new model, which also
-- excludes rejected claims from every remaining-balance calculation.)
insert into public.withdrawal_request_orders (withdrawal_id, order_id, gross_amount, fee_amount, net_amount)
select o.withdrawal_id, o.id, o.amount, public.order_success_fee(o.amount), o.amount - public.order_success_fee(o.amount)
from public.orders o
where o.withdrawal_id is not null
  and not exists (
    select 1 from public.withdrawal_request_orders wro
    where wro.order_id = o.id and wro.withdrawal_id = o.withdrawal_id
  );

-- RLS-safe (security_invoker, required on Postgres 15+ for a view to
-- apply the querying user's own RLS rather than the view owner's) per-
-- order remaining-balance view. A seller's own completed orders show
-- their true remaining gross/fee/net after every non-rejected claim
-- against them — used by getAvailableBalance() (earnings.client.ts) and
-- the receipt page instead of the old `.is("withdrawal_id", null)` check.
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
where o.status = 'completed';

grant select on public.order_remaining_balances to authenticated;

-- Rewritten to support partial claims. Same signature as 030-032 —
-- (text, text, numeric) — so this is a straight `create or replace`.
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

  -- Lock every completed order this seller has — whole or already
  -- partially claimed, not just untouched ones (030-032 only locked
  -- `withdrawal_id is null` rows, which no longer covers every order
  -- with a claimable remainder). A second concurrent call (double-click,
  -- two tabs, or a second method's request landing at the same moment)
  -- blocks here until this one commits, then sees this call's ledger
  -- inserts before computing its own remaining balances below.
  perform 1 from public.orders
    where seller_id = v_seller_id and status = 'completed'
    for update;

  if v_is_mfs then
    -- Per-method, not pooled across bKash/Rocket/Nagad (032) — a request
    -- on one method only counts against that same method's own allowance.
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
    -- daily-remaining and monthly-remaining windows.
    v_cap_usd := least(
      greatest(0, 50000 - v_daily_usd * p_bdt_rate) / p_bdt_rate,
      greatest(0, 300000 - v_monthly_usd * p_bdt_rate) / p_bdt_rate
    );

    if v_cap_usd <= 0 then
      raise exception 'You have reached your % withdrawal limit for today or this month — please try again later.', v_method_label;
    end if;
  end if;

  -- Oldest orders first (FIFO), each order's REMAINING balance only — its
  -- own total minus whatever earlier, non-rejected requests already
  -- claimed from it. This is what makes a single large order usable
  -- across more than one bKash/Rocket/Nagad request: instead of being
  -- all-or-nothing, we take just a slice (up to what's left of this
  -- request's cap) and leave the rest for a future request.
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
      where o.seller_id = v_seller_id and o.status = 'completed'
    ) x
    where x.remaining_net > 0
    order by x.created_at asc, x.id asc
  loop
    if v_is_mfs then
      v_remaining_cap := v_cap_usd - v_net;
      exit when v_remaining_cap <= 0;

      if r.remaining_net <= v_remaining_cap then
        -- The rest of this order fits under what's left of the cap —
        -- take all of it.
        v_claim_gross := r.remaining_gross;
        v_claim_fee := r.remaining_fee;
        v_claim_net := r.remaining_net;
      else
        -- Only part of this order fits under the remaining cap. Work
        -- backwards from the target net amount using this order's own
        -- fixed tier rate (from its ORIGINAL full amount, not the
        -- remaining slice).
        v_rate := r.fee_amount / r.gross_amount;
        v_claim_net := v_remaining_cap;
        v_claim_gross := round(v_claim_net / (1 - v_rate), 2);
        v_claim_fee := v_claim_gross - v_claim_net;

        -- Rounding could theoretically push v_claim_gross a cent past
        -- what's actually left on the order — clamp to the real
        -- remainder rather than ever over-claim.
        if v_claim_gross > r.remaining_gross then
          v_claim_gross := r.remaining_gross;
          v_claim_fee := r.remaining_fee;
          v_claim_net := r.remaining_net;
        end if;
      end if;
    else
      -- Bank Transfer / PayPal / Wise: no cap, always take everything
      -- left on the order.
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
    -- With partial claiming, a positive cap can always take SOME slice of
    -- the oldest available order — the old "your available orders are
    -- too large" rejection (031/032) is no longer reachable here. Zero
    -- claims now only ever means there's genuinely nothing left at all.
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
