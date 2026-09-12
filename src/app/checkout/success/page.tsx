import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CheckoutSuccessView from "./CheckoutSuccessView";

// Section 15: transactional confirmation page — noindex,nofollow.
export const metadata: Metadata = {
  title: "Payment Received | Durqo",
  robots: { index: false, follow: false },
};

// 2026-09-12, per the site owner's request: after paying, the buyer should
// land straight in their Transfer Room rather than on a generic "payment
// received" screen. /api/checkout puts the paid order id(s) on Stripe's
// success_url as `order_ids` (a plain comma list — known at checkout-session
// creation time, no need to wait on Stripe's own metadata). A single-item
// purchase (the common case — Buy Now, or a one-item cart) redirects
// straight to /dashboard/transfer/{orderId}; a multi-item cart checkout has
// no single room to land on, so it falls back to this confirmation screen
// same as before. The destination page re-checks that the signed-in user is
// actually a party to that order, so this redirect can't leak anyone else's
// order even if the query string were hand-edited.
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const orderIdsParam = typeof params.order_ids === "string" ? params.order_ids : "";
  const orderIds = orderIdsParam.split(",").filter(Boolean);
  if (orderIds.length === 1) {
    redirect(`/dashboard/transfer/${orderIds[0]}`);
  }

  return <CheckoutSuccessView />;
}
