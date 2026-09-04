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

// Parses a seller-typed duration ("1m 26s", "1m26s", "26s", "1:26", or a
// bare number of seconds) into a whole number of seconds — the storage
// format for ga_avg_engagement_seconds, matching what
// GoogleAnalyticsLivePanel's own fmtDuration() renders back out on the
// live-GA panel. Returns null when the text isn't a recognizable duration,
// so the caller can skip persisting it rather than saving a wrong number.
export function parseDurationToSeconds(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const colon = trimmed.match(/^(\d+):([0-5]?\d)$/);
  if (colon) return Number(colon[1]) * 60 + Number(colon[2]);

  const unitMatch = trimmed.match(/^(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?$/i);
  if (unitMatch && (unitMatch[1] !== undefined || unitMatch[2] !== undefined)) {
    return Number(unitMatch[1] ?? 0) * 60 + Number(unitMatch[2] ?? 0);
  }

  if (/^\d+$/.test(trimmed)) return Number(trimmed);

  return null;
}

// Reverse of parseDurationToSeconds() — renders a stored
// ga_avg_engagement_seconds value back into the "1m 26s" text an edit form
// pre-fills its input with, matching the format sellers are asked to type.
export function formatEngagementSeconds(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
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
  "monthly_visitors", "subscribers", "monthly_views", "total_views", "total_videos", "total_posts",
  "likes_per_post", "views_per_post", "total_downloads", "total_reviews", "active_clients", "followers",
]);

// Pulls the 11-character video id out of any YouTube video URL shape
// (watch, youtu.be, shorts, or embed links). Shared by youtubeThumbnailUrl()
// below (no API key needed for thumbnails) and by the server-side
// /api/youtube/video-info lookup (src/lib/youtube.ts) that auto-fills the
// Top Performing Videos form fields from a pasted URL.
export function extractYoutubeVideoId(videoUrl: string | null | undefined): string | null {
  if (!videoUrl) return null;
  const match = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/);
  return match ? match[1] : null;
}

// Extracts a thumbnail image URL straight from a YouTube video URL (watch,
// youtu.be, shorts, or embed links) via YouTube's own static thumbnail
// endpoint — no API key, and no separate image upload needed for the Top
// Performing Videos section (YouTube Channels category only).
export function youtubeThumbnailUrl(videoUrl: string | null | undefined): string | null {
  const id = extractYoutubeVideoId(videoUrl);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

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
