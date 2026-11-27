-- Nov 27, 2026 ("verified holei payout korte parbe"): from now on, approving
-- a seller's identity documents also grants payout access (see
-- setVerificationStatus in src/app/dashboard/admin/actions.ts). This brings
-- sellers who were verified before that change in line: every account whose
-- verification is approved gets payout access too. Nothing else changes;
-- create_withdrawal_request() still checks profiles.payout_verified.
update public.profiles
set payout_verified = true,
    payout_verified_at = coalesce(verification_reviewed_at, now())
where verification_status = 'verified'
  and is_verified
  and not payout_verified;
