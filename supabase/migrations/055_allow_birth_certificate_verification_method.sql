-- The Sep 23 KYC follow-up added "Birth Certificate" as a 4th accepted
-- identity-verification document type in the app (seller verification
-- page, admin table, public listing badge label), but missed that
-- profiles.verification_method has a live CHECK constraint from the base
-- schema.sql restricting it to ('passport','national_id','driving_license')
-- only. Any seller choosing Birth Certificate would have hit a raw
-- "violates check constraint" error on submission. Widening the
-- constraint to match what the app now actually offers.
alter table public.profiles drop constraint if exists profiles_verification_method_check;
alter table public.profiles add constraint profiles_verification_method_check
  check (verification_method = any (array['passport', 'national_id', 'driving_license', 'birth_certificate']));
