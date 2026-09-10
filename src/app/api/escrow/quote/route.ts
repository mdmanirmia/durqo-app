import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Read-only preview for the Escrow.com checkout option (Sep 10, 2026) —
// mirrors /api/sslcommerz/quote's shape (no orders created, nothing
// written) but there's no currency conversion to preview here: Escrow.com
// charges in USD directly, same as every listing price in this app, and
// the full price goes through escrow (unlike SSLCommerz/Stripe, which cap
// the online charge at ONLINE_DEPOSIT_CAP and leave a remainder to settle
// off-platform — see src/lib/payment-terms.ts). Single-listing (Buy Now)
// only for now — BuyNowButton.tsx is the only place the Escrow.com option
// is offered; Escrow.com transactions are single-seller, so a multi-seller
// cart checkout would need one transaction per seller, not built yet.
export async function GET(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 500 });
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "You need to be logged in to check out." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.json({ error: "Missing listingId." }, { status: 400 });
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, title, price, discounted_price, seller_id")
    .eq("id", listingId)
    .eq("status", "published")
    .maybeSingle();
  if (listingError) {
    return NextResponse.json({ error: listingError.message }, { status: 500 });
  }
  if (!listing) {
    return NextResponse.json({ error: "This listing has already been sold." }, { status: 400 });
  }
  if (listing.seller_id === userData.user.id) {
    return NextResponse.json({ error: "You can't buy your own listing." }, { status: 400 });
  }

  const fullPriceUsd = Number(listing.discounted_price ?? listing.price);

  return NextResponse.json({
    fullPriceUsd,
    listingTitle: listing.title,
  });
}
