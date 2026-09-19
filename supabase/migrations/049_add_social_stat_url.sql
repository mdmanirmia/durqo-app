-- Sep 19, 2026 seller request: "Ekhon theke list korar somoi social media
-- page er link o dibe / List publish hole o dekhabe" — Social Media
-- Accounts rows should also carry a link to that platform's page, shown on
-- the published listing. `url` is nullable/optional so existing rows
-- (created before this column existed) keep working with no link shown.
alter table public.listing_social_stats add column if not exists url text;
