import { NextResponse } from "next/server";

// SSLCommerz's fail_url — the buyer's browser lands here (POST) if the
// payment attempt itself failed on their hosted page (declined card, etc).
// The IPN handler independently marks the underlying order `cancelled`
// (see /api/sslcommerz/ipn) — this route is only about where the buyer's
// browser ends up, forwarding back to the cart with an error flag CartView
// can read and show as an inline message.
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const url = new URL("/cart", origin);
  url.searchParams.set("sslcommerz_error", "failed");
  return NextResponse.redirect(url, 303);
}
