import "server-only";
import { computeSuccessFee, centsToUSD } from "@/lib/fees";

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
//
// Sep 15, 2026: added Durqo's Success Fee as a second, non-transferable
// `partner_fee` item on the same transaction — closes a real gap found
// while auditing whether Durqo actually gets paid on an Escrow.com sale.
// For Stripe/SSLCommerz, Durqo collects its cut by deducting it from the
// seller's balance when they request a withdrawal (order_success_fee() in
// 033_withdrawal_order_splitting.sql) — that only works because the money
// lands in Durqo's own account first. Escrow.com orders were deliberately
// EXCLUDED from that same withdrawal ledger (035_exclude_escrow_com_from_
// payout_ledger.sql) — "the licensed provider's own release is the only
// payout event" — because the money never touches Durqo at all: the buyer
// pays Escrow.com directly, Escrow.com pays the seller directly. Nothing
// was ever put in its place, so up to this point Durqo earned $0 on every
// Escrow.com sale.
//
// Escrow.com's own API has a built-in mechanism for exactly this
// (escrow.com/api/docs/create-transaction, "Non transferable items...
// Broker fees, Partner fees" + the worked JSON example under that section):
// a `partner_fee` item, whose `schedule.beneficiary_customer` can be the
// literal string "me" — Escrow.com's own docs: "This field may also
// contain the value 'me', which refers to the currently logged in
// customer" — which is Durqo's own API-key account, since Durqo is
// automatically the transaction's "partner" (same reasoning as the
// no-need-for-a-partner-party-object note above). `payer_customer` is set
// to the seller, matching the existing Stripe/SSLCommerz model where the
// Success Fee comes out of the seller's proceeds, not an added buyer
// surcharge — the buyer's own schedule entry on the main item is
// unchanged. Fee amount reuses the one tiered schedule already defined in
// src/lib/fees.ts (10% under $50k, 7% $50k-$250k, 5% over $250k) so this
// never drifts from the number shown anywhere else on the site.
//
// Not yet independently confirmed live: whether Escrow.com nets this
// straight out of the seller's disbursement from the same pool of buyer
// funds (the expected/intended behavior) or requires the seller to fund it
// as a separate amount. Escrow.com's own docs don't spell out the
// disbursement mechanics for a seller-paid fee item beyond the schema
// itself. Worth confirming on the next real Escrow.com sale by checking
// the transaction's item schedule (GET /transaction/{id}) once secured,
// and, if anything looks off, escrow.com's support can confirm the exact
// disbursement behavior.
export async function createEscrowTransaction(
  config: EscrowConfig,
  params: CreateEscrowTransactionParams
): Promise<EscrowTransaction> {
  const fee = computeSuccessFee(params.amountUsd);
  const feeUsd = centsToUSD(fee.feeCents);

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
        // Durqo's Success Fee — see the dated comment above. Only added
        // when there's actually a fee to collect (always true today since
        // every tier is > 0%, but this guard keeps the item list honest if
        // a future 0% tier is ever introduced).
        ...(feeUsd > 0
          ? [
              {
                type: "partner_fee",
                title: "Durqo Success Fee",
                description: `Durqo Success Fee (${Math.round(fee.rate * 100)}%)`,
                schedule: [
                  {
                    amount: feeUsd,
                    payer_customer: params.sellerEmail,
                    beneficiary_customer: "me",
                  },
                ],
              },
            ]
          : []),
      ],
    }),
  });
}

export async function fetchEscrowTransaction(config: EscrowConfig, transactionId: number): Promise<EscrowTransaction> {
  return escrowFetch<EscrowTransaction>(config, `/transaction/${transactionId}`);
}

// STEP 2 (currently unused — see below): a link the buyer's browser could
// be redirected straight to, to agree to the transaction and pay, on
// Escrow.com's own hosted page — the "Durqo API -> escrow.com hosted page"
// flow the merchant originally asked for.
//
// Sep 15, 2026: two live attempts proved this doesn't work with Durqo's
// current Escrow.com account, for two different reasons. First, calling it
// plain (no header) failed with "Buyer is unable to agree at this stage in
// the transaction" — Escrow.com's post-creation email to the seller that
// same attempt explained why: since Durqo's partner key is the
// transaction's initiator, the seller needs no further action and only the
// buyer must still agree, so the plain call had no way to know the link
// should be scoped to the buyer. Adding the `As-Customer: <email>` header
// documented on escrow.com/api/docs/basics ("Performing actions on behalf
// of customers") looked like the fix for exactly that — but the very next
// live attempt with it got "Partner account not authorized to perform
// actions on behalf of customers." That's an account-tier permission,
// granted by Escrow.com to specific "approved partners," and Durqo's
// account isn't one. So there is currently no API call this app can make
// that generates a working agree link — api/escrow/init/route.ts no longer
// calls this function; it relies on Escrow.com's own automatic "please
// agree" email to the buyer instead (confirmed working on both live
// attempts above). Leaving this function in place in case Durqo's account
// is approved as an Escrow.com partner later, at which point the
// As-Customer version below should start working and can be wired back in.
export async function getEscrowAgreeLink(config: EscrowConfig, transactionId: number, onBehalfOfEmail: string): Promise<string> {
  const data = await escrowFetch<{ landing_page: string }>(config, `/transaction/${transactionId}/web_link/agree`, {
    headers: { "As-Customer": onBehalfOfEmail },
  });
  return data.landing_page;
}
