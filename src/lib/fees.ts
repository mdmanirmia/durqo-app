// Single authoritative source for Durqo's seller Success Fee schedule.
//
// Two earlier redesign passes (see claude/sell-page-redesign-addendum.md and
// claude/homepage-redesign-addendum.md) each independently found that
// /terms's legal fee table (10%/8%/5%/3% at $50k/$100k/$500k) had drifted
// from the fee schedule actually used everywhere else — /sell, the
// homepage's seller panel, and the /contact FAQ, which all agree on a
// three-tier 10%/7%/5% schedule. Both passes flagged the conflict and left
// /terms untouched, deferring to the site owner. The Sep 2026 Terms-page
// rebuild resolved it: the owner confirmed 10%/7%/5% is correct, and this
// module is now the one place that schedule is defined, so every page that
// quotes a Success Fee number imports it from here instead of hardcoding it.
//
// Policy, confirmed by the site owner (Sep 6, 2026):
//   - Final Sale Price under $50,000            -> 10%
//   - Final Sale Price $50,000 to $250,000       -> 7%  (inclusive both ends)
//   - Final Sale Price over $250,000             -> 5%
// The applicable rate applies to the ENTIRE final sale price — this is a
// flat lookup, never a marginal/progressive calculation like a tax bracket.
//
// Scope note: this module is display/calculation logic only (Terms copy,
// Sell-page pricing tiers, homepage seller panel, Contact FAQ, and the
// worked examples on /terms). It is NOT wired into the actual Stripe
// checkout or webhook code — Durqo doesn't yet have an automated seller
// payout step (see claude/build-plan-and-decisions.md, "Payments / Escrow /
// Withdrawals": seller payout is still a manual admin queue), so there is no
// live code path today where a Success Fee is actually deducted
// automatically. Wiring this into real money movement is a separate,
// explicitly-approved change, not something a Terms-page redesign should do
// silently.
export const SUCCESS_FEE_POLICY_VERSION = "2026-09-06";

// `max` is the inclusive upper bound of each tier EXCEPT the first, whose
// upper bound ($50,000 exactly) is owned by the *next* tier — see the
// explicit boundary rule under successFeeRate() below. Kept as data (rather
// than only as inline if/else logic) so the display tables on /terms and
// /sell can render the same three rows the calculator actually uses.
export const SUCCESS_FEE_TIERS = [
  { id: "under-50k", label: "Under $50,000", max: 50_000, rate: 0.10 },
  { id: "50k-250k", label: "$50,000 – $250,000", max: 250_000, rate: 0.07 },
  { id: "over-250k", label: "Over $250,000", max: Infinity, rate: 0.05 },
] as const;

export const SUCCESS_FEE_MIN_RATE = 0.05;
export const SUCCESS_FEE_MAX_RATE = 0.10;

/** "5–10%" — the range quoted in short-form marketing copy. */
export const SUCCESS_FEE_RANGE_LABEL = `${Math.round(SUCCESS_FEE_MIN_RATE * 100)}–${Math.round(
  SUCCESS_FEE_MAX_RATE * 100
)}%`;

/**
 * Looks up the flat Success Fee rate for a given final sale price.
 *
 * Boundary rule (confirmed by the site owner, Sep 6, 2026):
 *   $49,999.99 -> 10%   (strictly under $50,000)
 *   $50,000.00 -> 7%    (the $50k boundary belongs to the middle tier)
 *   $250,000.00 -> 7%   (the $250k boundary still belongs to the middle tier)
 *   $250,000.01 -> 5%   (strictly over $250,000)
 */
export function successFeeRate(finalSalePrice: number): number {
  if (finalSalePrice < SUCCESS_FEE_TIERS[0].max) return SUCCESS_FEE_TIERS[0].rate;
  if (finalSalePrice <= SUCCESS_FEE_TIERS[1].max) return SUCCESS_FEE_TIERS[1].rate;
  return SUCCESS_FEE_TIERS[2].rate;
}

export interface SuccessFeeBreakdown {
  priceCents: number;
  rate: number;
  feeCents: number;
  netCents: number;
  policyVersion: string;
  calculatedAt: string;
}

// Cents-based integer math so this never drifts the way naive
// floating-point percentage math can (e.g. 0.1 + 0.2 !== 0.3) — every
// amount is rounded to the nearest cent exactly once, at the end.
function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Decimal-safe Success Fee calculation for a given final sale price.
 * `at` is injectable for tests; real callers should omit it.
 */
export function computeSuccessFee(finalSalePrice: number, at: Date = new Date()): SuccessFeeBreakdown {
  const priceCents = toCents(finalSalePrice);
  const rate = successFeeRate(finalSalePrice);
  const feeCents = Math.round(priceCents * rate);
  const netCents = priceCents - feeCents;
  return {
    priceCents,
    rate,
    feeCents,
    netCents,
    policyVersion: SUCCESS_FEE_POLICY_VERSION,
    calculatedAt: at.toISOString(),
  };
}

export function fmtRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function centsToUSD(cents: number): number {
  return cents / 100;
}
