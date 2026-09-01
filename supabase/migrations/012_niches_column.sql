-- ============================================================
-- Durqo — adds a "Niche" tag to listings.
--
-- Sellers pick one or more niches (Health & Wellness, Finance & Investing,
-- Food & Recipes, etc. — see src/lib/niches.ts for the full list, sourced
-- from the reference screenshot the user supplied) from a fixed checklist
-- on the listing form. Stored as a text array of niche ids. Shown as an
-- extra "Niche" tile in the published listing's Quick Statistics grid
-- (src/app/listing/[id]/page.tsx) whenever at least one is set.
-- ============================================================

alter table public.listings
  add column if not exists niches text[] not null default '{}';
