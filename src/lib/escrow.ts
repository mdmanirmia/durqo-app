import "server-only";

// SERVER-ONLY Escrow.com client — same guarded-factory pattern as
// src/lib/stripe.ts and src/lib/sslcommerz.ts: returns null until the
// credentials are set, so the app still builds/runs before Escrow.com is
// configured, and callers surface a clear "not set up yet" error instead of
// crashing.
//
// Sep 10, 2026 build: added as a THIRD checkout option alongside Stripe and
// SSLCommerz, per the merchant's explicit request ("add Escrow live version
// now I have got verified today"). Unlike SSLCommerz, sandbox
// (api.escrow-sandbox.com) and production (api.escrow.com) are entirely
// separate accounts/signups on Escrow.com's side, not just a flag on the
// same credentials — so ESCROW_ENV only controls which base URL this app
// talks to; it does nothing to make a production key behave like a
// sandbox one or vice versa. Defaults to "production" because the only key
// generated so far (named "Durqo Production" in the Escrow.com dashboard,
// Sep 10, 2026) is a live key — every transaction this module creates
// while that's the only key configured moves real money. Per the merchant
// ("you set up live version"), that's the deliberate choice for now.
//
// The credentials themselves (ESCROW_API_EMAIL / ESCROW_API_KEY) are typed
// directly into Vercel's env vars by the user, never by Claude, never
// committed to this repo — same rule already documented in sslcommerz.ts
// for the SSLCommerz store password.
const SANDBOX_API_BASE = "https://api.escrow-sandbox.com/2017-09-01";
const PRODUCTION_API_BASE = "https://api.escrow.com/2017-09-01";

export interface EscrowConfig {
  apiEmail: string;
  apiKey: string;
  isLive: boolean;
  apiBase: string;
}

export function getEscrowConfig(): EscrowConfig | null {
  const apiEmail = process.env.ESCROW_API_EMAIL;
  const apiKey = process.env.ESCROW_API_KEY;
  if (!apiEmail || !apiKey) return null;

  const isLive = process.env.ESCROW_ENV !== "sandbox"; // default: live
  return {
    apiEmail,
    apiKey,
    isLive,
    apiBase: isLive ? PRODUCTION_API_BASE : SANDBOX_API_BASE,
  };
}

function authHeader(config: EscrowConfig): string {
  return "Basic " + Buffer.from(`${config.apiEmail}:${config.apiKey}`).toString("base64");
}

// Sep 14, 2026: a real "Pay with Escrow.com" attempt failed with the API
// returning HTTP 422 (Unprocessable Entity — the request was rejected on
// validation, not a transport/auth problem), but the buyer only ever saw
// the bare "Escrow.com API returned HTTP 422" fallback below. Per Escrow.com's
// own API reference (escrow.com/api/docs/reference), a 422 comes back as a
// TYPED validation-error object — TransactionValidationErrors,
// ItemValidationErrors, ExtraAttributesErrors, etc. — with per-field
// messages nested inside, not a flat `{ message: "..." }` the way the old
// code assumed. That shape didn't match the `"message" in data` check
// above, so the real reason was silently discarded on both sides: the
// buyer's modal and this server's own logs. Fixed below by (1) always
// logging the raw response body server-side on failure, regardless of its
// shape, so the actual validation error is visible in Vercel logs next
// time, and (2) walking the parsed error body for every string it
// contains (whatever the exact field names turn out to be) so the buyer
// sees something more specific than a bare status code. This does not
// change anything about a *successful* request/response.
function flattenErrorStrings(value: unknown, path: string[] = [], out: string[] = []): string[] {
  if (value == null) return out;
  if (typeof value === "string") {
    if (value.trim()) out.push(path.length ? `${path.join(".")}: ${value}` : value);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => flattenErrorStrings(v, [...path, String(i)], out));
  } else if (typeof value === "object") {
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      flattenErrorStrings(v, [...path, key], out);
    }
  }
  return out;
}

async function escrowFetch<T>(config: EscrowConfig, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${config.apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(config),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let data: unknown = undefined;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    // non-JSON error body — fall through, message below covers it
  }
  if (!res.ok) {
    // Always log the raw body — this is what actually diagnoses a failure
    // like the 422 above; the message returned to the caller may still be
    // trimmed/generic, but this line is the source of truth in Vercel logs.
    console.error(`[escrow] ${init?.method ?? "GET"} ${path} failed: HTTP ${res.status} — ${text || "(empty body)"}`);

    let message: string | undefined;
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if (typeof obj.message === "string" && obj.message.trim()) {
        message = obj.message;
      } else if (typeof obj.error === "string" && obj.error.trim()) {
        message = obj.error;
      } else {
        // Drop the schema-name discriminator field ("type": "ItemValidationErrors"
        // etc.) so it doesn't get mixed into the flattened message text.
        const { type: _discriminator, ...rest } = obj;
        const flattened = flattenErrorStrings(rest);
        if (flattened.length > 0) message = flattened.join("; ");
      }
    }

    // Sep 14, 2026: a real attempt on a $15 domain listing hit this exact
    // validation error. Traced it to Escrow.com's own $50 minimum Standard
    // fee (confirmed live on escrow.com/fee-calculator) — for any listing
    // priced under roughly $1,900, their minimum fee alone exceeds the
    // purchase price, so the buyer's payment can never cover it. This isn't
    // a bug in the request we send; it's Escrow.com's real minimum, so swap
    // in a message that explains the actual constraint and points the buyer
    // at Durqo's other payment options instead of the raw API string.
    if (message && /amount paid by the buyer must be at least the amount of the escrow fee/i.test(message)) {
      message =
        "Escrow.com can't be used for this listing — their own minimum fee is larger than the purchase price. Please use one of the other payment options (Stripe, SSLCommerz, or Pay Later) instead.";
    }

    throw new Error(message || `Escrow.com API returned HTTP ${res.status}`);
  }
  return data as T;
}

