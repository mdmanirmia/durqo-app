import "server-only";

// SERVER-ONLY Google OAuth + GA4 Data API helpers, same guarded pattern as
// src/lib/stripe.ts: every function that needs credentials returns null /
// throws a clear "not configured" error until GOOGLE_OAUTH_CLIENT_ID and
// GOOGLE_OAUTH_CLIENT_SECRET are set, so the app still builds and runs
// before those are configured.
//
// We talk to Google directly over fetch (no `googleapis` SDK dependency —
// it's a large package and we only need three endpoints) using the OAuth
// "authorization code" flow with `access_type=offline` so we get a
// refresh_token back, which is what lets the sync route pull fresh numbers
// on an ongoing basis without the seller re-authenticating every time.
//
// Scope used: https://www.googleapis.com/auth/analytics.readonly — a
// Google "sensitive scope" that requires OAuth consent-screen verification
// once the app is out of Testing mode with more than 100 test users (see
// the project doc for the exact setup steps given to the user). No API
// usage fees either way — the GA4 Data API is free within its standard
// quota.

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const GA_ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta";
const GA_DATA_API = "https://analyticsdata.googleapis.com/v1beta";
const GA_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
}

export function getGoogleOAuthConfig(): GoogleOAuthConfig | null {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

// The redirect URI Google sends the browser back to after consent. Must be
// registered byte-for-byte in the Google Cloud Console OAuth client's
// "Authorized redirect URIs" list.
export function getRedirectUri(origin: string): string {
  return `${origin}/api/google-analytics/callback`;
}

// `state` carries only the listingId (URL-safe) — we deliberately don't
// sign it. Tampering with it can only redirect the OAuth grant at a
// *different* listingId, and the callback route always re-checks that the
// currently-logged-in seller actually owns whatever listingId comes back,
// so a forged state can't attach a connection to a listing the requester
// doesn't own.
export function buildGoogleAuthUrl(origin: string, listingId: string): string {
  const config = getGoogleOAuthConfig();
  if (!config) throw new Error("Google OAuth isn't configured yet.");

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: getRedirectUri(origin),
    response_type: "code",
    scope: GA_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state: listingId,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export async function exchangeCodeForTokens(origin: string, code: string): Promise<TokenResponse> {
  const config = getGoogleOAuthConfig();
  if (!config) throw new Error("Google OAuth isn't configured yet.");

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: getRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const config = getGoogleOAuthConfig();
  if (!config) throw new Error("Google OAuth isn't configured yet.");

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${await res.text()}`);
  return res.json();
}

export async function revokeToken(token: string): Promise<void> {
  await fetch(`${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: "POST" }).catch(() => {
    // Best-effort — a failed revoke shouldn't block disconnecting on our side.
  });
}

export interface Ga4Property {
  propertyId: string;       // "properties/123456789"
  propertyDisplayName: string;
  accountDisplayName: string;
}

// Lists every GA4 property the just-authorized Google account can see, so
// the seller can pick the right one when they manage more than one site.
export async function listGa4Properties(accessToken: string): Promise<Ga4Property[]> {
  const res = await fetch(`${GA_ADMIN_API}/accountSummaries?pageSize=200`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Couldn't list Google Analytics properties: ${await res.text()}`);
  const data = await res.json();

  const properties: Ga4Property[] = [];
  for (const account of data.accountSummaries ?? []) {
    for (const p of account.propertySummaries ?? []) {
      properties.push({
        propertyId: p.property, // already "properties/123..."
        propertyDisplayName: p.displayName,
        accountDisplayName: account.displayName,
      });
    }
  }
  return properties;
}

export interface Ga4ReportSummary {
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
  bounceRate: number; // percent, 0-100
  avgSessionSeconds: number;
  dailyPageViews: { date: string; value: number }[];
  trafficAcquisition: { channel: string; sessions: number }[];
}

// One runReport call for the summary tiles + daily page-views series, one
// for the channel breakdown — matches the metrics Flippa's own integration
// docs list (Users, Page Views, Pages/Session, Avg. Session Duration,
// Bounce Rate) plus the "Traffic Acquisition" panel from the reference
// screenshot.
export async function runGa4Report(propertyId: string, accessToken: string, days = 90): Promise<Ga4ReportSummary> {
  const dateRange = { startDate: `${days}daysAgo`, endDate: "today" };

  async function runReport(body: Record<string, unknown>) {
    const res = await fetch(`${GA_DATA_API}/${propertyId}:runReport`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Google Analytics report failed: ${await res.text()}`);
    return res.json();
  }

  const [totals, daily, channels] = await Promise.all([
    runReport({
      dateRanges: [dateRange],
      metrics: [
        { name: "screenPageViews" },
        { name: "totalUsers" },
        { name: "sessions" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
    }),
    runReport({
      dateRanges: [dateRange],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    runReport({
      dateRanges: [dateRange],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: "8",
    }),
  ]);

  const totalRow = totals.rows?.[0]?.metricValues ?? [];
  const [pageViews, uniqueVisitors, sessions, bounceRate, avgSession] = totalRow.map(
    (v: { value: string }) => Number(v.value) || 0
  );

  const dailyPageViews = (daily.rows ?? []).map((r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
    date: formatGaDate(r.dimensionValues[0].value),
    value: Number(r.metricValues[0].value) || 0,
  }));

  const trafficAcquisition = (channels.rows ?? []).map((r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
    channel: r.dimensionValues[0].value,
    sessions: Number(r.metricValues[0].value) || 0,
  }));

  return {
    pageViews,
    uniqueVisitors,
    sessions,
    bounceRate: Math.round(bounceRate * 100 * 10) / 10, // GA4 returns a 0-1 fraction
    avgSessionSeconds: Math.round(avgSession),
    dailyPageViews,
    trafficAcquisition,
  };
}

// GA4 returns dates as "20260603" — reformat to "2026-06-03" for our charts.
function formatGaDate(raw: string): string {
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}
