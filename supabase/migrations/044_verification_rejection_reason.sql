-- ============================================================
-- Durqo — seller verification rejection reason (2026-09-13 dashboard audit:
-- "add a rejection reason field" deferred item from the earlier pass).
--
-- Before this, setVerificationStatus() rejected a submission with only a
-- generic form-letter email ("we weren't able to verify your documents")
-- and no record anywhere of *why* — the seller had to guess what to fix
-- before resubmitting, and a second admin looking at the history later had
-- no way to tell either. This column stores the admin's note at the moment
-- of rejection so both the seller's dashboard and the admin table can show
-- it.
-- ============================================================

alter table public.profiles
  add column if not exists verification_rejection_reason text;
