-- ============================================================
-- Durqo — wire the buyer's own transfer approval to actually release
-- funds, for every payment channel except Escrow.com.
--
-- 037_asset_transfer_system_rpcs.sql's own header comment flagged this
-- exact wiring as deliberately deferred: "The later flip to
-- orders.status = 'completed' ... is intentionally NOT touched by anything
-- here ... left for a dedicated, separate step once this RPC layer is
-- proven, not silently bundled in here." That RPC layer has now been live
-- in production for a while (all four payment webhooks create real
-- Transfer Rooms), so this is that dedicated step, per the site owner's
-- explicit request (2026-09-12): once a buyer approves the transfer,
-- money should move to the seller's withdrawable balance for every order
-- paid via Stripe, SSLCommerz, or Pay Later — Escrow.com is excluded
-- because release happens on Escrow.com's own platform, not here (same
-- reasoning as 035_exclude_escrow_com_from_payout_ledger.sql, which
-- already keeps escrow_com orders out of the withdrawal ledger even if
-- their status were ever "completed").
--
-- What actually makes an order withdrawable is
-- order_remaining_balances/create_withdrawal_request (035): both require
-- orders.status = 'completed' AND payment_channel <> 'escrow_com'. Buyers
-- and sellers cannot set orders.status themselves — 034's column allowlist
-- deliberately left `status` out of what `authenticated` may UPDATE — so
-- this has to happen inside a SECURITY DEFINER function, same as every
-- other status flip in this system.
--
-- Two independent paths can move a room to payout_eligible, and both need
-- the exact same order-completion rule or they'd disagree with each other:
--   1. transfer_approve() below — the buyer's own "Approve Transfer" click.
--   2. resolveTransferDispute()'s "approved_despite_report" branch
--      (src/app/dashboard/admin/actions.ts) — an admin siding with the
--      seller on a buyer's report and finishing the transfer anyway. That
--      function already runs through the service-role admin client, so its
--      half of this fix is a plain application-code change alongside this
--      migration, not new SQL.
--
-- Defensive on which source status it flips from: 'in_durqo' is what every
-- non-escrow_com order should be sitting at once payment is confirmed
-- (post-038), but 'in_escrow' is included too since that's what
-- pre-038 orders (created before the status split existed) may still be
-- sitting at — an old Stripe/SSLCommerz order that predates this split
-- must not be permanently unable to reach 'completed' just because its
-- status was set before the split. Never overwrites an order some other
-- event already moved past "paid" (already completed, or cancelled).
-- ============================================================

create or replace function public.transfer_approve(p_room_id uuid)
returns public.asset_transfer_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.asset_transfer_rooms;
  v_accepted_count int;
  v_order_id uuid;
  v_payment_channel text;
begin
  v_room := public.assert_transfer_participant(p_room_id, 'buyer');

  if v_room.stage <> 'inspection_active' then
    raise exception 'This transfer is not in its inspection window (stage=%).', v_room.stage;
  end if;

  update public.asset_transfer_items set status = 'accepted', accepted_at = now(), updated_at = now()
    where room_id = p_room_id and status = 'received';
  get diagnostics v_accepted_count = row_count;

  if v_accepted_count = 0 then
    raise exception 'No received items to approve.';
  end if;

  update public.asset_transfer_rooms set stage = 'payout_eligible', payout_eligible_at = now(), updated_at = now()
    where id = p_room_id
    returning * into v_room;

  -- Payout integration point (see this migration's header comment above).
  select o.payment_channel into v_payment_channel from public.orders o where o.id = v_room.order_id;
  v_order_id := v_room.order_id;

  if v_payment_channel is distinct from 'escrow_com' then
    update public.orders
      set status = 'completed'
      where id = v_order_id and status in ('in_durqo', 'in_escrow');
  end if;

  perform public.log_transfer_event(p_room_id, auth.uid(), 'buyer_approved', null, jsonb_build_object('items_accepted', v_accepted_count));

  return v_room;
end;
$$;

-- Grant unchanged from 037 (authenticated) — CREATE OR REPLACE keeps
-- existing grants; restated here only as documentation of that fact.
grant execute on function public.transfer_approve(uuid) to authenticated;
