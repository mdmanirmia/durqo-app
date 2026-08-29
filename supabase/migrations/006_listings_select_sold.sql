-- Widen the public "can read this listing" RLS policy to also include
-- sold listings, not just published ones. Without this, the moment a
-- listing's status flips to 'sold' (done automatically by the Stripe
-- webhook on a successful payment — see src/app/api/webhooks/stripe/route.ts)
-- it would become invisible to everyone except the seller (the existing
-- policy only allowed status = 'published' or seller_id = auth.uid()),
-- which would break the "show a Sold badge on the listing" feature — the
-- row simply wouldn't come back from the query at all for anyone else.
drop policy if exists "listings_select_published" on public.listings;
create policy "listings_select_published" on public.listings for select
  using (status in ('published', 'sold') or seller_id = auth.uid());
