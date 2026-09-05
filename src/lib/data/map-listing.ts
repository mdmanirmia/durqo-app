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
import { BUSINESS_TYPE_MAP } from "@/lib/business-types";
import { ACCOUNT_TYPE_MAP } from "@/lib/account-types";

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
  total_views: "total_views",
  total_videos: "total_videos",
  channel_age: "channel_age_years",
  // E-commerce only — a plain text column holding a comma-separated list of
  // business-type ids (e.g. "shopify,dropshipping"), same storage shape as
  // the other TEXT_QUICK_STAT_KEYS fields (location, domain_registrar).
  // buildQuickStats() below joins the ids into display names before this
  // reaches the page.
  business_type: "business_type",
  // Social Media Accounts only — same plain-text, comma-separated-ids
  // storage shape as business_type above, just for that category's Account
  // Type checklist (see src/lib/account-types.ts).
  account_type: "account_type",
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
  // Not a real column — Websites listings compute this from
  // listing_seo_data.semrush_authority_score in mapListing below instead of
  // reading a flat column. Kept here only so this map stays exhaustive over
  // QuickStatKey.
  authority_score: "authority_score",
  // Not a real column either — computed from listing_seo_data.gsc_indexed_pages
  // in mapListing below (see computeAutoQuickStats). Kept here only so this
  // map stays exhaustive over QuickStatKey.
  indexed_pages: "indexed_pages",
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
    if (value === null || value === undefined || value === "") continue;
    // "business_type" is stored as a comma-separated string of ids (see
    // QUICK_STAT_COLUMNS above) — turn it into a comma-space-joined string
    // of display names (e.g. "shopify,dropshipping" -> "Shopify,
    // Dropshipping") here, once, rather than making every consumer
    // (ListingCard, the listing detail page's StatTile) know about the raw
    // id encoding.
    if (key === "business_type" && typeof value === "string") {
      const names = value
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .map((id) => BUSINESS_TYPE_MAP[id] ?? id);
      if (names.length) stats[key] = names.join(", ");
      continue;
    }
    // "account_type" (Social Media Accounts) is stored the same way as
    // "business_type" above — a comma-separated string of ids joined into
    // display names here.
    if (key === "account_type" && typeof value === "string") {
      const names = value
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .map((id) => ACCOUNT_TYPE_MAP[id] ?? id);
      if (names.length) stats[key] = names.join(", ");
      continue;
    }
    stats[key] = value;
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

// YouTube Channels category only (Design & Development New.pdf, Sep 4
// 2026) — see CopyrightNotes/TopVideo in src/lib/types.ts.
export function mapCopyrightNotes(row: Row | null | undefined): Listing["copyrightNotes"] {
  if (!row) return undefined;
  return {
    notes: row.notes ?? "",
    updatedOn: row.updated_on ? String(row.updated_on).slice(0, 10) : "",
  };
}

export function mapTopVideos(rows: Row[]): NonNullable<Listing["topVideos"]> {
  return rows
    .slice()
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((r) => ({
      title: r.title,
      videoUrl: r.video_url ?? undefined,
      views: r.views ?? undefined,
      likes: r.likes ?? undefined,
      duration: r.duration ?? undefined,
      publishedOn: r.published_on ? String(r.published_on).slice(0, 10) : undefined,
    }));
}

