import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { createStripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, ADMIN_EMAIL } from "@/lib/email";
import { getUserEmails } from "@/lib/notifications";
import { maybeCreateTransferRoomsOnPayment, transferRoomEmailCta } from "@/lib/asset-transfer-room";

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
          .update({ status: "in_durqo", stripe_payment_intent_id: paymentIntentId })
          .in("id", orderIds);

        // Asset Transfer System v2 (Phase 4 follow-up, Task #188) —
        // feature-flagged, best-effort, never blocks this webhook. The
        // returned list is exactly which of these orders actually got a
        // room (idempotent — already-existing rooms count too), used below
        // to decide which seller gets the "Open the Transfer Room" link.
        const roomReadyOrderIds = new Set(await maybeCreateTransferRoomsOnPayment(admin, orderIds));
        const orderIdByListingId = new Map((paidOrders ?? []).map((o) => [o.listing_id, o.id]));
        const origin = new URL(request.url).origin;

        // The listings the buyer just paid for no longer belong in their
        // cart — clear just those, not the whole cart, in case something
        // else was added mid-checkout.
        if (paidOrders && paidOrders.length > 0) {
          const listingIds = paidOrders.map((o) => o.listing_id);
          if (buyerId) {
            await admin.from("cart_items").delete().eq("user_id", buyerId).in("listing_id", listingIds);
          }
          // Mark the listing(s) sold so the catalog/detail pages show a
          // "Sold" badge and lock further Add to Cart / Buy Now clicks.
          // Scoped to still-published rows so this never overwrites a
          // listing some other event already moved to a different state
          // (e.g. a seller who archived it in the meantime).
          await admin.from("listings").update({ status: "sold" }).in("id", listingIds).eq("status", "published");
          // Without this, the "Sold" badge only shows up once something
          // else happens to revalidate these paths — a buyer who completes
          // checkout and lands back on the listing page (or the homepage/
          // marketplace) could still see it as buyable.
          for (const id of listingIds) revalidatePath(`/listing/${id}`);
          revalidatePath("/");
          revalidatePath("/buy");

          // Best-effort purchase notifications — admin, buyer, and every
          // seller involved. Never blocks or fails the webhook: Stripe
          // retries a non-2xx response, and the order/listing state above is
          // already committed by this point, so a notification failure here
          // must not turn into a spurious retry. sendEmail already swallows
          // its own send errors; the try/catch below only guards against a
          // Supabase lookup itself throwing.
          try {
            const { data: purchasedListings } = await admin
              .from("listings")
              .select("id, title, price, seller_id")
              .in("id", listingIds);

            const sellerIds = Array.from(new Set((purchasedListings ?? []).map((l) => l.seller_id as string)));
            const lookupIds = buyerId ? [buyerId, ...sellerIds] : sellerIds;
            const emails = lookupIds.length ? await getUserEmails(admin, lookupIds) : {};
            const buyerEmail = buyerId ? emails[buyerId] : undefined;

            const itemsHtml = (purchasedListings ?? [])
              .map((l) => `<li>${l.title} — $${Number(l.price).toLocaleString()}</li>`)
              .join("");
            const total = (purchasedListings ?? []).reduce((sum, l) => sum + Number(l.price || 0), 0);

            await sendEmail(
              ADMIN_EMAIL,
              `New purchase completed — ${purchasedListings?.length ?? 0} listing(s)`,
              `<p>${buyerEmail ?? "A buyer"} completed checkout for:</p>
               <ul>${itemsHtml}</ul>
               <p>Total: $${total.toLocaleString()}</p>
               <p><a href="${origin}/dashboard/admin/orders">Review in admin dashboard</a></p>`
            );

            if (buyerEmail) {
              // Every ready Transfer Room among this buyer's just-purchased
              // listings — usually one, but a multi-item checkout can create
              // more than one order/room in the same webhook call. Mirrors
              // the Escrow.com webhook's buyer CTA, extended here since
              // Stripe's checkout flow now also redirects the buyer straight
              // into the room (see Task #190) — the email is a fallback for
              // whenever that redirect doesn't happen (e.g. tab closed).
              const readyOrderIds = (purchasedListings ?? [])
                .map((l) => orderIdByListingId.get(l.id as string))
                .filter((id): id is string => !!id && roomReadyOrderIds.has(id));
              const transferCtaHtml = readyOrderIds.length
                ? `<p>Your Transfer Room${readyOrderIds.length > 1 ? "s are" : " is"} open — head there to track the handover and confirm receipt once the seller transfers the assets.</p>${readyOrderIds
                    .map((id) => transferRoomEmailCta(origin, id))
                    .join("")}`
                : "";

              await sendEmail(
                buyerEmail,
                "Your Durqo purchase is confirmed",
                `<p>Thanks for your purchase — here's what you bought:</p>
                 <ul>${itemsHtml}</ul>
                 <p>Durqo is holding your payment in escrow until the seller transfers the assets and you confirm receipt.</p>
                 ${transferCtaHtml}`
              );
            }

            for (const listing of purchasedListings ?? []) {
              const sellerEmail = emails[listing.seller_id as string];
              if (!sellerEmail) continue;
              const orderId = orderIdByListingId.get(listing.id as string);
              const roomReady = orderId && roomReadyOrderIds.has(orderId);
              await sendEmail(
                sellerEmail,
                `Your listing "${listing.title}" has sold`,
                `<p>Good news — "${listing.title}" sold for $${Number(listing.price).toLocaleString()}.</p>
                 ${
                   roomReady && orderId
                     ? `<p>Your buyer's Transfer Room is open now — head there to start transferring the assets.</p>${transferRoomEmailCta(origin, orderId)}`
                     : `<p>Our team will be in touch with next steps to transfer the assets and release your payment.</p>`
                 }`
              );
            }
          } catch (err) {
            console.error("[webhook] purchase notification emails failed:", err);
          }
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
