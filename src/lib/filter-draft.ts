import { MarketplaceFilters } from "@/lib/marketplace-filters";

// The filter panel (Section 7) stages edits behind explicit Apply/Reset
// buttons rather than updating the URL on every keystroke/click — this is
// the plain-string, form-friendly shape those staged edits live in before
// being converted back into real MarketplaceFilters on Apply.
export interface FilterDraft {
  income: MarketplaceFilters["income"];
  categoryIds: string[];
  priceMin: string;
  priceMax: string;
  ageMin: string;
  ageMax: string;
  statusAvailable: boolean;
  statusSold: boolean;
}

export function draftFromFilters(f: MarketplaceFilters): FilterDraft {
  return {
    income: f.income,
    categoryIds: f.categoryIds,
    priceMin: f.priceMin === null ? "" : String(f.priceMin),
    priceMax: f.priceMax === null ? "" : String(f.priceMax),
    ageMin: f.ageMin === null ? "" : String(f.ageMin),
    ageMax: f.ageMax === null ? "" : String(f.ageMax),
    statusAvailable: f.status === "available" || f.status === "all",
    statusSold: f.status === "sold" || f.status === "all",
  };
}

export function draftToFilters(draft: FilterDraft, base: MarketplaceFilters): MarketplaceFilters {
  const status: MarketplaceFilters["status"] =
    draft.statusAvailable && draft.statusSold ? "all" : draft.statusSold && !draft.statusAvailable ? "sold" : "available";

  return {
    ...base,
    income: draft.income,
    categoryIds: draft.categoryIds,
    priceMin: draft.priceMin.trim() === "" ? null : Number(draft.priceMin),
    priceMax: draft.priceMax.trim() === "" ? null : Number(draft.priceMax),
    ageMin: draft.ageMin.trim() === "" ? null : Number(draft.ageMin),
    ageMax: draft.ageMax.trim() === "" ? null : Number(draft.ageMax),
    status,
    page: 1,
  };
}

export interface FilterDraftErrors {
  price?: string;
  age?: string;
}

export function validateDraft(draft: FilterDraft): FilterDraftErrors {
  const errors: FilterDraftErrors = {};
  const priceMin = draft.priceMin.trim() === "" ? null : Number(draft.priceMin);
  const priceMax = draft.priceMax.trim() === "" ? null : Number(draft.priceMax);
  if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
    errors.price = "Minimum price can't be more than maximum price.";
  }
  const ageMin = draft.ageMin.trim() === "" ? null : Number(draft.ageMin);
  const ageMax = draft.ageMax.trim() === "" ? null : Number(draft.ageMax);
  if (ageMin !== null && ageMax !== null && ageMin > ageMax) {
    errors.age = "Minimum age can't be more than maximum age.";
  }
  return errors;
}
