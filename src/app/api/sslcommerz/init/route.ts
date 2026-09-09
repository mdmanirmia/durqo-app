import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSslcommerzConfig, createSslcommerzSession } from "@/lib/sslcommerz";

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
// Currency note: SSLCommerz is a Bangladesh-market gateway and expects
// amounts in BDT (or another currency your merchant account is enabled
// for — sandbox accepts BDT regardless). Every listing price in this app
// is stored and displayed in USD. Sandbox testing below sends the raw USD
// number through as-is with currency "BDT" purely to exercise the
// integration end-to-end; going live needs an explicit decision on real
// USD→BDT conversion (a fixed rate, a live FX lookup, or pricing Durqo
// listings in BDT for Bangladesh buyers) before this can charge a real
// buyer a correct amount. Flagged here deliberately rather than guessed.
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
  const productName = listings.map((l) => l.title).join(", ").slice(0, 255);

  const orderRows = listings.map((l) => ({
    listing_id: l.id,
    buyer_id: buyerId,
    seller_id: l.seller_id,
    amount: Number(l.discounted_price ?? l.price),
    status: "awaiting_payment" as const,
    payment_channel: "bangladesh_gateway" as const,
  }));

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

  try {
    const session = await createSslcommerzSession(config, {
      tranId,
      totalAmount,
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

    return NextResponse.json({ url: session.gatewayPageUrl });
  } catch (err) {
    await supabase.from("orders").delete().in("id", insertedOrders.map((o) => o.id));
    const message = err instanceof Error ? err.message : "Couldn't start checkout. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
