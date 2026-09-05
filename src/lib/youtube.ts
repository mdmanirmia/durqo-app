import "server-only";
import { extractYoutubeChannelIdentifier } from "@/lib/format";

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

// --- Channel Overview -------------------------------------------------
//
// Powers two things from a single Channel URL lookup: (1) auto-filling the
// existing manual "Channel Statistics" fields (Total Subscribers, Total
// Views, Total Videos, Channel Age), and (2) the full "YouTube Channel
// Overview" panel shown on the published listing page (identity + 7 stat
// cards, including three derived from the channel's last 10 uploads).
//
// Cost per lookup: channels.list (1 unit) + playlistItems.list (1 unit) +
// videos.list for up to 10 recent ids (1 unit) = 3 units, against the same
// free 10,000-units/day quota already configured for video auto-fill.

export interface YoutubeChannelOverview {
  channelTitle: string;
  channelHandle: string | null; // "@name", without the @ stripped
  channelAvatarUrl: string | null;
  channelCreatedOn: string; // "YYYY-MM-DD"
  subscribers: number | null;
  totalViews: number | null;
  totalVideos: number | null;
  channelAgeYears: number | null;
  avgViewsPerVideo: number | null; // lifetime: totalViews / totalVideos
  recentAvgViews: number | null; // last up to 10 uploads
  recentAvgLikes: number | null; // last up to 10 uploads
  engagementRatePercent: number | null; // recent avg likes / recent avg views * 100
}

type ChannelListItem = {
  snippet?: Record<string, unknown>;
  statistics?: Record<string, unknown>;
  contentDetails?: Record<string, unknown>;
};

// Logs *why* a channels.list lookup failed (bad/missing key, quota
// exhausted, handle no longer resolving, etc.) instead of the old
// swallow-everything-into-null behavior, which made every failure show up
// identically as the generic "Couldn't fetch channel details from
// YouTube." with no way to tell the causes apart from Vercel's logs.
async function fetchChannelListItem(apiKey: string, identifier: { type: "id" | "handle"; value: string }): Promise<ChannelListItem | null> {
  const param = identifier.type === "id" ? `id=${encodeURIComponent(identifier.value)}` : `forHandle=${encodeURIComponent(identifier.value)}`;
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&${param}&key=${apiKey}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    console.error(`[youtube] channels.list network error for ${identifier.type}=${identifier.value}:`, err);
    return null;
  }
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    console.error(`[youtube] channels.list failed (${res.status} ${res.statusText}) for ${identifier.type}=${identifier.value}: ${bodyText}`);
    return null;
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch (err) {
    console.error(`[youtube] channels.list returned invalid JSON for ${identifier.type}=${identifier.value}:`, err);
    return null;
  }

  const item = (data as { items?: unknown[] })?.items?.[0] as ChannelListItem | undefined;
  if (!item) {
    console.error(`[youtube] channels.list returned no items for ${identifier.type}=${identifier.value}`);
  }
  return item ?? null;
}

