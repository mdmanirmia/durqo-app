import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncListingGaStats } from "@/lib/data/ga-sync.server";
import { fetchYoutubeChannelOverview } from "@/lib/youtube";

export const dynamic = "force-dynamic";
// Hobby-plan-safe ceiling (Vercel caps Hobby functions at 60s; Pro allows up
// to 300s). Raise this — and split the two loops below into separate cron
// routes if needed — once the number of connected GA listings + YouTube
// Channels listings grows enough that one run can't finish in 60s.
export const maxDuration = 60;

// Daily auto-sync (Sep 5 2026 request) — before this, both integrations only
// ever refreshed on a human action: Google Analytics synced once at
// OAuth-connect time and again only if a seller clicked the "Re-sync" button
// (see the original comment on syncListingGaStats, and the "future
// scheduled job" comment on /api/google-analytics/sync); YouTube channel
// stats (subscribers/views/videos/age, plus the Channel Analytics panel's
// identity + engagement fields) were fetched once, when a seller
// typed/blurred the Channel URL field on the listing form, and never again.
//
// This route re-runs both for every listing that has them, once a day.
// Triggered by Vercel Cron (see vercel.json's schedule) rather than
// CronCreate/CronList (those run inside a single dev session and don't
// survive a deploy). Guarded by CRON_SECRET so it can't be hit by anyone
// else — Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on
// cron-triggered requests once that env var is set in the project (see
// .env.example) — the route refuses to run at all if that var isn't set,
// rather than falling open.
//
// Each listing is synced independently inside its own try/catch so one
// failure (an expired refresh token, a channel that no longer resolves,
// YouTube quota exhaustion) never blocks the rest of the run — failures are
// still reported in the JSON response for visibility, and (for GA) already
// get written to listing_ga_connections.status by syncListingGaStats itself.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 500 });
  }

  // --- Google Analytics: every listing with a selected GA4 property and a
  // stored refresh token, regardless of current status — a listing sitting
  // in "error" status (e.g. a transient failure from yesterday) deserves a
  // retry today just as much as an "active" one does. syncListingGaStats
  // refreshes the access token itself and updates status/error_message.
  const gaResults: { listingId: string; ok: boolean; error?: string }[] = [];
  const { data: gaConnections, error: gaConnectionsError } = await admin
    .from("listing_ga_connections")
    .select("listing_id")
    .not("ga_property_id", "is", null)
    .not("refresh_token", "is", null);

  if (gaConnectionsError) {
    gaResults.push({ listingId: "(query)", ok: false, error: gaConnectionsError.message });
  } else {
    for (const conn of gaConnections ?? []) {
      try {
        await syncListingGaStats(conn.listing_id);
        gaResults.push({ listingId: conn.listing_id, ok: true });
      } catch (err) {
        gaResults.push({ listingId: conn.listing_id, ok: false, error: err instanceof Error ? err.message : "Sync failed." });
      }
    }
  }

  // --- YouTube Channels: every listing in this category with a Channel URL
  // saved. fetchYoutubeChannelOverview() is the same public-Data-API-v3 call
  // the Channel URL field's onBlur handler already uses — no OAuth involved,
  // just a fresh read of public channel metadata.
  const ytResults: { listingId: string; ok: boolean; error?: string }[] = [];
  const { data: ytListings, error: ytListingsError } = await admin
    .from("listings")
    .select("id, business_url")
    .eq("category_id", "youtube-channels")
    .not("business_url", "is", null);

  if (ytListingsError) {
    ytResults.push({ listingId: "(query)", ok: false, error: ytListingsError.message });
  } else {
    for (const listing of ytListings ?? []) {
      if (!listing.business_url) continue;
      try {
        const overview = await fetchYoutubeChannelOverview(listing.business_url);
        if (!overview) throw new Error("Couldn't fetch channel details from YouTube.");

        const { error: listingError } = await admin
          .from("listings")
          .update({
            ...(overview.subscribers != null ? { subscribers: overview.subscribers } : {}),
            ...(overview.totalViews != null ? { total_views: overview.totalViews } : {}),
            ...(overview.totalVideos != null ? { total_videos: overview.totalVideos } : {}),
            ...(overview.channelAgeYears != null ? { channel_age_years: overview.channelAgeYears } : {}),
          })
          .eq("id", listing.id);
        if (listingError) throw new Error(listingError.message);

        // Same upsert shape as the seller edit form's Channel Overview save
        // (src/lib/actions/listing-edit.ts) — last_synced_at drives the
        // "This data was updated on <date>" line on the public panel.
        const { error: overviewError } = await admin.from("listing_youtube_channel_overview").upsert(
          {
            listing_id: listing.id,
            channel_title: overview.channelTitle,
            channel_handle: overview.channelHandle,
            channel_avatar_url: overview.channelAvatarUrl,
            channel_created_on: overview.channelCreatedOn,
            avg_views_per_video: overview.avgViewsPerVideo,
            recent_avg_views: overview.recentAvgViews,
            recent_avg_likes: overview.recentAvgLikes,
            engagement_rate_percent: overview.engagementRatePercent,
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: "listing_id" }
        );
        if (overviewError) throw new Error(overviewError.message);

        revalidatePath(`/listing/${listing.id}`);
        ytResults.push({ listingId: listing.id, ok: true });
      } catch (err) {
        ytResults.push({ listingId: listing.id, ok: false, error: err instanceof Error ? err.message : "Sync failed." });
      }
    }
  }

  revalidatePath("/buy");
  revalidatePath("/");

  return NextResponse.json({
    ga: { total: gaResults.length, succeeded: gaResults.filter((r) => r.ok).length, results: gaResults },
    youtube: { total: ytResults.length, succeeded: ytResults.filter((r) => r.ok).length, results: ytResults },
  });
}
