export const MONETIZATION_TYPES: { id: string; name: string }[] = [
  { id: "amazon-affiliates", name: "Amazon Affiliates" },
  { id: "affiliate-sales", name: "Affiliate Sales" },
  { id: "adsense", name: "Adsense" },
  // Added for the Social Media Accounts category's curated Monetization
  // Methods checklist (Design & Development New.pdf, Sep 5, 2026) — kept in
  // this shared list (rather than a separate file) so MONETIZATION_MAP stays
  // the single source of truth for every monetization id's display name;
  // see SOCIAL_MEDIA_MONETIZATION_IDS below for which ids that category's
  // form actually shows.
  { id: "ads", name: "Ads" },
  { id: "sponsorships", name: "Sponsorships" },
  { id: "donations", name: "Donations" },
  { id: "merchandise-sale", name: "Merchandise Sale" },
  { id: "others", name: "Others" },
  // Added for the SaaS category's curated Monetization Methods checklist
  // (Design & Development New 1.pdf, Sep 5, 2026) — see
  // SAAS_MONETIZATION_IDS below. Every other id that list needs
  // ("services-subscriptions", "e-commerce", "affiliate-sales", "others",
  // "ads") already exists above.
  { id: "digital-products", name: "Digital Products" },
  { id: "ezoic", name: "Ezoic" },
  { id: "e-commerce", name: "E-commerce" },
  { id: "dropshipping", name: "Dropshipping" },
  { id: "youtube", name: "YouTube" },
  { id: "facebook", name: "Facebook" },
  { id: "services-subscriptions", name: "Services & Subscriptions" },
  { id: "memberships", name: "Memberships" },
  { id: "fulfilled-by-amazon", name: "Fulfilled by Amazon" },
  { id: "advertising", name: "Advertising" },
  { id: "services", name: "Services" },
  { id: "amazon", name: "Amazon" },
  { id: "avantlink", name: "Avantlink" },
  { id: "awin", name: "AWIN" },
  { id: "black-rock-grill", name: "Black Rock Grill" },
  { id: "chewy", name: "Chewy" },
  { id: "clickbank", name: "ClickBank" },
  { id: "commission-junction", name: "Commission Junction" },
  { id: "flex-offers", name: "Flex Offers" },
  { id: "get-your-guide", name: "Get Your Guide" },
  { id: "growthlink", name: "GrowthLink" },
  { id: "gumroad", name: "GumRoad" },
  { id: "halo", name: "Halo" },
  { id: "health-trader", name: "Health Trader" },
  { id: "impact", name: "Impact" },
  { id: "ltk", name: "LTK" },
  { id: "mavely", name: "Mavely" },
  { id: "mediavine", name: "MediaVine" },
  { id: "mediavine-journey", name: "Mediavine Journey" },
  { id: "monumetric", name: "Monumetric" },
  { id: "newor-media", name: "NEWOR MEDIA" },
  { id: "nomadic-supply", name: "Nomadic Supply" },
  { id: "nuk", name: "Nuk" },
  { id: "obsessed-garage", name: "Obsessed Garage" },
  { id: "payhip", name: "Payhip" },
  { id: "pepperjam", name: "Pepperjam" },
  { id: "playbetter", name: "PlayBetter" },
  { id: "rakuten", name: "Rakuten" },
  { id: "raptive", name: "Raptive" },
  { id: "refersion", name: "Refersion" },
  { id: "share-a-sale", name: "Share-A-Sale" },
  { id: "shemedia", name: "SheMedia" },
  { id: "skimlinks", name: "Skimlinks" },
  { id: "sovrn", name: "SOVRN" },
  { id: "springwell", name: "Springwell" },
  { id: "stay22", name: "Stay22" },
  { id: "superhero-x12", name: "Superhero X12" },
  { id: "teachable", name: "Teachable" },
  { id: "thinkific", name: "Thinkific" },
  { id: "ticketmaster", name: "Ticketmaster" },
  { id: "viator", name: "Viator" },
  { id: "youtube-display-ads", name: "YouTube Display Ads" },
  // Added for the AI Apps & Tools category's curated Monetization Methods
  // checklist (Design & Development New.pdf, Sep 5, 2026) — see
  // AI_APPS_TOOLS_MONETIZATION_IDS below. "ads" and "affiliate-sales"
  // already exist above; "services" also already exists (E-commerce/agency
  // categories use it too).
  { id: "subscriptions", name: "Subscriptions" },
  { id: "usage-based", name: "Usage-Based" },
  { id: "api-fees", name: "API Fees" },
  { id: "commission", name: "Commission" },
  { id: "lifetime-deals", name: "Lifetime Deals" },
  { id: "one-time-sales", name: "One-Time Sales" },
  { id: "licensing", name: "Licensing" },
  { id: "enterprise-contracts", name: "Enterprise Contracts" },
];

export const MONETIZATION_MAP: Record<string, string> = Object.fromEntries(
  MONETIZATION_TYPES.map((m) => [m.id, m.name])
);

// Social Media Accounts category only — the seller form shows just this
// curated subset of MONETIZATION_TYPES for that category (Design &
// Development New.pdf, Sep 5, 2026) instead of the full generic list every
// other category sees, since most of that list (affiliate networks, ad
// networks built for content sites, Amazon-specific programs) doesn't apply
// to a creator's social account.
export const SOCIAL_MEDIA_MONETIZATION_IDS = [
  "ads",
  "sponsorships",
  "affiliate-sales",
  "services-subscriptions",
  "donations",
  "merchandise-sale",
  "others",
];

// SaaS category only — same curated-subset mechanism as
// SOCIAL_MEDIA_MONETIZATION_IDS above (Design & Development New 1.pdf, Sep
// 5, 2026): the affiliate-network/ad-network/Amazon-specific entries in the
// full generic list don't apply to a software business.
export const SAAS_MONETIZATION_IDS = [
  "ads",
  "digital-products",
  "services-subscriptions",
  "e-commerce",
  "affiliate-sales",
  "others",
];

// AI Apps & Tools category only — same curated-subset mechanism as
// SOCIAL_MEDIA_MONETIZATION_IDS / SAAS_MONETIZATION_IDS above (Design &
// Development New.pdf, Sep 5, 2026).
export const AI_APPS_TOOLS_MONETIZATION_IDS = [
  "subscriptions",
  "usage-based",
  "api-fees",
  "ads",
  "affiliate-sales",
  "commission",
  "services",
  "lifetime-deals",
  "one-time-sales",
  "licensing",
  "enterprise-contracts",
  "others",
];
