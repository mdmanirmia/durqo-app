-- ============================================================
-- Durqo — listing-level Google Analytics verification (Motion Invest /
-- Flippa style: manual GA "Viewer" access review, not an OAuth/API
-- integration).
--
-- Sellers still type in all their GA/GSC/SEMrush/Ahrefs numbers on the
-- listing form exactly as before — these columns don't replace that data
-- entry, they add a trust layer on top of it:
--   - ga_access_confirmed: the seller self-declares, at submit time, that
--     they've added support@durqo.com as a Viewer on their GA4 property
--     (Google's own built-in Property Access Management "add user"
--     feature — no OAuth app, no API key, nothing to build on our end).
--   - loom_video_url: an optional Loom/screen-recording link showing the
--     seller's live income dashboard (harder to fake than a screenshot).
--   - ga_verified: admin-only. Set true once an admin has actually logged
--     into the GA property with the access above and confirmed the
--     submitted numbers look real. This is what unlocks the "Google
--     Analytics Verified" badge on the public listing page — it is never
--     set by the seller.
-- ============================================================

alter table public.listings
  add column if not exists ga_access_confirmed boolean not null default false,
  add column if not exists loom_video_url text,
  add column if not exists ga_verified boolean not null default false;
