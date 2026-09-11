import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSslcommerzConfig, createSslcommerzSession } from "@/lib/sslcommerz";
import { convertUsdToBdt } from "@/lib/currency";
import { onlineChargeAmount } from "@/lib/payment-terms";

// SSLCommerz counterpart to /api/checkout/route.ts (Stripe). Same shape —
// either the signed-in buyer's cart, or a single `{ listingId }` for Buy
// Now — turned into real `orders` rows (status "awaiting_payment",
// payment_channel "bangladesh_gateway") plus a SSLCommerz transaction
// session. On success the client redirects the browser to the returned
// GatewayPageURL, where the buyer picks bKash/Nagad/card/etc. within
// SSLCommerz's own hosted page. Payment is only actually confirmed by the
// IPN handler (/api/sslcommerz/ipn) re-validating server-to-server with
// SSLCommerz's Validation API — this route only ever creates
// "awaiting_payment" rows, matching the Stripe route's same reasoning.
//
// Currency note: SSLCommerz is a Bangladesh-market gateway and charges in
// BDT. Every listing price in this app is stored and displayed in USD, and
// `orders.amount` below stays in USD to match that — it's just the
// SSLCommerz session total that's converted, via convertUsdToBdt()
// (src/lib/currency.ts): current market USD->BDT rate + a flat 6 BDT
// margin, per the merchant's explicit instruction.
//
// Payment Terms note: the USD amount fed into that conversion is also
// capped per listing via onlineChargeAmount() (src/lib/payment-terms.ts)
// at ONLINE_DEPOSIT_CAP, so SSLCommerz never charges more than what each
// listing's own "Payment Terms" section told the buyer they'd pay online.
// Sep 11, 2026: Stripe used to apply this same cap; per the merchant's
// request that was removed for Stripe (api/checkout now always charges
// the full price), so this cap is SSLCommerz-only now.
export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 500 });
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "You need to be logged in to check out." }, { status: 401 });
  }
  const buyerId = userData.user.id;

  let directListingId: string | undefined;
  try {
    const body = await request.json();
    if (body && typeof body.listingId === "string") directListingId = body.listingId;
  } catch {
    // no body — cart checkout
  }

  let listingIds: string[];
  if (directListingId) {
    listingIds = [directListingId];
  } else {
    const { data: cartRows, error: cartError } = await supabase
      .from("cart_items")
      .select("listing_id")
      .eq("user_id", buyerId);
    if (cartError) {
      return NextResponse.json({ error: cartError.message }, { status: 500 });
    }
    if (!cartRows || cartRows.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }
    listingIds = cartRows.map((r) => r.listing_id);
  }

  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select("id, title, price, discounted_price, seller_id")
    .in("id", listingIds)
    .eq("status", "published");
  if (listingsError) {
    return NextResponse.json({ error: listingsError.message }, { status: 500 });
  }
  if (!listings || listings.length === 0) {
    return NextResponse.json(
      { error: directListingId ? "This listing has already been sold." : "The items in your cart aren't available anymore." },
      { status: 400 }
    );
  }

  const totalAmount = listings.reduce((sum, l) => sum + Number(l.discounted_price ?? l.price), 0);
  // What SSLCommerz actually charges — capped per listing to match each
  // listing's own "Payment Terms" copy (src/lib/payment-terms.ts).
  // `totalAmount` above (full price) is still what's recorded on the
  // orders below.
  const onlineTotal = listings.reduce((sum, l) => sum + onlineChargeAmount(Number(l.discounted_price ?? l.price)), 0);
  const productName = listings.map((l) => l.title).join(", ").slice(0, 255);

  const orderRows = listings.map((l) => {
    const price = Number(l.discounted_price ?? l.price);
    const charged = onlineChargeAmount(price);
    return {
      listing_id: l.id,
      buyer_id: buyerId,
      seller_id: l.seller_id,
      amount: price,
      online_charge_usd: charged,
      remainder_usd: Math.round((price - charged) * 100) / 100,
      status: "awaiting_payment" as const,
      payment_channel: "bangladesh_gateway" as const,
    };
  });

  const { data: insertedOrders, error: insertError } = await supabase
    .from("orders")
    .insert(orderRows)
    .select("id, listing_id");
  if (insertError || !insertedOrders) {
    return NextResponse.json({ error: insertError?.message ?? "Couldn't create the order." }, { status: 500 });
  }

  const config = getSslcommerzConfig();
  if (!config) {
    await supabase.from("orders").delete().in("id", insertedOrders.map((o) => o.id));
    return NextResponse.json({ error: "Bangladesh payment gateway isn't set up yet — try again shortly." }, { status: 500 });
  }

  // Fetch the buyer's profile name for the SSLCommerz customer fields —
  // Durqo doesn't collect a billing address today, so cus_add1/city/
  // postcode/country fall back to generic placeholders. SSLCommerz's API
  // requires *some* value in these fields; it doesn't validate them for
  // this merchant category. Worth revisiting (a real billing-details step)
  // before going live for real, but not a blocker for sandbox verification.
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", buyerId).single();

  // tran_id must be unique per SSLCommerz session — prefix it so it's
  // recognizable in the Merchant Panel's transaction log, and include the
  // first order's id so the IPN handler can always find its way back to
  // the right order(s) even if the metadata lookup below is ever bypassed.
  const tranId = `DURQO-${insertedOrders[0].id}-${Date.now()}`;

  const origin = new URL(request.url).origin;

  const { bdtAmount, appliedRate, source: rateSource } = await convertUsdToBdt(onlineTotal);
  if (rateSource === "fallback") {
    // Not a blocker — checkout still works off the fallback rate — but
    // worth a loud log line since it means a real buyer is about to be
    // charged off a stale hardcoded rate rather than today's market rate.
    console.error(`[sslcommerz-init] USD->BDT live rate lookup failed; charging tran ${tranId} off the fallback rate.`);
  }
  // Rate is logged (not just used) so a real charge's BDT total is always
  // traceable back to the USD->BDT rate applied at the moment of purchase.
  console.log(`[sslcommerz-init] tran ${tranId}: sale $${totalAmount} USD, charging $${onlineTotal} USD -> ${bdtAmount} BDT @ rate ${appliedRate} (${rateSource})`);

  try {
    const session = await createSslcommerzSession(config, {
      tranId,
      totalAmount: bdtAmount,
      currency: "BDT",
      productName: productName || "Durqo listing purchase",
      productCategory: "Digital Business",
      custName: profile?.full_name || userData.user.email || "Durqo Buyer",
      custEmail: userData.user.email ?? "buyer@durqo.com",
      custPhone: "01700000000",
      custAdd1: "N/A",
      custCity: "Dhaka",
      custPostcode: "1200",
      custCountry: "Bangladesh",
      successUrl: `${origin}/api/sslcommerz/success`,
      failUrl: `${origin}/api/sslcommerz/fail`,
      cancelUrl: `${origin}/api/sslcommerz/cancel`,
      ipnUrl: `${origin}/api/sslcommerz/ipn`,
    });

    if (session.status !== "SUCCESS" || !session.gatewayPageUrl) {
      throw new Error(session.failedreason || "SSLCommerz didn't return a checkout URL.");
    }

    await supabase
      .from("orders")
      .update({ sslcommerz_tran_id: tranId })
      .in("id", insertedOrders.map((o) => o.id));

    // Records each order's own BDT amount (its share of onlineTotal, same
    // appliedRate the whole transaction used) so the buyer/seller/admin
    // order views can show "you paid ৳X at rate Y" without recomputing —
    // and without depending on today's rate still being the applied one by
    // the time someone looks. Best-effort: a failure here doesn't affect
    // the payment itself, which has already succeeded above.
    const onlineChargeByListingId = new Map(listings.map((l) => [l.id, onlineChargeAmount(Number(l.discounted_price ?? l.price))]));
    await Promise.all(
      insertedOrders.map((o) =>
        supabase
          .from("orders")
          .update({
            sslcommerz_bdt_amount: Math.round((onlineChargeByListingId.get(o.listing_id) ?? 0) * appliedRate * 100) / 100,
            sslcommerz_rate: appliedRate,
          })
          .eq("id", o.id)
      )
    );

    return NextResponse.json({ url: session.gatewayPageUrl });
  } catch (err) {
    await supabase.from("orders").delete().in("id", insertedOrders.map((o) => o.id));
    const message = err instanceof Error ? err.message : "Couldn't start checkout. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
