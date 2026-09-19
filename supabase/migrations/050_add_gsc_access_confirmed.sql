-- ============================================================
-- Sep 19, 2026 request: the Google Analytics Data section already had a
-- seller self-declared "I've added support@durqo.com as a Viewer" checkbox
-- (see migration 011). Google Search Console Data had matching instructions
-- in its image-upload hint but no equivalent checkbox — this adds one so
-- Durqo can verify Search Console access the same way before publishing.
--
--   - gsc_access_confirmed: the seller self-declares, at submit time, that
--     they've added support@durqo.com with Restricted access on their
--     Search Console property (Search Console's own built-in Users &
--     Permissions "add user" feature — no OAuth app, no API key).
--
-- Not null default false, same convention as ga_access_confirmed.
-- ============================================================

alter table public.listings
  add column if not exists gsc_access_confirmed boolean not null default false;
