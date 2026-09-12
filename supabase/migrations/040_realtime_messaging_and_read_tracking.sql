-- ============================================================
-- Durqo — real-time messaging: instant delivery + unread counts/sound,
-- for both the general Messages inbox and a Transfer Room's Deal Messages.
--
-- Per the site owner's request (2026-09-12): a sent message should appear
-- for the other party instantly, without them needing to refresh the page,
-- a notification sound should play when one arrives, and unread counts
-- should show next to the relevant nav item (mirroring the existing live
-- "Comments" badge pattern already in DashboardShell.tsx).
--
-- Two things were missing to make that possible:
--   1. Neither `messages` nor `asset_transfer_messages` was in the
--      `supabase_realtime` publication (confirmed empty via
--      pg_publication_tables before writing this), so no postgres_changes
--      event would ever reach a subscribed client no matter what RLS
--      allows.
--   2. `asset_transfer_messages` had no per-message read-tracking at all
--      — unlike `messages`, which already got `read_at` plus a recipient
--      update policy in 004_messages_read_policy.sql — needed for an
--      "unread deal messages" count.
--
-- Both tables' existing SELECT policies (messages_select_involved;
-- asset_transfer_messages_select, scoped through the parent room's
-- buyer_id/seller_id) already authorize exactly the two participants —
-- that's also what Realtime uses to decide who receives which row, so no
-- new SELECT policy is needed for either table.
-- ============================================================

alter table public.asset_transfer_messages add column if not exists read_at timestamptz;

-- Mirrors messages_update_recipient (004) exactly: the non-sender
-- participant on the message's room may mark it read. Same trust posture
-- as that policy — scoped by `using` only, not `with check`, relying on
-- the client only ever touching `read_at` (as markThreadRead() and the new
-- markTransferMessagesRead() both do) rather than the database enforcing a
-- column-level restriction.
create policy "asset_transfer_messages_mark_read" on public.asset_transfer_messages for update
  using (
    auth.uid() <> sender_id
    and exists (
      select 1 from public.asset_transfer_rooms r
      where r.id = room_id and (r.buyer_id = auth.uid() or r.seller_id = auth.uid())
    )
  );

-- Guarded (rather than a bare ALTER PUBLICATION) so this migration can
-- never fail with "table is already a member of publication" if either
-- table is ever added another way (e.g. by hand in the dashboard) before
-- this runs.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'asset_transfer_messages'
  ) then
    alter publication supabase_realtime add table public.asset_transfer_messages;
  end if;
end $$;
