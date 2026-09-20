-- ============================================================
-- Durqo — Admin "Block" now actually prevents the blocked account
-- from doing anything, not just logging in.
--
-- Site owner request: block a seller/buyer so they can't
-- list/update a listing, send a (regular or deal/transfer-room)
-- message, or request a payout withdrawal — with an unblock option
-- too. The unblock option already existed (the "Block"/"Unblock"
-- button on the admin Users table, profiles.is_active, migration
-- 008) — what didn't exist was full enforcement of it:
--
--   - LoginForm.tsx already refuses a blocked account's next sign-in.
--   - src/proxy.ts (Next.js middleware) already force-signs-out a
--     blocked account on its very next page navigation, so a live
--     session doesn't stay usable past the point it's blocked.
--
-- What that DIDN'T cover: a blocked account whose browser tab was
-- already open with a live Supabase access token (not revoked by
-- signOut() — only the refresh token is, the JWT itself is valid
-- until it expires) could still successfully:
--   - create a new listing — src/app/dashboard/seller/listings/new/
--     page.tsx inserts into `listings` directly from the browser's
--     Supabase client, never touching Next.js middleware at all
--     (it's a direct Supabase REST call, not a page navigation)
--   - send a regular message — messages.client.ts's sendMessage(),
--     same direct-client-insert story
--   - send a message in an active Asset Transfer Room, or take any
--     other transfer-room action (submit/receive/approve an item,
--     report an issue, propose/decide an amendment) — all of those
--     go through SECURITY DEFINER RPCs (migration 037) that only
--     ever checked "is this the right buyer/seller for this room",
--     never "is this account blocked"
--   - request a payout — create_withdrawal_request() (migration
--     028, reshaped by 045's payout policy v2), same gap: only
--     checked auth.uid() + payout_verified
--
-- This migration closes all of those at the actual write boundary —
-- a trigger for the two direct-client inserts, an in-function check
-- for every SECURITY DEFINER RPC — rather than relying on the
-- login/middleware layer alone. Listing UPDATES (as opposed to
-- create) already go exclusively through updateListingFull() in
-- src/lib/actions/listing-edit.ts, a Server Action using the
-- service-role client (bypasses RLS/triggers) — that one gets its
-- own check added in application code (requireEditAccess() in that
-- file), not here.
-- ============================================================

-- Shared helper, used everywhere below instead of repeating the same
-- subquery. Fails OPEN (true) if the given id has no profiles row at
-- all — a missing profile is a data-integrity question, not a
-- blocking decision, matching profiles.is_active's own "not null
-- default true".
create or replace function public.is_account_active(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_active from public.profiles p where p.id = p_user_id), true);
$$;

-- ------------------------------------------------------------
-- 1. Direct-client inserts: a new listing, a new (regular) message.
-- Both go straight from the browser's Supabase client to these
-- tables, so the check has to live at the database layer. A BEFORE
-- INSERT trigger (rather than folding this into the existing
-- listings_insert_own / messages_insert_sender RLS policies) gives a
-- clear, specific error message instead of Postgres's generic "new
-- row violates row-level security policy" text. Guarded by
-- `auth.uid() is not null` so this never fires for a service-role
-- insert (none exist today for either table — confirmed by an audit
-- of the codebase before writing this — but this keeps it that way
-- by construction rather than by accident).
-- ------------------------------------------------------------
create or replace function public.reject_if_account_blocked()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_account_active(auth.uid()) then
    raise exception 'Your account has been blocked. Contact Durqo support for help.';
  end if;
  return new;
end;
$$;

drop trigger if exists listings_block_inactive_seller on public.listings;
create trigger listings_block_inactive_seller
  before insert on public.listings
  for each row execute function public.reject_if_account_blocked();

drop trigger if exists messages_block_inactive_sender on public.messages;
create trigger messages_block_inactive_sender
  before insert on public.messages
  for each row execute function public.reject_if_account_blocked();

-- ------------------------------------------------------------
-- 2. confirm_listing_assets — seller confirming the "Sale Includes"
-- asset list is itself a listing-update action (it gates Transfer
-- Room creation). Byte-for-byte the live function (verified via
-- pg_get_functiondef before writing this migration) plus the new
-- check, so nothing else about it changes.
-- ------------------------------------------------------------
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
  if not public.is_account_active(v_seller_id) then
    raise exception 'Your account has been blocked. Contact Durqo support for help.';
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

-- ------------------------------------------------------------
-- 3. assert_transfer_participant — the single shared gate every
-- Asset Transfer Room RPC calls (item mark-in-progress/submit/mark-
-- received, transfer_approve, transfer_report_issue, amendment
-- propose/decide, and transfer_send_message — the "deal message"
-- path). Adding the check here covers all of them in one place.
-- Byte-for-byte the live function plus the new check.
-- ------------------------------------------------------------
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
  if not public.is_account_active(v_uid) then
    raise exception 'Your account has been blocked. Contact Durqo support for help.';
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

-- ------------------------------------------------------------
-- 4. create_withdrawal_request — payment withdrawal. Byte-for-byte
-- the live function (payout policy v2 shape, migration 045 — MFS
-- daily/monthly caps, per-order partial claiming) plus the new
-- check, so none of that logic is touched.
-- ------------------------------------------------------------
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
  v_payout_verified boolean;
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
  if not public.is_account_active(v_seller_id) then
    raise exception 'Your account has been blocked. Contact Durqo support for help.';
  end if;

  select payout_verified into v_payout_verified from public.profiles where id = v_seller_id;
  if not coalesce(v_payout_verified, false) then
    raise exception 'Payout verification is required before your first withdrawal. Submit your identity documents from the Verification page and our team will review them.';
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

  perform 1 from public.orders
    where seller_id = v_seller_id and status = 'completed' and payment_channel <> 'escrow_com'
    for update;

  if v_is_mfs then
    select coalesce(sum(net_amount), 0) into v_daily_usd
      from public.withdrawal_requests
      where seller_id = v_seller_id
        and payout_method = p_payout_method
        and status <> 'rejected' and status <> 'cancelled'
        and requested_at >= date_trunc('day', now());

    select coalesce(sum(net_amount), 0) into v_monthly_usd
      from public.withdrawal_requests
      where seller_id = v_seller_id
        and payout_method = p_payout_method
        and status <> 'rejected' and status <> 'cancelled'
        and requested_at >= date_trunc('month', now());

    v_cap_usd := least(
      greatest(0, 50000 - v_daily_usd * p_bdt_rate) / p_bdt_rate,
      greatest(0, 300000 - v_monthly_usd * p_bdt_rate) / p_bdt_rate
    );

    if v_cap_usd <= 0 then
      raise exception 'You have reached your % withdrawal limit for today or this month — please try again later.', v_method_label;
    end if;
  end if;

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
        where wro.order_id = o.id and wr.status <> 'rejected' and wr.status <> 'cancelled'
      ) c on true
      where o.seller_id = v_seller_id and o.status = 'completed' and o.payment_channel <> 'escrow_com'
    ) x
    where x.remaining_net > 0
    order by x.created_at asc, x.id asc
  loop
    if v_is_mfs then
      v_remaining_cap := v_cap_usd - v_net;
      exit when v_remaining_cap <= 0;

      if r.remaining_net <= v_remaining_cap then
        v_claim_gross := r.remaining_gross;
        v_claim_fee := r.remaining_fee;
        v_claim_net := r.remaining_net;
      else
        v_rate := r.fee_amount / r.gross_amount;
        v_claim_net := v_remaining_cap;
        v_claim_gross := round(v_claim_net / (1 - v_rate), 2);
        v_claim_fee := v_claim_gross - v_claim_net;

        if v_claim_gross > r.remaining_gross then
          v_claim_gross := r.remaining_gross;
          v_claim_fee := r.remaining_fee;
          v_claim_net := r.remaining_net;
        end if;
      end if;
    else
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
    raise exception 'No completed orders are available to withdraw.';
  end if;

  insert into public.withdrawal_requests (seller_id, gross_amount, success_fee_amount, net_amount, order_count, payout_method, payout_details, status)
  values (v_seller_id, v_gross, v_fee, v_net, v_count, p_payout_method, trim(p_payout_details), 'requested')
  returning * into v_request;

  insert into public.withdrawal_request_orders (withdrawal_id, order_id, gross_amount, fee_amount, net_amount)
  select v_request.id, t.oid, t.g, t.f, t.n
  from unnest(v_claim_order_ids, v_claim_gross_arr, v_claim_fee_arr, v_claim_net_arr) as t(oid, g, f, n);

  insert into public.withdrawal_status_history (withdrawal_id, previous_status, new_status, reason)
  values (v_request.id, null, 'requested', null);

  return v_request;
end;
$$;
