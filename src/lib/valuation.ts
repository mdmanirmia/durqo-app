// Shared "Free Valuation" calculator (Sep 27, 2026 build, extended same day
// with a category-specific signal — see
// claude/free-valuation-lead-gen-addendum.md for the full brief).
//
// The core model is universal: an illustrative range built from a
// category-typical multiple of annual profit, nudged a little by business
// age. On top of that, each category asks for ONE extra metric that
// actually moves the needle for that kind of business — traffic for a
// content site, subscribers for a YouTube channel, downloads for an app —
// reusing the exact same Quick Stat keys/labels Durqo's real listing form
// already collects (src/lib/categories.ts), so the wording matches what a
// seller sees later when they actually list. This is still deliberately
// NOT a full per-category appraisal model (no attempt to reconcile all of a
// category's quick stats into one number) — just one well-chosen signal per
// category, applied as a modest multiplier on top of the profit/revenue
// math. Every place this number is shown says plainly that it's an
// estimate, not an appraisal or an offer.
import { CATEGORY_MAP, QUICK_STAT_LABELS, type QuickStatKey } from "@/lib/categories";

export interface ValuationMultiple {
  low: number;
  high: number;
}

// Annual-profit multiple ranges, grouped by how these categories typically
// trade for a small online-business sale: recurring-revenue software
// commands a premium over a content/social property whose realized profit
// is thinner and less durable. Ballpark, illustrative figures — not sourced
// from Durqo's own closed-sale data (too few completed sales yet to build a
// real comp model from), and intentionally conservative rather than
// optimistic, since overpromising a seller's price is worse for trust than
// underpromising it.
export const CATEGORY_MULTIPLES: Record<string, ValuationMultiple> = {
  websites: { low: 2.5, high: 4 },
  "e-commerce": { low: 2.5, high: 4 },
  "youtube-channels": { low: 2, high: 3.5 },
  "social-media-accounts": { low: 1.5, high: 3 },
  saas: { low: 3, high: 5 },
  "ai-apps-tools": { low: 3, high: 5 },
  "apps-tools": { low: 2, high: 4 },
  "startup-business": { low: 2, high: 4 },
  "plugins-themes-extensions": { low: 2.5, high: 4 },
  // Domains don't trade on a profit multiple at all — handled by the
  // revenue/floor fallback below (a parked or brandable domain usually has
  // $0 monthly revenue and profit, so it lands on the floor estimate).
  domains: { low: 0, high: 0 },
  "amazon-stores-kdp": { low: 2, high: 3.5 },
  "service-business": { low: 2, high: 3.5 },
  "digital-agencies": { low: 2, high: 3.5 },
  games: { low: 2, high: 4 },
  newsletters: { low: 2.5, high: 4 },
  "crypto-blockchain": { low: 2, high: 4 },
};

const DEFAULT_MULTIPLE: ValuationMultiple = { low: 2, high: 3.5 };

// ---- Category-specific secondary signal --------------------------------
// One extra metric per category (where one clearly applies), each with its
// own low/mid/high tiers and a small factor per tier — the same modest
// +/-10-15% range the age adjustment uses, since this is a supporting
// signal on top of the real revenue/profit math, not a second core input.
// Categories with no natural extra signal here (e.g. Amazon Stores & KDP)
// simply aren't listed — the form skips the extra field for them and the
// combined factor falls back to 1.0 for that part.
export interface CategoryMetricConfig {
  key: QuickStatKey;
  label: string;
  placeholder: string;
  helpText: string;
  tiers: { max: number; factor: number }[]; // ascending, last entry should use Infinity
}

function tiers(...entries: [number, number][]): { max: number; factor: number }[] {
  return entries.map(([max, factor]) => ({ max, factor }));
}

