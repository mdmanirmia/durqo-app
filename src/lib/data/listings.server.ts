import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";
import { MOCK_LISTINGS, getListingById as getMockListingById } from "@/lib/mock-data";
import type { Listing } from "@/lib/types";
import { mapListing } from "./map-listing";
import { MarketplaceFilters, PAGE_SIZE } from "@/lib/marketplace-filters";

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

// ---------- /buy marketplace: server-driven filtering, sorting, pagination ----------
//
// Every filter that lives on a plain `listings` column (category, price,
// business age, status, keyword/category-name search) is pushed down to
// Postgres — no "fetch every listing and filter in JS" here. The one
// exception is "Income generating" and the income sort: monthly income is a
// derived average over each listing's Proof of Income entries
// (listing_monthly_stats), not a maintained column (the legacy
// `listings.monthly_income` column is never written by the seller forms —
// see map-listing.ts's computeAutoQuickStats), so it can't be compared or
// sorted with a plain SQL predicate. When that filter/sort is active, every
// *other* filter still narrows the candidate set in Postgres first; only
// that already-narrowed set (capped well below "the whole table") is pulled
// down to aggregate income in memory. See the buy-page-redesign addendum for
// the full writeup of this trade-off.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
// Supabase's PostgrestFilterBuilder type changes shape with every chained
// call, so these helpers (which build the query up incrementally and pass
// it between functions) alias it to a single named `any` rather than
// sprinkling the literal keyword through every function signature below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseQuery = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientAny = any;

const STATUS_LISTS: Record<MarketplaceFilters["status"], string[]> = {
  available: ["published"],
  sold: ["sold"],
  all: ["published", "sold"],
};

export interface MarketplaceQueryResult {
  listings: Listing[];
  total: number;
  error: boolean;
}

function sanitizeForIlike(q: string): string {
  return q.replace(/[%,()]/g, " ").trim();
}

function applySearchAndAgeFilters(query: SupabaseQuery, filters: MarketplaceFilters) {
  if (filters.q) {
    const term = sanitizeForIlike(filters.q);
    if (term) {
      const matchedCategoryIds = CATEGORIES.filter((c) => c.name.toLowerCase().includes(term.toLowerCase())).map((c) => c.id);
      const parts = [`title.ilike.%${term}%`, `overview.ilike.%${term}%`];
      if (matchedCategoryIds.length) parts.push(`category_id.in.(${matchedCategoryIds.join(",")})`);
      query = query.or(parts.join(","));
    }
  }

  if (filters.ageMin !== null || filters.ageMax !== null) {
    const rangeCond = (col: string) => {
      const parts: string[] = [];
      if (filters.ageMin !== null) parts.push(`${col}.gte.${filters.ageMin}`);
      if (filters.ageMax !== null) parts.push(`${col}.lte.${filters.ageMax}`);
      return parts.length > 1 ? `and(${parts.join(",")})` : parts[0];
    };
    // business_age_years covers most categories; channel_age_years is
    // YouTube Channels' own age field (see map-listing.ts's businessAgeYears
    // fallback chain). Domains' free-text domain_age isn't numerically
    // filterable at the database level and is intentionally left out of this
    // range filter — a pre-existing data-modeling gap, not something to work
    // around with a full-table client-side fetch.
    query = query.or(`${rangeCond("business_age_years")},${rangeCond("channel_age_years")}`);
  }

  return query;
}

function applyCommonFilters(query: SupabaseQuery, filters: MarketplaceFilters) {
  query = query.in("status", STATUS_LISTS[filters.status]);
  if (filters.categoryIds.length) query = query.in("category_id", filters.categoryIds);
  if (filters.priceMin !== null) query = query.gte("price", filters.priceMin);
  if (filters.priceMax !== null) query = query.lte("price", filters.priceMax);
  return applySearchAndAgeFilters(query, filters);
}

