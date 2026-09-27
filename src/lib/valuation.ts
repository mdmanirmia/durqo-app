// Shared "Free Valuation" calculator (Sep 27, 2026 build — see
// claude/free-valuation-lead-gen-addendum.md for the full brief).
//
// This is a single universal model applied the same way to every category:
// an illustrative range built from a category-typical multiple of annual
// profit, nudged a little by how long the business has been operating.
// It is deliberately NOT a deep, per-category-field appraisal (Durqo's 15
// categories collect wildly different data — subscriber counts, domain
// age, store ratings — and reconciling all of that into one trustworthy
// number is a much bigger project than a lead-gen tool needs). Every place
// this number is shown says plainly that it's an estimate, not an
// appraisal or an offer — same spirit as the static "illustrative example"
// card this feature replaces on /sell.
import { CATEGORY_MAP } from "@/lib/categories";

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
  const factor = ageFactor(Math.max(0, input.businessAgeYears));
  const multiple = CATEGORY_MULTIPLES[input.categoryId] ?? DEFAULT_MULTIPLE;

  if (annualProfit > 0 && multiple.high > 0) {
    return {
      low: roundToHundred(annualProfit * multiple.low * factor),
      high: roundToHundred(annualProfit * multiple.high * factor),
      basis: "profit",
    };
  }

  if (annualRevenue > 0) {
    return {
      low: roundToHundred(annualRevenue * REVENUE_FALLBACK_MULTIPLE.low * factor),
      high: roundToHundred(annualRevenue * REVENUE_FALLBACK_MULTIPLE.high * factor),
      basis: "revenue",
    };
  }

  return { low: NO_SIGNAL_FLOOR.low, high: NO_SIGNAL_FLOOR.high, basis: "floor" };
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
