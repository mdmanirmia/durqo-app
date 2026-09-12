"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ArrowLeftRight } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/ui/Badge";
import { BUYER_NAV } from "@/lib/dashboard-nav";
import { fmtUSD } from "@/lib/format";
import { getBuyerOrders, type OrderRow } from "@/lib/data/orders.client";
import OrderAmountBreakdown from "@/components/OrderAmountBreakdown";

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBuyerOrders().then((data) => {
      if (!cancelled) setOrders(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardShell title="Buyer Dashboard" nav={BUYER_NAV} switchHref="/dashboard/seller" switchLabel="Go to Seller Dashboard">
      <h2 className="mb-4 text-xl text-ink">Orders</h2>
      {orders === null ? (
        <p className="text-sm text-ink-faint">Loading&hellip;</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-ink-faint">No orders yet — items you request to purchase from your cart will show up here.</p>
      ) : (
        <>
          {/* Desktop: unchanged table, horizontal-scroll fallback only. */}
          <div className="hidden overflow-x-auto rounded-xl border border-rule md:block">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Listing</th>
                  <th className="px-4 py-3 font-medium">Seller</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="mono border-b border-rule last:border-b-0">
                    <td className="px-4 py-3 text-ink-soft">{o.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-sans font-medium text-ink">{o.listingTitle}</td>
                    <td className="px-4 py-3 font-sans text-ink-soft">{o.counterpartyName}</td>
                    <td className="px-4 py-3">
                      {fmtUSD(o.amount)}
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
                    <td className="px-4 py-3 text-ink-faint">{o.date}</td>
                    <td className="px-4 py-3 text-right font-sans">
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: same data as a stacked card list instead of a
              horizontally-scrolling table. */}
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
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
