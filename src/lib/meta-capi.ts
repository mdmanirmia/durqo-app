import crypto from "crypto";

// Sep 16, 2026: server-side Meta (Facebook) Conversions API — POSTs
// conversion events straight to Meta's Graph API from this app's own
// backend, rather than a full server-side GTM container (that needs its
// own paid hosting, e.g. Cloud Run — see
// claude/meta-pixel-and-gtm-setup-addendum.md for why the direct-call
// approach was chosen over that).
//
// Fires from the exact server-side moment each payment rail's webhook
// confirms a real payment (Stripe checkout.session.completed, SSLCommerz's
// validated IPN, Escrow.com's secured-transaction webhook — see the CAPI
// call sites added in each of those three route.ts files). That's a
// different moment than GA4's client-side trackPurchase()/the browser-side
// Meta Pixel call in analytics.ts, which fire from the Transfer Room page
// once the buyer actually lands there. The two never share a request/
// response cycle, so they're tied together for Meta's event-deduplication
// requirement via a deterministic, independently-derivable event_id —
// `purchase-${orderId}` — rather than one being passed to the other over
// the network. Pay Later (`durqo_platform` channel) deliberately has no
// call site here, same reasoning as trackPurchase()'s own exclusion of it:
// no real money moves on that rail, so counting it as a Purchase
// conversion would misrepresent ad performance the same way it would
// inflate GA4's revenue reports.
//
// Guarded-optional like every other integration in this app
// (RESEND_API_KEY, STRIPE_SECRET_KEY, SSLCOMMERZ_STORE_ID, ...) — silently
// no-ops (console.error, never throws) when META_PIXEL_ID or
// META_CAPI_ACCESS_TOKEN isn't set, so every export here is safe to call
// unconditionally, including in local dev and preview deploys where CAPI
// isn't configured. META_CAPI_ACCESS_TOKEN is a Meta System User access
// token — a genuine secret, added to Vercel by the site owner directly
// (never by Claude — see the standing credential-handling rule recorded
// for this project); META_PIXEL_ID is not a secret (pixel IDs are visible
// in every page's own source) but is still read from an env var rather
// than hardcoded, matching NEXT_PUBLIC_GTM_ID/NEXT_PUBLIC_GA_ID's reasoning
// in layout.tsx.
const META_PIXEL_ID = process.env.META_PIXEL_ID;
const META_CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const META_GRAPH_API_VERSION = "v19.0";

// Meta requires personally-identifying user_data fields (email, external_id,
// ...) to be sent as lowercase-trimmed SHA-256 hashes, never in the clear —
// this app never sends a raw email to Meta, on this call path or any other.
function sha256Lower(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export interface MetaCapiUserData {
  /** Buyer's email, e.g. from getUserEmails() — hashed before it ever leaves this function. */
  email?: string | null;
  /** A stable per-user id (this app's own auth user id works fine) — also hashed before sending. */
  externalId?: string | null;
}

export interface MetaCapiEventParams {
  eventName: string;
  /** Shared with the matching browser-side fbq() call for Meta's dedup — see analytics.ts. */
  eventId: string;
  eventSourceUrl?: string;
  userData?: MetaCapiUserData;
  customData?: Record<string, unknown>;
}

// Low-level sender — exported in case a future server-side event (beyond
// Purchase) needs it directly, but sendMetaPurchaseEvent() below is the one
// actual call site today.
export async function sendMetaCapiEvent(params: MetaCapiEventParams): Promise<void> {
  if (!META_PIXEL_ID || !META_CAPI_ACCESS_TOKEN) return;

  const userData: Record<string, string[]> = {};
  if (params.userData?.email) userData.em = [sha256Lower(params.userData.email)];
  if (params.userData?.externalId) userData.external_id = [sha256Lower(params.userData.externalId)];

  const event: Record<string, unknown> = {
    event_name: params.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.eventId,
    // "website" is correct here even though these calls originate from a
    // payment gateway's server-to-server webhook, not literally the buyer's
    // browser — action_source describes where the underlying purchase
    // action happened (Durqo's website checkout), not which server sent
    // this particular API call. Per Meta's docs, action_source: "website"
    // events should include client IP/user agent when available for best
    // match quality — neither is available here (a webhook has no request
    // context for the buyer's own browser), so this relies on the hashed
    // email/external_id in user_data plus the shared event_id for dedup
    // and match quality instead.
    action_source: "website",
    user_data: userData,
  };
  if (params.eventSourceUrl) event.event_source_url = params.eventSourceUrl;
  if (params.customData) event.custom_data = params.customData;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_CAPI_ACCESS_TOKEN)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [event] }),
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[meta-capi] ${params.eventName} event failed (${res.status}):`, text);
    }
  } catch (err) {
    // Best-effort, same posture as sendEmail()/notification failures in the
    // webhooks that call this — a Meta API outage must never fail a
    // payment webhook or leave an order stuck.
    console.error(`[meta-capi] ${params.eventName} event threw:`, err);
  }
}

// Thin, typed wrapper for the one event fired from this app's backend today
// — mirrors trackPurchase()'s params in analytics.ts so the client and
// server call sites are easy to compare side by side.
export function sendMetaPurchaseEvent(params: {
  orderId: string;
  value: number;
  buyerEmail?: string | null;
  buyerUserId?: string | null;
  eventSourceUrl?: string;
}): Promise<void> {
  return sendMetaCapiEvent({
    eventName: "Purchase",
    eventId: `purchase-${params.orderId}`,
    eventSourceUrl: params.eventSourceUrl,
    userData: { email: params.buyerEmail, externalId: params.buyerUserId },
    customData: {
      currency: "USD",
      value: params.value,
      order_id: params.orderId,
    },
  });
}
