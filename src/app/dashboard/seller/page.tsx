"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SELLER_NAV } from "@/lib/dashboard-nav";
import { CATEGORY_MAP } from "@/lib/categories";
import { fmtUSD } from "@/lib/format";
import { getMyListings, type SellerListingRow } from "@/lib/data/seller-listings.client";
import { getSellerOrders } from "@/lib/data/orders.client";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  published: "Published",
  sold: "Sold",
  archived: "Archived",
};

export default function SellerOverview() {
  const [myListings, setMyListings] = useState<SellerListingRow[] | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyListings().then((data) => {
      if (!cancelled) setMyListings(data);
    });
    getSellerOrders().then((orders) => {
      if (!cancelled) setBalance(orders.filter((o) => o.status === "completed").reduce((sum, o) => sum + o.amount, 0));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const publishedCount = (myListings ?? []).filter((l) => l.status === "published").length;

  return (
    <DashboardShell title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-8">
          <div>
            <div className="mono text-2xl font-semibold text-brand-strong">{balance === null ? "…" : fmtUSD(balance)}</div>
            <div className="text-sm text-ink-faint">Available balance</div>
          </div>
          <div>
            <div className="mono text-2xl font-semibold">{myListings === null ? "…" : publishedCount}</div>
            <div className="text-sm text-ink-faint">Published listings</div>
          </div>
        </div>
        <Link href="/dashboard/seller/listings/new" className="flex items-center gap-2 rounded-lg bg-brand-strong px-4 py-2.5 text-sm font-semibold text-paper-raised hover:bg-brand">
          <Plus size={15} /> Add New Business
        </Link>
      </div>

      <h2 className="mb-4 text-xl">My Listings</h2>
      {myListings === null ? (
        <p className="text-sm text-ink-faint">Loading&hellip;</p>
      ) : myListings.length === 0 ? (
        <p className="text-sm text-ink-faint">You haven&rsquo;t listed a business yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-rule">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {myListings.map((l) => (
                <tr key={l.id} className="border-b border-rule last:border-b-0">
                  <td className="px-4 py-3 font-medium text-ink">{l.title}</td>
                  <td className="px-4 py-3 text-ink-soft">{CATEGORY_MAP[l.categoryId]?.name ?? l.categoryId}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-strong">
                      {STATUS_LABEL[l.status] ?? l.status}
                    </span>
                  </td>
                  <td className="mono px-4 py-3">{fmtUSD(l.price)}</td>
                  <td className="mono px-4 py-3">{l.views}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/listing/${l.id}`} className="text-sm font-semibold text-brand-strong">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
