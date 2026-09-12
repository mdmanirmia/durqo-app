import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEscrowConfig, fetchEscrowTransaction } from "@/lib/escrow";
import { sendEmail, ADMIN_EMAIL } from "@/lib/email";
import { getUserEmails } from "@/lib/notifications";
import {
  maybeCreateTransferRoomsOnPayment,
  transferRoomEmailCta,
  buyerTransferGuidanceHtml,
  sellerTransferGuidanceHtml,
  listingLinkHtml,
} from "@/lib/asset-transfer-room";

// Escrow.com's webhook listener. Register this route's full URL
// (<your-domain>/api/escrow/webhook) at escrow.com -> My Integrations ->
// API -> Webhooks (or POST /customer/me/webhook) — a one-time setup step
// on Escrow.com's own side, not something this app configures for itself.
//
// CRITICAL: per Escrow.com's own webhook docs, there is no signature or
// other cryptographic verification on these requests — "Escrow.com
// strongly recommends verifying any data received via webhook by fetching
// related data ... before taking actions". This handler treats the webhook
// body as nothing more than a hint to go check `transaction_id`; every
// status change is decided from the freshly-fetched Transaction object,
// never from the webhook payload's own `event` field. Same posture as the
// SSLCommerz IPN handler (api/sslcommerz/ipn/route.ts), which re-validates
// server-to-server before trusting an IPN body for the same reason.
export async function POST(request: Request) {
  const config = getEscrowConfig();
  const admin = createAdminClient();
  if (!config || !admin) {
    return NextResponse.json({ error: "Escrow.com isn't configured yet." }, { status: 500 });
  }

  let transactionId: number | undefined;
  try {
    const body = await request.json();
    transactionId = typeof body?.transaction_id === "number" ? body.transaction_id : Number(body?.transaction_id);
  } catch {
    return NextResponse.json({ error: "Invalid webhook body." }, { status: 400 });
  }
  if (!transactionId || Number.isNaN(transactionId)) {
    return NextResponse.json({ error: "Missing transaction_id." }, { status: 400 });
  }

  const { data: matchingOrders } = await admin
    .from("orders")
    .select("id, listing_id, buyer_id, seller_id, status")
    .eq("escrow_transaction_id", transactionId);

  if (!matchingOrders || matchingOrders.length === 0) {
    // Nothing here to act on — a stray/retried webhook for a transaction
    // this app has no record of. Acknowledge 200 so Escrow.com doesn't
    // keep retrying a request this app can't use.
    return NextResponse.json({ received: true, note: "No matching order for this transaction_id." });
  }

  let transaction;
  try {
    transaction = await fetchEscrowTransaction(config, transactionId);
  } catch (err) {
    console.error("[escrow-webhook] fetch transaction failed:", err);
    return NextResponse.json({ error: "Couldn't verify transaction with Escrow.com." }, { status: 502 });
  }

  // "Secured" on every item's schedule entry means Escrow.com is actually
  // holding the buyer's funds — the same real-world moment Stripe/
  // SSLCommerz call "in_escrow" (paid, held, nothing released to the
  // seller yet) elsewhere in this app.
  const isSecured = transaction.items.every((item) => item.schedule.every((s) => s.status?.secured === true));

  const order = matchingOrders[0];

  if (isSecured && order.status === "awaiting_payment") {
    await admin.from("orders").update({ status: "in_escrow" }).eq("id", order.id).eq("status", "awaiting_payment");

    // Asset Transfer System v2 (Phase 4 follow-up, Task #188) —
    // feature-flagged, best-effort, never blocks this webhook. Escrow.com
    // orders get a Durqo Transfer Room the same as Stripe/SSLCommerz ones —
    // it tracks the structured per-asset checklist and dispute workflow,
    // a different concern than which party actually holds the funds (see
    // 035_exclude_escrow_com_from_payout_ledger.sql, which is only about
    // Durqo's own payout ledger, not this).
    const roomReadyOrderIds = await maybeCreateTransferRoomsOnPayment(admin, [order.id]);
    const roomReady = roomReadyOrderIds.includes(order.id);
    const origin = new URL(request.url).origin;

    await admin.from("listings").update({ status: "sold" }).eq("id", order.listing_id).eq("status", "published");
    revalidatePath(`/listing/${order.listing_id}`);
    revalidatePath("/");
    revalidatePath("/buy");

    try {
      const [{ data: listing }, emails] = await Promise.all([
        admin.from("listings").select("title").eq("id", order.listing_id).maybeSingle(),
        getUserEmails(admin, [order.buyer_id, order.seller_id]),
      ]);
      await admin.from("cart_items").delete().eq("user_id", order.buyer_id).eq("listing_id", order.listing_id);

      const title = listing?.title ?? "your purchase";
      const buyerEmail = emails[order.buyer_id];
      const sellerEmail = emails[order.seller_id];

      await sendEmail(
        ADMIN_EMAIL,
        `New Escrow.com purchase — ${title}`,
        `<p>${buyerEmail ?? "A buyer"} funded an Escrow.com transaction (id ${transactionId}) for ${listingLinkHtml(origin, order.listing_id as string, title)}.</p>
         <p><a href="${origin}/dashboard/admin/orders">Review in admin dashboard</a></p>`
      );
      // Escrow.com's whole payment flow happens on their own hosted pages,
      // not Durqo's — unlike Stripe/SSLCommerz/Pay Later, there's no
      // browser redirect back into this app to send the buyer straight to
      // their Transfer Room after paying. This email (with the direct link)
      // is the only way they land there, so it gets the CTA that the other
      // three channels' post-purchase redirect otherwise provides.
      if (buyerEmail) {
        await sendEmail(
          buyerEmail,
          "Your Durqo purchase is confirmed",
          `<p>Thanks for your purchase — your payment for "${title}" is now held securely in escrow by Escrow.com.</p>
           <p>Once the seller transfers the assets and you confirm receipt on Escrow.com, funds will be released to them.</p>
           ${
             roomReady
               ? `${buyerTransferGuidanceHtml()}${transferRoomEmailCta(origin, order.id)}`
               : `<p>We'll email you as soon as your Transfer Room is ready, with a link and step-by-step guidance for receiving the assets.</p>`
           }`
        );
      }
      if (sellerEmail) {
        await sendEmail(
          sellerEmail,
          `Your listing "${title}" has sold`,
          `<p>Good news — "${title}" sold via Escrow.com, and the buyer's payment is now secured in escrow.</p>
           <p>Log in to Escrow.com to agree to the transaction (if you haven't already) and arrange the asset transfer.</p>
           ${
             roomReady
               ? `${sellerTransferGuidanceHtml()}${transferRoomEmailCta(origin, order.id)}`
               : `<p>Our team will be in touch with next steps to transfer the assets and release your payment.</p>`
           }`
        );
      }
    } catch (err) {
      console.error("[escrow-webhook] notification emails failed:", err);
    }
  }
  // Any other state (still awaiting agreement/funding, or an order this
  // handler already moved past awaiting_payment) — nothing actionable,
  // just acknowledge so Escrow.com doesn't retry.

  return NextResponse.json({ received: true, secured: isSecured });
}