// YouTube Channels category only — see ChannelOverview in src/lib/types.ts.
export function mapChannelOverview(row: Row | null | undefined): Listing["channelOverview"] {
  if (!row) return undefined;
  return {
    channelTitle: row.channel_title ?? "",
    channelHandle: row.channel_handle ?? undefined,
    channelAvatarUrl: row.channel_avatar_url ?? undefined,
    channelCreatedOn: row.channel_created_on ? String(row.channel_created_on).slice(0, 10) : undefined,
    avgViewsPerVideo: row.avg_views_per_video ?? undefined,
    recentAvgViews: row.recent_avg_views ?? undefined,
    recentAvgLikes: row.recent_avg_likes ?? undefined,
    engagementRatePercent: row.engagement_rate_percent ?? undefined,
    lastSyncedAt: row.last_synced_at ? String(row.last_synced_at).slice(0, 10) : "",
  };
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

// The "domains" category is the one exception to auto-computed Quick Stats:
// all three of its stats (domain_age, domain_expires, domain_registrar) are
// facts about the domain itself with no other data collected anywhere else
// on the form (hasSeoData/hasMonetization/hasSocialStats are all false for
// this category) — so it keeps its manual Quick Statistics inputs on the
// seller form (see src/app/dashboard/seller/listings/new/page.tsx) and its
// flat-column values here, unlike every other category.
const NO_AUTO_QUICK_STAT_CATEGORIES = new Set(["domains"]);

// Sellers no longer type in per-category "Quick Statistics" values directly
// (Sep 1, 2026 revision, extended to every category) — instead each stat is
// computed from data already collected elsewhere on the same form: the
// 12-month Proof of Income entries, the Google Analytics / SEMrush / Ahrefs
// snapshot, the Social Stats rows, and a straightforward price/income
// formula for Income Multiple. "location" and "age" mirror the top-level
// Business Location / Business Age fields (same flat columns as before —
// only *where* they're entered in the form changed, not the column). A key
// with no viable source here (e.g. Channel Age, Total Downloads, Rating —
// categories that have no real listings yet) is simply left unset, same as
// any other quick stat whose source data hasn't been provided.
function computeAutoQuickStats(
  row: Row,
  quickStatKeys: QuickStatKey[],
  quickStats: Partial<Record<string, number | string>>,
  monthlyStats: MonthlyStat[],
  seo: SeoData | undefined,
  socialStats: SocialStat[]
) {
  const has = (key: QuickStatKey) => quickStatKeys.includes(key);

  const incomeValues = monthlyStats.map((m) => m.income).filter((v): v is number => typeof v === "number");
  const avgMonthlyIncome = incomeValues.length > 0 ? Math.round(incomeValues.reduce((a, b) => a + b, 0) / incomeValues.length) : undefined;

  if (has("monthly_income")) {
    if (avgMonthlyIncome !== undefined) quickStats.monthly_income = avgMonthlyIncome;
    else delete quickStats.monthly_income;
  }

  // Design & Development.docx (Sep 1, 2026 revision): Monthly Views is an
  // *average* — the last-12-months GA total page views divided by 12.
  if (has("monthly_views")) {
    if (seo?.gaTotalPageViews !== undefined) quickStats.monthly_views = Math.round(seo.gaTotalPageViews / 12);
    else delete quickStats.monthly_views;
  }

  // "Monthly Visitors" (E-commerce, SaaS, Crypto, Agencies) is the GA
  // Total Users average, distinct from "Monthly Views" (GA Total Page
  // Views average, used by Websites).
  if (has("monthly_visitors")) {
    if (seo?.gaTotalUsers !== undefined) quickStats.monthly_visitors = Math.round(seo.gaTotalUsers / 12);
    else delete quickStats.monthly_visitors;
  }

  // Authority Score (Websites) and Domain Authority (E-commerce, SaaS,
  // Crypto, Agencies) are the same underlying signal — SEMrush's Authority
  // Score, falling back to Ahrefs Domain Rating when SEMrush wasn't
  // provided.
  const authority = seo?.semrushAuthorityScore ?? seo?.ahrefsDr;
  if (has("authority_score")) {
    if (authority !== undefined) quickStats.authority_score = authority;
    else delete quickStats.authority_score;
  }
  if (has("domain_authority")) {
    if (authority !== undefined) quickStats.domain_authority = authority;
    else delete quickStats.domain_authority;
  }

  // Indexed Pages (Websites) — Google Search Console's indexed-page count.
  if (has("indexed_pages")) {
    if (seo?.gscIndexedPages !== undefined) quickStats.indexed_pages = seo.gscIndexedPages;
    else delete quickStats.indexed_pages;
  }

  // Income Multiple = asking price ÷ annualized average monthly income —
  // a straightforward formula, not sourced from any additional seller
  // input. Rounded to one decimal (e.g. "3.2").
  if (has("income_multiple")) {
    const price = Number(row.price);
    if (avgMonthlyIncome !== undefined && avgMonthlyIncome > 0 && Number.isFinite(price)) {
      quickStats.income_multiple = Math.round((price / (avgMonthlyIncome * 12)) * 10) / 10;
    } else {
      delete quickStats.income_multiple;
    }
  }

  // Followers (Social Media Accounts) / Subscribers (Newsletters) — the
  // total across every platform/entry the seller logged in Social Stats.
  // YouTube Channels is excluded here (Design & Development New.pdf, Sep 4
  // 2026): "Total Subscribers" is now a manually-entered Quick Stat for
  // that category instead (see the manual Channel Statistics block on the
  // seller form) — this computed total would otherwise silently overwrite
  // (or delete, when Social Stats is empty) that manual value. Social Media
  // Accounts is excluded the same way as of Sep 5, 2026: this category has
  // hasSocialStats: false (a Social Media Accounts listing IS the account,
  // logging a Social Stats row for it doesn't make sense), so this
  // computed total would always be zero for it anyway — "Total Followers"
  // is now a plain manual input on the seller form instead, reading and
  // writing the same `followers` column buildQuickStats() already pulls in.
  const totalFollowers = socialStats.reduce((sum, s) => sum + (s.followers ?? 0), 0);
  if (has("followers") && row.category_id !== "social-media-accounts") {
    if (totalFollowers > 0) quickStats.followers = totalFollowers;
    else delete quickStats.followers;
  }
  if (has("subscribers") && row.category_id !== "youtube-channels") {
    if (totalFollowers > 0) quickStats.subscribers = totalFollowers;
    else delete quickStats.subscribers;
  }

  // Business Location mirrors the same top-level field the rest of the app
  // already reads (row.location) — buildQuickStats() already picked this up
  // via QUICK_STAT_COLUMNS, so there's nothing to override here; it's listed
  // in this comment only to make clear the omission is intentional, not an
  // oversight. Business Age is handled separately below (see businessAgeYears
  // in mapListing) — YouTube Channels never populates business_age_years at
  // all (sellers enter Channel Age as a manual quick stat instead, stored in
  // channel_age_years), so that field needs a category-spanning fallback,
  // not a pass-through.
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
    gaLiveStats?: Row | null;
    copyrightNotes?: Row | null;
    topVideos?: Row[];
    channelOverview?: Row | null;
  } = {}
): Listing {
  const monthlyStats = mapMonthlyStats(related.monthlyStats ?? []);
  const seo = mapSeo(related.seo);
  const socialStats = mapSocialStats(related.socialStats ?? []);
  const quickStats = buildQuickStats(row, quickStatKeys);

  if (!NO_AUTO_QUICK_STAT_CATEGORIES.has(row.category_id)) {
    computeAutoQuickStats(row, quickStatKeys, quickStats, monthlyStats, seo, socialStats);
  }

  return {
    id: row.id,
    categoryId: row.category_id,
    title: row.title,
    businessUrl: row.business_url ?? undefined,
    location: row.location ?? undefined,
    price: Number(row.price),
    discountedPrice: row.discounted_price != null ? Number(row.discounted_price) : undefined,
    // Sep 5 2026: YouTube Channels listings leave business_age_years null —
    // sellers enter the channel's age as a manual quick stat instead
    // (channel_age_years, see QUICK_STAT_COLUMNS.channel_age), which is
    // otherwise invisible to every surface that reads businessAgeYears
    // directly (ListingCard's "AGE" tile, the /buy table's "Business age"
    // column, the /buy age-range filter, the homepage spotlight's "X yrs
    // old" line) — those showed "New" for a 5-year-old channel because they
    // never look at quickStats.channel_age. Falling back to it here, at the
    // single mapping layer every one of those already reads through, fixes
    // all of them at once rather than patching each call site.
    businessAgeYears:
      row.business_age_years != null
        ? Number(row.business_age_years)
        : row.channel_age_years != null
          ? Number(row.channel_age_years)
          : undefined,
    overview: row.overview ?? "",
    monthlyExpenses: row.monthly_expenses ?? [],
    monetizationTypeIds: row.monetization_type_ids ?? [],
    saleIncludesAssets: row.sale_includes_assets ?? "",
    saleIncludesSupport: row.sale_includes_support ?? "",
    isVerified: !!row.is_verified,
    status: row.status === "sold" ? "sold" : "published",
    views: row.views ?? 0,
    createdAt: row.created_at ? String(row.created_at).slice(0, 10) : "",
    gaAccessConfirmed: !!row.ga_access_confirmed,
    loomVideoUrl: row.loom_video_url ?? undefined,
    gaVerified: !!row.ga_verified,
    niches: Array.isArray(row.niches) ? row.niches : [],

    quickStats,
    monthlyStats,
    seo,
    socialStats,
    faqs: mapFaqs(related.faqs ?? []),
    comments: mapComments(related.comments ?? [], related.authorNames ?? {}),
    seller: mapSeller(related.seller),
    images: mapImages(related.images ?? []),
    gaLiveStats: mapGaLiveStats(related.gaLiveStats),
    copyrightNotes: mapCopyrightNotes(related.copyrightNotes),
    topVideos: mapTopVideos(related.topVideos ?? []),
    channelOverview: mapChannelOverview(related.channelOverview),
  };
}

function mapGaLiveStats(row?: Row | null): Listing["gaLiveStats"] {
  if (!row) return undefined;
  return {
    dateRangeLabel: row.date_range_label ?? "Last 90 days",
    pageViews: row.page_views ?? 0,
    uniqueVisitors: row.unique_visitors ?? 0,
    sessions: row.sessions ?? 0,
    bounceRate: row.bounce_rate != null ? Number(row.bounce_rate) : 0,
    avgSessionSeconds: row.avg_session_seconds ?? 0,
    dailyPageViews: Array.isArray(row.daily_page_views) ? row.daily_page_views : [],
    trafficAcquisition: Array.isArray(row.traffic_acquisition) ? row.traffic_acquisition : [],
    lastSyncedAt: row.last_synced_at ?? "",
  };
}
