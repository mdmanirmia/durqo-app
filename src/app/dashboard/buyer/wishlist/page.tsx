"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/dashboard-nav";
import { getWishlistedListings } from "@/lib/data/wishlist.client";
import ListingCard from "@/components/ListingCard";
import EmptyState from "@/components/ui/EmptyState";
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
    <DashboardShell title="Buyer Dashboard" icon="heart" nav={BUYER_NAV} switchHref="/dashboard/seller" switchLabel="Go to Seller Dashboard">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-hover">
          <Heart size={15} />
        </div>
        <h2 className="text-xl text-ink">Wishlist</h2>
      </div>
      {wishlisted === null ? (
        <p className="text-sm text-ink-faint">Loading&hellip;</p>
      ) : wishlisted.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {wishlisted.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      ) : (
        <EmptyState icon={Heart} title="Nothing saved yet" body="Tap the heart on any listing to save it here." />
      )}
    </DashboardShell>
  );
}
