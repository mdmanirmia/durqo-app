import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEscrowConfig, createEscrowTransaction } from "@/lib/escrow";
import { getUserEmails } from "@/lib/notifications";
import { unconfirmedListingTitles, assetsNotConfirmedMessage } from "@/lib/listing-assets-gate";
import { computeSuccessFee, centsToUSD } from "@/lib/fees";

// Escrow.com counterpart to /api/sslcommerz/init (and /api/checkout for
// Stripe) — turns a single listing into a real `orders` row (status
// "awaiting_payment", payment_channel "escrow_com") plus a real Escrow.com
// transaction. Single-listing (Buy Now) only — see the note in
// api/escrow/quote/route.ts on why cart checkout isn't wired up yet.
//
// Unlike Stripe/SSLCommerz, there is no webhook-independent way to confirm
// payment from this route — Escrow.com only tells this app a transaction's
// funds are secured via a webhook (see api/escrow/webhook/route.ts), which
// always re-fetches the transaction from Escrow.com's API before trusting
// it. This route only ever creates "awaiting_payment" rows, exactly like
// the Stripe and SSLCommerz init routes.
//
// Sep 15, 2026: this used to also call getEscrowAgreeLink() and hand back a
// URL to redirect the buyer straight to Escrow.com's agree+pay page. Two
// live attempts proved that path doesn't work with Durqo's current
// Escrow.com account: calling it plain (no As-Customer) gets "Buyer is
// unable to agree at this stage in the transaction," and calling it scoped
// to the buyer via As-Customer — the fix shipped right before this —
// instead gets "Partner account not authorized to perform actions on
// behalf of customers." That header is documented (api/docs/basics) as an
// "approved partner" feature, and Durqo's account isn't approved for it, so
// no API call we can make generates a working link. What does demonstrably
// work, confirmed by two real inboxes receiving them on these same live
// attempts, is Escrow.com's own automatic "please agree" email straight to
// the buyer. So this route no longer tries to manufacture a redirect link
// at all — it just reports success, and the buyer finishes on Escrow.com's
// side via that email. If Durqo's account is ever approved as an Escrow.com
// partner, getEscrowAgreeLink() (still in src/lib/escrow.ts) can be wired
// back in here.
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
    .select("id, slug, title, price, discounted_price, seller_id, assets_confirmed_at")
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
    return NextResponse.json({ error: "Escrow.com isn't set up yet - try again shortly." }, { status: 500 });
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
      listingUrl: `${origin}/listing/${listing.slug}`,
    });

    await supabase.from("orders").update({ escrow_transaction_id: transaction.id }).eq("id", insertedOrder.id);

    // Success Fee is now collected as a partner_fee item on the same
    // Escrow.com transaction (see the dated comment on createEscrowTransaction()
    // in src/lib/escrow.ts) rather than through Durqo's own withdrawal
    // ledger, which deliberately excludes escrow_com orders. Logged here
    // purely for visibility — nothing reads this value back.
    const platformFeeUsd = centsToUSD(computeSuccessFee(price).feeCents);
    console.log(
      `[escrow-init] order ${insertedOrder.id}: created Escrow.com transaction ${transaction.id} for $${price} (Durqo Success Fee: $${platformFeeUsd}, seller-paid via partner_fee item)`
    );

    return NextResponse.json({ ok: true, buyerEmail });
  } catch (err) {
    await supabase.from("orders").delete().eq("id", insertedOrder.id);
    const message = err instanceof Error ? err.message : "Couldn't start checkout. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
