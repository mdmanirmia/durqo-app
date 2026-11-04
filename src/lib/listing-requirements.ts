// Nov 4, 2026 ("ei gulo te information deya mandatory kore dao: Niche,
// Overview of the Product, Proof of Income, Monetization Methods, Sale
// Includes"): per-category required sections, shared by the new-listing form
// and ListingEditForm so the two never drift apart. Sale Includes is already
// mandatory for every category (checked separately in both forms).
export const PRODUCT_CATEGORY = "plugins-themes-extensions";

// Categories with no meaningful physical location, so the location field is
// hidden and saved as null (Websites/Domains since earlier; Plugins, Themes &
// Extensions since Nov 4, 2026: a template or plugin is a digital file).
export const NO_LOCATION_CATEGORIES = new Set(["websites", "domains", PRODUCT_CATEGORY]);

export function missingRequiredSections(
  categoryId: string,
  data: {
    niches: string[];
    overview: string;
    monthlyIncome: string[];
    incomeImageCount: number;
    monetization: string[];
  }
): string | null {
  if (categoryId !== PRODUCT_CATEGORY) return null;
  const missing: string[] = [];
  if (data.niches.length === 0) missing.push("Niche");
  if (!data.overview.trim()) missing.push("Overview of the Product");
  const hasIncome = data.monthlyIncome.some((v) => v.trim() !== "");
  if (!hasIncome || data.incomeImageCount === 0) missing.push("Proof of Income (monthly income and at least one proof image)");
  if (data.monetization.length === 0) missing.push("Monetization Methods");
  if (missing.length === 0) return null;
  return `Please complete these required sections before saving: ${missing.join(", ")}.`;
}
