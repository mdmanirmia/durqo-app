"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ArrowLeftRight, ClipboardList, ShieldAlert } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { SELLER_NAV } from "@/lib/dashboard-nav";
import { fmtUSD } from "@/lib/format";
import { getSellerOrders, type OrderRow } from "@/lib/data/orders.client";
import OrderAmountBreakdown from "@/components/OrderAmountBreakdown";
import OrderReviewPanel from "@/components/dashboard/OrderReviewPanel";

// Read-only reminder for the seller when a buyer's identity/funds
// verification is still outstanding (KYC policy, Sep 2026) — the seller
// can't act on it (only the buyer uploads, only an admin reviews), but
// this is why that order's balance isn't claimable yet on the Earnings
// page (create_withdrawal_request() excludes it — see
// 053_kyc_name_match_and_buyer_verification.sql).
function VerificationNote({ status }: { status: OrderRow["verificationStatus"] }) {
  if (!status || status === "verified") return null;
  const label = status === "submitted" ? "Buyer verification under review" : status === "rejected" ? "Buyer verification not accepted" : "Buyer verification pending";
  return (
    <div className="mt-2 flex items-center gap-1.5 text-xs text-gold">
      <ShieldAlert size={12} /> {label}
    </div>
  );
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSellerOrders().then((data) => {
      if (!cancelled) setOrders(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function recordReview(orderId: string, review: { rating: number; comment: string | null }) {
    setOrders((prev) => prev?.map((o) => (o.id === orderId ? { ...o, myReview: review } : o)) ?? prev);
  }

  return (
    <DashboardShell title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <h2 className="mb-4 text-xl">Orders</h2>
      {orders === null ? (
        <p className="text-sm text-ink-faint">Loading&hellip;</p>
      ) : orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No orders yet" body="Purchase requests from buyers will show up here." />
      ) : (
        <>
          {/* Desktop: unchanged table, horizontal-scroll fallback only. */}
          <div className="hidden overflow-x-auto rounded-xl border border-rule md:block">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Listing</th>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <Fragment key={o.id}>
                    <tr className="border-b border-rule last:border-b-0">
                      <td className="mono px-4 py-3 text-ink-soft">{o.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 font-medium text-ink">{o.listingTitle}</td>
                      <td className="px-4 py-3 text-ink-soft">{o.counterpartyName}</td>
                      <td className="px-4 py-3">
                        <span className="mono">{fmtUSD(o.amount)}</span>
                        <OrderAmountBreakdown
                          paymentChannel={o.paymentChannel}
                          onlineChargeUsd={o.onlineChargeUsd}
                          remainderUsd={o.remainderUsd}
                          sslcommerzBdtAmount={o.sslcommerzBdtAmount}
                          sslcommerzRate={o.sslcommerzRate}
                          orderStatus={o.status}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="mono px-4 py-3 text-ink-faint">{o.date}</td>
                      <td className="px-4 py-3 text-right">
                        <VerificationNote status={o.verificationStatus} />
                        <div className="flex flex-col items-end gap-1.5">
                          {o.hasTransferRoom && (
                            <Link href={`/dashboard/transfer/${o.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-brand-strong">
                              <ArrowLeftRight size={13} /> Transfer Room
                            </Link>
                          )}
                          <Link href={`/dashboard/receipt/${o.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-brand-strong">
                            <FileText size={13} /> Receipt
                          </Link>
                        </div>
                      </td>
                    </tr>
                    {o.status === "completed" && (
                      <tr className="border-b border-rule last:border-b-0">
                        <td colSpan={7} className="bg-paper px-4 py-3 font-sans">
                          <OrderReviewPanel order={o} myRole="seller" onSubmitted={(review) => recordReview(o.id, review)} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: same data as a stacked card list instead of a
              horizontally-scrolling table. Matches the pattern established
              for /dashboard/buyer/orders — see dashboard-mobile-redesign
              addendum for the min-w-0 overflow fix this relies on. */}
          <div className="grid gap-3 md:hidden">
            {orders.map((o) => (
              <div key={o.id} className="min-w-0 rounded-xl border border-rule bg-paper-raised p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="mono text-xs text-ink-faint">{o.id.slice(0, 8)}</span>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mb-3 min-w-0">
                  <div className="truncate font-medium text-ink">{o.listingTitle}</div>
                  <div className="text-xs text-ink-faint">{o.counterpartyName}</div>
                </div>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="mono text-sm font-semibold">{fmtUSD(o.amount)}</div>
                    <OrderAmountBreakdown
                      paymentChannel={o.paymentChannel}
                      onlineChargeUsd={o.onlineChargeUsd}
                      remainderUsd={o.remainderUsd}
                      sslcommerzBdtAmount={o.sslcommerzBdtAmount}
                      sslcommerzRate={o.sslcommerzRate}
                      orderStatus={o.status}
                    />
                  </div>
                  <span className="mono shrink-0 text-xs text-ink-faint">{o.date}</span>
                </div>
                <div className="flex items-center gap-4 border-t border-rule pt-3">
                  {o.hasTransferRoom && (
                    <Link href={`/dashboard/transfer/${o.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-brand-strong">
                      <ArrowLeftRight size={13} /> Transfer Room
                    </Link>
                  )}
                  <Link href={`/dashboard/receipt/${o.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-brand-strong">
                    <FileText size={13} /> Receipt
                  </Link>
                </div>
                <VerificationNote status={o.verificationStatus} />
                {o.status === "completed" && (
                  <div className="mt-3">
                    <OrderReviewPanel order={o} myRole="seller" onSubmitted={(review) => recordReview(o.id, review)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
