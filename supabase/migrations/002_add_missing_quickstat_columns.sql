-- ============================================================
-- Durqo — adds a few "Quick Statistics" columns that the original
-- schema.sql was missing (needed for YouTube Channels, Social Media
-- Accounts, and Domains categories). Safe to run even though
-- schema.sql already ran — every column uses "if not exists".
-- ============================================================

alter table public.listings add column if not exists monthly_views bigint;
alter table public.listings add column if not exists total_posts int;
alter table public.listings add column if not exists likes_per_post int;
alter table public.listings add column if not exists views_per_post int;
alter table public.listings add column if not exists followers bigint;
alter table public.listings add column if not exists domain_age text;
