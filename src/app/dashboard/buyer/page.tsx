"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet, Clock, Heart, CheckCircle2 } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/dashboard-nav";
import { getWishlistedListings } from "@/lib/data/wishlist.client";
import { getBuyerOrderCounts } from "@/lib/data/cart.client";
import { fmtUSD } from "@/lib/format";
import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/lib/types";

export default function BuyerOverview() {
  const [wishlisted, setWishlisted] = useState<Listing[] | null>(null);
  const [counts, setCounts] = useState<{ open: number; completed: number; totalSpent: number } | null>(null);

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
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="flex items-start gap-3 rounded-xl border border-rule bg-paper-raised p-5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-strong text-white">
            <Wallet size={17} />
          </div>
          <div className="min-w-0">
            <div className="mono text-2xl font-semibold text-brand-strong">{counts ? fmtUSD(counts.totalSpent) : "…"}</div>
            <div className="text-sm text-ink-faint">Total spent</div>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-rule bg-paper-raised p-5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold-soft text-[#92730F]">
            <Clock size={17} />
          </div>
          <div className="min-w-0">
            <div className="mono text-2xl font-semibold">{counts ? counts.open : "…"}</div>
            <div className="text-sm text-ink-faint">Open orders</div>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-rule bg-paper-raised p-5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-hover">
            <Heart size={17} />
          </div>
          <div className="min-w-0">
            <div className="mono text-2xl font-semibold">{wishlisted ? wishlisted.length : "…"}</div>
            <div className="text-sm text-ink-faint">Wishlisted listings</div>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-rule bg-paper-raised p-5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-sunk text-ink-soft">
            <CheckCircle2 size={17} />
          </div>
          <div className="min-w-0">
            <div className="mono text-2xl font-semibold">{counts ? counts.completed : "…"}</div>
            <div className="text-sm text-ink-faint">Completed purchases</div>
          </div>
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
