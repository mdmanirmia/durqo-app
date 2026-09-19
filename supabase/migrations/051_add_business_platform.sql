-- ============================================================
-- Sep 19, 2026 request: a new single-select "Platform" field for the
-- Websites and E-commerce categories only ("Select the platform this
-- business is built on." — WordPress/Shopify/etc). Shown on the seller
-- form only for those two categories and displayed in its own "Platform"
-- SectionCard on the published listing page, right after Sale Includes.
--
-- Named `business_platform`, NOT `platform` — the `platform` column
-- already exists (migration 020/021) for the Android & iOS Apps category's
-- unrelated multi-select "Platform" quick stat (comma-separated
-- App Store/Google Play ids). This is a distinct single-value field for a
-- different pair of categories, so it gets its own column rather than
-- overloading that one.
--
-- Stores the option's plain-text id (e.g. "wordpress", "shopify",
-- "custom-built", "other" — see src/lib/business-platforms.ts), turned into
-- its display name (e.g. "WordPress") at render time — same convention as
-- funding_stage (migration 022).
-- ============================================================

alter table public.listings
  add column if not exists business_platform text;
