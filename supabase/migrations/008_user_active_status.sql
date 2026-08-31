-- ============================================================
-- Durqo — admin "block/deactivate user" capability.
--
-- profiles.is_active gates login (checked in src/proxy.ts on every
-- request for a signed-in user; false forces an immediate sign-out and a
-- redirect to /login with an explanatory message) rather than deleting the
-- account outright — a deactivated user's listings, orders and history all
-- stay intact and untouched, and an admin can flip this back to reactivate
-- them at any time. See setUserActive() in
-- src/app/dashboard/admin/actions.ts, the only place this column is ever
-- written.
-- ============================================================

alter table public.profiles
  add column if not exists is_active boolean not null default true;
