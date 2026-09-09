import { NextResponse } from "next/server";

// SSLCommerz redirects the buyer's browser here via POST (STEP 3 of their
// integration guide) once checkout finishes on their hosted page. This is
// purely a landing point — same reasoning as Stripe's success_url handling
// in CheckoutSuccessView.tsx: it does NOT itself confirm or update
// anything server-side (a buyer's browser landing here proves SSLCommerz
// redirected them, not that the IPN has already been validated), so it
// just forwards to the same confirmation page Stripe checkouts land on,
// carrying the tran_id through as a query param instead of session_id. A
// 303 redirect turns this POST into a plain GET for the browser.
export async function POST(request: Request) {
  const formData = await request.formData();
  const tranId = formData.get("tran_id")?.toString() ?? "";
  const origin = new URL(request.url).origin;
  const url = new URL("/checkout/success", origin);
  if (tranId) url.searchParams.set("tran_id", tranId);
  url.searchParams.set("gateway", "sslcommerz");
  return NextResponse.redirect(url, 303);
}
