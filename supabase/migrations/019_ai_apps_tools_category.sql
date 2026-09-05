-- ============================================================
-- Durqo — AI Apps & Tools category (Design & Development New.pdf, Sep 5,
-- 2026 request): a brand new category, not a rework of an existing one.
--
-- public.listings.category_id carries a foreign key to public.categories
-- (id/name/description/sort_order) — every category referenced by a
-- listing must already exist as a row there. Every category this app has
-- shipped so far already had a row (seeded when the schema was first set
-- up); this is the first time a genuinely new category is being added, so
-- it needs its own row here before any listing can be created under it.
-- ============================================================

insert into public.categories (id, name, description, sort_order)
values (
  'ai-apps-tools',
  'AI Apps & Tools',
  'AI-powered apps and tools built on top of major AI models.',
  15
)
on conflict (id) do nothing;
