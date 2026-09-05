// Startup Business category only (user request, Sep 5, 2026) — which
// business model(s) the startup runs on, shown as a checkbox list on the
// seller form (a startup can be more than one of these at once, e.g. a
// B2B marketplace) and joined into a single "Business Model" Quick Stat on
// the public listing page. Same mechanism/column (`business_type`) and
// shape as E-commerce's own Business Type checklist (src/lib/business-
// types.ts) and AI Apps & Tools' Business Type checklist (src/lib/ai-
// business-types.ts) — just a different curated option list, picked by
// category in buildQuickStats() in map-listing.ts.
export const STARTUP_BUSINESS_MODELS: { id: string; name: string }[] = [
  { id: "b2b", name: "B2B" },
  { id: "b2c", name: "B2C" },
  { id: "b2b2c", name: "B2B2C" },
  { id: "marketplace", name: "Marketplace" },
  { id: "saas", name: "SaaS" },
  { id: "hardware", name: "Hardware" },
  { id: "others", name: "Others" },
];

export const STARTUP_BUSINESS_MODEL_MAP: Record<string, string> = Object.fromEntries(
  STARTUP_BUSINESS_MODELS.map((m) => [m.id, m.name])
);
