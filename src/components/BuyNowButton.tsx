"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isRealListingId } from "@/lib/is-demo-listing";

type Gateway = "stripe" | "sslcommerz";

// "Buy Now" — skips the cart entirely and starts a checkout session for
// just this one listing, via either Stripe (/api/checkout) or SSLCommerz's
// Bangladesh payment gateway (/api/sslcommerz/init), buyer's choice — see
// `{ listingId }` body param on both routes. Locked once the listing is
// sold (or is a demo/mock listing with nothing real in the database to
// buy). Sep 9, 2026: gained the SSLCommerz option alongside the
// already-live Stripe one, matching the same choice CartView now offers.
export default function BuyNowButton({ listingId, sold }: { listingId: string; sold?: boolean }) {
  const router = useRouter();
  const [busyGateway, setBusyGateway] = useState<Gateway | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isDemo = !isRealListingId(listingId);
  const locked = isDemo || sold;

  async function handleClick(gateway: Gateway) {
    if (busyGateway || locked) return;
    setBusyGateway(gateway);
    setError(null);
    try {
      const endpoint = gateway === "stripe" ? "/api/checkout" : "/api/sslcommerz/init";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Couldn't start checkout. Please try again.");
        setBusyGateway(null);
        return;
      }
      // Deliberately don't reset `busyGateway` — the browser is about to
      // navigate away to the gateway's hosted page, same reasoning as the
      // cart's checkout buttons.
      window.location.href = data.url;
    } catch {
      setError("Couldn't start checkout. Please try again.");
      setBusyGateway(null);
    }
  }

  if (sold || isDemo) {
    return (
      <button
        type="button"
        disabled
        title={sold ? "This listing has already been sold." : "This is a sample listing — buying opens up once real listings are live."}
        className="rounded-xl bg-brand-strong py-3 text-sm font-semibold text-paper-raised shadow-[0_1px_2px_rgba(15,23,42,0.08)] opacity-60"
      >
        {sold ? "Sold" : "Sample listing"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => handleClick("stripe")}
        disabled={busyGateway !== null}
        className="rounded-xl bg-brand-strong py-3 text-sm font-semibold text-paper-raised shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-colors hover:bg-brand disabled:opacity-60"
      >
        {busyGateway === "stripe" ? "Starting checkout…" : "Buy Now — Card (Stripe)"}
      </button>
      <button
        type="button"
        onClick={() => handleClick("sslcommerz")}
        disabled={busyGateway !== null}
        className="rounded-xl border border-brand-strong bg-transparent py-3 text-sm font-semibold text-brand-strong transition-colors hover:bg-brand-soft disabled:opacity-60"
      >
        {busyGateway === "sslcommerz" ? "Starting checkout…" : "Buy Now — bKash/Nagad/Card"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
