// Durqo — "Estimated processing date" for a withdrawal request.
//
// Policy (site owner, Sep 13 2026): Durqo normally reviews and processes an
// eligible payout request within 3-5 business days of submission. This is
// an ESTIMATE, never a guaranteed arrival date — the destination bank or
// payout provider (bKash/Rocket/Nagad, PayPal, Wise, a bank transfer) can
// take additional time on top of Durqo's own processing.
//
// Rules, per the owner's explicit spec:
//  - Count from the first business day AFTER the request was submitted.
//  - Exclude Saturday and Sunday only — no public-holiday calendar, since
//    one isn't implemented (claiming to exclude holidays we don't actually
//    track would itself be an inaccurate statement to sellers).
//  - Pause the count entirely while the request sits in "action_required"
//    or "on_hold" — those states mean Durqo/the seller isn't actively
//    processing it, so business days spent there shouldn't count toward
//    the estimate.
//  - All timestamps are handled in UTC.
//  - Never label this a guaranteed date — every caller should show it as
//    "Estimated processing date", never "Guaranteed payment date" or similar.

export type WithdrawalStatus =
  | "requested"
  | "under_review"
  | "action_required"
  | "approved"
  | "processing"
  | "paid"
  | "on_hold"
  | "rejected"
  | "cancelled";

// Statuses where the processing clock is not running.
const PAUSED_STATUSES: ReadonlySet<WithdrawalStatus> = new Set(["action_required", "on_hold"]);
// Terminal statuses — no estimate is meaningful once a request lands here.
const TERMINAL_STATUSES: ReadonlySet<WithdrawalStatus> = new Set(["paid", "rejected", "cancelled"]);

const MIN_BUSINESS_DAYS = 3;
const MAX_BUSINESS_DAYS = 5;

function isWeekendUTC(d: Date): boolean {
  const day = d.getUTCDay();
  return day === 0 || day === 6; // Sunday, Saturday
}

function addUTCDays(d: Date, days: number): Date {
  const next = new Date(d.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

// Adds `count` business days (Mon-Fri, UTC) to `from`, starting the count
// on the first business day strictly after `from`.
function addBusinessDaysUTC(from: Date, count: number): Date {
  let cursor = addUTCDays(from, 1);
  let remaining = count;
  while (remaining > 0) {
    if (!isWeekendUTC(cursor)) remaining -= 1;
    if (remaining > 0) cursor = addUTCDays(cursor, 1);
  }
  return cursor;
}

export interface PayoutEtaResult {
  /** Earliest estimated processing date, or null if paused/terminal. */
  earliest: Date | null;
  /** Latest estimated processing date, or null if paused/terminal. */
  latest: Date | null;
  /** True while the request is action_required/on_hold — clock is paused. */
  paused: boolean;
  /** True once the request has reached a terminal status. */
  settled: boolean;
}

// requestedAt: when the withdrawal was originally submitted (never changes).
// status: the request's CURRENT status.
// pausedBusinessDays: how many business days have already elapsed while the
//   request sat in action_required/on_hold at some point in its history —
//   pass 0 if it has never been paused. Callers computing this from
//   withdrawal_status_history should sum the business days between each
//   on_hold/action_required entry and the entry that moved it back out.
export function estimatePayoutProcessingDate(
  requestedAt: Date,
  status: WithdrawalStatus,
  pausedBusinessDays = 0
): PayoutEtaResult {
  if (TERMINAL_STATUSES.has(status)) {
    return { earliest: null, latest: null, paused: false, settled: true };
  }
  if (PAUSED_STATUSES.has(status)) {
    return { earliest: null, latest: null, paused: true, settled: false };
  }

  const earliest = addBusinessDaysUTC(requestedAt, MIN_BUSINESS_DAYS + pausedBusinessDays);
  const latest = addBusinessDaysUTC(requestedAt, MAX_BUSINESS_DAYS + pausedBusinessDays);
  return { earliest, latest, paused: false, settled: false };
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

// Renders the estimate as seller-facing copy. Always says "Estimated" —
// never implies a guarantee — and explicitly names the paused/settled
// cases instead of showing a stale or misleading date range.
export function fmtPayoutEta(result: PayoutEtaResult): string {
  if (result.settled) return "—";
  if (result.paused) return "Paused — awaiting resolution";
  if (!result.earliest || !result.latest) return "—";
  return `Estimated ${fmtDate(result.earliest)} – ${fmtDate(result.latest)}`;
}
