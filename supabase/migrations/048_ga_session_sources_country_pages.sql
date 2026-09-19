-- Sep 19, 2026 site owner request: show more of the connected Google
-- Analytics data on GA-connected listings — Session Sources, Traffic by
-- Country, and Top Pages, alongside the existing Page Views/Sessions/Bounce
-- Rate tiles and Traffic Acquisition (channel-group) breakdown from
-- migration 013.
--
-- Same pattern as the existing daily_page_views/traffic_acquisition
-- columns: jsonb arrays written only by the sync route (service role) via
-- src/lib/data/ga-sync.server.ts, read through the same RLS policies
-- migration 013 already set up on this table (public for published
-- listings, or the owning seller). No new policies needed here.
alter table public.listing_ga_public_stats
  add column if not exists session_sources jsonb not null default '[]',    -- [{source: "google", sessions: 4200}, ...]
  add column if not exists traffic_by_country jsonb not null default '[]', -- [{country: "Bangladesh", sessions: 3100}, ...]
  add column if not exists top_pages jsonb not null default '[]';          -- [{path: "/", views: 5400}, ...]
