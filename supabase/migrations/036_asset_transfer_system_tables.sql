-- ============================================================
-- Durqo — Asset Transfer System v2: data model (Phase 1 of the
-- Asset Transfer System v2 feasibility report, Sep 12 2026).
--
-- This migration is schema + RLS ONLY. It creates ten new, fully
-- additive tables, one new private Storage bucket, and two small
-- pieces of schema-inherent behaviour (a trigger that un-confirms a
-- listing's asset list when it's edited, and a checkout-relevant
-- column on `listings`). It deliberately does NOT create any of the
-- SECURITY DEFINER RPCs that actually move a room through its state
-- machine (room creation on payment confirmation, item transitions,
-- messages, issues, amendments, admin resolution) — those are a
-- separate migration (037), matching the report's Phase 1 split of
-- "schema" vs. "backend RPCs / Server Actions".
--
-- Nothing in `listings`, `orders`, `profiles`, or the withdrawal
-- system is restructured. `listings` gets one new nullable column
-- (`assets_confirmed_at`); everything else is new tables.
--
-- Decisions confirmed by the site owner before this was written:
--   - v1 supports exactly the three payment rails that already exist
--     today (Stripe, SSLCommerz/bangladesh_gateway, Escrow.com) — no
--     new "manual bank transfer" buyer-facing checkout rail. Nothing
--     in this schema hard-codes that assumption (a room is unlocked
--     by *a* payment-confirmation event, not by a specific rail), so
--     adding a fourth rail later remains possible without touching
--     this migration.
--   - The final buyer "Approve Transfer" action is a single bulk
--     action that atomically accepts every currently-Received item —
--     not a per-item Accept click. `asset_transfer_items.accepted_at`
--     still gets its own per-item timestamp for the audit trail, it
--     just all happens in one server-side transaction.
--   - Checkout is blocked entirely for a listing that has no
--     confirmed structured asset list (enforced by Phase 2's checkout
--     code, not by this schema — this migration only adds the
--     `assets_confirmed_at` flag it will check).
--
-- Naming: table names are the site owner's own, from their Part 1-17
-- specification, adopted as authoritative over the two earlier,
-- narrower feasibility reports' proposed names (see the delivered
-- "Asset Transfer System v2" report, Section 2.3).
-- ============================================================

-- ---------- 0. One new column on `listings` ----------
-- Null until the seller runs the (Phase 2) "confirm structured asset
-- list" action. Phase 2's checkout code blocks a purchase on any
-- listing where this is null, per the site owner's confirmed choice —
-- there would otherwise be nothing correct to snapshot at purchase
-- time (see order_asset_snapshots below).
alter table public.listings
  add column if not exists assets_confirmed_at timestamptz;

