// SaaS category only (Design & Development New 1.pdf, Sep 5, 2026) — this
// category's own name for the generic Niche selector: "Industry" instead of
// "Niche", with its own curated option list rather than the shared NICHES
// list (src/lib/niches.ts). A listing can belong to more than one industry
// (checkboxes, same UI as Niche), and it's stored in the same `niches`
// column every other category already uses (see the categoryId === "saas"
// branches on both listing forms and the public listing page) — only the
// label and the option list change for this category, not the underlying
// storage, mirroring how "Account Location" is still just the `location`
// column under a different label for Social Media Accounts.
export const INDUSTRIES: { id: string; name: string }[] = [
  { id: "ai-automation", name: "AI & Automation" },
  { id: "marketing-sales", name: "Marketing & Sales" },
  { id: "social-media-management", name: "Social Media Management" },
  { id: "e-commerce", name: "E-commerce" },
  { id: "education", name: "Education" },
  { id: "business", name: "Business" },
  { id: "finance", name: "Finance" },
  { id: "project-management", name: "Project Management" },
  { id: "entertainment", name: "Entertainment" },
  { id: "sports-outdoor", name: "Sports & Outdoor" },
  { id: "health-beauty", name: "Health & Beauty" },
  { id: "games", name: "Games" },
  { id: "others", name: "Others" },
];

export const INDUSTRY_MAP: Record<string, string> = Object.fromEntries(INDUSTRIES.map((i) => [i.id, i.name]));
