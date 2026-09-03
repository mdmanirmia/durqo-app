export function fmtUSD(n: number | undefined | null): string {
  if (n === undefined || n === null) return "—";
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function fmtNumber(n: number | undefined | null): string {
  if (n === undefined || n === null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

// Shortens a business URL for display (strips the protocol and a leading
// "www.", then truncates with an ellipsis past maxLen) without touching the
// underlying value used for the actual href — long URLs (a Facebook page,
// a deep e-commerce link, etc.) shouldn't blow out the listing header.
export function fmtDisplayUrl(url: string, maxLen = 42): string {
  const display = url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
  if (display.length <= maxLen) return display;
  return display.slice(0, maxLen - 1) + "…";
}

// Normalizes a stored business URL into a safe, absolute href — most rows
// already include the protocol, but this covers any that were saved as a
// bare domain.
export function toHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

const QUICK_STAT_MONEY = new Set(["monthly_income"]);
const QUICK_STAT_MULTIPLE = new Set(["income_multiple"]);
const QUICK_STAT_YEARS = new Set(["age", "channel_age"]);
const QUICK_STAT_PERCENT = new Set(["open_rate", "click_through_rate", "unsubscribe_rate"]);
const QUICK_STAT_COUNT = new Set([
  "monthly_visitors", "subscribers", "monthly_views", "total_videos", "total_posts",
  "likes_per_post", "views_per_post", "total_downloads", "total_reviews", "active_clients", "followers",
]);

// Formats a listing.quickStats value the same way regardless of which
// category it belongs to — money as $, counts abbreviated (12.4K), rates as
// %, multiples with an ×, ages in years, everything else (ratings, domain
// registrar/expiry strings, etc.) shown as-is.
export function formatQuickStat(key: string, value: number | string | undefined): string {
  if (value === undefined || value === null || value === "") return "—";
  if (QUICK_STAT_MONEY.has(key)) return fmtUSD(Number(value));
  if (QUICK_STAT_MULTIPLE.has(key)) return `${value}×`;
  if (QUICK_STAT_YEARS.has(key)) return `${value} yrs`;
  if (QUICK_STAT_PERCENT.has(key)) return `${value}%`;
  if (QUICK_STAT_COUNT.has(key)) return fmtNumber(Number(value));
  return String(value);
}
