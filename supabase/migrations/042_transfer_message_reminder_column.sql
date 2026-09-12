-- Sep 12, 2026: same one-way reminder-tracking pattern as migration 026
-- (comments/messages), extended to Deal Messages (asset_transfer_messages)
-- now that they have per-message read tracking (migration 040's `read_at`).
-- Backs the new remindStaleTransferMessages() sweep in
-- src/app/api/cron/reminders/route.ts — a nullable, one-way timestamp the
-- cron route sets the first (and only) time it emails a reminder about a
-- given unread Deal Message, so a stale message gets at most one reminder
-- ever and the sweep stays safe to re-run.
alter table public.asset_transfer_messages add column if not exists reminder_sent_at timestamptz;