export const CATEGORY_METRICS: Partial<Record<string, CategoryMetricConfig>> = {
  websites: {
    key: "monthly_views",
    label: QUICK_STAT_LABELS.monthly_views,
    placeholder: "e.g. 25000",
    helpText: "More consistent traffic supports a higher multiple.",
    tiers: tiers([5000, 0.95], [50000, 1.0], [Infinity, 1.1]),
  },
  "e-commerce": {
    key: "monthly_views",
    label: QUICK_STAT_LABELS.monthly_views,
    placeholder: "e.g. 25000",
    helpText: "More consistent traffic supports a higher multiple.",
    tiers: tiers([5000, 0.95], [50000, 1.0], [Infinity, 1.1]),
  },
  "youtube-channels": {
    key: "subscribers",
    label: QUICK_STAT_LABELS.subscribers,
    placeholder: "e.g. 50000",
    helpText: "A larger subscriber base supports a higher multiple.",
    tiers: tiers([10000, 0.95], [100000, 1.0], [Infinity, 1.1]),
  },
  "social-media-accounts": {
    key: "followers",
    label: QUICK_STAT_LABELS.followers,
    placeholder: "e.g. 50000",
    helpText: "A larger, engaged following supports a higher multiple.",
    tiers: tiers([10000, 0.95], [100000, 1.0], [Infinity, 1.1]),
  },
  saas: {
    key: "active_subscribers",
    label: QUICK_STAT_LABELS.active_subscribers,
    placeholder: "e.g. 300",
    helpText: "More active subscribers means more proven recurring revenue.",
    tiers: tiers([100, 0.95], [1000, 1.0], [Infinity, 1.1]),
  },
  "ai-apps-tools": {
    key: "active_subscribers",
    label: QUICK_STAT_LABELS.active_subscribers,
    placeholder: "e.g. 300",
    helpText: "More active subscribers means more proven recurring revenue.",
    tiers: tiers([100, 0.95], [1000, 1.0], [Infinity, 1.1]),
  },
  "apps-tools": {
    key: "total_downloads",
    label: QUICK_STAT_LABELS.total_downloads,
    placeholder: "e.g. 100000",
    helpText: "More installs signals a larger, more defensible user base.",
    tiers: tiers([10000, 0.95], [100000, 1.0], [Infinity, 1.08]),
  },
  "plugins-themes-extensions": {
    key: "total_downloads",
    label: QUICK_STAT_LABELS.total_downloads,
    placeholder: "e.g. 100000",
    helpText: "More installs signals a larger, more defensible user base.",
    tiers: tiers([10000, 0.95], [100000, 1.0], [Infinity, 1.08]),
  },
  games: {
    key: "total_downloads",
    label: QUICK_STAT_LABELS.total_downloads,
    placeholder: "e.g. 100000",
    helpText: "More installs signals a larger, more defensible player base.",
    tiers: tiers([10000, 0.95], [100000, 1.0], [Infinity, 1.08]),
  },
  domains: {
    key: "domain_age",
    label: "Domain Age (years)",
    placeholder: "e.g. 5",
    helpText: "Older, aged domains typically carry more value on their own.",
    tiers: tiers([1, 0.9], [5, 1.0], [Infinity, 1.15]),
  },
  "service-business": {
    key: "active_clients",
    label: QUICK_STAT_LABELS.active_clients,
    placeholder: "e.g. 15",
    helpText: "More active clients means more diversified, durable revenue.",
    tiers: tiers([5, 0.95], [20, 1.0], [Infinity, 1.08]),
  },
  "digital-agencies": {
    key: "active_clients",
    label: QUICK_STAT_LABELS.active_clients,
    placeholder: "e.g. 15",
    helpText: "More active clients means more diversified, durable revenue.",
    tiers: tiers([5, 0.95], [20, 1.0], [Infinity, 1.08]),
  },
  newsletters: {
    key: "subscribers",
    label: QUICK_STAT_LABELS.subscribers,
    placeholder: "e.g. 5000",
    helpText: "A larger subscriber list supports a higher multiple.",
    tiers: tiers([1000, 0.95], [10000, 1.0], [Infinity, 1.08]),
  },
  "crypto-blockchain": {
    key: "monthly_visitors",
    label: QUICK_STAT_LABELS.monthly_visitors,
    placeholder: "e.g. 25000",
    helpText: "More consistent traffic supports a higher multiple.",
    tiers: tiers([5000, 0.95], [50000, 1.0], [Infinity, 1.08]),
  },
  "startup-business": {
    key: "funding_raised",
    label: QUICK_STAT_LABELS.funding_raised,
    placeholder: "e.g. 50000 (0 if none)",
    helpText: "Prior funding is a signal of outside validation, not a guarantee of a higher price.",
    tiers: tiers([0, 1.0], [Infinity, 1.05]),
  },
};

