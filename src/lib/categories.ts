// Category reference data + per-category "Quick Statistics" and section
// visibility, transcribed from the original spec docs (Business Page
// Layout.docx + Design & Development.docx) supplied for this project.

export type QuickStatKey =
  | "location"
  | "monthly_income"
  | "monthly_visitors"
  | "domain_authority"
  | "income_multiple"
  | "articles_posted"
  | "authority_score"
  | "subscribers"
  | "monthly_views"
  | "total_views"
  | "total_videos"
  | "channel_age"
  | "business_type"
  | "account_type"
  | "active_subscribers"
  | "followers"
  | "total_posts"
  | "likes_per_post"
  | "views_per_post"
  | "open_rate"
  | "click_through_rate"
  | "unsubscribe_rate"
  | "age"
  | "total_downloads"
  | "total_reviews"
  | "rating"
  | "active_clients"
  | "domain_age"
  | "domain_expires"
  | "domain_registrar"
  | "indexed_pages"
  | "store_price"
  | "platform";

export interface CategoryConfig {
  id: string;
  name: string;
  description: string;
  quickStats: QuickStatKey[];
  hasSeoData: boolean;       // Google Analytics / Search Console / SEMrush / Ahrefs
  hasMonetization: boolean;
  hasSocialStats: boolean;
  note?: string;             // special instructions from the spec (e.g. YouTube channel analytics)
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: "websites",
    name: "Websites",
    description: "Content sites, blogs and affiliate properties.",
    // Monthly Income, Monthly Views, Authority Score and Indexed Pages are
    // computed automatically for this category (see mapListing in
    // map-listing.ts) — averaged from the 12-month Proof of Income entries,
    // and pulled from the seller's Google Analytics / SEMrush / Search
    // Console data — rather than typed in manually. Income Multiple is
    // intentionally not shown for Websites. (Business Page Layout.docx,
    // Sep 1, 2026 revision.)
    quickStats: ["monthly_income", "monthly_views", "age", "authority_score", "articles_posted", "indexed_pages"],
    hasSeoData: true,
    hasMonetization: true,
    hasSocialStats: true,
  },
  {
    id: "e-commerce",
    name: "E-commerce",
    description: "Online stores selling physical or digital products.",
    // Same auto-computed model as Websites (Sep 1, 2026 revision): Monthly
    // Income, Monthly Views and Authority Score are computed automatically
    // rather than typed in manually. Income Multiple is intentionally not
    // shown for E-commerce. "Business Type" (Sep 5, 2026 addition) is a
    // manually-entered, multi-select Quick Stat unique to this category —
    // Shopify/WooCommerce/Dropshipping/Digital Products/Others, see
    // src/lib/business-types.ts — joined into a single display string by
    // buildQuickStats() in map-listing.ts, same treatment as the plain-text
    // "location" field.
    quickStats: ["location", "business_type", "monthly_income", "monthly_views", "age", "authority_score", "articles_posted"],
    hasSeoData: true,
    hasMonetization: true,
    hasSocialStats: true,
  },
  {
    id: "youtube-channels",
    name: "YouTube Channels",
    description: "Monetized channels with an existing subscriber base.",
    // Design & Development New.pdf (Sep 4, 2026 revision): Total
    // Subscribers/Total Views/Total Videos/Channel Age are entered
    // manually on the form (this category has no Google Analytics data to
    // compute them from — see hasSeoData: false), not auto-computed like
    // most other categories' Quick Stats. "Total Views" is a distinct
    // field from "monthly_views" (an average, GA-sourced, and not
    // applicable here) — see QUICK_STAT_COLUMNS in map-listing.ts. (The
    // "Channel Analytics is shared privately..." note that used to render
    // under Overview of the Channel was removed Sep 5, 2026 per the user's
    // request — see the build-plan doc.)
    quickStats: ["location", "monthly_income", "subscribers", "total_views", "total_videos", "channel_age"],
    hasSeoData: false,
    hasMonetization: true,
    hasSocialStats: true,
  },
  {
    id: "social-media-accounts",
    name: "Social Media Accounts",
    description: "Instagram, TikTok and X accounts with real followings.",
    // Design & Development New.pdf (Sep 5, 2026 revision): this category's
    // fields were reworked to talk about "the account" rather than "the
    // business" (see the label overrides in src/app/listing/[id]/page.tsx
    // and the form field labels), and its Quick Statistics were replaced
    // wholesale with Account Type/Account Location/Avg. Monthly
    // Income/Total Followers/Account Age (plus the always-shown
    // Niche/Asking Price) — Total Posts/Likes per Post/Views per
    // Post/Income Multiple are no longer part of this category's spec.
    // "Account Type" (Facebook/Instagram/TikTok/Twitter-X/Others, see
    // src/lib/account-types.ts) is a manually-entered, multi-select Quick
    // Stat, same mechanism as E-commerce's "Business Type". "Total
    // Followers" is now a plain manual input (see the seller form) rather
    // than computed from the generic Social Stats rows — see the
    // social-media-accounts carve-out in computeAutoQuickStats() in
    // map-listing.ts, mirroring the same treatment YouTube Channels'
    // "Total Subscribers" already got.
    quickStats: ["account_type", "location", "monthly_income", "followers", "age"],
    hasSeoData: false,
    hasMonetization: true,
    hasSocialStats: false,
  },
  {
    id: "newsletters",
    name: "Newsletters",
    description: "Email lists with open rates and sponsor history.",
    quickStats: ["monthly_income", "subscribers", "open_rate", "click_through_rate", "unsubscribe_rate"],
    hasSeoData: true,
    hasMonetization: true,
    hasSocialStats: true,
  },
  {
    id: "saas",
    name: "SaaS",
    description: "Subscription software with recurring revenue.",
    // Design & Development New 1.pdf (Sep 5, 2026 revision): this category's
    // Quick Statistics were replaced wholesale with Business Location/Avg.
    // Monthly Income/Active Subscribers/Business Age (plus the always-shown
    // Industry/Asking Price — "Industry" is this category's own name for the
    // generic Niche selector, see the categoryId === "saas" branches on both
    // listing forms and the public listing page, and src/lib/industries.ts
    // for its curated option list) — Monthly Visitors/Domain Authority/
    // Income Multiple/Articles Posted are no longer part of this category's
    // spec. "Active Subscribers" replaces "Articles Posted" as a plain
    // manual input (same mechanism, just a new QuickStatKey so Websites/
    // E-commerce's own "Articles Posted" field is untouched) — see the
    // category.quickStats.includes("active_subscribers") block on both
    // forms. hasSeoData stays true: the Google Analytics/Search Console/
    // SEMrush/Ahrefs sections this category collects aren't part of the
    // spec change, only which of their derived stats surface as a Quick
    // Stat.
    quickStats: ["location", "monthly_income", "active_subscribers", "age"],
    hasSeoData: true,
    hasMonetization: true,
    hasSocialStats: true,
  },
  {
    id: "ai-apps-tools",
    name: "AI Apps & Tools",
    description: "AI-powered apps and tools built on top of major AI models.",
    // Design & Development New.pdf (Sep 5, 2026 revision — a brand new
    // category, not a rework): Quick Statistics are Business Location/
    // Business Type/Avg. Monthly Income/Active Subscribers/Business Age
    // (plus the always-shown Asking Price, see below). "Business Type" here
    // is a manually-entered, multi-select Quick Stat listing which major AI
    // model(s) the app is built on (Anthropic (Claude)/Gemini (Google)/
    // OpenAI (ChatGPT)/Meta (Llama)/Character.AI/Others — see
    // src/lib/ai-business-types.ts) — same `business_type` column and
    // mechanism as E-commerce's own Business Type checklist, just a
    // different curated option list for this category (see the
    // categoryId === "ai-apps-tools" branches on both listing forms, and
    // the AI_BUSINESS_TYPE_MAP branch in buildQuickStats() in
    // map-listing.ts). "Active Subscribers" reuses the same key/column SaaS
    // already introduced (migration 018) as a plain manual input.
    // NOTE (Sep 5, 2026 same-day follow-up): this category originally also
    // had an "Industry" field (sharing SaaS's curated option list, see the
    // AI Apps & Tools category addendum project doc), but the user asked to
    // drop Industry entirely for this category — not just hide it from
    // Quick Statistics, but remove the selector from the form too. So
    // ai-apps-tools is deliberately NOT in INDUSTRY_ID_SPACE_CATEGORIES
    // below, and both listing forms skip the whole Niche/Industry <Section>
    // for this category (categoryId !== "ai-apps-tools" guard) rather than
    // falling back to the generic Niche list.
    quickStats: ["location", "business_type", "monthly_income", "active_subscribers", "age"],
    hasSeoData: true,
    hasMonetization: true,
    hasSocialStats: true,
  },
  {
    id: "amazon-stores-kdp",
    name: "Amazon Stores & KDP",
    description: "Amazon storefronts and Kindle Direct Publishing catalogs.",
    quickStats: ["location", "monthly_income", "income_multiple"],
    hasSeoData: false,
    hasMonetization: true,
    hasSocialStats: true,
  },
  {
    id: "plugins-themes-extensions",
    name: "Plugins, Themes & Extensions",
    description: "WordPress plugins, themes and browser extensions.",
    quickStats: ["monthly_income", "age", "total_downloads", "total_reviews", "rating", "income_multiple"],
    hasSeoData: true,
    hasMonetization: true,
    hasSocialStats: true,
  },
  {
    id: "apps-tools",
    name: "Android & iOS Apps",
    description: "Mobile apps for iOS and Android with real installs and reviews.",
    // Design & Development New.pdf ("Update the Apps & Tools category to
    // Android & iOS Apps", Sep 5, 2026) — renamed from the original generic
    // "Apps & Tools" seed category (id kept as "apps-tools" since there were
    // zero live listings under it to migrate) and given its own field set:
    // App Name/URL/Location/Age (the universal title/business_url/location/
    // business_age_years fields, just relabeled — see the categoryId ===
    // "apps-tools" branches on both listing forms), Rating/Reviews/
    // Downloads-Installs/Store Price as a dedicated "App Statistics" section
    // (replacing the generic "Quick Statistics" heading for this category
    // only — see the Section title ternary on both forms and the public
    // listing page), and a single-select Platform field (iOS/Android/iOS &
    // Android, src/lib/app-platforms.ts — a new `platform` column, migration
    // 020, stored as one plain string via TEXT_QUICK_STAT_KEYS rather than
    // the comma-separated multi-select shape Business Type/Account Type
    // use). Niche keeps its plain "Niche" label but swaps in its own
    // curated option list (src/lib/app-niches.ts) instead of the generic
    // NICHES list — see the categoryId === "apps-tools" branch on both
    // forms' Niche section and the public listing page's Niche StatTile.
    // Monetization Methods is trimmed to Services & Subscriptions/Ads/
    // Others (src/lib/monetization-types.ts, ANDROID_IOS_APPS_MONETIZATION_
    // IDS). The spec explicitly says to delete Google Analytics/Search
    // Console/SEMrush/Ahrefs Data for this category — hasSeoData: false
    // below already hides (and stops collecting/submitting) all four
    // sections on both forms and the public page, no further code needed.
    // Proof of Income, Monthly Expenses, Social Media Accounts, Sale
    // Includes and Payment Terms aren't mentioned in the spec, so they stay
    // as every other category has them (hasSocialStats: true, unchanged).
    // "location" added to this list (Sep 5, 2026 follow-up) so App Location
    // shows as its own App Statistics tile, same as every other category
    // that collects a location field (Digital Agencies, Service Business,
    // etc.) — labeled "App Location" via the categoryId === "apps-tools"
    // branch of quickStatLabelOverrides in the public listing page.
    // "monthly_income" added (same-day follow-up — "revenue and profit data
    // dekhabe" on the /buy marketplace card) so ListingCard's Revenue/mo and
    // Profit/mo stop showing "Not disclosed" for this category: both are
    // derived from listing.quickStats.monthly_income
    // (src/components/ListingCard.tsx), which computeAutoQuickStats() in
    // map-listing.ts only populates when "monthly_income" is present in a
    // category's quickStats — same auto-averaged-from-Proof-of-Income
    // mechanism every other category already uses, no form changes needed.
    // Labeled "Avg. Monthly Income" via quickStatLabelOverrides, same as
    // SaaS/AI Apps & Tools.
    quickStats: ["location", "monthly_income", "age", "rating", "total_reviews", "total_downloads", "store_price", "platform"],
    hasSeoData: false,
    hasMonetization: true,
    hasSocialStats: true,
  },
  {
    id: "games",
    name: "Games",
    description: "Mobile, web and desktop games.",
    quickStats: ["monthly_income", "age", "total_downloads", "total_reviews", "rating", "income_multiple"],
    hasSeoData: true,
    hasMonetization: true,
    hasSocialStats: true,
  },
  {
    id: "crypto-blockchain",
    name: "Crypto & Blockchain",
    description: "Crypto platforms, NFT projects and blockchain tools.",
    quickStats: ["monthly_income", "monthly_visitors", "age", "domain_authority", "income_multiple"],
    hasSeoData: true,
    hasMonetization: true,
    hasSocialStats: true,
  },
  {
    id: "digital-agencies",
    name: "Digital Agencies",
    description: "Service agencies with active client rosters.",
    quickStats: ["location", "monthly_income", "active_clients", "monthly_visitors", "age", "domain_authority", "income_multiple"],
    hasSeoData: true,
    hasMonetization: true,
    hasSocialStats: true,
  },
  {
    id: "service-business",
    name: "Service Business",
    description: "Client-service businesses with recurring engagements.",
    quickStats: ["location", "monthly_income", "active_clients", "monthly_visitors", "age", "domain_authority", "income_multiple"],
    hasSeoData: true,
    hasMonetization: true,
    hasSocialStats: true,
  },
  {
    id: "domains",
    name: "Domains",
    description: "Aged and brandable domains, single or in bundles.",
    quickStats: ["domain_age", "domain_expires", "domain_registrar"],
    hasSeoData: false,
    hasMonetization: false,
    hasSocialStats: false,
  },
];

