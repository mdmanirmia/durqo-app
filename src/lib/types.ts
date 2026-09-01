export interface MonthlyStat {
  month: string;        // "2026-01"
  income?: number;
  gaTotalUsers?: number;
  gaPageViews?: number;
}

export interface NamedValue {
  name: string;
  users: number;
}

export interface SeoData {
  gaTotalUsers?: number;
  gaNewUsers?: number;
  gaTotalPageViews?: number;
  gaAvgEngagementSeconds?: number;
  gaEngagementRate?: number;
  gaTopChannels?: NamedValue[];
  gaTopCountries?: NamedValue[];
  gaTopDevices?: NamedValue[];
  gscTotalClicks?: number;
  gscTotalImpressions?: number;
  gscIndexedPages?: number;
  gscNonIndexedPages?: number;
  gscAvgCtr?: number;
  semrushAuthorityScore?: number;
  semrushTotalTraffic?: number;
  semrushTotalKeywords?: number;
  semrushTop10Keywords?: number;
  semrushTotalBacklinks?: number;
  ahrefsDr?: number;
  ahrefsUr?: number;
  ahrefsReferringDomains?: number;
  ahrefsTotalKeywords?: number;
  ahrefsTotalBacklinks?: number;
}

export interface Expense {
  label: string;
  amount: number;
}

export interface SocialStat {
  platform: string;
  followers: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface CommentItem {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  replies?: CommentItem[];
}

export type ListingImageKind =
  | "cover"
  | "gallery"
  | "proof_of_income"
  | "google_analytics"
  | "search_console"
  | "semrush"
  | "ahrefs";

export interface ListingImage {
  url: string;
  kind: ListingImageKind;
}

export interface SellerInfo {
  id: string;
  name: string;
  location?: string;
  isVerified: boolean;
  verificationMethod?: "passport" | "national_id" | "driving_license";
  totalSales: number;
  memberSince: string;
}

export interface Listing {
  id: string;
  categoryId: string;
  title: string;
  businessUrl?: string;
  location?: string;
  price: number;
  discountedPrice?: number;
  businessAgeYears?: number;
  overview: string;
  monthlyExpenses: Expense[];
  monetizationTypeIds: string[];
  saleIncludesAssets: string;
  saleIncludesSupport: string;
  isVerified: boolean;
  status: "published" | "sold";
  views: number;
  createdAt: string;
  // Google Analytics verification (Motion Invest / Flippa style — manual GA
  // "Viewer" access review, not an OAuth/API integration). The seller still
  // types in every GA/GSC/SEMrush/Ahrefs number below as before; these three
  // fields are a trust layer on top of that data, not a replacement for it.
  gaAccessConfirmed: boolean;
  loomVideoUrl?: string;
  gaVerified: boolean;
  // Seller-picked niche tags (src/lib/niches.ts) — shown as an extra tile in
  // the published listing's Quick Statistics grid when non-empty.
  niches: string[];

  quickStats: Partial<Record<string, number | string>>;
  monthlyStats: MonthlyStat[];
  seo?: SeoData;
  socialStats: SocialStat[];
  faqs: FaqItem[];
  comments: CommentItem[];
  seller: SellerInfo;
  // Seller-uploaded verification screenshots (proof of income, GA/GSC/SEMrush/
  // Ahrefs), grouped by `kind` for the "View Images" lightboxes. Optional so
  // the bundled mock listings (which predate real Storage uploads) don't all
  // need updating — absent/empty just means the lightbox shows a placeholder.
  images?: ListingImage[];
  // Real, live Google Analytics 4 connection (OAuth-based — see
  // src/lib/google-analytics.ts), the Flippa-style feature on top of the
  // Motion-Invest-style manual fields above. Present only once a seller has
  // connected and a sync has completed at least once; the listing page
  // falls back to the manual GA section above when this is absent.
  gaLiveStats?: GaLiveStats;
}

export interface GaLiveStats {
  dateRangeLabel: string;
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
  bounceRate: number; // percent, 0-100
  avgSessionSeconds: number;
  dailyPageViews: { date: string; value: number }[];
  trafficAcquisition: { channel: string; sessions: number }[];
  lastSyncedAt: string;
}
