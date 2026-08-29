"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/dashboard-nav";
import { getWishlistedListings } from "@/lib/data/wishlist.client";
import { getBuyerOrderCounts } from "@/lib/data/cart.client";
import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/lib/types";

export default function BuyerOverview() {
  const [wishlisted, setWishlisted] = useState<Listing[] | null>(null);
  const [counts, setCounts] = useState<{ open: number; completed: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getWishlistedListings().then((data) => {
      if (!cancelled) setWishlisted(data);
    });
    getBuyerOrderCounts().then((data) => {
      if (!cancelled) setCounts(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardShell title="Buyer Dashboard" nav={BUYER_NAV} switchHref="/dashboard/seller" switchLabel="Go to Seller Dashboard">
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-rule bg-paper-raised p-5">
          <div className="mono text-2xl font-semibold">{counts ? counts.open : "…"}</div>
          <div className="text-sm text-ink-faint">Open orders</div>
        </div>
        <div className="rounded-lg border border-rule bg-paper-raised p-5">
          <div className="mono text-2xl font-semibold">{wishlisted ? wishlisted.length : "…"}</div>
          <div className="text-sm text-ink-faint">Wishlisted listings</div>
        </div>
        <div className="rounded-lg border border-rule bg-paper-raised p-5">
          <div className="mono text-2xl font-semibold">{counts ? counts.completed : "…"}</div>
          <div className="text-sm text-ink-faint">Completed purchases</div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl">From your wishlist</h2>
        <Link href="/dashboard/buyer/wishlist" className="text-sm font-semibold text-brand-strong">View all &rarr;</Link>
      </div>
      {wishlisted === null ? (
        <p className="text-sm text-ink-faint">Loading&hellip;</p>
      ) : wishlisted.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {wishlisted.slice(0, 3).map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      ) : (
        <p className="text-sm text-ink-faint">Nothing saved yet — tap the heart on any listing to save it here.</p>
      )}
    </DashboardShell>
  );
}
