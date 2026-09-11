// Shared with the "Payment Terms" copy shown on every listing page
// (src/app/listing/[id]/page.tsx): a Bangladeshi buyer paying in BDT
// through SSLCommerz on a listing priced above this cap only pays the BDT
// equivalent of ONLINE_DEPOSIT_CAP through SSLCommerz at checkout. Durqo
// then emails the buyer with instructions for paying the remainder by
// wire transfer, credit card, or debit card, and the purchase isn't
// considered complete until Durqo has received and verified it (see
// /api/sslcommerz/ipn and SslcommerzConfirmModal.tsx). A listing at or
// under the cap is charged in full through SSLCommerz, since there's no
// "remainder" to speak of.
//
// Sep 9, 2026: this used to be display-only text with no matching
// enforcement — the checkout route actually charged the listing's full
// price regardless of what the listing page told the buyer they'd pay.
// Fixed by having SSLCommerz (api/sslcommerz/init) run the actual charge
// through this function, so what a buyer is told and what they're charged
// can't drift apart again.
//
// Sep 11, 2026: this cap used to also apply to Stripe card checkout
// (api/checkout), with the remainder settled directly between buyer and
// seller off-platform. Per the merchant's explicit request, that Stripe
// cap was removed — Stripe now always charges the full listing price in
// one payment, same as Escrow.com. This function (and the cap it applies)
// is now SSLCommerz-only; see api/checkout/route.ts's own comment for
// where the Stripe-side charge amount changed. `orders.amount` still
// records the full agreed sale price regardless of rail (used for GMV,
// seller lifetime-sales stats, and the order record) — only the
// SSLCommerz gateway charge itself is capped now.
export const ONLINE_DEPOSIT_CAP = 2000;

export function onlineChargeAmount(listingPrice: number): number {
  return Math.min(listingPrice, ONLINE_DEPOSIT_CAP);
}
