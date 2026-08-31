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
