"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/ui/Badge";
import { SELLER_NAV } from "@/lib/dashboard-nav";
import { fmtUSD } from "@/lib/format";
import { getSellerOrders, type OrderRow } from "@/lib/data/orders.client";

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

  return (
    <DashboardShell title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <h2 className="mb-4 text-xl">Orders</h2>
      {orders === null ? (
        <p className="text-sm text-ink-faint">Loading&hellip;</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-ink-faint">No orders yet — purchase requests from buyers will show up here.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-rule">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Listing</th>
                <th className="px-4 py-3 font-medium">Buyer</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-rule last:border-b-0">
                  <td className="mono px-4 py-3 text-ink-soft">{o.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 font-medium text-ink">{o.listingTitle}</td>
                  <td className="px-4 py-3 text-ink-soft">{o.counterpartyName}</td>
                  <td className="mono px-4 py-3">{fmtUSD(o.amount)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="mono px-4 py-3 text-ink-faint">{o.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
