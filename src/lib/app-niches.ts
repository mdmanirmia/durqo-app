// Android & iOS Apps category only (Design & Development New.pdf — the
// "Update the Apps & Tools category to Android & iOS Apps" revision, Sep 5,
// 2026) — this category's own curated Niche option list, replacing the
// generic NICHES list (src/lib/niches.ts) for this category only. Unlike
// SaaS's "Industry" swap (src/lib/industries.ts), the spec keeps the plain
// "Niche" label here — only the option list changes, not the field name —
// so this doesn't need its own entry in INDUSTRY_ID_SPACE_CATEGORIES; both
// listing forms and the public listing page just check
// `categoryId === "apps-tools"` directly to pick this list instead. Stored
// in the same `niches` column every other category already uses (a listing
// can belong to more than one niche, same checkbox UI).
export const APP_NICHES: { id: string; name: string }[] = [
  { id: "ai", name: "AI" },
  { id: "games", name: "Games" },
  { id: "health-fitness", name: "Health & Fitness" },
  { id: "finance", name: "Finance" },
  { id: "productivity", name: "Productivity" },
  { id: "education", name: "Education" },
  { id: "entertainment", name: "Entertainment" },
  { id: "others", name: "Others" },
];

export const APP_NICHE_MAP: Record<string, string> = Object.fromEntries(APP_NICHES.map((n) => [n.id, n.name]));
