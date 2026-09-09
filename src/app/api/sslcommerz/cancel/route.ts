import { NextResponse } from "next/server";

// SSLCommerz's cancel_url — the buyer backed out of their hosted checkout
// page voluntarily, rather than a failed payment attempt. Same forwarding
// pattern as fail/route.ts, distinguished only by the error flag so
// CartView can show a slightly different message ("cancelled" vs
// "failed") if it wants to.
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const url = new URL("/cart", origin);
  url.searchParams.set("sslcommerz_error", "cancelled");
  return NextResponse.redirect(url, 303);
}