// Categories that share the "Industry" option list/id space
// (src/lib/industries.ts) instead of the generic NICHES list — currently
// just SaaS (Design & Development New 1.pdf, Sep 5, 2026). Single source of
// truth used by both listing forms (to decide which option list to show,
// and whether to clear a niches/industries selection on category change)
// and the public listing page (to decide the "Industry" vs "Niche" label).
// AI Apps & Tools briefly shared this same mechanism (Design & Development
// New.pdf) but the user asked, same day, to drop Industry from that
// category entirely — it's intentionally not a member of this set; both
// listing forms skip the whole Niche/Industry section for it outright
// instead of falling back to the generic Niche list.
export const INDUSTRY_ID_SPACE_CATEGORIES = new Set(["saas"]);

export const CATEGORY_MAP: Record<string, CategoryConfig> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);

export const QUICK_STAT_LABELS: Record<QuickStatKey, string> = {
  location: "Business Location",
  monthly_income: "Monthly Income",
  monthly_visitors: "Monthly Visitors",
  domain_authority: "Domain Authority",
  income_multiple: "Income Multiple",
  articles_posted: "Articles Posted",
  subscribers: "Subscribers",
  monthly_views: "Monthly Views",
  total_views: "Total Views",
  total_videos: "Total Videos",
  channel_age: "Channel Age",
  business_type: "Business Type",
  account_type: "Account Type",
  active_subscribers: "Active Subscribers",
  followers: "Followers",
  total_posts: "Total Posts",
  likes_per_post: "Likes per Post",
  views_per_post: "Views per Post",
  open_rate: "Open Rate",
  click_through_rate: "Click-Through Rate",
  unsubscribe_rate: "Unsubscribe Rate",
  age: "Business Age",
  total_downloads: "Total Downloads",
  total_reviews: "Total Reviews",
  rating: "Rating",
  active_clients: "Active Clients",
  domain_age: "Domain Age",
  domain_expires: "Expires",
  domain_registrar: "Registrar",
  authority_score: "Authority Score",
  indexed_pages: "Indexed Pages",
  store_price: "Store Price",
  platform: "Platform",
};