export interface CreateEscrowTransactionParams {
  buyerEmail: string;
  sellerEmail: string;
  description: string;
  itemTitle: string;
  amountUsd: number;
  listingUrl?: string;
}

export interface EscrowTransaction {
  id: number;
  currency: string;
  description: string;
  parties: { customer: string; role: string; agreed: boolean }[];
  items: {
    id: number;
    title?: string;
    type: string;
    schedule: { amount: string; payer_customer: string; beneficiary_customer: string; status?: { secured?: boolean } }[];
  }[];
}

// STEP 1: create the transaction. Durqo's own API key is automatically the
// "partner" on every transaction it creates (Escrow.com's own docs: "There
// is no need to specify the party object for the partner") — only buyer
// and seller need to be listed explicitly, by email. Neither buyer nor
// seller needs a pre-existing Escrow.com account: per Escrow.com's "Create
// a customer" guide, "Customer accounts will be created for any person
// involved in a transaction who does not already have an account at the
// time of transaction creation" — they simply get an email from
// Escrow.com introducing them and asking them to set a password.
//
// A single general_merchandise item, full listing price, no shipping (every
// Durqo sale is a digital business/website/app/domain, nothing physically
// ships). Deliberately NOT capped the way Stripe/SSLCommerz checkout is
// (src/lib/payment-terms.ts, ONLINE_DEPOSIT_CAP) — the whole reason that
// cap+manual-remainder workaround exists is that Durqo has no other way to
// safely hold a large sale amount; real Escrow.com escrow is exactly that,
// so the full price goes through it here.
//
// Sep 14, 2026: a live purchase came back with "errors.items.0.category.0:
// This is not a valid category for a general_merchandise item" — Escrow.com's
// own docs (escrow.com/api/docs/create-transaction, "valid categories are
// based on the type of item") list "business_and_internet" as valid for
// general_merchandise, but the live API rejected it anyway (confirmed by
// re-reading that exact doc page, not just recalling it). Since `category`
// is documented as optional on the Item object ("we highly recommend
// providing a category... as doing so can result in faster processing" —
// never "required"), and the docs and the live validator now disagree on
// which value is correct, the safe fix is to stop guessing a category at
// all rather than swap in another unverified value against a live,
// real-money endpoint. Every transaction this creates still processes
// normally without one; Escrow.com's support can be asked for the actual
// current enum if faster processing is wanted later.
export async function createEscrowTransaction(
  config: EscrowConfig,
  params: CreateEscrowTransactionParams
): Promise<EscrowTransaction> {
  return escrowFetch<EscrowTransaction>(config, "/transaction", {
    method: "POST",
    body: JSON.stringify({
      parties: [
        { role: "buyer", customer: params.buyerEmail },
        { role: "seller", customer: params.sellerEmail },
      ],
      currency: "usd",
      description: params.description,
      items: [
        {
          title: params.itemTitle,
          description: params.itemTitle,
          type: "general_merchandise",
          shipping_type: "no_shipping",
          inspection_period: 259200, // 3 days, matches Escrow.com's own doc examples
          quantity: 1,
          schedule: [
            {
              amount: params.amountUsd,
              payer_customer: params.buyerEmail,
              beneficiary_customer: params.sellerEmail,
            },
          ],
          ...(params.listingUrl ? { extra_attributes: { merchant_url: params.listingUrl } } : {}),
        },
      ],
    }),
  });
}

export async function fetchEscrowTransaction(config: EscrowConfig, transactionId: number): Promise<EscrowTransaction> {
  return escrowFetch<EscrowTransaction>(config, `/transaction/${transactionId}`);
}

// STEP 2: a link the buyer's browser can be redirected straight to, to
// agree to the transaction and pay, on Escrow.com's own hosted page —
// exactly the "Durqo API -> escrow.com hosted page" flow the merchant
// asked for.
//
// Sep 15, 2026: the first real attempt (once the category/fee bugs above
// were fixed and a transaction actually got created) failed at this exact
// step with "Buyer is unable to agree at this stage in the transaction."
// Two pieces of evidence from that live transaction explain why: (1)
// Escrow.com's own post-creation email went to the SELLER, saying their
// "next step is to ask the Buyer to review and agree to the transaction by
// sharing [a] link with them" — i.e. Durqo's partner key is treated as the
// initiator, the seller side needs no further action, and only the buyer
// still has to agree; (2) escrow.com/api/docs/basics documents an
// `As-Customer: <email>` header that lets an approved partner "perform...
// the agree... action on a transaction on behalf of another party," and
// the agree-transaction guide notes the web_link variant is "most useful
// when performed on behalf of another customer" via that same header. The
// original call above never set it, so Escrow.com had no way to know this
// link should be scoped to the buyer — passing it now is what was missing.
export async function getEscrowAgreeLink(config: EscrowConfig, transactionId: number, onBehalfOfEmail: string): Promise<string> {
  const data = await escrowFetch<{ landing_page: string }>(config, `/transaction/${transactionId}/web_link/agree`, {
    headers: { "As-Customer": onBehalfOfEmail },
  });
  return data.landing_page;
}
