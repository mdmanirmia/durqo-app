import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// SSLCommerz redirects the buyer's browser here via POST (STEP 3 of their
// integration guide) once checkout finishes on their hosted page. This does
// NOT itself confirm or update anything server-side (a buyer's browser
// landing here proves SSLCommerz redirected them, not that the IPN has
// already been validated) — that's still entirely the IPN handler's job
// (/api/sslcommerz/ipn). All this route decides is where to send the
// buyer's browser next.
//
// 2026-09-12, per the site owner's request: a single-item purchase (the
// common case) sends the buyer straight to /dashboard/transfer/{orderId}
// instead of the generic confirmation page — looked up by tran_id, which
// /api/sslcommerz/init already stored on the order(s) before redirecting to
// SSLCommerz. A multi-item cart checkout (more than one order sharing this
// tran_id) has no single room to land on, so it falls back to the generic
// confirmation page exactly as before. The Transfer Room page itself
// re-checks that the signed-in user is actually a party to that order, so
// this can't leak anyone else's order.
//
// Note this route usually runs a beat ahead of the IPN — SSLCommerz's own
// docs don't guarantee ordering between the browser redirect and the
// server-to-server IPN call, so the order may still say "awaiting_payment"
// for a moment after the buyer lands here. The Transfer Room page's
// "hasn't been set up yet" state (NoRoomState in TransferRoomView.tsx)
// already covers exactly that, and now auto-refreshes for a few seconds.
// A 303 redirect turns this POST into a plain GET for the browser either way.
export async function POST(request: Request) {
  const formData = await request.formData();
  const tranId = formData.get("tran_id")?.toString() ?? "";
  const origin = new URL(request.url).origin;

  if (tranId) {
    const admin = createAdminClient();
    if (admin) {
      const { data: matchingOrders } = await admin.from("orders").select("id").eq("sslcommerz_tran_id", tranId);
      if (matchingOrders && matchingOrders.length === 1) {
        return NextResponse.redirect(new URL(`/dashboard/transfer/${matchingOrders[0].id}`, origin), 303);
      }
    }
  }

  const url = new URL("/checkout/success", origin);
  if (tranId) url.searchParams.set("tran_id", tranId);
  url.searchParams.set("gateway", "sslcommerz");
  return NextResponse.redirect(url, 303);
}
