"use server";

import { sendEmail, ADMIN_EMAIL } from "@/lib/email";

// Fired from register/page.tsx right after supabase.auth.signUp() succeeds
// for a seller. This is separate from Supabase's own confirmation-link
// email (handled entirely by Supabase Auth + the custom SMTP config, not
// this codebase) — that's "verify your email"; this is "someone just
// created a seller account", which only the app itself knows about.
// Best-effort, same as every other notification in this codebase: sendEmail
// swallows its own errors, so a Resend outage never blocks or errors out
// the signup flow that already succeeded.
export async function notifySellerAccountCreated(fullName: string, email: string) {
  const name = fullName.trim() || "A new seller";

  await sendEmail(
    ADMIN_EMAIL,
    `New seller account — ${name}`,
    `<p>${name} (${email}) just created a seller account on Durqo.</p>`
  );

  await sendEmail(
    email,
    "Welcome to Durqo",
    `<p>Hi ${fullName.trim() || "there"},</p>
     <p>Your Durqo seller account has been created. Once you've verified your email, you can head to your seller dashboard to submit identity verification and create your first listing.</p>
     <p>— Durqo</p>`
  );

  return { ok: true };
}
