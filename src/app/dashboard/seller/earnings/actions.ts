"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, ADMIN_EMAIL } from "@/lib/email";
import { fmtUSD } from "@/lib/format";

const PAYOUT_METHODS = ["bank_transfer", "paypal", "other"] as const;
type PayoutMethod = (typeof PAYOUT_METHODS)[number];

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
export async function requestWithdrawal(payoutMethod: PayoutMethod, payoutDetails: string) {
  if (!PAYOUT_METHODS.includes(payoutMethod)) throw new Error("Invalid payout method");
  if (!payoutDetails.trim()) throw new Error("Payout details are required");

  const supabase = await createClient();
  if (!supabase) throw new Error("Backend not connected");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

  const { data: request, error } = await supabase
    .rpc("create_withdrawal_request", { p_payout_method: payoutMethod, p_payout_details: payoutDetails.trim() })
    .single();
  if (error) throw new Error(error.message);

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

  return { ok: true };
}
