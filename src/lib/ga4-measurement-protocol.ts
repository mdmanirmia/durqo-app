import crypto from "crypto";

// Sep 27, 2026: server-side GA4 Measurement Protocol — POSTs a custom event
// straight to GA4 from this app's own backend, mirroring the reasoning in
// src/lib/meta-capi.ts (a direct API call from the relevant server action
// itself, rather than standing up a full server-side GTM container). The
// one call site today is "listing_approved", fired from setListingStatus()
// in dashboard/admin/actions.ts's pending_review -> published transition —
// an admin clicking Approve has no browser/gtag context of its own to fire
// a client-side event from, the same reason Purchase needs a server-side
// Conversions API call on the Meta side instead of a browser-side fbq().
// See claude/bangladesh-seller-acquisition-page-and-ad-copy-addendum.md for
// the funnel this event feeds: Ad Click -> Article View -> Sell CTA Click ->
// Listing Started -> Listing Submitted -> Listing Approved.
//
// Guarded-optional, same posture as sendMetaCapiEvent() above it and every
// other integration in this app: silently no-ops (console.error, never
// throws) when GA4_API_SECRET isn't set, so this is safe to call
// unconditionally, including in local dev and preview deploys where a
// Measurement Protocol API secret hasn't been generated yet.
// GA4_API_SECRET is a genuine secret (GA4 Admin -> Data Streams -> your web
// stream -> Measurement Protocol API secrets -> Create), added to Vercel by
// the site owner directly, never by Claude — same handling as
// META_CAPI_ACCESS_TOKEN in meta-capi.ts. NEXT_PUBLIC_GA_ID (already used by
// layout.tsx and the client-side sendGAEvent() calls in this file's sibling,
// analytics.ts) doubles as the measurement_id here — GA4 measurement ids
// aren't secret, so reusing the existing public env var matches how
// META_PIXEL_ID is reused across analytics.ts and meta-capi.ts rather than
// adding a second env var for the same id.
const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;
const GA4_API_SECRET = process.env.GA4_API_SECRET;

// GA4 Measurement Protocol requires a client_id to attribute an event to
// *some* GA4 user, but this server action has no real one to reuse — the
// admin approving the listing isn't the seller whose funnel this event
// describes, and the seller's own gtag client_id from when they submitted
// isn't captured or stored anywhere today (doing that would mean a schema
// change to the listings table, out of scope for this pass). A stable,
// listing-scoped synthetic id (hashed from the listing id, not random per
// call) at least makes a duplicate Approve click land as the same GA4
// "user" instead of inflating the count, and is good enough for this
// event's actual purpose: a plain count of approved listings feeding the
// "Submission -> Approval Rate" and "Cost Per Approved Quality Listing"
// metrics, neither of which depends on this event being stitched to the
// seller's original browser session.
function syntheticClientId(seed: string): string {
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  return `${hash.slice(0, 16)}.${hash.slice(16, 26)}`;
}

/**
 * Low-level sender — exported in case a future server-side GA4 event
 * (beyond listing_approved) needs it directly, but sendListingApprovedEvent()
 * below is the one actual call site today.
 */
export async function sendGa4MeasurementProtocolEvent(
  eventName: string,
  params: Record<string, unknown>,
  clientIdSeed: string
): Promise<void> {
  if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) return;

  try {
    const res = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(
        GA4_MEASUREMENT_ID
      )}&api_secret=${encodeURIComponent(GA4_API_SECRET)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: syntheticClientId(clientIdSeed),
          events: [{ name: eventName, params }],
        }),
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[ga4-mp] ${eventName} event failed (${res.status}):`, text);
    }
  } catch (err) {
    // Best-effort, same posture as sendMetaCapiEvent()'s own catch — a GA4
    // outage must never fail an admin's Approve action.
    console.error(`[ga4-mp] ${eventName} event threw:`, err);
  }
}

/** Thin, typed wrapper for the one event fired from this app's backend today. */
export function sendListingApprovedEvent(params: {
  listingId: string;
  category?: string | null;
  price?: number | null;
}): Promise<void> {
  return sendGa4MeasurementProtocolEvent(
    "listing_approved",
    {
      listing_id: params.listingId,
      ...(params.category ? { category: params.category } : {}),
      ...(params.price != null ? { value: params.price, currency: "USD" } : {}),
    },
    params.listingId
  );
}
