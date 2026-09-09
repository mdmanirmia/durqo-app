import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { convertUsdToBdt } from "@/lib/currency";
import { onlineChargeAmount, ONLINE_DEPOSIT_CAP } from "@/lib/payment-terms";

// Read-only preview of what an SSLCommerz checkout will actually charge —
// no orders are created here, nothing is written. Powers the confirmation
// step Cart/BuyNow show before redirecting a buyer to SSLCommerz's hosted
// page: the exact BDT amount, the USD->BDT rate used, and — for a listing
// priced above the online deposit cap — how the remainder is handled. Only
// shown on the SSLCommerz path (bKash/Rocket/Nagad/Bank); Stripe charges
// USD directly and has no BDT conversion step to preview.
//
// Mirrors the same listing lookup and amount math as
// /api/sslcommerz/init, just without inserting `orders` rows or creating a
// gateway session — same shape (cart vs. `?listingId=` Buy Now) so a
// buyer sees a number here that's guaranteed to match what init actually
// charges a moment later.
export async function GET(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 500 });
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "You need to be logged in to check out." }, { status: 401 });
  }
  const buyerId = userData.user.id;

  const { searchParams } = new URL(request.url);
  const directListingId = searchParams.get("listingId") ?? undefined;

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
    .select("id, price, discounted_price")
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

  const fullPriceUsd = listings.reduce((sum, l) => sum + Number(l.discounted_price ?? l.price), 0);
  const onlineChargeUsd = listings.reduce((sum, l) => sum + onlineChargeAmount(Number(l.discounted_price ?? l.price)), 0);
  const remainderUsd = Math.round((fullPriceUsd - onlineChargeUsd) * 100) / 100;

  const { bdtAmount, appliedRate, source } = await convertUsdToBdt(onlineChargeUsd);

  return NextResponse.json({
    fullPriceUsd,
    onlineChargeUsd,
    remainderUsd,
    depositCap: ONLINE_DEPOSIT_CAP,
    bdtAmount,
    rate: appliedRate,
    rateSource: source,
  });
}
