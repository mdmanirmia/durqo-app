-- ============================================================
-- Durqo — YouTube Channels category expansion (Design & Development New.pdf,
-- supplied Sep 4, 2026):
--   1. "Total Views" is a new manually-entered Quick Stat for YouTube
--      listings, distinct from the existing `monthly_views` column (which
--      is an *average* computed from Google Analytics data — YouTube
--      listings don't collect GA data, see hasSeoData: false in
--      src/lib/categories.ts).
--   2. Two new sections, both scoped to the YouTube Channels category in
--      the app layer (same pattern as listing_seo_data / listing_social_stats
--      — every listing gets the table row capability, only the UI decides
--      which categories actually show it):
--        - Copyright Notes: free-text notes + an auto-stamped "last
--          updated" date + proof screenshots (reuses listing_images with a
--          new 'copyright_notes' kind).
--        - Top Performing Videos: up to 5 per listing, each with a title,
--          video URL (a thumbnail is derived from this client-side — see
--          youtubeThumbnailUrl() in src/lib/format.ts — no separate image
--          upload needed), views, likes, duration, and publish date.
--   3. The "Business Name/URL/Location" -> "Channel Name/URL/Location" and
--      "Overview of the Business" -> "Overview of the Channel" relabeling
--      is UI copy only for the youtube-channels category — no schema
--      change needed for that part.
-- ============================================================

alter table public.listings add column if not exists total_views bigint;

-- ---------- COPYRIGHT NOTES (1:1 with listings, mirrors listing_seo_data) ----------
create table if not exists public.listing_copyright_notes (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  notes text,
  updated_on date not null default current_date
);

alter table public.listing_copyright_notes enable row level security;
create policy "listing_copyright_notes_select" on public.listing_copyright_notes for select using (true);
create policy "listing_copyright_notes_write" on public.listing_copyright_notes for all using (
  exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
);

-- ---------- TOP PERFORMING VIDEOS (up to 5 per listing) ----------
create table if not exists public.listing_top_videos (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  rank int not null default 1,
  title text not null,
  video_url text,
  views bigint,
  likes int,
  duration text,
  published_on date,
  unique (listing_id, rank)
);

alter table public.listing_top_videos enable row level security;
create policy "listing_top_videos_select" on public.listing_top_videos for select using (true);
create policy "listing_top_videos_write" on public.listing_top_videos for all using (
  exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
);

-- ---------- Proof of Copyright Notes screenshots reuse listing_images ----------
-- listing_images.kind's check constraint (defined inline in schema.sql, so
-- Postgres named it listing_images_kind_check by its default convention)
-- needs the new 'copyright_notes' value added. No storage policy change
-- needed — listing-proofs' policies (migration 003) gate by upload path
-- (<seller_id>/<listing_id>/<kind>/<file>), not by the kind string itself.
alter table public.listing_images drop constraint if exists listing_images_kind_check;
alter table public.listing_images add constraint listing_images_kind_check
  check (kind in ('cover','gallery','proof_of_income','google_analytics','search_console','semrush','ahrefs','copyright_notes'));
