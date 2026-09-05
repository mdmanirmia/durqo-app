-- ============================================================
-- Durqo — Startup Business category (user request, Sep 5, 2026): a brand
-- new category, same treatment as AI Apps & Tools (migration 019) — a new
-- row in public.categories, plus three new listings columns this
-- category's own Startup Details section needs.
-- ============================================================

insert into public.categories (id, name, description, sort_order)
values (
  'startup-business',
  'Startup Business',
  'Early-stage startups with product, traction, or a funding history.',
  16
)
on conflict (id) do nothing;

-- funding_stage: single-select plain-text id (bootstrapped/pre-seed/seed/
-- series-a/series-b-plus — see src/lib/funding-stages.ts), same shape as
-- Android & iOS Apps' original single-select Platform field before it
-- became multi-select — a startup is only ever at one stage at a time, so
-- no comma-separated multi-select mechanism is needed here.
-- funding_raised / team_size: plain manual numeric inputs, same treatment
-- as Android & iOS Apps' store_price/rating/etc (migration 020).
alter table public.listings
  add column if not exists funding_stage text,
  add column if not exists funding_raised numeric(14,2),
  add column if not exists team_size integer;
