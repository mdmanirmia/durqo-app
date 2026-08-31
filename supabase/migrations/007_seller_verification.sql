-- ============================================================
-- Durqo — seller identity verification: document-tracking columns on
-- profiles, plus a PRIVATE Storage bucket for the uploaded documents.
--
-- Private (unlike the public `listing-proofs` bucket from migration 003)
-- because these are passport / national ID / driving-licence images —
-- only the uploading seller (their own row, via RLS below) and an admin
-- (via the service-role client, which bypasses RLS entirely — see
-- src/lib/supabase/admin.ts) should ever be able to read them.
--
-- `profiles.verification_status` / `verification_method` / `is_verified`
-- already existed in schema.sql from the start — this migration only adds
-- the columns needed to track *what was submitted and when*.
-- ============================================================

alter table public.profiles
  add column if not exists verification_document_paths text[],
  add column if not exists verification_submitted_at timestamptz,
  add column if not exists verification_reviewed_at timestamptz;

insert into storage.buckets (id, name, public)
values ('seller-verification', 'seller-verification', false)
on conflict (id) do nothing;

-- Path convention: seller-verification/<uid>/<timestamp>-<filename>
create policy "seller_verification_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'seller-verification'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "seller_verification_owner_select"
  on storage.objects for select
  using (
    bucket_id = 'seller-verification'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "seller_verification_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'seller-verification'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
