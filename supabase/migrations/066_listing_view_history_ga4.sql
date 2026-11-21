-- Nov 21, 2026 ("website ta publish howa theke start kore count kore update
-- koro"): listing_views (migration 065) only counts from go-live on Nov 21,
-- 2026. The views before that come from Durqo's own Google Analytics 4
-- property ("Durqo", Pages and screens report, page paths under /listing/,
-- first data mid-September through Nov 20, 2026), read from the GA4 UI and
-- stored once here as a history baseline per listing:
--   views = GA4 "Views", users = GA4 "Active users" for that page.
-- GA4 counts every visitor (it can't tell sellers or admins apart), so
-- these numbers are slightly looser than listing_views' own rules.
-- admin_top_viewed_listings() adds them to the All Time totals only;
-- the 7 / 30 day views keep using exact listing_views data.

create table if not exists public.listing_view_history (
  listing_id uuid primary key references public.listings (id) on delete cascade,
  views integer not null default 0,
  users integer not null default 0,
  source text not null,
  period_start date,
  period_end date not null
);

alter table public.listing_view_history enable row level security;
revoke all on public.listing_view_history from anon, authenticated;
grant select, insert, update, delete on public.listing_view_history to service_role;

insert into public.listing_view_history (listing_id, views, users, source, period_start, period_end)
select l.id, v.views, v.users, 'ga4', date '2026-09-15', date '2026-11-20'
from (values
  ('socchol', 126, 28),
  ('leatherdot-bangladesh', 63, 28),
  ('northlight-creative', 54, 23),
  ('bookiiz', 49, 19),
  ('nightly-circuit', 46, 38),
  ('creatorpilotai', 44, 31),
  ('promptnova-ai-prompt-discovery-platform', 43, 26),
  ('xnewsapp-com', 40, 32),
  ('deshibasket-multi-vendor-e-commerce-marketplace-for-bangladesh', 39, 20),
  ('vexora-all-in-one-saas-platform', 36, 26),
  ('delta-executor', 35, 29),
  ('learn-with-flow', 34, 24),
  ('movie-website-blogger-template', 33, 18),
  ('pulsemetrics', 31, 24),
  ('chainforge-analytics', 30, 19),
  ('ledger-and-loom', 30, 10),
  ('tidynest-home-co', 29, 19),
  ('create-discover-and-share', 25, 15),
  ('coastal-bloom-apparel', 23, 19),
  ('loopvista-com', 21, 13),
  ('soccerquizx', 20, 11),
  ('vane-guard-sovereign-framework-v1-0', 20, 16),
  ('meridian-health-labs', 19, 16),
  ('northwind-trail-guides', 17, 10),
  ('pixel-drift-studios-nebula-run', 16, 15),
  ('scribemind-ai', 13, 13),
  ('the-weekly-ledger', 13, 12),
  ('urbanplate-eats', 13, 10),
  ('vane-space-sla', 13, 13),
  ('apora-bd-premium-e-commerce-marketplace', 12, 10),
  ('homestead-harvest-co', 12, 11),
  ('brightpath-bookkeeping', 9, 9),
  ('restiqa-multi-vendor-hotel-resort-apartment-booking-platform', 9, 8),
  ('focusloop', 6, 6),
  ('cctv-camera-services-bangladesh-call-01711196314', 5, 2),
  ('swiftcart-checkout', 5, 5),
  ('novels-tamil', 4, 2),
  ('only-the-files-and-rights-explicitly-included-in-the-sale-will-be-transferred-ap', 4, 2),
  ('reebux', 4, 2),
  ('rent-a-car-sylhet', 1, 1),
  ('trailside-tech-reviews', 1, 1),
  ('voyra-ai-trip-planner', 1, 1),
  ('workspace-ai-all-in-one-ai-web-tools-platform-workspace-ai-is-an-online-platform', 1, 1)
) as v(slug, views, users)
join public.listings l on l.slug = v.slug
on conflict (listing_id) do update
  set views = excluded.views, users = excluded.users, source = excluded.source,
      period_start = excluded.period_start, period_end = excluded.period_end;

drop function if exists public.admin_top_viewed_listings(timestamptz, int);
create function public.admin_top_viewed_listings(p_since timestamptz, p_limit int default 10)
returns table (
  listing_id uuid,
  views bigint,
  unique_visitors bigint,
  signed_in_viewers bigint,
  last_viewed_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with live as (
    select v.listing_id,
           count(*) as views,
           count(distinct v.visitor_key) as uniq,
           count(distinct v.viewer_id) as signed_in,
           max(v.viewed_at) as last_at
    from public.listing_views v
    where p_since is null or v.viewed_at >= p_since
    group by v.listing_id
  ),
  hist as (
    select h.listing_id, h.views, h.users, (h.period_end + 1)::timestamptz - interval '1 second' as last_at
    from public.listing_view_history h
    where p_since is null
  )
  select coalesce(live.listing_id, hist.listing_id) as listing_id,
         coalesce(live.views, 0) + coalesce(hist.views, 0) as views,
         coalesce(live.uniq, 0) + coalesce(hist.users, 0) as unique_visitors,
         coalesce(live.signed_in, 0) as signed_in_viewers,
         greatest(live.last_at, hist.last_at) as last_viewed_at
  from live
  full join hist on hist.listing_id = live.listing_id
  order by views desc, unique_visitors desc, last_viewed_at desc nulls last
  limit greatest(1, least(coalesce(p_limit, 10), 100));
$$;

revoke execute on function public.admin_top_viewed_listings(timestamptz, int) from public, anon, authenticated;
grant execute on function public.admin_top_viewed_listings(timestamptz, int) to service_role;
