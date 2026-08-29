"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/dashboard-nav";
import { fmtUSD } from "@/lib/format";
import { getBuyerOrders, type OrderRow } from "@/lib/data/orders.client";

const STATUS_LABEL: Record<string, string> = {
  requested: "Offer sent",
  awaiting_payment: "Awaiting payment",
  in_escrow: "In escrow",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<string, string> = {
  requested: "bg-gold-soft text-gold",
  awaiting_payment: "bg-gold-soft text-gold",
  in_escrow: "bg-brand-soft text-brand-strong",
  completed: "bg-brand-soft text-brand-strong",
  cancelled: "bg-danger-soft text-danger",
};

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
      <h2 className="mb-4 text-xl">Orders</h2>
      {orders === null ? (
        <p className="text-sm text-ink-faint">Loading&hellip;</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-ink-faint">No orders yet — items you request to purchase from your cart will show up here.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-rule">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Listing</th>
                <th className="px-4 py-3 font-medium">Seller</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="mono border-b border-rule last:border-b-0">
                  <td className="px-4 py-3 text-ink-soft">{o.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 font-sans font-medium text-ink">{o.listingTitle}</td>
                  <td className="px-4 py-3 font-sans text-ink-soft">{o.counterpartyName}</td>
                  <td className="px-4 py-3">{fmtUSD(o.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-sans font-semibold ${STATUS_STYLE[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-faint">{o.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
