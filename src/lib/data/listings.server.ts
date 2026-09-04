import { createClient } from "@/lib/supabase/server";
import { CATEGORY_MAP } from "@/lib/categories";
import { MOCK_LISTINGS, getListingById as getMockListingById } from "@/lib/mock-data";
import type { Listing } from "@/lib/types";
import { mapListing } from "./map-listing";

// Every function here is defensive on purpose: if Supabase isn't
// configured, or the real query fails for any reason (including this
// sandbox's own network restrictions during development), we fall back to
// the bundled mock data rather than crash a Server Component. A console
// warning marks whenever that fallback happens so it's easy to spot once
// this runs somewhere with real network access.

export async function getPublishedListings(limit?: number): Promise<Listing[]> {
  try {
    const supabase = await createClient();
    if (!supabase) return limit ? MOCK_LISTINGS.slice(0, limit) : MOCK_LISTINGS;

    let query = supabase
      .from("listings")
      .select("*")
      // Sold listings stay visible (with a Sold badge, handled by the UI)
      // rather than disappearing from the catalog the instant they're
      // bought — only draft/pending_review/archived rows are excluded.
      .in("status", ["published", "sold"])
      .order("created_at", { ascending: false });
    if (limit) query = query.limit(limit);

    const { data: rows, error } = await query;
    if (error || !rows || rows.length === 0) {
      if (error) console.warn("[listings] getPublishedListings falling back to mock data:", error.message);
      return limit ? MOCK_LISTINGS.slice(0, limit) : MOCK_LISTINGS;
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
    console.warn("[listings] getPublishedListings falling back to mock data (unexpected error):", err);
    return limit ? MOCK_LISTINGS.slice(0, limit) : MOCK_LISTINGS;
  }
}

export async function getListingById(id: string): Promise<Listing | undefined> {
  try {
    const supabase = await createClient();
    if (!supabase) return getMockListingById(id);

    const { data: row, error } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
    if (error || !row) {
      if (error) console.warn("[listings] getListingById falling back to mock data:", error.message);
      return getMockListingById(id);
    }

    const [
      { data: seller },
      { data: monthlyStats },
      { data: seo },
      { data: socialStats },
      { data: faqs },
      { data: comments },
      { data: images },
      { data: gaLiveStats },
      { data: copyrightNotes },
      { data: topVideos },
      { data: channelOverview },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", row.seller_id).maybeSingle(),
      supabase.from("listing_monthly_stats").select("*").eq("listing_id", id),
      supabase.from("listing_seo_data").select("*").eq("listing_id", id).maybeSingle(),
      supabase.from("listing_social_stats").select("*").eq("listing_id", id),
      supabase.from("listing_faqs").select("*").eq("listing_id", id),
      supabase.from("comments").select("*").eq("listing_id", id),
      supabase.from("listing_images").select("*").eq("listing_id", id),
      // Real, live Google Analytics connection (src/lib/google-analytics.ts)
      // — a separate table gated by its own RLS (public for published
      // listings), so a missing/errored query here just means "not
      // connected," never a reason to fail the whole page.
      supabase.from("listing_ga_public_stats").select("*").eq("listing_id", id).maybeSingle(),
      // YouTube Channels category only (Design & Development New.pdf, Sep
      // 4 2026) — missing rows just mean neither section renders.
      supabase.from("listing_copyright_notes").select("*").eq("listing_id", id).maybeSingle(),
      supabase.from("listing_top_videos").select("*").eq("listing_id", id),
      supabase.from("listing_youtube_channel_overview").select("*").eq("listing_id", id).maybeSingle(),
    ]);

    let authorNames: Record<string, string> = {};
    const authorIds = [...new Set((comments ?? []).map((c) => c.author_id))];
    if (authorIds.length) {
      const { data: authors } = await supabase.from("profiles").select("id, full_name").in("id", authorIds);
      authorNames = Object.fromEntries((authors ?? []).map((a) => [a.id, a.full_name ?? "Member"]));
    }

    return mapListing(row, CATEGORY_MAP[row.category_id]?.quickStats ?? [], {
      seller,
      monthlyStats: monthlyStats ?? [],
      seo,
      socialStats: socialStats ?? [],
      faqs: faqs ?? [],
      comments: comments ?? [],
      authorNames,
      images: images ?? [],
      gaLiveStats,
      copyrightNotes,
      topVideos: topVideos ?? [],
      channelOverview,
    });
  } catch (err) {
    console.warn("[listings] getListingById falling back to mock data (unexpected error):", err);
    return getMockListingById(id);
  }
}
