import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEscrowConfig, createEscrowTransaction, getEscrowAgreeLink } from "@/lib/escrow";
import { getUserEmails } from "@/lib/notifications";
import { unconfirmedListingTitles, assetsNotConfirmedMessage } from "@/lib/listing-assets-gate";

// Escrow.com counterpart to /api/sslcommerz/init (and /api/checkout for
// Stripe) — turns a single listing into a real `orders` row (status
// "awaiting_payment", payment_channel "escrow_com") plus a real Escrow.com
// transaction, then hands back the URL to redirect the buyer's browser to
// Escrow.com's own hosted page to agree and pay. Single-listing (Buy Now)
// only — see the note in api/escrow/quote/route.ts on why cart checkout
// isn't wired up yet.
//
// Unlike Stripe/SSLCommerz, there is no webhook-independent way to confirm
// payment from this route — Escrow.com only tells this app a transaction's
// funds are secured via a webhook (see api/escrow/webhook/route.ts), which
// always re-fetches the transaction from Escrow.com's API before trusting
// it. This route only ever creates "awaiting_payment" rows, exactly like
// the Stripe and SSLCommerz init routes.
export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 500 });
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user || !userData.user.email) {
    return NextResponse.json({ error: "You need to be logged in to check out." }, { status: 401 });
  }
  const buyerId = userData.user.id;
  const buyerEmail = userData.user.email;

  let listingId: string | undefined;
  try {
    const body = await request.json();
    if (body && typeof body.listingId === "string") listingId = body.listingId;
  } catch {
    // no body
  }
  if (!listingId) {
    return NextResponse.json({ error: "Missing listingId." }, { status: 400 });
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, title, price, discounted_price, seller_id, assets_confirmed_at")
    .eq("id", listingId)
    .eq("status", "published")
    .maybeSingle();
  if (listingError) {
    return NextResponse.json({ error: listingError.message }, { status: 500 });
  }
  if (!listing) {
    return NextResponse.json({ error: "This listing has already been sold." }, { status: 400 });
  }
  if (listing.seller_id === buyerId) {
    return NextResponse.json({ error: "You can't buy your own listing." }, { status: 400 });
  }

  // Asset Transfer System v2 checkout gate (report Section 2.7, confirmed) —
  // see src/lib/listing-assets-gate.ts.
  const unconfirmedTitles = unconfirmedListingTitles([listing]);
  if (unconfirmedTitles.length > 0) {
    return NextResponse.json({ error: assetsNotConfirmedMessage(unconfirmedTitles) }, { status: 400 });
  }

  const config = getEscrowConfig();
  if (!config) {
    return NextResponse.json({ error: "Escrow.com isn't set up yet — try again shortly." }, { status: 500 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 500 });
  }
  const sellerEmails = await getUserEmails(admin, [listing.seller_id]);
  const sellerEmail = sellerEmails[listing.seller_id];
  if (!sellerEmail) {
    return NextResponse.json({ error: "Couldn't reach the seller's account. Please try again shortly." }, { status: 500 });
  }

  const price = Number(listing.discounted_price ?? listing.price);

  const { data: insertedOrder, error: insertError } = await supabase
    .from("orders")
    .insert({
      listing_id: listing.id,
      buyer_id: buyerId,
      seller_id: listing.seller_id,
      amount: price,
      status: "awaiting_payment",
      payment_channel: "escrow_com",
    })
    .select("id")
    .single();
  if (insertError || !insertedOrder) {
    return NextResponse.json({ error: insertError?.message ?? "Couldn't create the order." }, { status: 500 });
  }

  try {
    const origin = new URL(request.url).origin;
    const transaction = await createEscrowTransaction(config, {
      buyerEmail,
      sellerEmail,
      description: `Durqo purchase: ${listing.title}`,
      itemTitle: listing.title,
      amountUsd: price,
      listingUrl: `${origin}/listing/${listing.id}`,
    });

    await supabase.from("orders").update({ escrow_transaction_id: transaction.id }).eq("id", insertedOrder.id);

    console.log(`[escrow-init] order ${insertedOrder.id}: created Escrow.com transaction ${transaction.id} for $${price}`);

    const agreeUrl = await getEscrowAgreeLink(config, transaction.id);

    return NextResponse.json({ url: agreeUrl });
  } catch (err) {
    await supabase.from("orders").delete().eq("id", insertedOrder.id);
    const message = err instanceof Error ? err.message : "Couldn't start checkout. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
