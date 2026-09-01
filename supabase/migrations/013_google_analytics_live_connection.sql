-- Real, live Google Analytics 4 connection (OAuth-based), modeled on
-- Flippa's "Connect Google Analytics" feature (auto-updating Users / Page
-- Views / Pages per Session / Avg. Session Duration / Bounce Rate shown
-- directly on the listing page) — NOT the existing Motion-Invest-style
-- manual "I granted support@durqo.com Viewer access" checkbox from
-- migration 011, which stays as-is as a fallback for sellers who don't
-- connect this way.
--
-- Two tables, deliberately split by sensitivity:
--
--   listing_ga_connections — holds the OAuth refresh/access tokens. No
--   public or authenticated RLS policies at all: only reachable through
--   the admin/service-role Supabase client (createAdminClient()), i.e.
--   only from the server-side API routes in src/app/api/google-analytics/*.
--   Never selected from a client component, never sent to the browser.
--
--   listing_ga_public_stats — holds only the already-aggregated numbers
--   that are safe to show publicly (page views, sessions, bounce rate,
--   the daily chart series, traffic-acquisition breakdown). Written only
--   by the sync route (service role), but readable by anyone for a
--   published listing, and by the owning seller regardless of status —
--   same shape of policy as `listings` itself already uses.

create table if not exists listing_ga_connections (
  listing_id uuid primary key references listings(id) on delete cascade,
  seller_id uuid not null references profiles(id) on delete cascade,
  ga_property_id text,            -- e.g. "properties/123456789"; null until selected
  ga_property_display_name text,
  ga_account_display_name text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  status text not null default 'pending_property_selection'
    check (status in ('pending_property_selection', 'active', 'error', 'disconnected')),
  error_message text,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz
);

alter table listing_ga_connections enable row level security;
-- Intentionally no policies: default-deny for anon/authenticated. Only the
-- service-role client (which bypasses RLS entirely) can read or write here.

create table if not exists listing_ga_public_stats (
  listing_id uuid primary key references listings(id) on delete cascade,
  date_range_label text not null default 'Last 90 days',
  page_views int,
  unique_visitors int,
  sessions int,
  bounce_rate numeric(5,2),
  avg_session_seconds int,
  daily_page_views jsonb not null default '[]',      -- [{date: "2026-06-03", value: 210}, ...]
  traffic_acquisition jsonb not null default '[]',    -- [{channel: "Organic Search", sessions: 12000}, ...]
  last_synced_at timestamptz not null default now()
);

alter table listing_ga_public_stats enable row level security;

create policy "public can read ga stats for published listings"
  on listing_ga_public_stats for select
  using (exists (
    select 1 from listings
    where listings.id = listing_ga_public_stats.listing_id
      and listings.status = 'published'
  ));

create policy "sellers can read their own listing's ga stats"
  on listing_ga_public_stats for select
  using (exists (
    select 1 from listings
    where listings.id = listing_ga_public_stats.listing_id
      and listings.seller_id = auth.uid()
  ));

-- No insert/update/delete policies — those only ever happen via the
-- service-role client in the sync route.
