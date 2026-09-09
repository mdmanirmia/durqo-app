import "server-only";

// SERVER-ONLY SSLCommerz client — same guarded-factory pattern as
// src/lib/stripe.ts: returns null until the store credentials are set, so
// the app still builds/runs before SSLCommerz is configured, and callers
// surface a clear "not set up yet" error instead of crashing.
//
// SSLCommerz has two entirely separate hostnames for sandbox vs. live —
// unlike Stripe, where the same secret key implicitly picks test/live mode.
// SSLCOMMERZ_IS_LIVE controls which one this app talks to; it defaults to
// the sandbox, and going live is a deliberate opt-in (flip the env var),
// never a side effect of which credentials happen to be set. Per SSLCommerz's
// own onboarding email (Sep 9, 2026), the sandbox uses their public,
// non-secret "testbox" demo credentials — build and verify the whole flow
// against those first; the real Store ID/Password (received live, for
// "durqo2live") only ever get typed directly into Vercel's env vars by the
// user, never by Claude, never committed to this repo.
const SANDBOX_API_BASE = "https://sandbox.sslcommerz.com";
const LIVE_API_BASE = "https://securepay.sslcommerz.com";

export interface SslcommerzConfig {
  storeId: string;
  storePassword: string;
  isLive: boolean;
  apiBase: string;
}

export function getSslcommerzConfig(): SslcommerzConfig | null {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  if (!storeId || !storePassword) return null;

  const isLive = process.env.SSLCOMMERZ_IS_LIVE === "true";
  return {
    storeId,
    storePassword,
    isLive,
    apiBase: isLive ? LIVE_API_BASE : SANDBOX_API_BASE,
  };
}

export interface CreateSessionParams {
  tranId: string;
  totalAmount: number;
  currency: string; // e.g. "BDT" — see the currency note in api/sslcommerz/init/route.ts
  productName: string;
  productCategory: string;
  custName: string;
  custEmail: string;
  custPhone: string;
  custAdd1: string;
  custCity: string;
  custPostcode: string;
  custCountry: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
}

export interface CreateSessionResult {
  status: string; // "SUCCESS" | "FAILED"
  gatewayPageUrl?: string;
  sessionkey?: string;
  failedreason?: string;
}

// STEP 1 of SSLCommerz's own 3-step integration guide: create a transaction
// session. POSTs form-encoded (not JSON — SSLCommerz's API expects a plain
// form body) to the Session API and returns the JSON response's
// GatewayPageURL, which the buyer's browser is redirected to next.
export async function createSslcommerzSession(
  config: SslcommerzConfig,
  params: CreateSessionParams
): Promise<CreateSessionResult> {
  const body = new URLSearchParams({
    store_id: config.storeId,
    store_passwd: config.storePassword,
    total_amount: params.totalAmount.toFixed(2),
    currency: params.currency,
    tran_id: params.tranId,
    success_url: params.successUrl,
    fail_url: params.failUrl,
    cancel_url: params.cancelUrl,
    ipn_url: params.ipnUrl,
    shipping_method: "NO", // digital-goods marketplace — nothing physically ships
    product_name: params.productName,
    product_category: params.productCategory,
    product_profile: "general",
    cus_name: params.custName,
    cus_email: params.custEmail,
    cus_add1: params.custAdd1,
    cus_city: params.custCity,
    cus_postcode: params.custPostcode,
    cus_country: params.custCountry,
    cus_phone: params.custPhone,
    num_of_item: "1",
    emi_option: "0",
  });

  const res = await fetch(`${config.apiBase}/gwprocess/v4/api.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`SSLCommerz session API returned HTTP ${res.status}`);
  }

  const data = await res.json();
  return {
    status: data.status,
    gatewayPageUrl: data.GatewayPageURL,
    sessionkey: data.sessionkey,
    failedreason: data.failedreason,
  };
}

export interface ValidationResult {
  status: string; // "VALID" | "VALIDATED" | "FAILED" | "CANCELLED" | ...
  tranId?: string;
  valId?: string;
  amount?: string;
  currency?: string;
  riskLevel?: string; // "0" normal, "1" risky — per SSLCommerz's own IPN guidance
  riskTitle?: string;
  raw: Record<string, unknown>;
}

// STEP 2 (the actual verification half of it): once an IPN notification
// arrives claiming a transaction succeeded, this app must call SSLCommerz's
// own Validation API to confirm that claim server-to-server before trusting
// it — an IPN POST body alone is not proof of payment, since anyone could
// POST a fake one to this app's IPN URL. Uses the REST validator (the
// Validation URL (By REST) from SSLCommerz's onboarding email), not the
// SOAP one.
export async function validateSslcommerzPayment(
  config: SslcommerzConfig,
  valId: string
): Promise<ValidationResult> {
  const url = new URL(`${config.apiBase}/validator/api/validationserverAPI.php`);
  url.searchParams.set("val_id", valId);
  url.searchParams.set("store_id", config.storeId);
  url.searchParams.set("store_passwd", config.storePassword);
  url.searchParams.set("v", "1");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`SSLCommerz validation API returned HTTP ${res.status}`);
  }
  const data = await res.json();
  return {
    status: data.status,
    tranId: data.tran_id,
    valId: data.val_id,
    amount: data.amount,
    currency: data.currency,
    riskLevel: data.risk_level,
    riskTitle: data.risk_title,
    raw: data,
  };
}
