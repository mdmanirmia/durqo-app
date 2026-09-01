"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/dashboard-nav";
import { getWishlistedListings } from "@/lib/data/wishlist.client";
import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/lib/types";

export default function WishlistPage() {
  const [wishlisted, setWishlisted] = useState<Listing[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getWishlistedListings().then((data) => {
      if (!cancelled) setWishlisted(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardShell title="Buyer Dashboard" nav={BUYER_NAV} switchHref="/dashboard/seller" switchLabel="Go to Seller Dashboard">
      <h2 className="mb-4 text-xl text-ink">Wishlist</h2>
      {wishlisted === null ? (
        <p className="text-sm text-ink-faint">Loading&hellip;</p>
      ) : wishlisted.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {wishlisted.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      ) : (
        <p className="text-sm text-ink-faint">Nothing saved yet — tap the heart on any listing to save it here.</p>
      )}
    </DashboardShell>
  );
}
