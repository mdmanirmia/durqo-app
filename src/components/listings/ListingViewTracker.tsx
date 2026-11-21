"use client";

import { useEffect } from "react";

// Nov 21, 2026: counts this listing page view once per page load (the
// server-side rules live in /api/listings/view). Renders nothing.
export default function ListingViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    fetch("/api/listings/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
      keepalive: true,
    }).catch(() => {});
  }, [listingId]);
  return null;
}
