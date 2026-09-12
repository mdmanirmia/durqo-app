-- ============================================================
-- Durqo — split the "payment confirmed" order status by who's actually
-- holding the money, per the site owner's explicit correction (2026-09-13):
-- 'in_escrow' should mean exactly what it says — Escrow.com is holding the
-- funds — and should stop being used for Stripe/SSLCommerz/Pay Later
-- orders, where the money (or, for Pay Later, nothing at all) sits with
-- Durqo directly, not any neutral third party. Adds 'in_durqo' as a
-- sibling status:
--   - escrow_com payments  -> stay 'in_escrow' (unchanged, still correct)
--   - stripe / bangladesh_gateway (SSLCommerz) / durqo_platform (Pay Later)
--     payments -> now 'in_durqo' (previously all went to 'in_escrow')
-- The application-side changes are in src/app/api/webhooks/stripe,
-- src/app/api/sslcommerz/ipn, and src/app/api/pay-later/init — this
-- migration only has to widen the column's own check constraint and teach
-- create_transfer_room_on_payment (037) to accept either "payment
-- confirmed" status, since a Transfer Room's own logic never cared which
-- of the two it was, only that payment had landed.
-- ============================================================

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status = any (array['requested', 'awaiting_payment', 'in_escrow', 'in_durqo', 'completed', 'cancelled']));

create or replace function public.create_transfer_room_on_payment(p_order_id uuid)
returns public.asset_transfer_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_listing public.listings;
  v_room public.asset_transfer_rooms;
  v_snapshot_json jsonb;
begin
  select * into v_order from public.orders where id = p_order_id;
  if v_order.id is null then
    raise exception 'Order not found.';
  end if;

  -- Idempotent re-entry: a retried/replayed webhook (or a second manual
  -- admin click) must not create a second room or a second snapshot for
  -- the same order.
  select * into v_room from public.asset_transfer_rooms where order_id = p_order_id;
  if v_room.id is not null then
    return v_room;
  end if;

  if v_order.status not in ('in_escrow', 'in_durqo') then
    raise exception 'Order payment is not confirmed yet (status=%).', v_order.status;
  end if;

  select * into v_listing from public.listings where id = v_order.listing_id;
  if v_listing.id is null then
    raise exception 'Listing not found for this order.';
  end if;
  if v_listing.assets_confirmed_at is null then
    raise exception 'This listing has no confirmed structured asset list — cannot create a Transfer Room.';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', la.id,
      'position', la.position,
      'name', la.name,
      'buyer_receives', la.buyer_receives,
      'transfer_method', la.transfer_method,
      'note', la.note
    ) order by la.position, la.created_at
  ), '[]'::jsonb)
  into v_snapshot_json
  from public.listing_assets la
  where la.listing_id = v_listing.id;

  if jsonb_array_length(v_snapshot_json) = 0 then
    raise exception 'Listing has a confirmed status but no asset rows — data inconsistency, refusing to create an empty Transfer Room.';
  end if;

  insert into public.order_asset_snapshots (order_id, listing_id, buyer_id, seller_id, snapshot_json, post_sale_support_text)
  values (v_order.id, v_listing.id, v_order.buyer_id, v_order.seller_id, v_snapshot_json, v_listing.sale_includes_support);

  insert into public.asset_transfer_rooms (order_id, buyer_id, seller_id, stage, unlocked_at)
  values (v_order.id, v_order.buyer_id, v_order.seller_id, 'room_unlocked', now())
  returning * into v_room;

  insert into public.asset_transfer_items (room_id, snapshot_asset_id, name)
  select v_room.id, (elem->>'id')::uuid, elem->>'name'
  from jsonb_array_elements(v_snapshot_json) as elem;

  insert into public.post_sale_support_tracking (order_id, buyer_id, seller_id, agreed_terms)
  values (v_order.id, v_order.buyer_id, v_order.seller_id, v_listing.sale_includes_support);

  perform public.log_transfer_event(v_room.id, null, 'room_unlocked', 'Payment confirmed.', jsonb_build_object('order_id', v_order.id));

  return v_room;
end;
$$;

-- Grants unchanged from 037 (service_role only) — CREATE OR REPLACE keeps
-- existing grants, this is just documentation of that fact.
revoke execute on function public.create_transfer_room_on_payment(uuid) from public;
grant execute on function public.create_transfer_room_on_payment(uuid) to service_role;
