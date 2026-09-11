import { fmtUSD, fmtBDT } from "@/lib/format";

// Small note rendered under an order's Amount cell — added Sep 2026 so the
// "$2,000 online, remainder direct" Payment Terms rule and the SSLCommerz
// BDT conversion aren't just a one-time confirmation the buyer saw at
// checkout, but a durable, always-visible record on every order view
// (buyer dashboard, seller dashboard, admin). Renders nothing for orders
// placed before these columns existed (all fields undefined) or where the
// full price was simply charged online with no BDT conversion involved.
// Sep 9 2026: the remainder note now branches by channel — SSLCommerz's
// remaining balance is coordinated by Durqo (an email with wire/card
// instructions, purchase not complete until that balance verifies), which
// is a different policy from Stripe's "settled directly, not through
// Durqo" — so only the SSLCommerz wording changed here; Stripe's is
// untouched.
// Sep 10 2026: the SSLCommerz remainder now also shows its BDT equivalent
// (remainderUsd * sslcommerzRate, the same rate already stored for the
// online-charge portion of this same order) — same gap/fix as
// SslcommerzConfirmModal's confirmation screen, so the balance a
// Bangladeshi buyer sees quoted at checkout still reads in BDT once it
// shows up again here on the order record.
// Sep 11 2026: the SSLCommerz remainder note used to say "not yet
// completed" unconditionally — including on orders whose status was
// already "completed" (admin only marks an order completed once the
// remainder has actually been received and verified, per the manual
// review flow), which read as a contradiction right next to a COMPLETED
// badge on the same card. Added an `orderStatus` prop so this note can
// reflect what actually happened: "not yet completed" only while the
// order is still open, a past-tense "received and verified" once
// completed, and a "not collected" note if the order was cancelled
// instead. Optional/untyped as a plain string (rather than importing
// OrderStatus from orders.client.ts) since one call site (AdminOrdersTable,
// ReceiptView) already carries status as a bare string, not the union type.
function remainderNote(orderStatus: string | undefined): string {
  if (orderStatus === "completed") return "balance received and verified by Durqo";
  if (orderStatus === "cancelled") return "balance not collected — order cancelled";
  return "balance due — pay by wire/card once Durqo emails instructions; not yet completed";
}

export default function OrderAmountBreakdown({
  paymentChannel,
  onlineChargeUsd,
  remainderUsd,
  sslcommerzBdtAmount,
  sslcommerzRate,
  orderStatus,
}: {
  paymentChannel: string | null;
  onlineChargeUsd: number | undefined;
  remainderUsd: number | undefined;
  sslcommerzBdtAmount: number | undefined;
  sslcommerzRate: number | undefined;
  orderStatus?: string;
}) {
  const isSslcommerz = paymentChannel === "bangladesh_gateway";
  const hasRemainder = typeof remainderUsd === "number" && remainderUsd > 0;
  const hasBdt = isSslcommerz && typeof sslcommerzBdtAmount === "number" && typeof sslcommerzRate === "number";

  if (!hasRemainder && !hasBdt) return null;

  return (
    <div className="mt-1 flex flex-col gap-0.5 text-xs font-normal normal-case text-ink-faint">
      {hasBdt && (
        <span>
          Charged {fmtBDT(sslcommerzBdtAmount)} (1 USD = {fmtBDT(sslcommerzRate)})
          {typeof onlineChargeUsd === "number" ? ` ≈ ${fmtUSD(onlineChargeUsd)}` : ""}
        </span>
      )}
      {!hasBdt && typeof onlineChargeUsd === "number" && (
        <span>{fmtUSD(onlineChargeUsd)} online</span>
      )}
      {hasRemainder && (
        <span>
          {isSslcommerz
            ? `+ ${fmtUSD(remainderUsd)}${
                typeof sslcommerzRate === "number"
                  ? ` (≈ ${fmtBDT(Math.round(remainderUsd! * sslcommerzRate * 100) / 100)})`
                  : ""
              } ${remainderNote(orderStatus)}`
            : `+ ${fmtUSD(remainderUsd)} settled directly (wire/card), not through Durqo`}
        </span>
      )}
    </div>
  );
}
