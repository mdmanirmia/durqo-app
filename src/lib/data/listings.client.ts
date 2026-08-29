"use client";

import { createClient } from "@/lib/supabase/client";
import { CATEGORY_MAP } from "@/lib/categories";
import { MOCK_LISTINGS } from "@/lib/mock-data";
import type { Listing } from "@/lib/types";
import { mapListing } from "./map-listing";

// Browser-side equivalent of listings.server.ts's getPublishedListings, for
// the Buy page's client-side filter UI. Same defensive fall-back-to-mock
// behavior — see the comment there for why.
export async function fetchPublishedListings(): Promise<Listing[]> {
  try {
    const supabase = createClient();
    if (!supabase) return MOCK_LISTINGS;

    const { data: rows, error } = await supabase
      .from("listings")
      .select("*")
      // Sold listings stay visible (with a Sold badge) instead of vanishing
      // the moment they're bought — see the matching comment in
      // listings.server.ts.
      .in("status", ["published", "sold"])
      .order("created_at", { ascending: false });
    if (error || !rows || rows.length === 0) {
      if (error) console.warn("[listings] fetchPublishedListings falling back to mock data:", error.message);
      return MOCK_LISTINGS;
    }

    const ids = rows.map((r) => r.id);
    const sellerIds = [...new Set(rows.map((r) => r.seller_id))];

    const [{ data: sellers }, { data: monthlyStats }, { data: socialStats }] = await Promise.all([
      supabase.from("profiles").select("*").in("id", sellerIds),
      supabase.from("listing_monthly_stats").select("*").in("listing_id", ids),
      supabase.from("listing_social_stats").select("*").in("listing_id", ids),
    ]);

    const sellerById = new Map((sellers ?? []).map((s) => [s.id, s]));

    return rows.map((row) =>
      mapListing(row, CATEGORY_MAP[row.category_id]?.quickStats ?? [], {
        seller: sellerById.get(row.seller_id),
        monthlyStats: (monthlyStats ?? []).filter((m) => m.listing_id === row.id),
        socialStats: (socialStats ?? []).filter((s) => s.listing_id === row.id),
      })
    );
  } catch (err) {
    console.warn("[listings] fetchPublishedListings falling back to mock data (unexpected error):", err);
    return MOCK_LISTINGS;
  }
}
