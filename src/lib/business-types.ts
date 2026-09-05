// E-commerce category only (Sep 5, 2026 request) — the business model(s) a
// store uses, shown as a checkbox list on the seller form (a store can be
// more than one of these at once, e.g. a Shopify store that also
// dropships) and joined into a single "Business Type" Quick Stat on the
// public listing page. Mirrors the shape of monetization-types.ts.
export const BUSINESS_TYPES: { id: string; name: string }[] = [
  { id: "shopify", name: "Shopify" },
  { id: "woocommerce", name: "WooCommerce" },
  { id: "dropshipping", name: "Dropshipping" },
  { id: "digital-products", name: "Digital Products" },
  { id: "others", name: "Others" },
];

export const BUSINESS_TYPE_MAP: Record<string, string> = Object.fromEntries(
  BUSINESS_TYPES.map((t) => [t.id, t.name])
);
