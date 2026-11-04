// Nov 4, 2026 ("ei gulo te information deya mandatory kore dao: Niche,
// Overview of the Product, Proof of Income, Monetization Methods, Sale
// Includes"; Proof of Income relaxed the same day, see below): per-category required sections, shared by the new-listing form
// and ListingEditForm so the two never drift apart. Sale Includes is already
// mandatory for every category (checked separately in both forms).
export const PRODUCT_CATEGORY = "plugins-themes-extensions";

// Categories with no meaningful physical location, so the location field is
// hidden and saved as null (Websites/Domains since earlier; Plugins, Themes &
// Extensions since Nov 4, 2026: a template or plugin is a digital file).
// Nov 4, 2026 ("jei gulor dorkar nei tule dao"): also Android & iOS Apps,
// Games, Newsletters and AI Apps & Tools, which sell globally through app
// stores or online with no physical location; the seller's own country is
// already shown on the seller card.
export const NO_LOCATION_CATEGORIES = new Set([
  "websites",
  "domains",
  PRODUCT_CATEGORY,
  "apps-tools",
  "games",
  "newsletters",
  "ai-apps-tools",
]);

export function missingRequiredSections(
  categoryId: string,
  data: {
    niches: string[];
    overview: string;
    monthlyIncome: string[];
    incomeImageCount: number;
    monetization: string[];
    // Nov 4, 2026 ("Google Analytics Data, Google Search Console Data,
    // SEMrush Data, Ahrefs Data ei gulo data dile obosoi at least 1 ta image
    // dite hobe"): each data section that has any value entered needs at
    // least one screenshot in its own gallery. Empty sections need nothing.
    dataProofs?: { section: string; values: string[]; imageCount: number }[];
  }
): string | null {
  const missing: string[] = [];
  for (const d of data.dataProofs ?? []) {
    const hasData = d.values.some((v) => {
      const t = v.trim();
      return t !== "" && t !== "0";
    });
    if (hasData && d.imageCount === 0) missing.push(`${d.section} images (at least one, since you entered ${d.section} data)`);
  }
  // Nov 4, 2026 ("eita mandatory korar dorkar nei... jokhon data dibe tokhon
  // obossoi image upload korte hobe at least akta"): income itself is
  // optional for every category (no data shows as $0 on the listing), but
  // once any month has income above 0, at least one proof image is required.
  const hasIncome = data.monthlyIncome.some((v) => Number(v) > 0);
  if (hasIncome && data.incomeImageCount === 0) missing.push("Proof of Income images (at least one, since you entered monthly income)");
  if (categoryId === PRODUCT_CATEGORY) {
    if (data.niches.length === 0) missing.push("Niche");
    if (!data.overview.trim()) missing.push("Overview of the Product");
    if (data.monetization.length === 0) missing.push("Monetization Methods");
  }
  if (missing.length === 0) return null;
  return `Please complete these required sections before saving: ${missing.join(", ")}.`;
}
