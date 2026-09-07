-- 023_signup_role_from_metadata.sql
--
-- Bug: a user who registers choosing "Sell a business" gets role='seller'
-- stashed in auth.users.raw_user_meta_data (register/page.tsx passes it to
-- signUp()'s options.data), but the on_auth_user_created trigger's
-- handle_new_user() function only ever inserted `full_name` into
-- public.profiles — `role` was left at its table default of 'buyer'. So
-- every self-registered seller was silently recorded as a buyer in
-- profiles.role, regardless of what they picked at signup or which of the
-- confirm-by-email / immediate-session paths they went through. This is
-- also why the post-confirmation and post-login redirects (fixed alongside
-- this migration, in auth/callback/route.ts and login/page.tsx) always sent
-- everyone to /dashboard/buyer: they were reading the (wrong) stored role.
--
-- Fix: have handle_new_user() copy role from the signup metadata, but only
-- ever promote to 'seller' — never trust a caller-supplied 'admin' out of
-- signUp()'s public, unauthenticated metadata. Admin accounts continue to
-- be created only via inviteUser() (dashboard/admin/actions.ts), which sets
-- role through an authenticated admin-only update after the invite.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  meta_role text := new.raw_user_meta_data->>'role';
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    case when meta_role = 'seller' then 'seller' else 'buyer' end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Backfill: any existing profile whose auth.users signup metadata says
-- 'seller' but whose profiles.role is still stuck at 'buyer' (i.e. every
-- self-registered seller so far, per the bug above). Never downgrades
-- anyone — an existing admin or a role set by other means is left alone.
update public.profiles p
set role = 'seller'
from auth.users u
where u.id = p.id
  and u.raw_user_meta_data->>'role' = 'seller'
  and p.role = 'buyer';
