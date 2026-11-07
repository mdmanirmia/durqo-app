-- Nov 7, 2026 ("ei buyer seller k message korlo but seller toh message
-- paini"): new messages only produced an email through the once-a-day
-- reminder cron (12:00 UTC, for messages unread for 3+ hours), so a message
-- sent just after the cron ran waited ~22 hours before the recipient heard
-- about it. Now every new message asks /api/hooks/new-message (via pg_net)
-- to email the recipient right away. That route re-checks everything with
-- the service-role client and records `notified_at` so each message is
-- emailed at most once, and at most one email per conversation per 30 min.

alter table public.messages add column if not exists notified_at timestamptz;

create or replace function public.notify_on_new_message()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  begin
    perform net.http_post(
      url := 'https://www.durqo.com/api/hooks/new-message',
      body := jsonb_build_object('message_id', new.id),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      timeout_milliseconds := 5000
    );
  exception when others then
    -- An email problem must never block sending a message.
    raise warning 'notify_on_new_message: %', sqlerrm;
  end;
  return new;
end;
$$;

revoke execute on function public.notify_on_new_message() from public, anon, authenticated;

drop trigger if exists on_message_created_notify on public.messages;
create trigger on_message_created_notify
  after insert on public.messages
  for each row execute function public.notify_on_new_message();