function applySort(query: SupabaseQuery, sort: MarketplaceFilters["sort"]) {
  if (sort === "price-asc") return query.order("price", { ascending: true });
  if (sort === "price-desc") return query.order("price", { ascending: false });
  return query.order("created_at", { ascending: false }); // "newest" default; income-desc is handled separately
}

async function hydrateRows(supabase: SupabaseClientAny, rows: Row[]): Promise<Listing[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const sellerIds = [...new Set(rows.map((r) => r.seller_id))];
  const [sellersRes, monthlyRes] = await Promise.all([
    supabase.from("profiles").select("*").in("id", sellerIds),
    supabase.from("listing_monthly_stats").select("*").in("listing_id", ids),
  ]);
  const sellers: Row[] = sellersRes?.data ?? [];
  const monthlyStats: Row[] = monthlyRes?.data ?? [];
  const sellerById = new Map<string, Row>(sellers.map((s): [string, Row] => [s.id, s]));
  return rows.map((row) =>
    mapListing(row, CATEGORY_MAP[row.category_id]?.quickStats ?? [], {
      seller: sellerById.get(row.seller_id),
      monthlyStats: monthlyStats.filter((m) => m.listing_id === row.id),
    })
  );
}

function filterMockMarketplaceListings(filters: MarketplaceFilters): MarketplaceQueryResult {
  const statuses = STATUS_LISTS[filters.status];
  let list = MOCK_LISTINGS.filter((l) => statuses.includes(l.status));

  if (filters.q) {
    const term = filters.q.toLowerCase();
    const matchedCategoryIds = CATEGORIES.filter((c) => c.name.toLowerCase().includes(term)).map((c) => c.id);
    list = list.filter(
      (l) => l.title.toLowerCase().includes(term) || l.overview.toLowerCase().includes(term) || matchedCategoryIds.includes(l.categoryId)
    );
  }
  if (filters.categoryIds.length) list = list.filter((l) => filters.categoryIds.includes(l.categoryId));
  if (filters.priceMin !== null) list = list.filter((l) => l.price >= filters.priceMin!);
  if (filters.priceMax !== null) list = list.filter((l) => l.price <= filters.priceMax!);
  if (filters.ageMin !== null) list = list.filter((l) => l.businessAgeYears !== undefined && l.businessAgeYears >= filters.ageMin!);
  if (filters.ageMax !== null) list = list.filter((l) => l.businessAgeYears !== undefined && l.businessAgeYears <= filters.ageMax!);
  if (filters.income === "yes") list = list.filter((l) => ((l.quickStats.monthly_income as number) || 0) > 0);
  if (filters.income === "no") list = list.filter((l) => !(((l.quickStats.monthly_income as number) || 0) > 0));

  if (filters.sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  else if (filters.sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
  else if (filters.sort === "income-desc")
    list = [...list].sort((a, b) => ((b.quickStats.monthly_income as number) || 0) - ((a.quickStats.monthly_income as number) || 0));
  else list = [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const total = list.length;
  const from = (filters.page - 1) * PAGE_SIZE;
  return { listings: list.slice(from, from + PAGE_SIZE), total, error: false };
}

export async function getMarketplaceListings(filters: MarketplaceFilters): Promise<MarketplaceQueryResult> {
  try {
    const supabase = await createClient();
    if (!supabase) return filterMockMarketplaceListings(filters);

    const needsIncomeAggregate = filters.income !== "any" || filters.sort === "income-desc";

    if (!needsIncomeAggregate) {
      const from = (filters.page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let query = supabase.from("listings").select("*", { count: "exact" });
      query = applyCommonFilters(query, filters);
      query = applySort(query, filters.sort);
      query = query.range(from, to);

      const { data: rows, error, count } = await query;
      if (error) {
        console.warn("[listings] getMarketplaceListings query failed:", error.message);
        return { listings: [], total: 0, error: true };
      }
      const listings = await hydrateRows(supabase, rows ?? []);
      return { listings, total: count ?? listings.length, error: false };
    }

    // Income filter/sort path — narrow everything else in Postgres first.
    const CANDIDATE_CAP = 1000;
    let candidateQuery = supabase.from("listings").select("id, price, created_at").limit(CANDIDATE_CAP);
    candidateQuery = applyCommonFilters(candidateQuery, filters);

    const { data: candidates, error: candidateError } = await candidateQuery;
    if (candidateError) {
      console.warn("[listings] getMarketplaceListings candidate query failed:", candidateError.message);
      return { listings: [], total: 0, error: true };
    }
    if (!candidates || candidates.length === 0) return { listings: [], total: 0, error: false };

    const candidateIds = candidates.map((c: Row) => c.id);
    const { data: incomeRows, error: incomeError } = await supabase
      .from("listing_monthly_stats")
      .select("listing_id, income")
      .in("listing_id", candidateIds);
    if (incomeError) {
      console.warn("[listings] getMarketplaceListings income aggregate failed:", incomeError.message);
      return { listings: [], total: 0, error: true };
    }

    const incomeByListing = new Map<string, number[]>();
    for (const row of incomeRows ?? []) {
      if (typeof row.income !== "number") continue;
      const arr = incomeByListing.get(row.listing_id) ?? [];
      arr.push(row.income);
      incomeByListing.set(row.listing_id, arr);
    }
    const avgIncomeById = new Map<string, number | undefined>();
    for (const id of candidateIds) {
      const values = incomeByListing.get(id);
      avgIncomeById.set(id, values && values.length ? values.reduce((a, b) => a + b, 0) / values.length : undefined);
    }

    let filteredCandidates = candidates;
    if (filters.income === "yes") {
      filteredCandidates = candidates.filter((c: Row) => (avgIncomeById.get(c.id) ?? 0) > 0);
    } else if (filters.income === "no") {
      filteredCandidates = candidates.filter((c: Row) => !((avgIncomeById.get(c.id) ?? 0) > 0));
    }

    const sorted = [...filteredCandidates].sort((a: Row, b: Row) => {
      if (filters.sort === "income-desc") return (avgIncomeById.get(b.id) ?? -1) - (avgIncomeById.get(a.id) ?? -1);
      if (filters.sort === "price-asc") return Number(a.price) - Number(b.price);
      if (filters.sort === "price-desc") return Number(b.price) - Number(a.price);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const total = sorted.length;
    const from = (filters.page - 1) * PAGE_SIZE;
    const pageIds = sorted.slice(from, from + PAGE_SIZE).map((c: Row) => c.id);
    if (pageIds.length === 0) return { listings: [], total, error: false };

    const { data: pageRows, error: pageError } = await supabase.from("listings").select("*").in("id", pageIds);
    if (pageError || !pageRows) {
      console.warn("[listings] getMarketplaceListings page fetch failed:", pageError?.message);
      return { listings: [], total: 0, error: true };
    }
    const rowById = new Map(pageRows.map((r: Row) => [r.id, r]));
    const orderedRows = pageIds.map((id) => rowById.get(id)).filter(Boolean) as Row[];
    const listings = await hydrateRows(supabase, orderedRows);
    return { listings, total, error: false };
  } catch (err) {
    console.warn("[listings] getMarketplaceListings unexpected error:", err);
    return { listings: [], total: 0, error: true };
  }
}

// Platform-wide count of profiles that have completed identity verification
// (profiles.is_verified) — used by the homepage stats bar's "Verified
// sellers" tile (Sep 7 2026). Deliberately NOT scoped to whether that seller
// currently has any active listings: a seller who has been through
// verification should show up in this count immediately, even before their
// first listing goes live, rather than only appearing once they also happen
// to have live inventory (see src/app/page.tsx's own comment at the call
// site for the full story of why this changed from the earlier
// listings-scoped count).
export async function getVerifiedSellerCount(): Promise<number> {
  try {
    const supabase = await createClient();
    if (!supabase) return 0;
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_verified", true);
    if (error) {
      console.warn("[listings] getVerifiedSellerCount failed:", error.message);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.warn("[listings] getVerifiedSellerCount unexpected error:", err);
    return 0;
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
