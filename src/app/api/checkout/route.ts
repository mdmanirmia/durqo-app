import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createStripeClient } from "@/lib/stripe";

// Turns either the signed-in buyer's cart, or (when the request body
// includes a `listingId`) a single listing bought directly via "Buy Now",
// into real `orders` rows (status "awaiting_payment") and a Stripe Checkout
// Session that collects payment in one charge, straight into Durqo's own
// Stripe balance (no Stripe Connect / seller onboarding — payouts to
// sellers stay a manual admin step, per the withdrawal flow already
// planned in the project docs).
//
// Called from the /cart page's "Request to purchase" button (no body — the
// buyer's cart_items decide what's being bought) and from BuyNowButton on
// the listing detail page (`{ listingId }` body — skips the cart entirely
// for a direct single-item purchase). On success the client redirects the
// browser to the returned Stripe-hosted checkout URL. The webhook at
// /api/webhooks/stripe (not this route) is what actually marks the orders
// paid — this route only ever creates "awaiting_payment" rows, so a buyer
// who abandons checkout just leaves orphaned awaiting_payment rows rather
// than anything that looks paid.
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

  // Buy Now sends `{ listingId }` as a JSON body to buy just that one
  // listing directly; the cart flow sends no body at all, so a missing/
  // unparsable body is expected there, not an error.
  let directListingId: string | undefined;
  try {
    const body = await request.json();
    if (body && typeof body.listingId === "string") directListingId = body.listingId;
  } catch {
    // no body — cart checkout, fall through to the cart_items lookup below
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

  // Only "published" listings can be bought — this is what stops a sold
  // (or draft/archived) listing from being purchased again, whether via
  // Buy Now or a stale cart entry for something that sold out from under
  // the buyer while they were browsing.
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

  const orderRows = listings.map((l) => ({
    listing_id: l.id,
    buyer_id: buyerId,
    seller_id: l.seller_id,
    amount: Number(l.discounted_price ?? l.price),
    status: "awaiting_payment" as const,
  }));

  const { data: insertedOrders, error: insertError } = await supabase
    .from("orders")
    .insert(orderRows)
    .select("id, listing_id");
  if (insertError || !insertedOrders) {
    return NextResponse.json({ error: insertError?.message ?? "Couldn't create the order." }, { status: 500 });
  }

  const stripe = createStripeClient();
  if (!stripe) {
    // Clean up the orders we just created — otherwise they'd sit as
    // permanently-orphaned "awaiting_payment" rows with no way to pay.
    await supabase.from("orders").delete().in("id", insertedOrders.map((o) => o.id));
    return NextResponse.json({ error: "Payments aren't set up yet — try again shortly." }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const orderIdByListingId = new Map(insertedOrders.map((o) => [o.listing_id, o.id]));

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: listings.map((l) => ({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(Number(l.discounted_price ?? l.price) * 100),
          product_data: { name: l.title },
        },
      })),
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      customer_email: userData.user.email ?? undefined,
      metadata: {
        buyer_id: buyerId,
        order_ids: insertedOrders.map((o) => o.id).join(","),
      },
    });

    await supabase
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .in("id", Array.from(orderIdByListingId.values()));

    if (!session.url) throw new Error("Stripe didn't return a checkout URL.");
    return NextResponse.json({ url: session.url });
  } catch (err) {
    await supabase.from("orders").delete().in("id", insertedOrders.map((o) => o.id));
    const message = err instanceof Error ? err.message : "Couldn't start checkout. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
