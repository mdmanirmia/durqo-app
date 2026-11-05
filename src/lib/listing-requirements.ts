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

export type ListingFieldKey =
  | "title"
  | "price"
  | "age"
  | "overview"
  | "niche"
  | "monetization"
  | "assets"
  | "income_images"
  | "ga_images"
  | "gsc_images"
  | "semrush_images"
  | "ahrefs_images";

// Whether the category's form shows a manual Age input (the "age" quick stat
// outside Domains and YouTube Channels, whose ages come from other fields).
export function hasAgeInput(categoryId: string, quickStatKeys: readonly string[]): boolean {
  return categoryId !== "domains" && categoryId !== "youtube-channels" && quickStatKeys.includes("age");
}

// Nov 4, 2026 ("manadatory data gulo chare submit korar sob category te oi
// gulo red dekhabe kon gulo mandatory and error message o thakbe"): one
// validator for both listing forms. Returns every missing field at once so
// the form can outline each one in red and list them in a single message
// (the browser's own one-at-a-time "required" popups are turned off with
// noValidate). Labels are not marked "(required)" anywhere, per request.
export function validateListing(
  categoryId: string,
  data: {
    title: string;
    price: string;
    // undefined when the category has no Age input (see hasAgeInput)
    age?: string;
    ageLabel: string;
    overview: string;
    overviewLabel: string;
    assetCount: number;
    niches: string[];
    monthlyIncome: string[];
    incomeImageCount: number;
    monetization: string[];
    // Nov 4, 2026 ("Google Analytics Data, Google Search Console Data,
    // SEMrush Data, Ahrefs Data ei gulo data dile obosoi at least 1 ta image
    // dite hobe"): each data section that has any value entered needs at
    // least one screenshot in its own gallery. Empty sections need nothing.
    dataProofs?: { key: ListingFieldKey; section: string; values: string[]; imageCount: number }[];
  }
): { keys: Set<ListingFieldKey>; message: string | null } {
  const keys = new Set<ListingFieldKey>();
  const labels: string[] = [];
  const add = (k: ListingFieldKey, label: string) => {
    keys.add(k);
    labels.push(label);
  };

  if (!data.title.trim()) add("title", "Title");
  if (data.price.trim() === "" || Number(data.price) <= 0) add("price", "Asking price");
  // Nov 4, 2026 ("jei gulote age ache oi gulo mandatory hobe karon age ta
  // onek important"): every category with an Age input requires it (0 is a
  // valid "brand new" answer).
  if (data.age !== undefined && data.age.trim() === "") add("age", data.ageLabel);
  if (categoryId === PRODUCT_CATEGORY && data.niches.length === 0) add("niche", "Niche");
  if (!data.overview.trim()) add("overview", data.overviewLabel);
  // Nov 4, 2026 ("eita mandatory korar dorkar nei... jokhon data dibe tokhon
  // obossoi image upload korte hobe at least akta"): income itself is
  // optional for every category (no data shows as $0 on the listing), but
  // once any month has income above 0, at least one proof image is required.
  if (data.monthlyIncome.some((v) => Number(v) > 0) && data.incomeImageCount === 0) {
    add("income_images", "Proof of Income images (at least one, since you entered monthly income)");
  }
  if (categoryId === PRODUCT_CATEGORY && data.monetization.length === 0) add("monetization", "Monetization Methods");
  for (const d of data.dataProofs ?? []) {
    const hasData = d.values.some((v) => {
      const t = v.trim();
      return t !== "" && t !== "0";
    });
    if (hasData && d.imageCount === 0) add(d.key, `${d.section} images (at least one, since you entered ${d.section} data)`);
  }
  // Mandatory for every category since 2026-09-16.
  if (data.assetCount === 0) add("assets", "Sale Includes (at least one asset)");

  return {
    keys,
    message: labels.length ? `Please fill in the fields marked in red: ${labels.join(", ")}.` : null,
  };
}
