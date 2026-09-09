import "server-only";

// USD -> BDT conversion for the SSLCommerz live gateway (Sep 9, 2026).
// Every listing price in this app is stored and displayed in USD, but
// SSLCommerz charges in BDT — see the currency note that used to live in
// api/sslcommerz/init/route.ts. Per the merchant's explicit instruction:
// "always add 6 BDT more than [the] Google rate" — i.e. take the current
// market mid-rate and add a flat 6 BDT margin per US dollar.
//
// There's no supported way to read the exact number Google's own currency
// widget shows from a server (it's rendered client-side, not a public API,
// and scraping google.com search results is against their terms and not
// something this app should depend on for pricing). open.er-api.com is a
// free, keyless exchange-rate API that publishes the same kind of
// mid-market rate Google's converter displays — typically within a paisa
// or two of it — so it's used here as the "Google rate" stand-in. If that
// ever needs to be a literal scrape of google.com instead, this is the one
// place to change.
const RATE_API_URL = "https://open.er-api.com/v6/latest/USD";
const MARGIN_BDT = 6;

// Used only if the live rate lookup fails (network hiccup, API down) so
// checkout never hard-fails just because a third-party rate API is
// unreachable. Deliberately conservative/rough — update this occasionally;
// it's a safety net, not the real rate.
const FALLBACK_MARKET_RATE = 122;

let cachedRate: { marketRate: number; fetchedAt: number } | null = null;
const CACHE_MS = 60 * 60 * 1000; // 1 hour — market rates don't move fast enough to need less

async function getMarketUsdToBdtRate(): Promise<{ marketRate: number; source: "live" | "fallback" }> {
  if (cachedRate && Date.now() - cachedRate.fetchedAt < CACHE_MS) {
    return { marketRate: cachedRate.marketRate, source: "live" };
  }

  try {
    const res = await fetch(RATE_API_URL, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`rate API returned HTTP ${res.status}`);
    const data = await res.json();
    const rate = Number(data?.rates?.BDT);
    if (!rate || Number.isNaN(rate)) throw new Error("rate API response had no usable BDT rate");
    cachedRate = { marketRate: rate, fetchedAt: Date.now() };
    return { marketRate: rate, source: "live" };
  } catch (err) {
    console.error("[currency] USD->BDT rate lookup failed, using fallback rate:", err);
    return { marketRate: FALLBACK_MARKET_RATE, source: "fallback" };
  }
}

export interface UsdToBdtConversion {
  bdtAmount: number;
  marketRate: number;
  appliedRate: number; // marketRate + MARGIN_BDT
  source: "live" | "fallback";
}

// The conversion applied to every SSLCommerz charge: (market USD->BDT rate
// + 6) * usdAmount, rounded to 2 decimal places (SSLCommerz's total_amount
// field is a plain decimal, same as Stripe's).
export async function convertUsdToBdt(usdAmount: number): Promise<UsdToBdtConversion> {
  const { marketRate, source } = await getMarketUsdToBdtRate();
  const appliedRate = marketRate + MARGIN_BDT;
  const bdtAmount = Math.round(usdAmount * appliedRate * 100) / 100;
  return { bdtAmount, marketRate, appliedRate, source };
}
