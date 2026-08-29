-- ============================================================
-- Durqo — creates the Storage bucket seller verification screenshots
-- (proof of income, GA/GSC/SEMrush/Ahrefs) get uploaded to, and its access
-- rules. Public bucket on purpose: buyers view these via the "View Images"
-- lightbox on listing pages, so reads must be public. Uploads are only
-- allowed into a path starting with the uploader's own user id
-- (listing-proofs/<seller_id>/<listing_id>/<kind>/<file>), and only that
-- seller can edit/delete what they uploaded.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('listing-proofs', 'listing-proofs', true)
on conflict (id) do nothing;

create policy "listing_proofs_public_read"
  on storage.objects for select
  using (bucket_id = 'listing-proofs');

create policy "listing_proofs_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "listing_proofs_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'listing-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "listing_proofs_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'listing-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
