import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSslcommerzConfig, validateSslcommerzPayment } from "@/lib/sslcommerz";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, ADMIN_EMAIL } from "@/lib/email";
import { getUserEmails } from "@/lib/notifications";
import { maybeCreateTransferRoomsOnPayment, transferRoomEmailCta } from "@/lib/asset-transfer-room";

// SSLCommerz's IPN (Instant Payment Notification) listener — STEP 2 of
// their own 3-step integration guide, and the real source of truth for
// "did the buyer pay", mirroring exactly how the Stripe webhook
// (src/app/api/webhooks/stripe/route.ts) is the source of truth there
// rather than the success_url redirect. Register this route's full URL
// (<your-domain>/api/sslcommerz/ipn) in the SSLCommerz Merchant Panel under
// My Store → IPN Settings — that's a one-time setup step in SSLCommerz's
// own dashboard, not something this app can configure for itself.
//
// SSLCommerz POSTs form-encoded data here (not JSON). Per their guidance,
// an IPN body is only a *claim* that a transaction succeeded — this
// handler always re-validates server-to-server via the Validation API
// before trusting it, exactly as their onboarding email instructs.
export async function POST(request: Request) {
  const config = getSslcommerzConfig();
  const admin = createAdminClient();
  if (!config || !admin) {
    return NextResponse.json({ error: "Bangladesh payment gateway isn't configured yet." }, { status: 500 });
  }

  const formData = await request.formData();
  const valId = formData.get("val_id")?.toString();
  const tranIdFromIpn = formData.get("tran_id")?.toString();

  if (!valId) {
    return NextResponse.json({ error: "Missing val_id." }, { status: 400 });
  }

  let validation;
  try {
    validation = await validateSslcommerzPayment(config, valId);
  } catch (err) {
    console.error("[sslcommerz-ipn] validation API call failed:", err);
    return NextResponse.json({ error: "Validation API call failed." }, { status: 502 });
  }

  const tranId = validation.tranId || tranIdFromIpn;
  if (!tranId) {
    return NextResponse.json({ error: "No tran_id on this IPN/validation response." }, { status: 400 });
  }

  const { data: matchingOrders } = await admin
    .from("orders")
    .select("id, listing_id, amount, status, buyer_id, remainder_usd")
    .eq("sslcommerz_tran_id", tranId);

  if (!matchingOrders || matchingOrders.length === 0) {
    // Nothing here to act on — could be a retried/duplicate IPN for a
    // transaction this app already finished processing and has no other
    // record of, or a stray request. Acknowledge with 200 either way so
    // SSLCommerz doesn't keep retrying a request this app can't use.
    return NextResponse.json({ received: true, note: "No matching order for this tran_id." });
  }

  const orderIds = matchingOrders.map((o) => o.id);

  // "Transaction status will be VALID / FAILED / CANCELLED" per SSLCommerz's
  // own email — VALID (or VALIDATED, once this call itself has run) means
  // the payment succeeded and should move the order into escrow, same
  // status this app already uses to mean "paid, held, not yet released to
  // the seller" for Stripe orders too.
  if (validation.status === "VALID" || validation.status === "VALIDATED") {
    // "if risk_level = 1 and transaction status = VALID, then please hold
    // the transaction and verify the customer" — orders already land in
    // `in_durqo` (funds held by Durqo directly, nothing released to the
    // seller yet — SSLCommerz is not a neutral escrow agent, unlike
    // Escrow.com's `in_escrow`) rather than `completed`, so the hold
    // SSLCommerz asks for is already the default behavior here. A risky
    // transaction additionally gets an extra flagged email so admin knows
    // to manually verify this buyer before ever moving it to `completed`.
    const isRisky = validation.riskLevel === "1";

    await admin
      .from("orders")
      .update({ status: "in_durqo", sslcommerz_val_id: validation.valId ?? valId })
      .in("id", orderIds)
      .eq("status", "awaiting_payment");

    // Asset Transfer System v2 (Phase 4 follow-up, Task #188), refined
    // 2026-09-12 per the site owner's instruction: a SSLCommerz order that
    // still has money owed beyond the online-deposit cap (remainder_usd >
    // 0) does NOT get its Transfer Room auto-created here — the site owner
    // wants to collect and verify that remaining balance manually first,
    // then start the room by hand from the admin Orders page
    // (startAssetTransfer in dashboard/admin/actions.ts). Orders paid in
    // full online (remainder_usd 0/null) are unaffected and still get an
    // automatic room exactly as before.
    const autoRoomOrderIds = matchingOrders
      .filter((o) => Number(o.remainder_usd ?? 0) <= 0)
      .map((o) => o.id);
    const roomReadyOrderIds = new Set(await maybeCreateTransferRoomsOnPayment(admin, autoRoomOrderIds));
    const orderIdByListingId = new Map(matchingOrders.map((o) => [o.listing_id, o.id]));
    const origin = new URL(request.url).origin;

    const listingIds = matchingOrders.map((o) => o.listing_id);
    await admin.from("listings").update({ status: "sold" }).in("id", listingIds).eq("status", "published");
    for (const id of listingIds) revalidatePath(`/listing/${id}`);
    revalidatePath("/");
    revalidatePath("/buy");

    try {
      const { data: paidListings } = await admin
        .from("listings")
        .select("id, title, price, seller_id")
        .in("id", listingIds);
      const buyerId = matchingOrders[0]?.buyer_id as string | undefined;

      const sellerIds = Array.from(new Set((paidListings ?? []).map((l) => l.seller_id as string)));
      const lookupIds = buyerId ? [buyerId, ...sellerIds] : sellerIds;
      const emails = lookupIds.length ? await getUserEmails(admin, lookupIds) : {};
      const buyerEmail = buyerId ? emails[buyerId] : undefined;

      if (buyerId) {
        await admin.from("cart_items").delete().eq("user_id", buyerId).in("listing_id", listingIds);
      }

      // Per-listing remaining-balance amounts, from the same remainder_usd
      // this order's own checkout math already computed and stored
      // (src/lib/payment-terms.ts's onlineChargeAmount(), applied in
      // /api/sslcommerz/init) — never recomputed here, so this can never
      // drift from what the buyer actually saw and agreed to pay before
      // checkout. A listing at or under the deposit cap has remainder_usd
      // 0/null and gets no balance note.
      const remainderByListingId = new Map(matchingOrders.map((o) => [o.listing_id, Number(o.remainder_usd ?? 0)]));
      const totalRemainderUsd = matchingOrders.reduce((sum, o) => sum + Number(o.remainder_usd ?? 0), 0);
      const hasRemainder = totalRemainderUsd > 0;

      const itemsHtml = (paidListings ?? [])
        .map((l) => {
          const remainder = remainderByListingId.get(l.id) ?? 0;
          return `<li>${l.title}${remainder > 0 ? ` — remaining balance due: $${remainder.toLocaleString()} USD` : ""}</li>`;
        })
        .join("");
      const riskNote = isRisky
        ? `<p style="color:#b91c1c"><strong>Risk flag:</strong> SSLCommerz marked this transaction risk_level=1 (${validation.riskTitle ?? "unspecified"}). Please verify the customer before releasing escrow.</p>`
        : "";
      const balanceOpsNote = hasRemainder
        ? `<p><strong>Remaining balance owed:</strong> $${totalRemainderUsd.toLocaleString()} USD. Follow up with the buyer with wire transfer/credit card/debit card instructions — do not mark this order completed until the full balance is received and verified.</p>`
        : "";

      await sendEmail(
        ADMIN_EMAIL,
        `New SSLCommerz purchase — ${paidListings?.length ?? 0} listing(s)${isRisky ? " [RISK FLAG]" : ""}${hasRemainder ? " [BALANCE DUE]" : ""}`,
        `<p>${buyerEmail ?? "A buyer"} completed checkout via SSLCommerz for:</p>
         <ul>${itemsHtml}</ul>
         <p>Amount: ${validation.amount ?? "?"} ${validation.currency ?? "BDT"} (tran_id ${tranId})</p>
         ${riskNote}
         ${balanceOpsNote}`
      );

      if (buyerEmail) {
        // Two distinct buyer emails depending on whether this purchase was
        // fully paid through SSLCommerz or only the deposit-capped initial
        // payment (src/lib/payment-terms.ts) — matching the Payment Terms
        // copy on the listing page and the pre-payment confirmation modal
        // (SslcommerzConfirmModal.tsx) word for word: only the initial
        // payment is confirmed here, the purchase itself isn't complete
        // until the remaining balance is received and verified, and no
        // "conversion margin" language is used in buyer-facing copy.
        const balanceNote = hasRemainder
          ? `<p>This was the initial payment on your purchase. To complete it, you&rsquo;ll need to pay the remaining
             balance of $${totalRemainderUsd.toLocaleString()} USD by bank wire transfer, credit card, or debit card
             — our team will contact you shortly with instructions for paying it.</p>
             <p>Your purchase will be completed only after we&rsquo;ve received and verified the full remaining
             balance.</p>`
          : `<p>Durqo is holding your payment in escrow until the seller transfers the assets and you confirm receipt.</p>`;

        await sendEmail(
          buyerEmail,
          hasRemainder ? "Your Durqo purchase — remaining balance due" : "Your Durqo purchase is confirmed",
          `<p>Thanks for your purchase — here's what you bought:</p>
           <ul>${itemsHtml}</ul>
           ${balanceNote}`
        );
      }

      for (const listing of paidListings ?? []) {
        const sellerEmail = emails[listing.seller_id as string];
        if (!sellerEmail) continue;
        const orderId = orderIdByListingId.get(listing.id as string);
        const roomReady = orderId && roomReadyOrderIds.has(orderId);
        await sendEmail(
          sellerEmail,
          `Your listing "${listing.title}" has sold`,
          `<p>Good news — "${listing.title}" sold via our Bangladesh payment gateway.</p>
           ${
             roomReady && orderId
               ? `<p>Your buyer's Transfer Room is open now — head there to start transferring the assets.</p>${transferRoomEmailCta(origin, orderId)}`
               : `<p>Our team will be in touch with next steps to transfer the assets and release your payment.</p>`
           }`
        );
      }
    } catch (err) {
      console.error("[sslcommerz-ipn] notification emails failed:", err);
    }
  } else if (validation.status === "FAILED" || validation.status === "CANCELLED") {
    await admin.from("orders").update({ status: "cancelled" }).in("id", orderIds).eq("status", "awaiting_payment");
  }

  return NextResponse.json({ received: true, status: validation.status });
}
