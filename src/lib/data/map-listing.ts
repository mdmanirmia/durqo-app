import type {
  Listing,
  MonthlyStat,
  SeoData,
  SocialStat,
  FaqItem,
  CommentItem,
  SellerInfo,
  ListingImage,
  ListingImageKind,
} from "@/lib/types";
import type { QuickStatKey } from "@/lib/categories";

// Maps each app-level QuickStatKey to the flat column name it lives under
// on public.listings. "location" reads the same generic `location` column
// the rest of the app already uses for the listing's address/remote tag.
export const QUICK_STAT_COLUMNS: Record<QuickStatKey, string> = {
  location: "location",
  monthly_income: "monthly_income",
  monthly_visitors: "monthly_visitors",
  domain_authority: "domain_authority",
  income_multiple: "income_multiple",
  articles_posted: "articles_posted",
  subscribers: "subscribers",
  monthly_views: "monthly_views",
  total_videos: "total_videos",
  channel_age: "channel_age_years",
  followers: "followers",
  total_posts: "total_posts",
  likes_per_post: "likes_per_post",
  views_per_post: "views_per_post",
  open_rate: "open_rate",
  click_through_rate: "click_through_rate",
  unsubscribe_rate: "unsubscribe_rate",
  age: "business_age_years",
  total_downloads: "total_downloads",
  total_reviews: "total_reviews",
  rating: "rating",
  active_clients: "active_clients",
  domain_age: "domain_age",
  domain_expires: "domain_expires",
  domain_registrar: "domain_registrar",
};

// Row shapes are intentionally loose (`Record<string, any>` via a minimal
// interface) rather than importing generated Supabase types — this project
// doesn't run `supabase gen types` yet, so we stay defensive and tolerate
// missing/null fields rather than assuming an exact shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function monthKey(dateStr: string): string {
  // DB stores month as a date (first-of-month); app wants "YYYY-MM".
  return dateStr.slice(0, 7);
}

export function buildQuickStats(row: Row, quickStatKeys: QuickStatKey[]): Partial<Record<string, number | string>> {
  const stats: Partial<Record<string, number | string>> = {};
  for (const key of quickStatKeys) {
    const column = QUICK_STAT_COLUMNS[key];
    const value = row[column];
    if (value !== null && value !== undefined) stats[key] = value;
  }
  return stats;
}

export function mapSeller(profile: Row | null | undefined): SellerInfo {
  if (!profile) {
    return { id: "unknown", name: "Durqo Seller", isVerified: false, totalSales: 0, memberSince: "" };
  }
  return {
    id: profile.id,
    name: profile.full_name ?? "Durqo Seller",
    location: profile.location ?? undefined,
    isVerified: !!profile.is_verified,
    verificationMethod: profile.verification_method ?? undefined,
    totalSales: profile.total_sales ?? 0,
    memberSince: profile.created_at ? String(profile.created_at).slice(0, 10) : "",
  };
}

export function mapMonthlyStats(rows: Row[]): MonthlyStat[] {
  return rows
    .slice()
    .sort((a, b) => String(a.month).localeCompare(String(b.month)))
    .map((r) => ({
      month: monthKey(String(r.month)),
      income: r.income ?? undefined,
      gaTotalUsers: r.ga_total_users ?? undefined,
      gaPageViews: r.ga_page_views ?? undefined,
    }));
}

