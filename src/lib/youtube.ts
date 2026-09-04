import "server-only";

// SERVER-ONLY YouTube Data API v3 client, authenticated with a plain API
// key (no OAuth flow — a video's title/views/likes/duration/upload date are
// all public metadata, the same trust level as the no-key thumbnail trick
// already used by youtubeThumbnailUrl() in src/lib/format.ts). Returns null
// until YOUTUBE_API_KEY is set (same guarded-factory pattern as
// src/lib/stripe.ts / src/lib/google-analytics.ts's getGoogleOAuthConfig())
// so the app still builds and runs, and the Top Performing Videos form
// fields just fall back to manual entry, before the key is configured.
//
// Cost: videos.list costs 1 quota unit per call (up to 50 ids per call)
// against the API's free 10,000-units/day quota — no billing account
// needed. A seller filling in 5 video rows costs 5 units; effectively free
// at this app's scale.
export function getYoutubeApiKey(): string | null {
  return process.env.YOUTUBE_API_KEY || null;
}

export interface YoutubeVideoInfo {
  title: string;
  views: number | null;
  likes: number | null;
  duration: string; // "MM:SS" or "H:MM:SS", matching this form's existing "12:18" style
  publishedOn: string; // "YYYY-MM-DD"
}

// Converts YouTube's ISO 8601 duration (e.g. "PT18M42S", "PT1H5M9S",
// "PT45S") into the plain text the Top Performing Videos Duration field
// already expects.
function formatIso8601Duration(iso: string): string {
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return "";
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Looks up a single YouTube video's public metadata via videos.list.
// Returns null if the key isn't configured, the video doesn't exist, or the
// request fails for any reason — callers should degrade to manual entry
// rather than surface a hard error over a nice-to-have auto-fill.
export async function fetchYoutubeVideoInfo(videoId: string): Promise<YoutubeVideoInfo | null> {
  const apiKey = getYoutubeApiKey();
  if (!apiKey) return null;

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${encodeURIComponent(videoId)}&key=${apiKey}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }
  if (!res.ok) return null;

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return null;
  }

  const item = (data as { items?: unknown[] })?.items?.[0] as
    | { snippet?: Record<string, unknown>; statistics?: Record<string, unknown>; contentDetails?: Record<string, unknown> }
    | undefined;
  if (!item) return null;

  const snippet = item.snippet ?? {};
  const statistics = item.statistics ?? {};
  const contentDetails = item.contentDetails ?? {};

  return {
    title: typeof snippet.title === "string" ? snippet.title : "",
    views: statistics.viewCount !== undefined ? Number(statistics.viewCount) : null,
    likes: statistics.likeCount !== undefined ? Number(statistics.likeCount) : null,
    duration: typeof contentDetails.duration === "string" ? formatIso8601Duration(contentDetails.duration) : "",
    publishedOn: typeof snippet.publishedAt === "string" ? snippet.publishedAt.slice(0, 10) : "",
  };
}