function categoryMetricFactor(categoryId: string, value: number | undefined): number {
  const config = CATEGORY_METRICS[categoryId];
  if (!config || value === undefined || value === null || Number.isNaN(value)) return 1.0;
  const clamped = Math.max(0, value);
  const tier = config.tiers.find((t) => clamped <= t.max);
  return tier?.factor ?? 1.0;
}

export function getCategoryMetricConfig(categoryId: string): CategoryMetricConfig | null {
  return CATEGORY_METRICS[categoryId] ?? null;
}

// A conservative revenue-based fallback for a break-even or pre-profit
// business (annual profit <= 0, but there's still real revenue to point
// to), and an absolute floor shown when there's no financial signal at all
// (e.g. a domain, or a brand-new listing with $0 everywhere) — small
// numbers on purpose, so the tool never reads as promising a price for an
// asset it has nothing to base one on.
const REVENUE_FALLBACK_MULTIPLE: ValuationMultiple = { low: 1, high: 2 };
const NO_SIGNAL_FLOOR: ValuationMultiple = { low: 500, high: 5000 };

export interface ValuationInput {
  categoryId: string;
  monthlyRevenue: number;
  monthlyProfit: number;
  businessAgeYears: number;
  // The one category-specific Quick Stat collected on the form (see
  // CATEGORY_METRICS above) — undefined for a category with no configured
  // metric, or if the seller left it blank.
  categoryMetricValue?: number;
}

export type ValuationBasis = "profit" | "revenue" | "floor";

export interface ValuationResult {
  low: number;
  high: number;
  basis: ValuationBasis;
}

// A business under a year old hasn't yet proven its numbers hold up over
// time; one running 3+ years has — a modest +/-10% swing applied to the
// multiple only, never to the revenue/profit figures the seller entered.
function ageFactor(years: number): number {
  if (years < 1) return 0.9;
  if (years >= 3) return 1.1;
  return 1.0;
}

function roundToHundred(n: number): number {
  return Math.round(n / 100) * 100;
}

export function estimateValuation(input: ValuationInput): ValuationResult {
  const annualRevenue = Math.max(0, input.monthlyRevenue) * 12;
  const annualProfit = Math.max(0, input.monthlyProfit) * 12;
  const multiple = CATEGORY_MULTIPLES[input.categoryId] ?? DEFAULT_MULTIPLE;

  // Age and the category-specific signal are two independent, modest
  // adjustments on the same multiple — combined and then clamped to a
  // +/-25% band overall, so two "high" signals together (e.g. a mature
  // business with a large audience) can't compound into an implausible
  // swing the way multiplying two +10-15% factors uncapped could.
  const combinedFactor = Math.min(
    1.25,
    Math.max(0.75, ageFactor(Math.max(0, input.businessAgeYears)) * categoryMetricFactor(input.categoryId, input.categoryMetricValue))
  );

  if (annualProfit > 0 && multiple.high > 0) {
    return {
      low: roundToHundred(annualProfit * multiple.low * combinedFactor),
      high: roundToHundred(annualProfit * multiple.high * combinedFactor),
      basis: "profit",
    };
  }

  if (annualRevenue > 0) {
    return {
      low: roundToHundred(annualRevenue * REVENUE_FALLBACK_MULTIPLE.low * combinedFactor),
      high: roundToHundred(annualRevenue * REVENUE_FALLBACK_MULTIPLE.high * combinedFactor),
      basis: "revenue",
    };
  }

  return {
    low: roundToHundred(NO_SIGNAL_FLOOR.low * combinedFactor),
    high: roundToHundred(NO_SIGNAL_FLOOR.high * combinedFactor),
    basis: "floor",
  };
}

export function valuationCategoryOptions(): { id: string; name: string }[] {
  return Object.values(CATEGORY_MAP).map((c) => ({ id: c.id, name: c.name }));
}

// Business-age buckets shown on the form — plain years under the hood so
// estimateValuation() above stays a single numeric input, but a seller
// thinks in "under a year" / "3+ years", not a slider.
export const BUSINESS_AGE_OPTIONS: { value: number; label: string }[] = [
  { value: 0.25, label: "Under 6 months" },
  { value: 0.75, label: "6–12 months" },
  { value: 2, label: "1–3 years" },
  { value: 4, label: "3+ years" },
];
