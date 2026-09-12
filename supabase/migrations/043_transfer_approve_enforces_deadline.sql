-- ============================================================
-- Durqo — close a real gap in the inspection-window rule: an expired
-- window must NEVER let funds release, but transfer_approve() (039) never
-- actually checked the deadline itself. The only thing enforcing the
-- window at all was sweep_expired_inspections() (037), a cron job that
-- only runs once a day (vercel.json) — so a buyer whose 7-day window had
-- technically ended could still click "Approve Transfer" and this RPC
-- would happily flip the room to payout_eligible and the order to
-- completed, releasing funds up to ~24h after the window should have
-- locked. Found during a 2026-09-12 dashboard audit.
--
-- Fix: transfer_approve() now checks inspection_deadline_at itself, and if
-- it has passed, moves the room straight to admin_review (the exact same
-- transition sweep_expired_inspections() would have made) instead of
-- approving — then raises, so no items are accepted and no funds move.
-- This makes the database the real authority on the rule regardless of
-- cron timing; the client-side "Approve Transfer" button is separately
-- hidden once the countdown reaches zero (src/app/dashboard/transfer/
-- [orderId]/TransferRoomView.tsx) so this should rarely even be reached in
-- practice, but the RPC must not depend on the client behaving.
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

  if v_room.inspection_deadline_at is not null and v_room.inspection_deadline_at < now() then
    update public.asset_transfer_rooms set stage = 'admin_review', updated_at = now()
      where id = p_room_id and stage = 'inspection_active';
    raise exception 'Your inspection window has ended — this transfer now needs admin review before it can proceed.';
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

  -- Payout integration point (see 039's header comment).
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

-- Grant unchanged from 037/039 (authenticated) — CREATE OR REPLACE keeps
-- existing grants; restated here only as documentation of that fact.
grant execute on function public.transfer_approve(uuid) to authenticated;
