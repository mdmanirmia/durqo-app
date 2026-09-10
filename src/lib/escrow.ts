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
    const message =
      (data && typeof data === "object" && "message" in data && typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : undefined) ?? `Escrow.com API returned HTTP ${res.status}`;
    throw new Error(message);
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
          category: "business_and_internet",
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
// asked for. Escrow.com's own docs don't spell out how this endpoint picks
// which party the link is for when more than one party still needs to
// act (both buyer and seller are unagreed right after creation here,
// unlike their docs' own examples where the API caller is "me" = the
// buyer and only the seller is left to agree) — this hasn't been verified
// against a real transaction yet. If the link this returns doesn't land the
// buyer on the right action, the fallback is Escrow.com's own transaction
// page (https://www.escrow.com/transactions/{id}/payment, from their
// funding-a-transaction guide) or contacting developers@escrow.com.
export async function getEscrowAgreeLink(config: EscrowConfig, transactionId: number): Promise<string> {
  const data = await escrowFetch<{ landing_page: string }>(config, `/transaction/${transactionId}/web_link/agree`);
  return data.landing_page;
}
