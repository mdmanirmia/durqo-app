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
  | "total_videos"
  | "channel_age"
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
  | "domain_registrar";

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
    // Monthly Income, Monthly Views and Authority Score are computed
    // automatically for this category (see mapListing in map-listing.ts) —
    // averaged from the 12-month Proof of Income entries, and pulled from
    // the seller's Google Analytics / SEMrush data — rather than typed in
    // manually. Income Multiple is intentionally not shown for Websites.
    quickStats: ["monthly_income", "monthly_views", "age", "articles_posted", "authority_score"],
    hasSeoData: true,
    hasMonetization: true,
    hasSocialStats: true,
  },
  {
    id: "e-commerce",
    name: "E-commerce",
    description: "Online stores selling physical or digital products.",
    quickStats: ["location", "monthly_income", "monthly_visitors", "age", "domain_authority", "income_multiple"],
    hasSeoData: true,
    hasMonetization: true,
    hasSocialStats: true,
  },
  {
    id: "youtube-channels",
    name: "YouTube Channels",
    description: "Monetized channels with an existing subscriber base.",
    quickStats: ["location", "monthly_income", "monthly_views", "subscribers", "total_videos", "channel_age", "income_multiple"],
    hasSeoData: false,
    hasMonetization: true,
    hasSocialStats: true,
    note: "Channel Analytics is shared privately — buyers request access via message before purchase.",
  },
  {
    id: "social-media-accounts",
    name: "Social Media Accounts",
    description: "Instagram, TikTok and X accounts with real followings.",
    quickStats: ["location", "monthly_income", "followers", "age", "total_posts", "likes_per_post", "views_per_post", "income_multiple"],
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
    quickStats: ["monthly_income", "monthly_visitors", "age", "domain_authority", "income_multiple", "articles_posted"],
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
    name: "Apps & Tools",
    description: "Mobile and desktop apps, utilities and tools.",
    quickStats: ["monthly_income", "age", "total_downloads", "total_reviews", "rating", "income_multiple"],
    hasSeoData: true,
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
  total_videos: "Total Videos",
  channel_age: "Channel Age",
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
};
