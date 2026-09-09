// Shared with the "Payment Terms" copy shown on every listing page
// (src/app/listing/[id]/page.tsx): businesses priced above this cap are
// paid ONLINE_DEPOSIT_CAP through Durqo's own checkout (Stripe or
// SSLCommerz), with the remainder settled by wire transfer, credit card,
// or debit card. For Stripe that remainder is settled directly between
// buyer and seller off-platform. For SSLCommerz (Bangladesh-based buyers
// paying in BDT), Durqo instead emails the buyer with instructions for
// paying that remainder, and the purchase isn't considered complete until
// Durqo has received and verified it (see /api/sslcommerz/ipn and
// SslcommerzConfirmModal.tsx) — the two rails differ here even though the
// cap math (this function) is identical for both. Businesses at or under
// the cap are charged in full online, since there's no "remainder" to
// speak of, on either rail.
//
// Sep 9, 2026: this used to be display-only text with no matching
// enforcement — every checkout route actually charged the listing's full
// price regardless of what the listing page told the buyer they'd pay.
// Fixed by having both Stripe (api/checkout) and SSLCommerz
// (api/sslcommerz/init) run the actual charge through this same function,
// so what a buyer is told and what they're charged can't drift apart
// again. `orders.amount` intentionally still records the full agreed sale
// price (used for GMV, seller lifetime-sales stats, and the order
// record) — only the gateway charge itself is capped.
export const ONLINE_DEPOSIT_CAP = 2000;

export function onlineChargeAmount(listingPrice: number): number {
  return Math.min(listingPrice, ONLINE_DEPOSIT_CAP);
}
