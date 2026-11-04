-- Nov 3, 2026 ("aj 5 jon buyer/seller account korlo and verify o korlo but
-- ami kono notification pelam nah"): the admin "new account" email used to
-- fire only from /auth/callback after a successful PKCE code exchange. That
-- exchange needs a code-verifier cookie stored by the browser that filled in
-- the register form, so whenever the confirmation link is opened somewhere
-- else (the Gmail app's built-in browser on a phone, a different browser or
-- device) the exchange fails, the callback bails out, and no admin email is
-- sent, even though Supabase has already marked the email as verified. On
-- Nov 3, all five verified signups went that way.
--
-- New path, independent of which browser opens the link: a trigger on
-- auth.users fires the moment email_confirmed_at is set and asks the site's
-- /api/hooks/user-verified route (via pg_net) to send the notification.
-- That route re-checks everything with the service-role client, so the
-- request body is only a hint (a user id); this table records who has been
-- notified so each account produces at most one admin email, no matter how
-- many times the trigger, the callback, or the daily sweep asks.

create extension if not exists pg_net with schema extensions;

create table if not exists public.admin_signup_notifications (
  user_id uuid primary key references auth.users (id) on delete cascade,
  notified_at timestamptz not null default now()
);

alter table public.admin_signup_notifications enable row level security;
-- No policies: only the service-role client (the hook route / cron) touches it.
revoke all on public.admin_signup_notifications from anon, authenticated;
grant select, insert, update, delete on public.admin_signup_notifications to service_role;

-- Everyone already verified before today's fix counts as notified, except the
-- Nov 3 signups that were missed (they are sent once, right after deploy).
insert into public.admin_signup_notifications (user_id, notified_at)
select id, coalesce(email_confirmed_at, now())
from auth.users
where email_confirmed_at is not null
  and email_confirmed_at < '2026-11-03 00:00:00+00'
on conflict (user_id) do nothing;

create or replace function public.notify_admin_on_email_verified()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.email_confirmed_at is not null
     and (tg_op = 'INSERT' or old.email_confirmed_at is null) then
    begin
      perform net.http_post(
        url := 'https://www.durqo.com/api/hooks/user-verified',
        body := jsonb_build_object('user_id', new.id),
        headers := '{"Content-Type": "application/json"}'::jsonb,
        timeout_milliseconds := 5000
      );
    exception when others then
      -- A notification problem must never block a signup or a verification.
      raise warning 'notify_admin_on_email_verified: %', sqlerrm;
    end;
  end if;
  return new;
end;
$$;

revoke execute on function public.notify_admin_on_email_verified() from public, anon, authenticated;

drop trigger if exists on_auth_user_email_verified on auth.users;
create trigger on_auth_user_email_verified
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.notify_admin_on_email_verified();
