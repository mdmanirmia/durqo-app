-- 2026-09-30 (seller card country + flag): the existing `location` column on
-- public.profiles is free text a seller types themselves ("Dhaka", "Remote",
-- "City, Country", or nothing at all) — too unreliable to render a flag from.
-- This adds a separate, structured `country` column (ISO 3166-1 alpha-2 code,
-- e.g. "BD"), selected from a fixed dropdown (src/lib/countries.ts) on the
-- seller Account Details page, so the listing page's seller card can show a
-- real country name + flag. `location` is untouched and keeps its existing
-- meaning/display.
--
-- Self-service, like `location`/`bio`/`address` — no change needed to the
-- profiles_guard_self_update_trg trigger from migration 056, which only
-- needs to enumerate the *sensitive* admin-only columns it blocks.
alter table public.profiles
  add column if not exists country text;

comment on column public.profiles.country is
  'ISO 3166-1 alpha-2 country code (e.g. BD, US), self-service via the Account Details page. See src/lib/countries.ts for the fixed option list and flag-emoji helper.';
