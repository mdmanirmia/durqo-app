// Oct 8, 2026 ("eita dynamic hobe always last 12 month hobe"): the Proof of
// Income month grid on the seller create and edit listing forms used to be
// a hardcoded Sep 2025 - Aug 2026 list, so it went stale as soon as the
// calendar moved on. This returns the last 12 *completed* months, oldest
// first, ending with the month before the current one (on Oct 8, 2026 that
// is Oct 2025 - Sep 2026).
//
// Computed in UTC so the server render and the browser render of these
// client forms always agree on the window (no hydration mismatch for a
// seller in a timezone that has already rolled into the next month).
// Rows are still stored in listing_monthly_stats by their real first-of-
// month date ("2025-10-01"), so existing listings' data keeps its correct
// month however the window moves.
import { useMemo, useSyncExternalStore } from "react";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface IncomeMonth {
  key: string; // "YYYY-MM-01", the value stored in listing_monthly_stats.month
  label: string; // "Oct 2025"
}

export function lastTwelveIncomeMonths(now: Date = new Date()): IncomeMonth[] {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-11, the current (incomplete) month
  const months: IncomeMonth[] = [];
  for (let back = 12; back >= 1; back--) {
    const d = new Date(Date.UTC(year, month - back, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    months.push({
      key: `${y}-${String(m + 1).padStart(2, "0")}-01`,
      label: `${MONTH_NAMES[m]} ${y}`,
    });
  }
  return months;
}

// For client components that may be statically prerendered (the seller
// "new listing" page is built as static HTML): returns null during the
// server render and hydration, then the live window computed in the
// browser. Prevents a build-time month list from being baked into the page.
// Uses useSyncExternalStore (no setState-in-effect) with a primitive "YYYY-MM"
// snapshot so it stays referentially stable between renders.
const noopSubscribe = () => () => {};
function currentMonthSnapshot() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function useIncomeMonths(): IncomeMonth[] | null {
  const ym = useSyncExternalStore(noopSubscribe, currentMonthSnapshot, () => null);
  return useMemo(() => {
    if (!ym) return null;
    const [y, m] = ym.split("-").map(Number);
    return lastTwelveIncomeMonths(new Date(Date.UTC(y, m - 1, 15)));
  }, [ym]);
}
