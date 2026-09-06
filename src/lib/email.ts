import "server-only";
import { Resend } from "resend";

// Optional transactional email — degrades gracefully (logs + skips) until
// RESEND_API_KEY is set, the same null-guard pattern used for Stripe
// (src/lib/stripe.ts) and the Supabase admin client elsewhere in this
// codebase, so the app keeps building/running without it.
//
// Get a free key at https://resend.com. Until a sending domain is verified
// there, EMAIL_FROM must stay on their shared onboarding@resend.dev
// address — which only delivers to the Resend account's own verified
// email, a sandbox limitation on Resend's side, not a bug here. See
// .env.example.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "Durqo <onboarding@resend.dev>";

// Sep 2026 email-notifications build: every admin-facing notification
// (new seller account, listing update, purchase, contact form) goes to this
// one fixed inbox rather than a dynamically-resolved list of admin users —
// that's what was actually requested, and it keeps delivery working even if
// no `profiles.role = "admin"` row exists yet. submitVerification() below in
// dashboard/seller/verification/actions.ts predates this and still resolves
// admin emails dynamically; that's left as-is since it's a different,
// already-shipped flow, not part of this pass.
export const ADMIN_EMAIL = "support@durqo.com";

export async function sendEmail(to: string | string[], subject: string, html: string): Promise<{ sent: boolean }> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping "${subject}" to`, to);
    return { sent: false };
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error("[email] send failed:", error);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] send threw:", err);
    return { sent: false };
  }
}
