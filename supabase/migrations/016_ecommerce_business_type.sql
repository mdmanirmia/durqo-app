-- ============================================================
-- Durqo — E-commerce category "Business Type" Quick Stat (Sep 5, 2026
-- request): sellers pick every business model their store uses (Shopify,
-- WooCommerce, Dropshipping, Digital Products, Others — see
-- src/lib/business-types.ts) from a checkbox list on the listing form.
-- Stored as a plain comma-separated string of ids (e.g.
-- "shopify,dropshipping"), the same simple text-column shape already used
-- for other manually-entered Quick Stats like `location` and
-- `domain_registrar` — see QUICK_STAT_COLUMNS in map-listing.ts, which
-- joins the ids into display names ("Shopify, Dropshipping") before this
-- reaches the page.
-- ============================================================

alter table public.listings add column if not exists business_type text;
