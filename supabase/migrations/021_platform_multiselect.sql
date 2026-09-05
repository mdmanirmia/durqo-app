-- Design & Development New.pdf follow-up (Sep 5, 2026): "Platform will be
-- select types because 1 seller can select 2 types" — Android & iOS Apps'
-- Platform field changes from a single-select ('ios' | 'android' |
-- 'ios-android') to a multi-select checkbox grid, same mechanism as
-- Business Type/Account Type: a comma-separated string of ids (e.g.
-- "ios,android") in the same `platform` column added by migration 020.
-- The old check constraint only allowed the three single-select values, so
-- it has to go — validation now lives at the application layer, same as
-- business_type/account_type (plain `text`, no check constraint).
alter table public.listings drop constraint if exists listings_platform_check;

-- Backfill the one existing Android & iOS Apps listing created under the
-- old single-select scheme ("PixelSnap Photo Editor", platform =
-- 'ios-android') to the new comma-separated encoding.
update public.listings set platform = 'ios,android' where platform = 'ios-android';