// Builds the "basic info" shape from an already-fetched channels.list item —
// shared by fetchYoutubeChannelBasicInfo (which fetches its own item) and
// fetchYoutubeChannelOverview (which reuses the item it already fetched,
// instead of making a second, redundant channels.list call for the same
// channel).
function buildBasicInfoFromItem(item: ChannelListItem): YoutubeChannelOverview {
  const snippet = item.snippet ?? {};
  const statistics = item.statistics ?? {};

  const publishedOn = typeof snippet.publishedAt === "string" ? snippet.publishedAt.slice(0, 10) : "";
  const channelAgeYears = publishedOn
    ? Math.max(0, Math.floor((Date.now() - new Date(publishedOn).getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
    : null;

  const totalViews = statistics.viewCount !== undefined ? Number(statistics.viewCount) : null;
  const totalVideos = statistics.videoCount !== undefined ? Number(statistics.videoCount) : null;

  const thumbnails = snippet.thumbnails as { default?: { url?: string }; medium?: { url?: string } } | undefined;
  const customUrl = typeof snippet.customUrl === "string" ? snippet.customUrl : null;

  return {
    channelTitle: typeof snippet.title === "string" ? snippet.title : "",
    channelHandle: customUrl ? (customUrl.startsWith("@") ? customUrl : `@${customUrl}`) : null,
    channelAvatarUrl: thumbnails?.medium?.url ?? thumbnails?.default?.url ?? null,
    channelCreatedOn: publishedOn,
    subscribers: statistics.hiddenSubscriberCount ? null : statistics.subscriberCount !== undefined ? Number(statistics.subscriberCount) : null,
    totalViews,
    totalVideos,
    channelAgeYears,
    avgViewsPerVideo: totalViews !== null && totalVideos ? Math.round(totalViews / totalVideos) : null,
    recentAvgViews: null,
    recentAvgLikes: null,
    engagementRatePercent: null,
  };
}

// Looks up just the basic, always-available channel fields (title, handle,
// avatar, created date, subscribers, total views, total videos, age) — used
// to auto-fill the 4 existing manual Channel Statistics inputs quickly, and
// as the first half of the full overview lookup below.
export async function fetchYoutubeChannelBasicInfo(channelUrl: string): Promise<YoutubeChannelOverview | null> {
  const apiKey = getYoutubeApiKey();
  if (!apiKey) return null;

  const identifier = extractYoutubeChannelIdentifier(channelUrl);
  if (!identifier) return null;

  const item = await fetchChannelListItem(apiKey, identifier);
  if (!item) return null;

  return buildBasicInfoFromItem(item);
}

// Full overview: basic info plus the three "recent" stats derived from the
// channel's last (up to) 10 uploads — Recent Avg Views, Recent Avg Likes,
// and Engagement Rate (avg likes / avg views on those same recent videos).
export async function fetchYoutubeChannelOverview(channelUrl: string): Promise<YoutubeChannelOverview | null> {
  const apiKey = getYoutubeApiKey();
  if (!apiKey) return null;

  const identifier = extractYoutubeChannelIdentifier(channelUrl);
  if (!identifier) return null;

  const item = await fetchChannelListItem(apiKey, identifier);
  if (!item) return null;

  // Built from the item already fetched above — previously this made a
  // second, redundant channels.list call (fetchYoutubeChannelBasicInfo did
  // its own identifier extraction + fetch for the same channel), doubling
  // quota usage per lookup and doubling the chance of a transient failure
  // making the whole overview lookup fail.
  const basic = buildBasicInfoFromItem(item);

  const contentDetails = item.contentDetails ?? {};
  const relatedPlaylists = contentDetails.relatedPlaylists as { uploads?: string } | undefined;
  const uploadsPlaylistId = relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) return basic;

  try {
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${encodeURIComponent(uploadsPlaylistId)}&maxResults=10&key=${apiKey}`;
    const playlistRes = await fetch(playlistUrl);
    if (!playlistRes.ok) return basic;
    const playlistData = (await playlistRes.json()) as { items?: { contentDetails?: { videoId?: string } }[] };
    const videoIds = (playlistData.items ?? [])
      .map((i) => i.contentDetails?.videoId)
      .filter((id): id is string => !!id);
    if (videoIds.length === 0) return basic;

    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.join(",")}&key=${apiKey}`;
    const videosRes = await fetch(videosUrl);
    if (!videosRes.ok) return basic;
    const videosData = (await videosRes.json()) as { items?: { statistics?: { viewCount?: string; likeCount?: string } }[] };
    const stats = videosData.items ?? [];
    if (stats.length === 0) return basic;

    const views = stats.map((v) => Number(v.statistics?.viewCount ?? 0));
    const likes = stats.map((v) => Number(v.statistics?.likeCount ?? 0));
    const recentAvgViews = Math.round(views.reduce((a, b) => a + b, 0) / views.length);
    const recentAvgLikes = Math.round(likes.reduce((a, b) => a + b, 0) / likes.length);
    const engagementRatePercent = recentAvgViews > 0 ? Math.round((recentAvgLikes / recentAvgViews) * 10000) / 100 : null;

    return { ...basic, recentAvgViews, recentAvgLikes, engagementRatePercent };
  } catch {
    return basic;
  }
}
