-- Design & Development New.pdf ("Update the Apps & Tools category to
-- Android & iOS Apps", Sep 5, 2026): renames the original generic "Apps &
-- Tools" seed category (public.categories.id = 'apps-tools', part of the
-- original 14-category seed, zero real listings under it as of this
-- migration — confirmed via `select count(*) from public.listings where
-- category_id = 'apps-tools'` returning 0) to "Android & iOS Apps", and
-- adds the two new columns this category's App Statistics section needs
-- that didn't already exist (rating/total_downloads/total_reviews were
-- already part of the original schema.sql, day one).

update public.categories
set
  name = 'Android & iOS Apps',
  description = 'Mobile apps for iOS and Android with real installs and reviews.'
where id = 'apps-tools';

alter table public.listings
  add column if not exists store_price numeric(12,2),
  add column if not exists platform text check (platform in ('ios', 'android', 'ios-android'));
