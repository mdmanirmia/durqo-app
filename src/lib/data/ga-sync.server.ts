import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshAccessToken, runGa4Report } from "@/lib/google-analytics";

// Shared by the OAuth callback (first sync right after connecting) and the
// on-demand /api/google-analytics/sync route (re-sync button, and where a
// future scheduled job would hook in for the "auto-updates monthly"
// cadence Flippa's own integration uses). Always refreshes the access
// token first — GA4 access tokens are short-lived (~1hr), so a stored one
// is almost always stale by the time this runs.
export async function syncListingGaStats(listingId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Backend isn't connected yet.");

  const { data: connection } = await admin
    .from("listing_ga_connections")
    .select("ga_property_id, refresh_token")
    .eq("listing_id", listingId)
    .single();

  if (!connection?.ga_property_id || !connection.refresh_token) {
    throw new Error("This listing doesn't have a Google Analytics property selected yet.");
  }

  try {
    const fresh = await refreshAccessToken(connection.refresh_token);
    const report = await runGa4Report(connection.ga_property_id, fresh.access_token, 90);

    await admin
      .from("listing_ga_connections")
      .update({
        access_token: fresh.access_token,
        token_expires_at: new Date(Date.now() + fresh.expires_in * 1000).toISOString(),
        status: "active",
        error_message: null,
        last_synced_at: new Date().toISOString(),
      })
      .eq("listing_id", listingId);

    await admin.from("listing_ga_public_stats").upsert({
      listing_id: listingId,
      date_range_label: "Last 90 days",
      page_views: report.pageViews,
      unique_visitors: report.uniqueVisitors,
      sessions: report.sessions,
      bounce_rate: report.bounceRate,
      avg_session_seconds: report.avgSessionSeconds,
      daily_page_views: report.dailyPageViews,
      traffic_acquisition: report.trafficAcquisition,
      last_synced_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed.";
    await admin
      .from("listing_ga_connections")
      .update({ status: "error", error_message: message })
      .eq("listing_id", listingId);
    throw err;
  }
}
