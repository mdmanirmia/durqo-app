import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createStripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe calls this directly (not a browser) whenever a Checkout Session's
// state changes — this is the actual source of truth for "did the buyer
// pay", not the success_url redirect (which a buyer's browser could in
// theory hit without ever paying, or could fail to hit at all if they close
// the tab right after paying). Needs the RAW request body for signature
// verification, so this reads request.text() rather than request.json().
//
// Register this URL (<your-domain>/api/webhooks/stripe) in the Stripe
// Dashboard → Developers → Webhooks, listening for at least
// checkout.session.completed and checkout.session.expired, then put the
// "Signing secret" it gives you into STRIPE_WEBHOOK_SECRET.
export async function POST(request: Request) {
  const stripe = createStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe isn't configured yet." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    // Don't leak verification details — could be a forged request.
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // Service-role client: a webhook request carries no buyer session/cookies
  // for RLS to key off, so this has to bypass RLS entirely (same as the
  // admin dashboard — see src/lib/supabase/admin.ts).
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 500 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") {
      const orderIds = (session.metadata?.order_ids ?? "").split(",").filter(Boolean);
      const buyerId = session.metadata?.buyer_id;
      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);

      if (orderIds.length > 0) {
        const { data: paidOrders } = await admin.from("orders").select("id, listing_id").in("id", orderIds);

        await admin
          .from("orders")
          .update({ status: "in_escrow", stripe_payment_intent_id: paymentIntentId })
          .in("id", orderIds);

        // The listings the buyer just paid for no longer belong in their
        // cart — clear just those, not the whole cart, in case something
        // else was added mid-checkout.
        if (buyerId && paidOrders && paidOrders.length > 0) {
          const listingIds = paidOrders.map((o) => o.listing_id);
          await admin.from("cart_items").delete().eq("user_id", buyerId).in("listing_id", listingIds);
        }
      }
    }
  } else if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderIds = (session.metadata?.order_ids ?? "").split(",").filter(Boolean);
    if (orderIds.length > 0) {
      // Only cancel orders still sitting in awaiting_payment — never
      // overwrite an order some other event already moved forward.
      await admin.from("orders").update({ status: "cancelled" }).in("id", orderIds).eq("status", "awaiting_payment");
    }
  }

  return NextResponse.json({ received: true });
}
