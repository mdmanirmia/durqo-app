"use client";

import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { fmtUSD } from "@/lib/format";
import { fmtRate } from "@/lib/fees";
import OrderAmountBreakdown from "@/components/OrderAmountBreakdown";

export interface ReceiptData {
  orderId: string;
  date: string;
  listingTitle: string;
  buyerName: string;
  sellerName: string;
  amount: number;
  status: string;
  paymentChannel: string | null;
  onlineChargeUsd: number | undefined;
  remainderUsd: number | undefined;
  sslcommerzBdtAmount: number | undefined;
  sslcommerzRate: number | undefined;
  escrowTransactionId: string | null;
  viewerSide: "buyer" | "seller";
  estimatedFeeRate: number;
  estimatedFeeAmount: number;
  estimatedNetAmount: number;
  alreadyClaimedByWithdrawal: boolean;
}

// Duplicated from AdminOrdersTable.tsx's PAYMENT_CHANNEL_LABEL — same
// "small enough that a shared lib isn't worth it yet" call already made
// there for ORDER_PAYMENT_CHANNELS; keep both in sync if a channel is ever
// renamed.
const PAYMENT_CHANNEL_LABEL: Record<string, string> = {
  stripe: "Stripe",
  durqo_platform: "Durqo Platform",
  bangladesh_gateway: "Bangladesh Payment Gateway",
  escrow: "Escrow",
  escrow_com: "Escrow.com",
};

export default function ReceiptView({ data }: { data: ReceiptData }) {
  const backHref = data.viewerSide === "buyer" ? "/dashboard/buyer/orders" : "/dashboard/seller/orders";

  return (
    <main className="py-10">
      {/* Only exists while this page is mounted — hides the global site
          header/footer and any on-page controls when the browser prints
          this specific page (window.print() below), so what a buyer/seller
          saves as a PDF is just the receipt itself. */}
      <style>{`
        @media print {
          header, footer, .receipt-no-print { display: none !important; }
          main { padding: 0 !important; }
        }
      `}</style>

      <Container className="max-w-2xl">
        <div className="receipt-no-print mb-6 flex items-center justify-between">
          <Link href={backHref} className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-brand-strong">
            <ArrowLeft size={15} /> Back to Orders
          </Link>
          <Button type="button" onClick={() => window.print()} variant="secondary">
            <Printer size={15} /> Print / Save as PDF
          </Button>
        </div>

        <div className="rounded-xl border border-rule bg-paper-raised p-8">
          <div className="mb-6 flex items-start justify-between border-b border-rule pb-6">
            <div>
              <p className="mono text-lg font-bold tracking-tight text-ink">Durqo</p>
              <p className="text-xs text-ink-faint">durqo.com</p>
            </div>
            <div className="text-right">
              <p className="mono text-xs uppercase tracking-wide text-ink-faint">Receipt</p>
              <p className="mono text-sm text-ink-soft">#{data.orderId.slice(0, 8)}</p>
              <p className="text-xs text-ink-faint">{data.date}</p>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mono mb-1 text-[0.68rem] uppercase tracking-wide text-ink-faint">Buyer</p>
              <p className="font-medium text-ink">{data.buyerName}</p>
            </div>
            <div>
              <p className="mono mb-1 text-[0.68rem] uppercase tracking-wide text-ink-faint">Seller</p>
              <p className="font-medium text-ink">{data.sellerName}</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="mono mb-1 text-[0.68rem] uppercase tracking-wide text-ink-faint">Listing</p>
            <p className="font-medium text-ink">{data.listingTitle}</p>
          </div>

          <div className="mb-6 rounded-lg border border-rule bg-paper px-5 py-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-ink-soft">Amount</span>
              <span className="mono text-lg font-semibold text-ink">{fmtUSD(data.amount)}</span>
            </div>
            <OrderAmountBreakdown
              paymentChannel={data.paymentChannel}
              onlineChargeUsd={data.onlineChargeUsd}
              remainderUsd={data.remainderUsd}
              sslcommerzBdtAmount={data.sslcommerzBdtAmount}
              sslcommerzRate={data.sslcommerzRate}
              orderStatus={data.status}
            />
            <div className="mt-3 flex items-center justify-between border-t border-rule pt-3 text-sm">
              <span className="text-ink-soft">Payment method</span>
              <span className="font-medium text-ink">{data.paymentChannel ? PAYMENT_CHANNEL_LABEL[data.paymentChannel] ?? data.paymentChannel : "—"}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-ink-soft">Status</span>
              <StatusBadge status={data.status} />
            </div>
            {data.escrowTransactionId && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-ink-soft">Escrow.com transaction</span>
                <span className="mono text-xs text-ink-faint">{data.escrowTransactionId}</span>
              </div>
            )}
          </div>

          {data.viewerSide === "seller" && (
            <div className="rounded-lg border border-rule border-dashed px-5 py-4">
              <p className="mono mb-2 text-[0.68rem] uppercase tracking-wide text-ink-faint">
                {data.alreadyClaimedByWithdrawal ? "Success Fee applied" : "Estimated Success Fee"}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">Rate ({fmtRate(data.estimatedFeeRate)})</span>
                <span className="mono text-ink">-{fmtUSD(data.estimatedFeeAmount)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm font-semibold">
                <span className="text-ink">Net to you</span>
                <span className="mono text-brand-strong">{fmtUSD(data.estimatedNetAmount)}</span>
              </div>
              {!data.alreadyClaimedByWithdrawal && (
                <p className="mt-2 text-xs text-ink-faint">
                  Charged only if/when this order is included in a withdrawal request — see your Earnings page.
                </p>
              )}
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