-- ============================================================
-- 1. listing_assets — the seller's own live, editable structured
-- asset list for a listing. Pre-sale only; never touched by an order.
-- 100% seller-authored: no category template, no auto-suggestion, no
-- AI-derived content of any kind populates this table, ever.
-- ============================================================
create table if not exists public.listing_assets (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  position int not null default 0,
  name text not null,
  buyer_receives text,
  transfer_method text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listing_assets_listing_idx on public.listing_assets(listing_id);

-- Editing the list after it was confirmed un-confirms it — a seller
-- must re-run the confirm action before the listing can be sold under
-- the new (edited) list. Without this, a seller could confirm, sell,
-- then quietly change what a *future* buyer would see without ever
-- re-confirming, which is exactly the silent-drift problem the
-- confirm step exists to prevent.
create or replace function public.clear_listing_assets_confirmation()
returns trigger
language plpgsql
as $$
declare
  v_listing_id uuid := coalesce(new.listing_id, old.listing_id);
begin
  update public.listings set assets_confirmed_at = null
    where id = v_listing_id and assets_confirmed_at is not null;
  return coalesce(new, old);
end;
$$;

drop trigger if exists listing_assets_clear_confirmation on public.listing_assets;
create trigger listing_assets_clear_confirmation
  after insert or update or delete on public.listing_assets
  for each row execute procedure public.clear_listing_assets_confirmation();

-- ============================================================
-- 2. order_asset_snapshots — one immutable row per order, freezing
-- the entire listing_assets list (plus the Post-Sale Support terms)
-- exactly as they stood the moment payment was confirmed. Later edits
-- to listing_assets never retroactively change an existing order —
-- this table is the only thing a Transfer Room ever reads asset
-- content from.
--
-- snapshot_json is an array of objects, each carrying its own stable
-- `id` (copied from the source listing_assets.id at snapshot time) —
-- that id is what asset_transfer_items.snapshot_asset_id below
-- correlates against. It is intentionally NOT a foreign key: the
-- snapshot must stay byte-identical even if the source listing_assets
-- row is later edited or deleted.
--   [{ id, position, name, buyer_receives, transfer_method, note }]
-- ============================================================
create table if not exists public.order_asset_snapshots (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  listing_id uuid not null references public.listings(id),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  snapshot_json jsonb not null,
  post_sale_support_text text,
  created_at timestamptz not null default now()
);

create index if not exists order_asset_snapshots_buyer_idx on public.order_asset_snapshots(buyer_id);
create index if not exists order_asset_snapshots_seller_idx on public.order_asset_snapshots(seller_id);

-- ============================================================
-- 3. asset_transfer_rooms — one row per order: the room's own stage
-- (the order/room-level state machine from the feasibility report,
-- Section 5.1) plus its key timestamps.
--
-- buyer_id/seller_id are denormalized from orders at room-creation
-- time (immutable thereafter) so every child table below can express
-- its own RLS as a single join to this table instead of a two-hop
-- join through `orders` — cheaper, and one consistent pattern for all
-- eight child tables.
-- ============================================================
create table if not exists public.asset_transfer_rooms (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  stage text not null default 'order_created' check (stage in (
    'order_created',
    'room_locked_awaiting_payment',
    'room_unlocked',
    'seller_transferring',
    'awaiting_buyer_receipt',
    'inspection_active',
    'admin_review',
    'payout_eligible',
    'resolved_refund',
    'resolved_settlement',
    'cancelled'
  )),
  unlocked_at timestamptz,
  inspection_started_at timestamptz,
  inspection_deadline_at timestamptz,
  payout_eligible_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists asset_transfer_rooms_buyer_idx on public.asset_transfer_rooms(buyer_id);
create index if not exists asset_transfer_rooms_seller_idx on public.asset_transfer_rooms(seller_id);
create index if not exists asset_transfer_rooms_stage_idx on public.asset_transfer_rooms(stage);

-- ============================================================
-- 4. asset_transfer_items — exactly one row per snapshot asset
-- (never invented, combined, or dropped). Per-item status machine:
-- not_started -> in_progress -> submitted (seller-only transitions)
-- -> received -> accepted (buyer-only transitions; "accepted" is set
-- in bulk by the single final Approve Transfer action, per the site
-- owner's confirmed choice above — each row still gets its own
-- accepted_at for the audit trail).
-- ============================================================
create table if not exists public.asset_transfer_items (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.asset_transfer_rooms(id) on delete cascade,
  snapshot_asset_id uuid not null,
  name text not null,
  status text not null default 'not_started' check (status in (
    'not_started', 'in_progress', 'submitted', 'received', 'accepted'
  )),
  seller_reference text,
  submitted_at timestamptz,
  received_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, snapshot_asset_id)
);

create index if not exists asset_transfer_items_room_idx on public.asset_transfer_items(room_id);
create index if not exists asset_transfer_items_status_idx on public.asset_transfer_items(status);

-- ============================================================
-- 5. asset_transfer_issues — buyer-reported problems on a room or a
-- specific item. Created before asset_transfer_files below so files
-- can reference it.
-- ============================================================
create table if not exists public.asset_transfer_issues (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.asset_transfer_rooms(id) on delete cascade,
  item_id uuid references public.asset_transfer_items(id) on delete set null,
  reporter_id uuid not null references public.profiles(id),
  category text not null check (category in (
    'not_received', 'not_working', 'incomplete', 'misrepresented', 'credentials_invalid', 'other'
  )),
  explanation text not null,
  status text not null default 'open' check (status in (
    'open', 'seller_responded', 'admin_review', 'resolved'
  )),
  seller_response text,
  resolution text,
  resolution_type text check (resolution_type in (
    'returned_to_seller', 'approved_despite_report', 'refund_authorized', 'settlement_recorded', 'order_cancelled'
  )),
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists asset_transfer_issues_room_idx on public.asset_transfer_issues(room_id);
create index if not exists asset_transfer_issues_status_idx on public.asset_transfer_issues(status);

-- ============================================================
-- 6. asset_transfer_files — evidence/attachments. Only private
-- Storage object keys are ever stored here, never raw file bytes.
-- Deliberately append-only at the RLS layer below (insert + select
-- only, no update, no delete for anyone but the service role) — per
-- the report's explicit requirement that evidence can't be deleted by
-- either party.
-- ============================================================
create table if not exists public.asset_transfer_files (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.asset_transfer_rooms(id) on delete cascade,
  item_id uuid references public.asset_transfer_items(id) on delete set null,
  issue_id uuid references public.asset_transfer_issues(id) on delete set null,
  uploader_id uuid not null references public.profiles(id),
  storage_path text not null,
  original_filename text,
  content_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create index if not exists asset_transfer_files_room_idx on public.asset_transfer_files(room_id);

-- ============================================================
-- 7. asset_transfer_messages — deal-specific chat, deliberately
-- separate from the general `messages` table (whose direct-client
-- insert policy has no real participant check — not a pattern to
-- reuse for dispute-relevant conversation).
-- ============================================================
create table if not exists public.asset_transfer_messages (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.asset_transfer_rooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists asset_transfer_messages_room_idx on public.asset_transfer_messages(room_id, created_at);

-- ============================================================
-- 8. asset_transfer_amendments — every proposed post-purchase change
-- to an already-snapshotted item or a Post-Sale Support term. Both
-- the original and proposed value are always retained, whether
-- accepted or rejected.
-- ============================================================
create table if not exists public.asset_transfer_amendments (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.asset_transfer_rooms(id) on delete cascade,
  item_id uuid references public.asset_transfer_items(id) on delete set null,
  field text not null,
  original_value text,
  proposed_value text not null,
  proposed_by uuid not null references public.profiles(id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists asset_transfer_amendments_room_idx on public.asset_transfer_amendments(room_id);
create index if not exists asset_transfer_amendments_status_idx on public.asset_transfer_amendments(status);

-- ============================================================
-- 9. asset_transfer_events — append-only audit log. Every state
-- transition and every admin action writes a row here, always with
-- an actor (null only for a genuinely system-triggered event, e.g.
-- the inspection-expiry cron) and, for admin actions, a reason.
-- ============================================================
create table if not exists public.asset_transfer_events (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.asset_transfer_rooms(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  event_type text not null,
  reason text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists asset_transfer_events_room_idx on public.asset_transfer_events(room_id, created_at);

-- ============================================================
-- 10. post_sale_support_tracking — separate lifecycle for the
-- non-transferable post-sale support commitment. Entirely independent
-- of the asset items and the payout gate: a room can reach
-- payout_eligible with support still `active`.
-- ============================================================
create table if not exists public.post_sale_support_tracking (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  agreed_terms text,
  duration_days int,
  status text not null default 'not_started' check (status in ('not_started', 'active', 'completed')),
  start_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists post_sale_support_tracking_buyer_idx on public.post_sale_support_tracking(buyer_id);
create index if not exists post_sale_support_tracking_seller_idx on public.post_sale_support_tracking(seller_id);

-- ============================================================
-- Row Level Security
--
-- listing_assets is the one exception to the "zero client write
-- policy" rule below — it's the seller's own pre-sale draft content,
-- the same trust level as listing_faqs/listing_images (which already
-- have owner-write policies), not a money-relevant state transition.
--
-- Every other table here gets SELECT-only client policies, scoped to
-- the room's buyer/seller. All writes go through SECURITY DEFINER
-- RPCs (migration 037) or the service-role admin client — mirroring
-- create_withdrawal_request() and explicitly NOT mirroring
-- orders_update_involved (already-flagged column gap) or messages'
-- permissive insert policy. Admin reads use the existing service-role
-- admin client (src/lib/supabase/admin.ts), which bypasses RLS
-- entirely — same convention as every other admin dashboard page in
-- this codebase (no `profiles.role = 'admin'` RLS policy exists
-- anywhere today; admin authorization is enforced in application code
-- via requireAdmin(), not in the database).
-- ============================================================
alter table public.listing_assets enable row level security;
alter table public.order_asset_snapshots enable row level security;
alter table public.asset_transfer_rooms enable row level security;
alter table public.asset_transfer_items enable row level security;
alter table public.asset_transfer_issues enable row level security;
alter table public.asset_transfer_files enable row level security;
alter table public.asset_transfer_messages enable row level security;
alter table public.asset_transfer_amendments enable row level security;
alter table public.asset_transfer_events enable row level security;
alter table public.post_sale_support_tracking enable row level security;

-- listing_assets: readable with the parent listing (same as
-- listing_images/listing_faqs), writable only by the owning seller.
create policy "listing_assets_select" on public.listing_assets for select using (true);
create policy "listing_assets_write" on public.listing_assets for all using (
  exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
);

-- order_asset_snapshots: read-only to the buyer or seller involved.
create policy "order_asset_snapshots_select" on public.order_asset_snapshots for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- asset_transfer_rooms: read-only to the buyer or seller involved.
create policy "asset_transfer_rooms_select" on public.asset_transfer_rooms for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Every child table: read-only, scoped via a single join up to the
-- room's buyer_id/seller_id.
create policy "asset_transfer_items_select" on public.asset_transfer_items for select
  using (exists (
    select 1 from public.asset_transfer_rooms r
    where r.id = room_id and (r.buyer_id = auth.uid() or r.seller_id = auth.uid())
  ));

create policy "asset_transfer_issues_select" on public.asset_transfer_issues for select
  using (exists (
    select 1 from public.asset_transfer_rooms r
    where r.id = room_id and (r.buyer_id = auth.uid() or r.seller_id = auth.uid())
  ));

create policy "asset_transfer_files_select" on public.asset_transfer_files for select
  using (exists (
    select 1 from public.asset_transfer_rooms r
    where r.id = room_id and (r.buyer_id = auth.uid() or r.seller_id = auth.uid())
  ));

create policy "asset_transfer_messages_select" on public.asset_transfer_messages for select
  using (exists (
    select 1 from public.asset_transfer_rooms r
    where r.id = room_id and (r.buyer_id = auth.uid() or r.seller_id = auth.uid())
  ));

create policy "asset_transfer_amendments_select" on public.asset_transfer_amendments for select
  using (exists (
    select 1 from public.asset_transfer_rooms r
    where r.id = room_id and (r.buyer_id = auth.uid() or r.seller_id = auth.uid())
  ));

create policy "asset_transfer_events_select" on public.asset_transfer_events for select
  using (exists (
    select 1 from public.asset_transfer_rooms r
    where r.id = room_id and (r.buyer_id = auth.uid() or r.seller_id = auth.uid())
  ));

create policy "post_sale_support_tracking_select" on public.post_sale_support_tracking for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- ============================================================
-- Storage: new PRIVATE bucket for Transfer Room evidence/attachments,
-- mirroring the existing `seller-verification` bucket's pattern
-- exactly, except the "owner" of a folder is either participant in
-- that room (buyer or seller), not a single uid — so the path
-- convention is order-transfer-evidence/<room_id>/<filename>, and the
-- policy joins back to asset_transfer_rooms to check participation
-- instead of a flat uid comparison.
--
-- Insert + select only, deliberately no update/delete policy for any
-- client role — evidence is append-only, matching
-- asset_transfer_files' own design above. Only the service-role admin
-- client (bypasses RLS) can ever remove an object, and no application
-- code is expected to do that.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('order-transfer-evidence', 'order-transfer-evidence', false)
on conflict (id) do nothing;

create policy "order_transfer_evidence_participant_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'order-transfer-evidence'
    and exists (
      select 1 from public.asset_transfer_rooms r
      where r.id::text = (storage.foldername(name))[1]
        and (r.buyer_id = auth.uid() or r.seller_id = auth.uid())
    )
  );

create policy "order_transfer_evidence_participant_select"
  on storage.objects for select
  using (
    bucket_id = 'order-transfer-evidence'
    and exists (
      select 1 from public.asset_transfer_rooms r
      where r.id::text = (storage.foldername(name))[1]
        and (r.buyer_id = auth.uid() or r.seller_id = auth.uid())
    )
  );
