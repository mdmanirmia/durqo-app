-- ============================================================
-- Durqo — Asset Transfer System v2: backend RPCs (Phase 1, part 2).
--
-- Every protected transition on the tables from migration 036 goes
-- through one of the SECURITY DEFINER functions below — never a
-- direct client INSERT/UPDATE, per that migration's RLS design.
-- Mirrors create_withdrawal_request()'s established shape: derive the
-- caller's identity from auth.uid() (never trust a client-supplied
-- id), validate the current state before transitioning, and write
-- everything in one transaction.
--
-- Nothing in this migration is wired up to anything yet. No webhook,
-- cron route, or Server Action calls any of these functions as of
-- this migration — they exist in the database, inert, callable only
-- via direct RPC (`supabase.rpc(...)`) for testing, exactly matching
-- the report's Phase 1 description ("testable via direct DB calls...
-- before any new UI exists"). Wiring the three payment webhooks and
-- the inspection-expiry cron to actually call these is a deliberate,
-- separate, carefully-reviewed follow-up (Phase 1's remaining item),
-- specifically because those are live, payment-critical code paths —
-- not something to fold into a schema/RPC migration.
--
-- EXECUTE privilege note: like every existing function in this
-- codebase (see create_withdrawal_request), the buyer/seller-facing
-- functions below rely on their own internal auth.uid() checks for
-- protection rather than an explicit `revoke execute from public` —
-- consistent with the established pattern, since Postgres grants
-- EXECUTE to PUBLIC by default and this codebase has never overridden
-- that. The two functions with no natural per-caller identity check
-- (create_transfer_room_on_payment, sweep_expired_inspections — both
-- system/webhook/cron-triggered, not user-initiated) are the
-- exception: those explicitly revoke from PUBLIC and grant only to
-- service_role, because there is no auth.uid()-based check that could
-- otherwise protect them — the same reasoning as this project's
-- service-role-only admin actions.
--
-- Payment-confirmation signal: today, all three live webhooks
-- (Stripe, SSLCommerz IPN, Escrow.com) flip `orders.status` from
-- 'awaiting_payment' to 'in_escrow' the moment payment is confirmed
-- (see src/app/api/webhooks/stripe/route.ts,
-- src/app/api/sslcommerz/ipn/route.ts,
-- src/app/api/escrow/webhook/route.ts) — 'in_escrow' is a legacy
-- internal enum value, not user-facing copy (the compliance rule
-- about never *displaying* the word "escrow" for Durqo-held funds is
-- unaffected). `create_transfer_room_on_payment` below checks for
-- exactly this status, since it's the real, already-live "payment
-- confirmed" signal across all three rails today. The later flip to
-- `orders.status = 'completed'` (currently a bare admin dropdown) is
-- intentionally NOT touched by anything here — wiring a room reaching
-- payout_eligible to that flip automatically is the report's Section
-- 6 "payout integration point," left for a dedicated, separate step
-- once this RPC layer is proven, not silently bundled in here.
-- ============================================================

-- ------------------------------------------------------------
-- Internal helper: append one row to the audit log. Not a public API
-- — only ever called from inside the other functions below, which
-- run as this same function's owner, so no separate grant is needed.
-- ------------------------------------------------------------
create or replace function public.log_transfer_event(
  p_room_id uuid,
  p_actor_id uuid,
  p_event_type text,
  p_reason text default null,
  p_metadata jsonb default '{}'
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.asset_transfer_events (room_id, actor_id, event_type, reason, metadata)
  values (p_room_id, p_actor_id, p_event_type, p_reason, coalesce(p_metadata, '{}'));
end;
$$;

-- ============================================================
-- 1. confirm_listing_assets — seller-only. Locks in the structured
-- asset list as the source of truth for future purchases of this
-- listing. Phase 2's checkout code will block a purchase on any
-- listing where listings.assets_confirmed_at is null.
-- ============================================================
create or replace function public.confirm_listing_assets(p_listing_id uuid)
returns public.listings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid := auth.uid();
  v_listing public.listings;
  v_asset_count int;
begin
  if v_seller_id is null then
    raise exception 'Not signed in.';
  end if;

  select * into v_listing from public.listings where id = p_listing_id;
  if v_listing.id is null then
    raise exception 'Listing not found.';
  end if;
  if v_listing.seller_id <> v_seller_id then
    raise exception 'You do not own this listing.';
  end if;

  select count(*) into v_asset_count from public.listing_assets where listing_id = p_listing_id;
  if v_asset_count = 0 then
    raise exception 'Add at least one asset to the list before confirming it.';
  end if;

  update public.listings set assets_confirmed_at = now()
    where id = p_listing_id
    returning * into v_listing;

  return v_listing;
end;
$$;

grant execute on function public.confirm_listing_assets(uuid) to authenticated;

-- ============================================================
-- 2. create_transfer_room_on_payment — system/webhook-triggered only.
-- Idempotent: calling it twice for the same order returns the
-- existing room rather than erroring or duplicating anything, since
-- a webhook can legitimately be retried/replayed.
--
-- Freezes listing_assets into order_asset_snapshots.snapshot_json
-- (each element keeps the source listing_assets.id as its own stable
-- `id`, which is what asset_transfer_items.snapshot_asset_id
-- correlates against — see migration 036's comment on that table),
-- creates the room already `room_unlocked` (payment is, by
-- definition, already confirmed by the time this is called), one
-- item per snapshot asset, and a post_sale_support_tracking row
-- seeded from the listing's current Post-Sale Support text.
-- ============================================================
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

  -- Idempotent re-entry: a retried/replayed webhook must not create a
  -- second room or a second snapshot for the same order.
  select * into v_room from public.asset_transfer_rooms where order_id = p_order_id;
  if v_room.id is not null then
    return v_room;
  end if;

  if v_order.status <> 'in_escrow' then
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

revoke execute on function public.create_transfer_room_on_payment(uuid) from public;
grant execute on function public.create_transfer_room_on_payment(uuid) to service_role;

-- ============================================================
-- Shared helper: fetch an item's room and verify the caller is that
-- room's buyer or seller (as required), raising if not. Used by every
-- item/room transition function below to avoid repeating the same
-- lookup+check five times.
-- ============================================================
create or replace function public.assert_transfer_participant(p_room_id uuid, p_role text)
returns public.asset_transfer_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.asset_transfer_rooms;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not signed in.';
  end if;

  select * into v_room from public.asset_transfer_rooms where id = p_room_id;
  if v_room.id is null then
    raise exception 'Transfer room not found.';
  end if;

  if p_role = 'seller' and v_room.seller_id <> v_uid then
    raise exception 'Only the seller can do this.';
  elsif p_role = 'buyer' and v_room.buyer_id <> v_uid then
    raise exception 'Only the buyer can do this.';
  elsif p_role = 'any' and v_uid <> v_room.buyer_id and v_uid <> v_room.seller_id then
    raise exception 'You are not part of this transfer.';
  end if;

  return v_room;
end;
$$;

-- ============================================================
-- 3. transfer_item_mark_in_progress — seller-only.
-- ============================================================
create or replace function public.transfer_item_mark_in_progress(p_item_id uuid)
returns public.asset_transfer_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.asset_transfer_items;
  v_room public.asset_transfer_rooms;
begin
  select * into v_item from public.asset_transfer_items where id = p_item_id;
  if v_item.id is null then
    raise exception 'Transfer item not found.';
  end if;

  v_room := public.assert_transfer_participant(v_item.room_id, 'seller');

  if v_item.status <> 'not_started' then
    raise exception 'This item is already %.', v_item.status;
  end if;

  update public.asset_transfer_items set status = 'in_progress', updated_at = now()
    where id = p_item_id returning * into v_item;

  if v_room.stage = 'room_unlocked' then
    update public.asset_transfer_rooms set stage = 'seller_transferring', updated_at = now() where id = v_room.id;
  end if;

  perform public.log_transfer_event(v_item.room_id, auth.uid(), 'item_in_progress', null, jsonb_build_object('item_id', v_item.id, 'name', v_item.name));

  return v_item;
end;
$$;

grant execute on function public.transfer_item_mark_in_progress(uuid) to authenticated;

-- ============================================================
-- 4. transfer_item_submit — seller-only. If this was the last item
-- still short of "submitted", the room advances to
-- awaiting_buyer_receipt (per the state machine: "All items Submitted"
-- is exactly that transition's trigger).
-- ============================================================
create or replace function public.transfer_item_submit(p_item_id uuid, p_seller_reference text default null)
returns public.asset_transfer_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.asset_transfer_items;
  v_room public.asset_transfer_rooms;
  v_remaining int;
begin
  select * into v_item from public.asset_transfer_items where id = p_item_id;
  if v_item.id is null then
    raise exception 'Transfer item not found.';
  end if;

  v_room := public.assert_transfer_participant(v_item.room_id, 'seller');

  if v_item.status not in ('not_started', 'in_progress') then
    raise exception 'This item is already %.', v_item.status;
  end if;

  update public.asset_transfer_items
    set status = 'submitted', submitted_at = now(), seller_reference = coalesce(p_seller_reference, seller_reference), updated_at = now()
    where id = p_item_id
    returning * into v_item;

  select count(*) into v_remaining from public.asset_transfer_items
    where room_id = v_room.id and status in ('not_started', 'in_progress');

  if v_remaining = 0 then
    update public.asset_transfer_rooms set stage = 'awaiting_buyer_receipt', updated_at = now() where id = v_room.id;
  end if;

  perform public.log_transfer_event(v_item.room_id, auth.uid(), 'item_submitted', null, jsonb_build_object('item_id', v_item.id, 'name', v_item.name));

  return v_item;
end;
$$;

grant execute on function public.transfer_item_submit(uuid, text) to authenticated;

-- ============================================================
-- 5. transfer_item_mark_received — buyer-only. Once every item is at
-- least received, the 7-day inspection window starts — this is the
-- report's Section 2.5 refinement (inspection starts on buyer
-- confirmation, not on a seller "transfer complete" claim).
-- ============================================================
create or replace function public.transfer_item_mark_received(p_item_id uuid)
returns public.asset_transfer_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.asset_transfer_items;
  v_room public.asset_transfer_rooms;
  v_remaining int;
begin
  select * into v_item from public.asset_transfer_items where id = p_item_id;
  if v_item.id is null then
    raise exception 'Transfer item not found.';
  end if;

  v_room := public.assert_transfer_participant(v_item.room_id, 'buyer');

  if v_item.status <> 'submitted' then
    raise exception 'This item is not awaiting receipt (status=%).', v_item.status;
  end if;

  update public.asset_transfer_items set status = 'received', received_at = now(), updated_at = now()
    where id = p_item_id returning * into v_item;

  select count(*) into v_remaining from public.asset_transfer_items
    where room_id = v_room.id and status not in ('received', 'accepted');

  if v_remaining = 0 and v_room.stage <> 'inspection_active' then
    update public.asset_transfer_rooms
      set stage = 'inspection_active', inspection_started_at = now(), inspection_deadline_at = now() + interval '7 days', updated_at = now()
      where id = v_room.id;
  end if;

  perform public.log_transfer_event(v_item.room_id, auth.uid(), 'item_received', null, jsonb_build_object('item_id', v_item.id, 'name', v_item.name));

  return v_item;
end;
$$;

grant execute on function public.transfer_item_mark_received(uuid) to authenticated;

-- ============================================================
-- 6. transfer_approve — buyer-only, bulk action (per the site owner's
-- confirmed choice: one "Approve Transfer" click accepts every
-- currently-Received item atomically, each still getting its own
-- accepted_at). Moves the room to payout_eligible. Deliberately does
-- NOT touch orders.status — see this file's header comment.
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

  perform public.log_transfer_event(p_room_id, auth.uid(), 'buyer_approved', null, jsonb_build_object('items_accepted', v_accepted_count));

  return v_room;
end;
$$;

grant execute on function public.transfer_approve(uuid) to authenticated;

-- ============================================================
-- 7. transfer_report_issue — buyer-only, during the inspection
-- window. Freezes payout by moving the room straight to admin_review
-- — never auto-releases, and only an admin (via the service-role
-- client, Phase 4) can move it out of that state.
-- ============================================================
create or replace function public.transfer_report_issue(
  p_room_id uuid,
  p_item_id uuid,
  p_category text,
  p_explanation text
) returns public.asset_transfer_issues
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.asset_transfer_rooms;
  v_issue public.asset_transfer_issues;
begin
  v_room := public.assert_transfer_participant(p_room_id, 'buyer');

  if v_room.stage <> 'inspection_active' then
    raise exception 'Issues can only be reported during the inspection window (stage=%).', v_room.stage;
  end if;

  if p_item_id is not null and not exists (
    select 1 from public.asset_transfer_items where id = p_item_id and room_id = p_room_id
  ) then
    raise exception 'That item does not belong to this transfer.';
  end if;

  if p_explanation is null or length(trim(p_explanation)) = 0 then
    raise exception 'An explanation is required.';
  end if;

  insert into public.asset_transfer_issues (room_id, item_id, reporter_id, category, explanation)
  values (p_room_id, p_item_id, auth.uid(), p_category, trim(p_explanation))
  returning * into v_issue;

  update public.asset_transfer_rooms set stage = 'admin_review', updated_at = now() where id = p_room_id;

  perform public.log_transfer_event(p_room_id, auth.uid(), 'issue_reported', p_category, jsonb_build_object('issue_id', v_issue.id, 'item_id', p_item_id));

  return v_issue;
end;
$$;

grant execute on function public.transfer_report_issue(uuid, uuid, text, text) to authenticated;

-- ============================================================
-- 8. transfer_amendment_propose — seller-only. `p_field` is
-- restricted to a small allowlist so this can never be used to
-- smuggle a write into an arbitrary column. A null p_item_id means
-- the amendment targets the Post-Sale Support terms instead of one
-- asset (post_sale_support_tracking.agreed_terms).
-- ============================================================
create or replace function public.transfer_amendment_propose(
  p_room_id uuid,
  p_item_id uuid,
  p_field text,
  p_proposed_value text
) returns public.asset_transfer_amendments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.asset_transfer_rooms;
  v_item public.asset_transfer_items;
  v_snapshot public.order_asset_snapshots;
  v_original_value text;
  v_amendment public.asset_transfer_amendments;
begin
  v_room := public.assert_transfer_participant(p_room_id, 'seller');

  if v_room.stage in ('payout_eligible', 'resolved_refund', 'resolved_settlement', 'cancelled') then
    raise exception 'This transfer is already closed out — no further amendments.';
  end if;

  if p_proposed_value is null or length(trim(p_proposed_value)) = 0 then
    raise exception 'A proposed value is required.';
  end if;

  if p_item_id is not null then
    if p_field not in ('buyer_receives', 'transfer_method', 'note') then
      raise exception 'Unrecognized field for an asset amendment: %', p_field;
    end if;
    select * into v_item from public.asset_transfer_items where id = p_item_id and room_id = p_room_id;
    if v_item.id is null then
      raise exception 'That item does not belong to this transfer.';
    end if;
    select * into v_snapshot from public.order_asset_snapshots where order_id = v_room.order_id;
    select elem->>p_field into v_original_value
      from jsonb_array_elements(v_snapshot.snapshot_json) as elem
      where (elem->>'id')::uuid = v_item.snapshot_asset_id;
  else
    if p_field not in ('agreed_terms') then
      raise exception 'Unrecognized field for a Post-Sale Support amendment: %', p_field;
    end if;
    select agreed_terms into v_original_value from public.post_sale_support_tracking where order_id = v_room.order_id;
  end if;

  insert into public.asset_transfer_amendments (room_id, item_id, field, original_value, proposed_value, proposed_by)
  values (p_room_id, p_item_id, p_field, v_original_value, trim(p_proposed_value), auth.uid())
  returning * into v_amendment;

  perform public.log_transfer_event(p_room_id, auth.uid(), 'amendment_proposed', null, jsonb_build_object('amendment_id', v_amendment.id, 'field', p_field));

  return v_amendment;
end;
$$;

grant execute on function public.transfer_amendment_propose(uuid, uuid, text, text) to authenticated;

-- ============================================================
-- 9. transfer_amendment_decide — buyer-only. On acceptance, applies
-- the change to the live snapshot (or Post-Sale Support terms) —
-- both the original and proposed value stay on the amendment row
-- either way, per the report's explicit requirement.
-- ============================================================
create or replace function public.transfer_amendment_decide(p_amendment_id uuid, p_accept boolean)
returns public.asset_transfer_amendments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amendment public.asset_transfer_amendments;
  v_room public.asset_transfer_rooms;
  v_item public.asset_transfer_items;
begin
  select * into v_amendment from public.asset_transfer_amendments where id = p_amendment_id;
  if v_amendment.id is null then
    raise exception 'Amendment not found.';
  end if;

  v_room := public.assert_transfer_participant(v_amendment.room_id, 'buyer');

  if v_amendment.status <> 'pending' then
    raise exception 'This amendment was already %.', v_amendment.status;
  end if;

  update public.asset_transfer_amendments
    set status = case when p_accept then 'accepted' else 'rejected' end,
        decided_by = auth.uid(),
        decided_at = now()
    where id = p_amendment_id
    returning * into v_amendment;

  if p_accept then
    if v_amendment.item_id is not null then
      select * into v_item from public.asset_transfer_items where id = v_amendment.item_id;

      update public.order_asset_snapshots
        set snapshot_json = (
          select jsonb_agg(
            case when (elem->>'id')::uuid = v_item.snapshot_asset_id
              then elem || jsonb_build_object(v_amendment.field, v_amendment.proposed_value)
              else elem
            end
          )
          from jsonb_array_elements(snapshot_json) as elem
        )
        where order_id = v_room.order_id;
    else
      update public.post_sale_support_tracking
        set agreed_terms = v_amendment.proposed_value, updated_at = now()
        where order_id = v_room.order_id;
    end if;
  end if;

  perform public.log_transfer_event(
    v_amendment.room_id, auth.uid(),
    case when p_accept then 'amendment_accepted' else 'amendment_rejected' end,
    null, jsonb_build_object('amendment_id', v_amendment.id, 'field', v_amendment.field)
  );

  return v_amendment;
end;
$$;

grant execute on function public.transfer_amendment_decide(uuid, boolean) to authenticated;

-- ============================================================
-- 10. transfer_send_message — buyer or seller. Deliberately not
-- logged to asset_transfer_events (that log is for state transitions
-- and admin actions, not day-to-day chat volume).
-- ============================================================
create or replace function public.transfer_send_message(p_room_id uuid, p_body text)
returns public.asset_transfer_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message public.asset_transfer_messages;
begin
  perform public.assert_transfer_participant(p_room_id, 'any');

  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'Message cannot be empty.';
  end if;

  insert into public.asset_transfer_messages (room_id, sender_id, body)
  values (p_room_id, auth.uid(), trim(p_body))
  returning * into v_message;

  return v_message;
end;
$$;

grant execute on function public.transfer_send_message(uuid, text) to authenticated;

-- ============================================================
-- 11. sweep_expired_inspections — cron-triggered only (mirrors the
-- existing CRON_SECRET-gated api/cron/reminders pattern). Moves any
-- room whose inspection window has lapsed straight to admin_review —
-- this is the one and only place an inspection deadline has any
-- effect, and it never sets payout_eligible. Idempotent: rooms
-- already past inspection_active are simply not matched again.
-- ============================================================
create or replace function public.sweep_expired_inspections()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  with expired as (
    update public.asset_transfer_rooms
      set stage = 'admin_review', updated_at = now()
      where stage = 'inspection_active' and inspection_deadline_at < now()
      returning id
  )
  insert into public.asset_transfer_events (room_id, actor_id, event_type, reason)
  select id, null, 'inspection_expired', 'Inspection window elapsed without buyer approval or a reported issue.'
  from expired;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.sweep_expired_inspections() from public;
grant execute on function public.sweep_expired_inspections() to service_role;
