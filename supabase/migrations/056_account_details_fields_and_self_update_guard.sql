-- 2026-09-23: seller/buyer "Account Details" feature request (First Name,
-- Last Name, Email, Password, Address, with email/password change support)
-- needed two new self-service profile columns that didn't exist yet.
-- full_name stays the canonical display field used across many existing
-- read sites (listing cards, dashboards, admin tables, emails) -- first_name/
-- last_name are additive, kept in sync from the account form on every save
-- (full_name := trim(first_name || ' ' || last_name)) rather than replacing
-- full_name everywhere. address is a new private mailing-address field,
-- deliberately separate from the existing public `location` column (shown
-- on public seller profiles/listings) so this doesn't change what's shown
-- publicly.
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists address text;

-- Investigation triggered by this same feature (widening what a signed-in
-- user can self-update): profiles_update_own's RLS policy
-- ("using (auth.uid() = id)") only restricts *which row* a user can touch,
-- not *which columns* -- Postgres RLS using/with check clauses can't do
-- column-level restriction, and no trigger or column-level GRANT existed on
-- public.profiles. In practice this meant any signed-in user could already
-- call .from("profiles").update({ role: "admin" }) (or payout_verified,
-- is_verified, is_active, verification_status: "verified", ...) on their
-- own row directly and it would have been silently accepted -- nothing
-- besides "the official UI doesn't expose a control for it" was stopping
-- that. Closing it here with a BEFORE UPDATE trigger rather than column
-- GRANTs, since GRANTs would need every legitimate self-service update site
-- (this migration's new fields, full_name, location, bio, avatar_url,
-- address, and the seller verification submission's own columns)
-- enumerated as an explicit column allow-list, and a future new
-- self-service field would silently break until someone remembered to
-- update that list. A trigger fails safe the other way: it only needs the
-- *sensitive* columns enumerated, so forgetting a new sensitive column in
-- the future is a "no worse than today" gap rather than a regression.
create or replace function public.profiles_guard_self_update()
returns trigger
language plpgsql
as $$
begin
  -- The admin/service-role client (dashboard/admin/actions.ts -- role
  -- changes, is_active toggling, verification review decisions,
  -- payout_verified grants) bypasses RLS entirely but NOT triggers, so it
  -- must be explicitly let through here or every admin action above would
  -- silently stop working.
  if auth.role() = 'service_role' then
    return new;
  end if;

  -- Admin-only columns: a plain signed-in user's own session can never
  -- change these on their own row, no matter what a client sends.
  new.role := old.role;
  new.is_verified := old.is_verified;
  new.payout_verified := old.payout_verified;
  new.payout_verified_at := old.payout_verified_at;
  new.is_active := old.is_active;
  new.total_purchases := old.total_purchases;
  new.total_sales := old.total_sales;
  new.created_at := old.created_at;

  -- verification_status is special-cased rather than fully locked: a
  -- seller's own verification submission (submitVerification() in
  -- dashboard/seller/verification/actions.ts) legitimately writes
  -- "pending" from the user's own session. Only that "pending" transition
  -- is allowed from a plain session -- moving to "verified"/"rejected"
  -- must always go through the admin service-role review action.
  if new.verification_status is distinct from old.verification_status
     and new.verification_status <> 'pending' then
    new.verification_status := old.verification_status;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_self_update_trg on public.profiles;
create trigger profiles_guard_self_update_trg
  before update on public.profiles
  for each row execute function public.profiles_guard_self_update();
