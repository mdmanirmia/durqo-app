"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, ADMIN_EMAIL } from "@/lib/email";
import { fmtUSD } from "@/lib/format";
import { getUsdToBdtWithdrawalRate } from "@/lib/currency";

const PAYOUT_METHODS = ["bank_transfer", "bkash", "rocket", "nagad", "paypal", "wise"] as const;
type PayoutMethod = (typeof PAYOUT_METHODS)[number];

// Mobile financial services — each of bKash, Rocket and Nagad has its own
// independent ৳50,000/day and ৳300,000/month cap (a request on one method
// only counts against that method's own allowance, not a shared pool
// across all three — 032_withdrawal_mfs_per_method_caps.sql), enforced
// inside create_withdrawal_request() itself. A single order larger than
// that cap is no longer a dead end either — it can be split across
// multiple requests over time (033_withdrawal_order_splitting.sql). Bank
// Transfer, PayPal and Wise aren't capped.
const MFS_METHODS: readonly string[] = ["bkash", "rocket", "nagad"];

// Expected-error result shape for requestWithdrawal() below. Site owner
// (Sep 11 2026) reported a live "Minified React error #441" appearing on
// the Earnings page whenever a withdrawal request hit a business-rule
// rejection (invalid method, RLS/auth issue, or one of
// create_withdrawal_request()'s own raise exception messages — e.g. the
// bKash/Rocket/Nagad daily/monthly cap). Root cause: in this Next.js
// version, a Server Action invoked alongside revalidatePath() has its
// thrown errors treated as uncaught exceptions and redacted to a generic
// digest-only message in production — see "Handling expected errors" /
// "avoid using try/catch blocks and throw errors ... model expected
// errors as return values" in the Next.js docs bundled with this repo
// (node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md).
// requestWithdrawal() now follows that pattern: every expected failure
// (bad input, no session, the RPC's own validation) returns
// { ok: false, message } instead of throwing, so its real message always
// reaches the client. A thrown error can still occur for a genuinely
// unexpected failure (e.g. a network blip) — the caller's try/catch
// around the await handles that with a generic fallback.
export type RequestWithdrawalResult = { ok: true; netAmount: number | null } | { ok: false; message: string };

// Exposes today's bKash/Rocket/Nagad withdrawal rate to the client (site
// owner, Sep 11 2026): src/lib/currency.ts is "server-only", so the
// "use client" Earnings page can't import getUsdToBdtWithdrawalRate()
// directly — it goes through this action instead, the same way
// requestWithdrawal() below does when actually submitting. Lets the page
// show the seller the live USD equivalent of the ৳50,000/day cap (and the
// BDT equivalent of their own balance) *before* they submit, not just
// after (requestWithdrawal()'s returned netAmount still has the final
// word, since a seller's remaining daily/monthly allowance can be less
// than the flat ৳50,000/day figure this only estimates from).
export async function getMfsWithdrawalRate() {
  return getUsdToBdtWithdrawalRate();
}

// Submits a withdrawal request. The actual claiming of orders and Success
// Fee math happens atomically inside create_withdrawal_request()
// (028_withdrawals.sql, SECURITY DEFINER, identity from auth.uid()) — this
// action just calls it through the caller's own RLS-scoped client (never
// the admin client) so the RPC sees the real signed-in user, then emails
// the seller a confirmation and admin a review prompt. It can NEVER
// approve, reject or mark a request paid — that's only ever
// setWithdrawalStatus() in dashboard/admin/actions.ts, using the
// service-role client, after a human reviews it. Same shape as
// submitVerification() in dashboard/seller/verification/actions.ts.
export async function requestWithdrawal(payoutMethod: PayoutMethod, payoutDetails: string): Promise<RequestWithdrawalResult> {
  if (!PAYOUT_METHODS.includes(payoutMethod)) return { ok: false, message: "Invalid payout method" };
  if (!payoutDetails.trim()) return { ok: false, message: "Payout details are required" };

  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Backend not connected" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in" };

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

  // Only fetched for bKash/Rocket/Nagad — the daily/monthly BDT caps are
  // meaningless (and unenforced) for Bank Transfer, PayPal and Wise. This
  // is the market rate minus ৳1.50 (getUsdToBdtWithdrawalRate() in
  // src/lib/currency.ts), not the plain market rate — a deliberate
  // product decision, the mirror image of the +6 BDT checkout margin.
  const bdtRate = MFS_METHODS.includes(payoutMethod) ? (await getUsdToBdtWithdrawalRate()).rate : null;

  const { data: request, error } = await supabase
    .rpc("create_withdrawal_request", { p_payout_method: payoutMethod, p_payout_details: payoutDetails.trim(), p_bdt_rate: bdtRate })
    .single();
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard/seller/earnings");

  const sellerName = profile?.full_name || "A seller";
  const sellerEmail = user.email;
  const netAmount = request ? Number((request as { net_amount: number }).net_amount) : null;
  
  const hdrs = await headers();
  const host = hdrs.get("host");
  const origin = host ? `${host.includes("localhost") ? "http" : "https"}://${host}` : "https://www.durqo.com";

  // Best-effort notification emails — failures never block the submission
  // itself (sendEmail already swallows its own errors).
  if (sellerEmail) {
    await sendEmail(
      sellerEmail,
      "We've received your withdrawal request",
      `<p>Hi ${sellerName},</p>
       <p>We've received your withdrawal request${netAmount !== null ? ` for ${fmtUSD(netAmount)} (after the Success Fee)` : ""}. Our team will review it and email you the outcome — this usually takes 1–2 business days.</p>
       <p>— Durqo</p>`
    );
  }
  await sendEmail(
    ADMIN_EMAIL,
    `New withdrawal request — ${sellerName}`,
    `<p>${sellerName} (${sellerEmail ?? "no email on file"}) requested a withdrawal${netAmount !== null ? ` of ${fmtUSD(netAmount)}` : ""}.</p>
     <p><a href="${origin}/dashboard/admin/withdrawals">Review it in the admin dashboard</a>.</p>`
  );

  // netAmount is what create_withdrawal_request() actually claimed, which
  // for bKash/Rocket/Nagad can be less than the seller's full available
  // balance — it only claims as much as fits under the remaining
  // ৳50,000/day or ৳300,000/month allowance, leaving the rest (even a
  // slice of a single large order — 033_withdrawal_order_splitting.sql
  // can split one order across many requests) available for a future
  // request. The caller uses this to tell the seller exactly what was
  // withdrawn, since it may not match the balance shown before they
  // clicked "Request".
  return { ok: true, netAmount };
}

// NOTE: getMfsWithdrawalRate() above never throws (getUsdToBdtWithdrawalRate()
// already falls back to a safe default rate on its own fetch failure — see
// src/lib/currency.ts) so it doesn't need the same return-value treatment.