export function mapSeo(row: Row | null | undefined): SeoData | undefined {
  if (!row) return undefined;
  return {
    gaTotalUsers: row.ga_total_users ?? undefined,
    gaNewUsers: row.ga_new_users ?? undefined,
    gaTotalPageViews: row.ga_total_page_views ?? undefined,
    gaAvgEngagementSeconds: row.ga_avg_engagement_seconds ?? undefined,
    gaEngagementRate: row.ga_engagement_rate ?? undefined,
    gaTopChannels: row.ga_top_channels ?? undefined,
    gaTopCountries: row.ga_top_countries ?? undefined,
    gaTopDevices: row.ga_top_devices ?? undefined,
    gscTotalClicks: row.gsc_total_clicks ?? undefined,
    gscTotalImpressions: row.gsc_total_impressions ?? undefined,
    gscIndexedPages: row.gsc_indexed_pages ?? undefined,
    gscNonIndexedPages: row.gsc_non_indexed_pages ?? undefined,
    gscAvgCtr: row.gsc_avg_ctr ?? undefined,
    semrushAuthorityScore: row.semrush_authority_score ?? undefined,
    semrushTotalTraffic: row.semrush_total_traffic ?? undefined,
    semrushTotalKeywords: row.semrush_total_keywords ?? undefined,
    semrushTop10Keywords: row.semrush_top10_keywords ?? undefined,
    semrushTotalBacklinks: row.semrush_total_backlinks ?? undefined,
    ahrefsDr: row.ahrefs_dr ?? undefined,
    ahrefsUr: row.ahrefs_ur ?? undefined,
    ahrefsReferringDomains: row.ahrefs_referring_domains ?? undefined,
    ahrefsTotalKeywords: row.ahrefs_total_keywords ?? undefined,
    ahrefsTotalBacklinks: row.ahrefs_total_backlinks ?? undefined,
  };
}

export function mapSocialStats(rows: Row[]): SocialStat[] {
  return rows.map((r) => ({ platform: r.platform, followers: r.followers ?? 0 }));
}

export function mapImages(rows: Row[]): ListingImage[] {
  return rows
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((r) => ({ url: r.url, kind: r.kind as ListingImageKind }));
}

export function mapFaqs(rows: Row[]): FaqItem[] {
  return rows
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((r) => ({ question: r.question, answer: r.answer ?? "" }));
}

// Flat `comments` rows (self-referencing via parent_id) -> one level of
// nested replies, matching how the listing page renders them.
export function mapComments(rows: Row[], authorNames: Record<string, string>): CommentItem[] {
  const byId = new Map<string, CommentItem>();
  const top: CommentItem[] = [];

  const sorted = rows.slice().sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  for (const r of sorted) {
    byId.set(r.id, {
      id: r.id,
      author: authorNames[r.author_id] ?? "Member",
      body: r.body,
      createdAt: String(r.created_at).slice(0, 10),
      replies: [],
    });
  }
  for (const r of sorted) {
    const item = byId.get(r.id)!;
    if (r.parent_id && byId.has(r.parent_id)) {
      byId.get(r.parent_id)!.replies!.push(item);
    } else {
      top.push(item);
    }
  }
  return top;
}

export function mapListing(
  row: Row,
  quickStatKeys: QuickStatKey[],
  related: {
    seller?: Row | null;
    monthlyStats?: Row[];
    seo?: Row | null;
    socialStats?: Row[];
    faqs?: Row[];
    comments?: Row[];
    authorNames?: Record<string, string>;
    images?: Row[];
  } = {}
): Listing {
  return {
    id: row.id,
    categoryId: row.category_id,
    title: row.title,
    businessUrl: row.business_url ?? undefined,
    location: row.location ?? undefined,
    price: Number(row.price),
    discountedPrice: row.discounted_price != null ? Number(row.discounted_price) : undefined,
    businessAgeYears: row.business_age_years != null ? Number(row.business_age_years) : undefined,
    overview: row.overview ?? "",
    monthlyExpenses: row.monthly_expenses ?? [],
    monetizationTypeIds: row.monetization_type_ids ?? [],
    saleIncludesAssets: row.sale_includes_assets ?? "",
    saleIncludesSupport: row.sale_includes_support ?? "",
    isVerified: !!row.is_verified,
    status: row.status === "sold" ? "sold" : "published",
    views: row.views ?? 0,
    createdAt: row.created_at ? String(row.created_at).slice(0, 10) : "",

    quickStats: buildQuickStats(row, quickStatKeys),
    monthlyStats: mapMonthlyStats(related.monthlyStats ?? []),
    seo: mapSeo(related.seo),
    socialStats: mapSocialStats(related.socialStats ?? []),
    faqs: mapFaqs(related.faqs ?? []),
    comments: mapComments(related.comments ?? [], related.authorNames ?? {}),
    seller: mapSeller(related.seller),
    images: mapImages(related.images ?? []),
  };
}
