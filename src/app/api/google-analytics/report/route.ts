import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshAccessToken, runGa4Report, type Ga4DateRange } from "@/lib/google-analytics";

export const dynamic = "force-dynamic";

const PRESET_LABELS: Record<string, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
};
const PRESET_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 };

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function resolveDateRange(
  range: string | null,
  start: string | null,
  end: string | null
): { dateRange: Ga4DateRange; label: string } | null {
  if (range && range in PRESET_DAYS) {
    return { dateRange: { startDate: `${PRESET_DAYS[range]}daysAgo`, endDate: "today" }, label: PRESET_LABELS[range] };
  }

  if (range === "custom" && start && end && isValidIsoDate(start) && isValidIsoDate(end)) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(today.getFullYear() - 2);

    if (startDate > endDate) return null;
    if (endDate.getTime() > today.getTime() + 24 * 60 * 60 * 1000) return null; // small slack for TZ rounding
    if (startDate < twoYearsAgo) return null; // keep custom lookback bounded

    return { dateRange: { startDate: start, endDate: end }, label: `${start} – ${end}` };
  }

  return null;
}

// On-demand GA4 report for an arbitrary date range, so the public listing
// page's live panel can offer the same 7/30/90-day, 12-month, and custom
// range picker Motion Invest's own dashboards do. The periodic sync
// (src/lib/data/ga-sync.server.ts) only ever stores one fixed 90-day
// snapshot in listing_ga_public_stats — any other window is fetched live
// from Google here instead, rather than trying to derive it from that
// stored snapshot.
//
// Public (no auth) when the listing is published — the same visibility
// rule listing_ga_public_stats' own RLS policy already enforces for the
// synced snapshot — or when the requester is the listing's own seller, so
// a seller can preview this panel before publishing. Never returns tokens;
// goes through the admin client + explicit checks for the same reason
// /api/google-analytics/status does (listing_ga_connections has no RLS
// policies at all by design, since it holds OAuth tokens).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const listingId = url.searchParams.get("listingId");
  const range = url.searchParams.get("range");
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  if (!listingId) {
    return NextResponse.json({ error: "Missing listingId." }, { status: 400 });
  }

  const resolved = resolveDateRange(range, start, end);
  if (!resolved) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 503 });

  const { data: listing } = await admin
    .from("listings")
    .select("id, status, seller_id")
    .eq("id", listingId)
    .single();

  if (!listing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  let authorized = listing.status === "published";
  if (!authorized) {
    const supabase = await createClient();
    const { data: userData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    authorized = userData.user?.id === listing.seller_id;
  }
  if (!authorized) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { data: connection } = await admin
    .from("listing_ga_connections")
    .select("ga_property_id, refresh_token, status")
    .eq("listing_id", listingId)
    .single();

  if (!connection?.ga_property_id || !connection.refresh_token || connection.status !== "active") {
    return NextResponse.json({ error: "This listing isn't connected to Google Analytics." }, { status: 404 });
  }

  try {
    const fresh = await refreshAccessToken(connection.refresh_token);
    const report = await runGa4Report(connection.ga_property_id, fresh.access_token, resolved.dateRange);

    // Opportunistically keep the stored access token fresh too, so the next
    // periodic sync (or another live report call) starts from a live-ish
    // token. Best-effort — awaited so it completes before the function
    // returns on serverless, but its failure shouldn't fail this response
    // since the report itself already succeeded.
    await admin
      .from("listing_ga_connections")
      .update({
        access_token: fresh.access_token,
        token_expires_at: new Date(Date.now() + fresh.expires_in * 1000).toISOString(),
      })
      .eq("listing_id", listingId)
      .then(
        () => {},
        () => {}
      );

    return NextResponse.json({
      dateRangeLabel: resolved.label,
      pageViews: report.pageViews,
      uniqueVisitors: report.uniqueVisitors,
      sessions: report.sessions,
      bounceRate: report.bounceRate,
      avgSessionSeconds: report.avgSessionSeconds,
      dailyPageViews: report.dailyPageViews,
      trafficAcquisition: report.trafficAcquisition,
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't load Google Analytics data for this range.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
