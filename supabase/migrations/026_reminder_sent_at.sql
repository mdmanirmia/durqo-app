-- Sep 10, 2026: backs the "seller didn't reply within 3 hours" email
-- reminder (src/app/api/cron/reminders/route.ts). A nullable, one-way
-- timestamp: the cron route sets it the first (and only) time it emails a
-- reminder about a given comment/message, then always skips rows where it's
-- already set — so a stale item gets at most one reminder ever, never a
-- repeating daily nudge, and the sweep stays safe to re-run (Vercel cron
-- delivery is best-effort and can occasionally invoke the same run twice).
alter table public.comments add column if not exists reminder_sent_at timestamptz;
alter table public.messages add column if not exists reminder_sent_at timestamptz;
