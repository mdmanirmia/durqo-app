-- ============================================================
-- Durqo — SaaS category "Active Subscribers" Quick Stat
-- (Design & Development New 1.pdf, Sep 5, 2026 request): replaces
-- "Articles Posted" for this category with a plain manual number input,
-- same shape as articles_posted itself (see QUICK_STAT_COLUMNS in
-- map-listing.ts) — kept as its own column/QuickStatKey rather than
-- reusing articles_posted so Websites/E-commerce's own "Articles Posted"
-- field is untouched.
-- ============================================================

alter table public.listings add column if not exists active_subscribers int;
