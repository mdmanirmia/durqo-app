"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isRealListingId } from "@/lib/is-demo-listing";

// "Buy Now" — skips the cart entirely and starts a Stripe Checkout Session
// for just this one listing (see /api/checkout's `listingId` body param).
// Locked once the listing is sold (or is a demo/mock listing with nothing
// real in the database to buy).
export default function BuyNowButton({ listingId, sold }: { listingId: string; sold?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDemo = !isRealListingId(listingId);
  const locked = isDemo || sold;

  async function handleClick() {
    if (busy || locked) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
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
        setBusy(false);
        return;
      }
      // Deliberately don't reset `busy` — the browser is about to navigate
      // away to Stripe's hosted page, same reasoning as the cart's
      // "Request to purchase" button.
      window.location.href = data.url;
    } catch {
      setError("Couldn't start checkout. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || locked}
        title={sold ? "This listing has already been sold." : isDemo ? "This is a sample listing — buying opens up once real listings are live." : undefined}
        className="rounded-lg bg-brand-strong py-2.5 text-sm font-semibold text-paper-raised hover:bg-brand disabled:opacity-60"
      >
        {sold ? "Sold" : isDemo ? "Sample listing" : busy ? "Starting checkout…" : "Buy Now"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
