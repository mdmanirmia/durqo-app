// Single source of truth for the /buy marketplace's URL query-string shape.
// Every filter, the sort order, the view mode and the page number all live
// in the URL (never component state) so refresh, Back/Forward and shared
// links all restore the exact same result set — see the /buy redesign spec,
// Sections 4/8/16 ("Preserve filter, sort, page and view state in the URL").
//
// Defaults are omitted from the URL entirely (an empty ?q= or the default
// sort never gets written) so the "no filters applied" state is just
// `/buy` with no query string, and active-filter chips (Section 8) have an
// unambiguous "is this even a chip-worthy override" test: present in the
// parsed object but absent from DEFAULTS.
import { CATEGORY_MAP } from "@/lib/categories";

export type IncomeFilter = "any" | "yes" | "no";
export type StatusFilter = "available" | "sold" | "all";
export type SortOption = "newest" | "price-asc" | "price-desc" | "income-desc";
export type ViewMode = "cards" | "table";

export interface MarketplaceFilters {
  q: string;
  categoryIds: string[];
  income: IncomeFilter;
  priceMin: number | null;
  priceMax: number | null;
  ageMin: number | null;
  ageMax: number | null;
  status: StatusFilter;
  sort: SortOption;
  view: ViewMode;
  page: number;
}

export const DEFAULT_FILTERS: MarketplaceFilters = {
  q: "",
  categoryIds: [],
  income: "any",
  priceMin: null,
  priceMax: null,
  ageMin: null,
  ageMax: null,
  status: "available",
  sort: "newest",
  view: "cards",
  page: 1,
};

export const PAGE_SIZE = 12;

const SORT_OPTIONS: SortOption[] = ["newest", "price-asc", "price-desc", "income-desc"];

function readStr(sp: URLSearchParams, key: string): string | undefined {
  const v = sp.get(key);
  return v === null ? undefined : v;
}

function readNum(sp: URLSearchParams, key: string): number | null {
  const v = sp.get(key);
  if (v === null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Accepts either Next's searchParams object (Record<string, string | string[]
// | undefined>, as handed to Server Components) or a real URLSearchParams
// (used client-side), so the same parser backs both the server page and the
// client filter components.
export function parseFilters(
  input: URLSearchParams | Record<string, string | string[] | undefined>
): MarketplaceFilters {
  const sp =
    input instanceof URLSearchParams
      ? input
      : new URLSearchParams(
          Object.entries(input).flatMap(([k, v]) =>
            v === undefined ? [] : Array.isArray(v) ? v.map((x) => [k, x] as [string, string]) : [[k, v] as [string, string]]
          )
        );

  const categoryIds = (readStr(sp, "category") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((id) => id && CATEGORY_MAP[id]);

  const income = readStr(sp, "income");
  const status = readStr(sp, "status");
  const sort = readStr(sp, "sort");
  const view = readStr(sp, "view");
  const page = readNum(sp, "page");

  return {
    q: readStr(sp, "q")?.trim() ?? DEFAULT_FILTERS.q,
    categoryIds,
    income: income === "yes" || income === "no" ? income : DEFAULT_FILTERS.income,
    priceMin: readNum(sp, "priceMin"),
    priceMax: readNum(sp, "priceMax"),
    ageMin: readNum(sp, "ageMin"),
    ageMax: readNum(sp, "ageMax"),
    status: status === "sold" || status === "all" ? status : DEFAULT_FILTERS.status,
    sort: sort && SORT_OPTIONS.includes(sort as SortOption) ? (sort as SortOption) : DEFAULT_FILTERS.sort,
    view: view === "table" ? "table" : DEFAULT_FILTERS.view,
    page: page && page >= 1 ? Math.floor(page) : DEFAULT_FILTERS.page,
  };
}

// Serializes filters back to a query string, omitting anything equal to its
// default so the URL stays minimal and shareable.
export function serializeFilters(filters: MarketplaceFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.categoryIds.length) sp.set("category", filters.categoryIds.join(","));
  if (filters.income !== DEFAULT_FILTERS.income) sp.set("income", filters.income);
  if (filters.priceMin !== null) sp.set("priceMin", String(filters.priceMin));
  if (filters.priceMax !== null) sp.set("priceMax", String(filters.priceMax));
  if (filters.ageMin !== null) sp.set("ageMin", String(filters.ageMin));
  if (filters.ageMax !== null) sp.set("ageMax", String(filters.ageMax));
  if (filters.status !== DEFAULT_FILTERS.status) sp.set("status", filters.status);
  if (filters.sort !== DEFAULT_FILTERS.sort) sp.set("sort", filters.sort);
  if (filters.view !== DEFAULT_FILTERS.view) sp.set("view", filters.view);
  if (filters.page !== DEFAULT_FILTERS.page) sp.set("page", String(filters.page));
  return sp;
}

export function filtersToHref(filters: MarketplaceFilters, base = "/buy"): string {
  const qs = serializeFilters(filters).toString();
  return qs ? `${base}?${qs}` : base;
}

// One removable chip per active, non-default filter value (Section 8: "Each
// active-filter chip must have an accessible remove button" — the caller
// only needs to know the label and how to produce the filters state with
// that one value removed).
export interface FilterChip {
  key: string;
  label: string;
  remove: (filters: MarketplaceFilters) => MarketplaceFilters;
}

export function buildChips(filters: MarketplaceFilters): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.q) {
    chips.push({ key: "q", label: `"${filters.q}"`, remove: (f) => ({ ...f, q: "", page: 1 }) });
  }
  for (const id of filters.categoryIds) {
    const name = CATEGORY_MAP[id]?.name ?? id;
    chips.push({
      key: `category:${id}`,
      label: name,
      remove: (f) => ({ ...f, categoryIds: f.categoryIds.filter((c) => c !== id), page: 1 }),
    });
  }
  if (filters.income !== "any") {
    chips.push({
      key: "income",
      label: filters.income === "yes" ? "Income generating: Yes" : "Income generating: No",
      remove: (f) => ({ ...f, income: "any", page: 1 }),
    });
  }
  if (filters.priceMin !== null || filters.priceMax !== null) {
    const label =
      filters.priceMin !== null && filters.priceMax !== null
        ? `Price: $${filters.priceMin.toLocaleString()}–$${filters.priceMax.toLocaleString()}`
        : filters.priceMin !== null
          ? `Price: $${filters.priceMin.toLocaleString()}+`
          : `Price: up to $${filters.priceMax!.toLocaleString()}`;
    chips.push({ key: "price", label, remove: (f) => ({ ...f, priceMin: null, priceMax: null, page: 1 }) });
  }
  if (filters.ageMin !== null || filters.ageMax !== null) {
    const label =
      filters.ageMin !== null && filters.ageMax !== null
        ? `Age: ${filters.ageMin}–${filters.ageMax} yrs`
        : filters.ageMin !== null
          ? `Age: ${filters.ageMin}+ yrs`
          : `Age: up to ${filters.ageMax} yrs`;
    chips.push({ key: "age", label, remove: (f) => ({ ...f, ageMin: null, ageMax: null, page: 1 }) });
  }
  // "Available" is the permanent default — per Section 8, only surface a
  // status chip when the visitor has moved away from that default.
  if (filters.status !== "available") {
    chips.push({
      key: "status",
      label: filters.status === "sold" ? "Sold" : "Available + Sold",
      remove: (f) => ({ ...f, status: "available", page: 1 }),
    });
  }

  return chips;
}

export function hasActiveFilters(filters: MarketplaceFilters): boolean {
  return buildChips(filters).length > 0;
}
