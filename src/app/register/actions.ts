"use server";

import { sendEmail, ADMIN_EMAIL } from "@/lib/email";

// Fired from register/page.tsx right after supabase.auth.signUp() succeeds
// for a seller. This is separate from Supabase's own confirmation-link
// email (handled entirely by Supabase Auth + the custom SMTP config, not
// this codebase) — that's "verify your email"; this is Durqo's own welcome
// email to whatever address was just typed in.
//
// Sep 21 2026 ("ei sob user der kono email notification o admin pabena
// registration er somoi" — a wave of bot signups meant the admin no longer
// wants any email notification for these AT REGISTRATION time): this used
// to also email ADMIN_EMAIL right here, at raw signUp() time — before the
// email is even confirmed. A bot can signUp() and vanish forever without
// ever confirming, so every one of those hit the admin's inbox as a "New
// seller account" email for an account that (per the "Confirm email" login
// requirement) could never actually do anything. That admin-facing half
// moved to notifyAdminSellerVerified() below, fired only once the address
// is proven real by actually confirming it — see /auth/callback/route.ts.
// This function now only ever emails the signer-upper themselves, so it's
// harmless to keep firing immediately for every signup, bot or not.
// Best-effort, same as every other notification in this codebase: sendEmail
// swallows its own errors, so a Resend outage never blocks or errors out
// the signup flow that already succeeded.
// 2026-09-23 fix ("register korar por identity verification e niye jabe ei
// text ta delete korte hobe" — identity verification (KYC) is only required
// before a seller's FIRST WITHDRAWAL, never to create a listing; pointing a
// brand-new signup at verification before they've even made a listing was
// misleading about what's actually required next): this used to also tell
// the seller to "submit identity verification" in the same breath as
// creating their first listing. Trimmed to just what's actually needed
// right after signing up.
export async function notifySellerAccountCreated(fullName: string, email: string) {
  await sendEmail(
    email,
    "Welcome to Durqo",
    `<p>Hi ${fullName.trim() || "there"},</p>
     <p>Your Durqo seller account has been created. Once you've verified your email, you can head to your seller dashboard to create your first listing.</p>
     <p>— Durqo</p>`
  );

  return { ok: true };
}

// Sep 21 2026, split out of notifySellerAccountCreated() above (see its
// comment) — the admin-facing "a seller account exists" email, now fired
// from /auth/callback/route.ts only after the account's email is actually
// confirmed, never at raw signup. A bot that signs up and never opens its
// inbox now never generates an admin notification at all; a real seller
// still reaches the admin's inbox, just a few minutes later than before
// (as soon as they click the confirmation link instead of the instant they
// submit the form).
export async function notifyAdminSellerVerified(fullName: string, email: string) {
  const name = fullName.trim() || "A seller";

  await sendEmail(
    ADMIN_EMAIL,
    `New seller account — ${name}`,
    `<p>${name} (${email}) verified their email and is now an active seller account on Durqo.</p>`
  );

  return { ok: true };
}
