-- Nov 21, 2026 ("admin dashboard e top 10 viewed listing banaba and kon
-- listing kotbar view hoiche ... koto jon user view koreche oita o
-- thakbe"): Durqo had no record of listing page views (the listings.views
-- columns are seller-entered social/YouTube stats). This table records one
-- row per listing page view, written only by the server
-- (/api/listings/view, service role) so the numbers can't be faked from a
-- browser:
--   * the listing's own seller and admins are not counted;
--   * the same visitor re-opening the same listing within 30 minutes counts
--     once (refreshes don't inflate views);
--   * visitor_key = the signed-in user id, or an anonymous random cookie id.
-- admin_top_viewed_listings() aggregates it for the admin Overview.

create table if not exists public.listing_views (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings (id) on delete cascade,
  viewer_id uuid references auth.users (id) on delete set null,
  visitor_key text not null,
  viewed_at timestamptz not null default now()
);

create index if not exists listing_views_listing_time_idx on public.listing_views (listing_id, viewed_at desc);
create index if not exists listing_views_time_idx on public.listing_views (viewed_at desc);
create index if not exists listing_views_dedupe_idx on public.listing_views (listing_id, visitor_key, viewed_at desc);

alter table public.listing_views enable row level security;
-- No policies: only the service-role client reads or writes this table.
revoke all on public.listing_views from anon, authenticated;
grant select, insert, update, delete on public.listing_views to service_role;

create or replace function public.admin_top_viewed_listings(p_since timestamptz, p_limit int default 10)
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
  select v.listing_id,
         count(*) as views,
         count(distinct v.visitor_key) as unique_visitors,
         count(distinct v.viewer_id) as signed_in_viewers,
         max(v.viewed_at) as last_viewed_at
  from public.listing_views v
  where p_since is null or v.viewed_at >= p_since
  group by v.listing_id
  order by views desc, unique_visitors desc, last_viewed_at desc
  limit greatest(1, least(coalesce(p_limit, 10), 100));
$$;

revoke execute on function public.admin_top_viewed_listings(timestamptz, int) from public, anon, authenticated;
grant execute on function public.admin_top_viewed_listings(timestamptz, int) to service_role;
