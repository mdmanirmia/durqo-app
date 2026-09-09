import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSslcommerzConfig, validateSslcommerzPayment } from "@/lib/sslcommerz";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, ADMIN_EMAIL } from "@/lib/email";
import { getUserEmails } from "@/lib/notifications";

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
    .select("id, listing_id, amount, status")
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
    // `in_escrow` (funds held, nothing released to the seller yet) rather
    // than `completed`, so the hold SSLCommerz asks for is already the
    // default behavior here. A risky transaction additionally gets an
    // extra flagged email so admin knows to manually verify this buyer
    // before ever moving it to `completed`.
    const isRisky = validation.riskLevel === "1";

    await admin
      .from("orders")
      .update({ status: "in_escrow", sslcommerz_val_id: validation.valId ?? valId })
      .in("id", orderIds)
      .eq("status", "awaiting_payment");

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
      const { data: orderRows } = await admin.from("orders").select("buyer_id").in("id", orderIds).limit(1);
      const buyerId = orderRows?.[0]?.buyer_id as string | undefined;

      const sellerIds = Array.from(new Set((paidListings ?? []).map((l) => l.seller_id as string)));
      const lookupIds = buyerId ? [buyerId, ...sellerIds] : sellerIds;
      const emails = lookupIds.length ? await getUserEmails(admin, lookupIds) : {};
      const buyerEmail = buyerId ? emails[buyerId] : undefined;

      if (buyerId) {
        await admin.from("cart_items").delete().eq("user_id", buyerId).in("listing_id", listingIds);
      }

      const itemsHtml = (paidListings ?? []).map((l) => `<li>${l.title}</li>`).join("");
      const riskNote = isRisky
        ? `<p style="color:#b91c1c"><strong>Risk flag:</strong> SSLCommerz marked this transaction risk_level=1 (${validation.riskTitle ?? "unspecified"}). Please verify the customer before releasing escrow.</p>`
        : "";

      await sendEmail(
        ADMIN_EMAIL,
        `New SSLCommerz purchase — ${paidListings?.length ?? 0} listing(s)${isRisky ? " [RISK FLAG]" : ""}`,
        `<p>${buyerEmail ?? "A buyer"} completed checkout via SSLCommerz for:</p>
         <ul>${itemsHtml}</ul>
         <p>Amount: ${validation.amount ?? "?"} ${validation.currency ?? "BDT"} (tran_id ${tranId})</p>
         ${riskNote}`
      );

      if (buyerEmail) {
        await sendEmail(
          buyerEmail,
          "Your Durqo purchase is confirmed",
          `<p>Thanks for your purchase — here's what you bought:</p>
           <ul>${itemsHtml}</ul>
           <p>Durqo is holding your payment in escrow until the seller transfers the assets and you confirm receipt.</p>`
        );
      }

      for (const listing of paidListings ?? []) {
        const sellerEmail = emails[listing.seller_id as string];
        if (!sellerEmail) continue;
        await sendEmail(
          sellerEmail,
          `Your listing "${listing.title}" has sold`,
          `<p>Good news — "${listing.title}" sold via our Bangladesh payment gateway.</p>
           <p>Our team will be in touch with next steps to transfer the assets and release your payment.</p>`
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
