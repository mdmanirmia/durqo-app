-- ============================================================
-- Durqo — Social Media Accounts category "Account Type" Quick Stat
-- (Design & Development New.pdf, Sep 5, 2026 request): sellers pick every
-- platform the account is on (Facebook, Instagram, TikTok, Twitter/X,
-- Others — see src/lib/account-types.ts) from a checkbox list on the
-- listing form. Stored as a plain comma-separated string of ids (e.g.
-- "instagram,tiktok"), the same simple text-column shape already used for
-- E-commerce's "business_type" column (migration 016) and other
-- manually-entered Quick Stats like `location` — see QUICK_STAT_COLUMNS in
-- map-listing.ts, which joins the ids into display names ("Instagram,
-- TikTok") before this reaches the page.
-- ============================================================

alter table public.listings add column if not exists account_type text;
