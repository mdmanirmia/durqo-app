-- ============================================================
-- Durqo — fixes a real, long-standing bug: 004_messages_read_policy.sql
-- (which adds messages_update_recipient, letting a recipient mark their own
-- received messages read) exists as a migration FILE in the repo, but was
-- never actually applied to this production database — confirmed by
-- querying pg_policies on `messages` directly (2026-09-12): only
-- messages_insert_sender and messages_select_involved exist, no UPDATE
-- policy at all. With RLS enabled and no matching policy, Postgres denies
-- every UPDATE by default — so every markThreadRead() call
-- (messages.client.ts) has been silently failing this whole time (it's
-- wrapped in a swallow-the-error try/catch, "best-effort", by design for a
-- missing-migration soft-degrade — which is exactly what masked this).
-- Net effect: `read_at` never got set on a single row, ever, so every
-- received message has stayed "unread" forever and unread badges could
-- never clear — reported by the site owner once the new live Messages
-- badge (migration 040) made a stuck badge actually visible.
--
-- This is byte-for-byte 004_messages_read_policy.sql's own policy,
-- finally actually landing. No backfill needed: once this is live, the
-- next time a user opens a thread they've already seen, markThreadRead()
-- succeeds and clears it — same self-healing behavior the app already
-- relies on everywhere else.
-- ============================================================

create policy "messages_update_recipient" on public.messages for update
  using (auth.uid() = recipient_id);
