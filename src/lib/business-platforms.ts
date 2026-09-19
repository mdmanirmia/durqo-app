// Websites and E-commerce categories only (Sep 19, 2026 request): "which
// platform is this business built on" — a single-select dropdown (a
// business only runs on one platform at a time), stored as a single
// plain-text id in the `business_platform` column (migration 051) and
// turned into a display name at render time via BUSINESS_PLATFORM_MAP —
// same convention as FUNDING_STAGES/FUNDING_STAGE_MAP in funding-stages.ts.
//
// Two different option lists (Websites vs. E-commerce) share a few ids —
// "wix", "custom-built", "other" — with identical display names, so one
// combined map covers lookups for both.
export const WEBSITE_PLATFORMS: { id: string; name: string }[] = [
  { id: "wordpress", name: "WordPress" },
  { id: "webflow", name: "Webflow" },
  { id: "wix", name: "Wix" },
  { id: "squarespace", name: "Squarespace" },
  { id: "ghost", name: "Ghost" },
  { id: "custom-built", name: "Custom-built" },
  { id: "other", name: "Other" },
];

export const ECOMMERCE_PLATFORMS: { id: string; name: string }[] = [
  { id: "shopify", name: "Shopify" },
  { id: "woocommerce", name: "WooCommerce" },
  { id: "magento-adobe-commerce", name: "Magento / Adobe Commerce" },
  { id: "bigcommerce", name: "BigCommerce" },
  { id: "wix", name: "Wix" },
  { id: "squarespace-commerce", name: "Squarespace Commerce" },
  { id: "webflow-ecommerce", name: "Webflow Ecommerce" },
  { id: "prestashop", name: "PrestaShop" },
  { id: "opencart", name: "OpenCart" },
  { id: "custom-built", name: "Custom-built" },
  { id: "other", name: "Other" },
];

export const BUSINESS_PLATFORM_MAP: Record<string, string> = Object.fromEntries(
  [...WEBSITE_PLATFORMS, ...ECOMMERCE_PLATFORMS].map((p) => [p.id, p.name])
);
