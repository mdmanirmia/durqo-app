import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { unconfirmedListingTitles, assetsNotConfirmedMessage } from "@/lib/listing-assets-gate";
import { payLaterEnabled, maybeCreateTransferRoomsOnPayment, transferRoomEmailCta } from "@/lib/asset-transfer-room";
import { sendEmail, ADMIN_EMAIL } from "@/lib/email";
import { getUserEmails } from "@/lib/notifications";

// "Buy Now — Pay Later" — a 4th checkout option on every listing page,
// alongside Stripe/SSLCommerz/Escrow.com. Live for every signed-in buyer as
// of 2026-09-12, per the site owner's explicit decision (made after being
// told plainly what this means: it creates a real `orders` row and marks
// the listing "sold" with NO real payment collected — see the project doc
// for the exact exchange). This is not a mock/sandbox action.
//
// Calls the same real production code path a genuine payment webhook would:
// creates the order (`payment_channel: 'durqo_platform'`, `status:
// 'in_durqo'` — money sits with Durqo directly, not a neutral escrow agent,
// same as Stripe/SSLCommerz), marks the listing sold, clears the buyer's
// cart entry, and
// calls maybeCreateTransferRoomsOnPayment — the same function Stripe/
// SSLCommerz/Escrow.com's webhooks call. If ASSET_TRANSFER_ROOMS_ENABLED is
// also true, this creates a real Transfer Room and the buyer is taken
// straight to it.
//
// Kill switch: set PAY_LATER_ENABLED=false in Vercel's Environment
// Variables to turn this checkout option off again without a code
// redeploy — see payLaterEnabled() in src/lib/asset-transfer-room.ts. This
// is the ONLY gate on who can use it; there's no per-account restriction.
//
// Written with the service-role client rather than the caller's own session
// client: orders' current INSERT policy (orders_insert_buyer) only checks
// `auth.uid() = buyer_id`, not the `status`/`payment_channel` values being
// inserted, and (unlike an earlier draft of this route) there is now no
// account-level check happening here to substitute for that at the RLS
// layer either — writing through the admin client keeps this route's
// behavior identical regardless of that RLS gap. See the project doc for a
// still-open recommendation to close that gap with an insert-time check
// constraint (mirroring migration 034's UPDATE column allowlist) — not
// applied, since it touches the live checkout path for all three real
// payment rails and needs the site owner's own go-ahead.
export async function POST(request: Request) {
  if (!payLaterEnabled()) {
    return NextResponse.json({ error: "Pay Later isn't available right now." }, { status: 403 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 500 });
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "You need to be logged in to check out." }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 500 });
  }

  let listingId: string | undefined;
  try {
    const body = await request.json();
    if (body && typeof body.listingId === "string") listingId = body.listingId;
  } catch {
    // no/invalid body — handled by the missing-listingId check below
  }
  if (!listingId) {
    return NextResponse.json({ error: "Missing listingId." }, { status: 400 });
  }

  const { data: listing, error: listingError } = await admin
    .from("listings")
    .select("id, title, price, discounted_price, seller_id, assets_confirmed_at")
    .eq("id", listingId)
    .eq("status", "published")
    .maybeSingle();
  if (listingError) {
    return NextResponse.json({ error: listingError.message }, { status: 500 });
  }
  if (!listing) {
    return NextResponse.json({ error: "This listing has already been sold or isn't available." }, { status: 400 });
  }

  // Same Asset Transfer System v2 checkout gate the other three payment
  // rails apply — kept here too so Pay Later can't buy a listing whose
  // seller hasn't confirmed a structured asset list yet, same as any other
  // rail.
  const unconfirmedTitles = unconfirmedListingTitles([listing]);
  if (unconfirmedTitles.length > 0) {
    return NextResponse.json({ error: assetsNotConfirmedMessage(unconfirmedTitles) }, { status: 400 });
  }

  const buyerId = userData.user.id;
  const price = Number(listing.discounted_price ?? listing.price);

  const { data: insertedOrder, error: insertError } = await admin
    .from("orders")
    .insert({
      listing_id: listing.id,
      buyer_id: buyerId,
      seller_id: listing.seller_id,
      amount: price,
      online_charge_usd: price,
      remainder_usd: 0,
      // Reuses the existing "not one of the three real gateways" label
      // (ORDER_PAYMENT_CHANNELS in dashboard/admin/actions.ts) so this is
      // instantly recognizable on the admin Orders page as not a real
      // Stripe/SSLCommerz/Escrow.com payment.
      payment_channel: "durqo_platform",
      status: "in_durqo",
    })
    .select("id")
    .single();
  if (insertError || !insertedOrder) {
    return NextResponse.json({ error: insertError?.message ?? "Couldn't create the order." }, { status: 500 });
  }

  await admin.from("listings").update({ status: "sold" }).eq("id", listing.id).eq("status", "published");
  await admin.from("cart_items").delete().eq("user_id", buyerId).eq("listing_id", listing.id);
  const roomReadyOrderIds = await maybeCreateTransferRoomsOnPayment(admin, [insertedOrder.id]);
  const roomReady = roomReadyOrderIds.includes(insertedOrder.id);

  // 2026-09-12: this route never sent any notification at all — the other
  // three payment rails (Stripe/SSLCommerz/Escrow.com) all email admin +
  // buyer + seller from their webhooks, and the seller in particular needs
  // to know a Pay Later "sale" happened at all, since nothing charged them
  // and there's no payment-gateway email trail to notice it from otherwise.
  // Best-effort, same as the other three — never blocks the response.
  try {
    const origin = new URL(request.url).origin;
    const emails = await getUserEmails(admin, [buyerId, listing.seller_id]);
    const buyerEmail = emails[buyerId];
    const sellerEmail = emails[listing.seller_id];

    await sendEmail(
      ADMIN_EMAIL,
      `New Pay Later "purchase" — ${listing.title}`,
      `<p>${buyerEmail ?? "A buyer"} used Pay Later to buy "${listing.title}" for $${price.toLocaleString()} — no payment was actually collected.</p>`
    );

    if (sellerEmail) {
      await sendEmail(
        sellerEmail,
        `Your listing "${listing.title}" has sold`,
        `<p>Good news — "${listing.title}" sold via Pay Later for $${price.toLocaleString()}.</p>
         ${
           roomReady
             ? `<p>The buyer's Transfer Room is open now — head there to start transferring the assets.</p>${transferRoomEmailCta(origin, insertedOrder.id)}`
             : `<p>Our team will be in touch with next steps to transfer the assets and release your payment.</p>`
         }`
      );
    }
  } catch (err) {
    console.error("[pay-later-init] notification emails failed:", err);
  }

  revalidatePath(`/listing/${listing.id}`);
  revalidatePath("/");
  revalidatePath("/buy");
  revalidatePath("/dashboard/buyer/orders");
  revalidatePath("/dashboard/seller/orders");

  return NextResponse.json({ orderId: insertedOrder.id });
}
