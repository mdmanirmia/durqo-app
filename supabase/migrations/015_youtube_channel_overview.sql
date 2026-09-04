-- ============================================================
-- Durqo — YouTube Channel Overview (auto-filled from Channel URL via the
-- YouTube Data API v3, same key as the video auto-fill feature — see
-- src/lib/youtube.ts's fetchYoutubeChannelOverview()):
--   1:1 with listings (mirrors listing_copyright_notes), storing the
--   identity + 7 stat-card fields shown in the public "YouTube Channel
--   Overview" panel on the listing page (youtube-channels category only,
--   gated in the app layer like the other YouTube-specific tables).
--
--   avg_views_per_video is the lifetime average (total_views / total_videos);
--   recent_avg_views / recent_avg_likes / engagement_rate_percent are
--   derived from the channel's last (up to) 10 uploads at sync time.
-- ============================================================

create table if not exists public.listing_youtube_channel_overview (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  channel_title text,
  channel_handle text,
  channel_avatar_url text,
  channel_created_on date,
  avg_views_per_video bigint,
  recent_avg_views bigint,
  recent_avg_likes bigint,
  engagement_rate_percent numeric,
  last_synced_at timestamptz not null default now()
);

alter table public.listing_youtube_channel_overview enable row level security;
create policy "listing_youtube_channel_overview_select" on public.listing_youtube_channel_overview for select using (true);
create policy "listing_youtube_channel_overview_write" on public.listing_youtube_channel_overview for all using (
  exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
);
