import { fmtUSD, fmtBDT } from "@/lib/format";

// Small note rendered under an order's Amount cell — added Sep 2026 so the
// "$2,000 online, remainder direct" Payment Terms rule and the SSLCommerz
// BDT conversion aren't just a one-time confirmation the buyer saw at
// checkout, but a durable, always-visible record on every order view
// (buyer dashboard, seller dashboard, admin). Renders nothing for orders
// placed before these columns existed (all fields undefined) or where the
// full price was simply charged online with no BDT conversion involved.
export default function OrderAmountBreakdown({
  paymentChannel,
  onlineChargeUsd,
  remainderUsd,
  sslcommerzBdtAmount,
  sslcommerzRate,
}: {
  paymentChannel: string | null;
  onlineChargeUsd: number | undefined;
  remainderUsd: number | undefined;
  sslcommerzBdtAmount: number | undefined;
  sslcommerzRate: number | undefined;
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
      {hasRemainder && <span>+ {fmtUSD(remainderUsd)} settled directly (wire/card), not through Durqo</span>}
    </div>
  );
}
