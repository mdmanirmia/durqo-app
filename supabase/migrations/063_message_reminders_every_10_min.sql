-- Nov 7, 2026 ("1 hour er majhe message er reply na korle email e
-- notification asbe ... eitake 1 hour e niye aso"): the unanswered-message
-- reminder moves from 3 hours / once a day (Vercel cron) to 1 hour, checked
-- every 10 minutes. Vercel's plan only allows daily crons, so the schedule
-- lives here: pg_cron calls the site's /api/hooks/message-reminders through
-- pg_net (enabled in migration 062). The rules themselves (1 hour, one
-- reminder per message, last 3 days only) are in src/lib/message-reminders.ts.

create extension if not exists pg_cron;

select cron.unschedule(jobid) from cron.job where jobname = 'durqo-message-reminders';

select cron.schedule(
  'durqo-message-reminders',
  '*/10 * * * *',
  $$select net.http_post(
      url := 'https://www.durqo.com/api/hooks/message-reminders',
      body := '{}'::jsonb,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      timeout_milliseconds := 30000
    );$$
);
