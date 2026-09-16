-- Human-readable listing permalinks ("listing er url business name e hobe",
-- Sep 16 2026 site owner request): every listing gets a URL slug generated
-- from its title. Generated once (here, for existing rows, or at creation
-- time for new ones — see src/lib/slug.ts) and never regenerated on a later
-- title edit, so a listing's public URL stays stable even after the
-- seller/admin renames it.

alter table public.listings add column if not exists slug text;

-- Backfill every existing row that has no slug yet, using the same
-- lowercase/hyphenate rule as src/lib/slug.ts's slugify(), de-duplicated by
-- appending -2, -3, ... (in creation order) for listings that would
-- otherwise collide on the same base slug (e.g. two listings both titled
-- "Pinebrook Outdoor Journal").
with base as (
  select
    id,
    coalesce(nullif(trim(both '-' from regexp_replace(lower(trim(title)), '[^a-z0-9]+', '-', 'g')), ''), 'listing') as base_slug,
    created_at
  from public.listings
  where slug is null
),
numbered as (
  select
    id,
    base_slug,
    row_number() over (partition by base_slug order by created_at, id) as rn
  from base
)
update public.listings l
set slug = case when n.rn = 1 then n.base_slug else n.base_slug || '-' || n.rn::text end
from numbered n
where l.id = n.id;

alter table public.listings alter column slug set not null;
create unique index if not exists listings_slug_key on public.listings (slug);
