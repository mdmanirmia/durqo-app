// AI Apps & Tools category only (Design & Development New.pdf, Sep 5, 2026
// request) — which major AI model/platform an app or tool is built on top
// of, shown as a checkbox list on the seller form (an app can be built on
// more than one, e.g. a wrapper that supports both Claude and ChatGPT) and
// joined into a single "Business Type" Quick Stat on the public listing
// page. Same mechanism and label ("Business Type") as E-commerce's own
// curated list (src/lib/business-types.ts), just a different option set for
// this category — both are stored in the shared `business_type` column
// (see QUICK_STAT_COLUMNS in map-listing.ts), with buildQuickStats() there
// picking this map instead of BUSINESS_TYPE_MAP when the listing's category
// is "ai-apps-tools".
export const AI_BUSINESS_TYPES: { id: string; name: string }[] = [
  { id: "anthropic-claude", name: "Anthropic (Claude)" },
  { id: "gemini-google", name: "Gemini (Google)" },
  { id: "openai-chatgpt", name: "OpenAI (ChatGPT)" },
  { id: "meta-llama", name: "Meta (Llama)" },
  { id: "character-ai", name: "Character.AI" },
  { id: "others", name: "Others" },
];

export const AI_BUSINESS_TYPE_MAP: Record<string, string> = Object.fromEntries(
  AI_BUSINESS_TYPES.map((t) => [t.id, t.name])
);
