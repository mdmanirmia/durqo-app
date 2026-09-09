"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isRealListingId } from "@/lib/is-demo-listing";
import SslcommerzConfirmModal, { type SslcommerzQuote } from "@/components/SslcommerzConfirmModal";

// "Buy Now" — skips the cart entirely and starts a checkout session for
// just this one listing, via either Stripe (/api/checkout) or SSLCommerz's
// Bangladesh payment gateway (/api/sslcommerz/init), buyer's choice. Locked
// once the listing is sold (or is a demo/mock listing with nothing real in
// the database to buy). Sep 9, 2026: gained the SSLCommerz option alongside
// the already-live Stripe one, matching the same choice CartView now
// offers. No country detection/gating — the label itself ("bKash/Rocket/
// Nagad/Bank") is the filter: only makes sense to a Bangladeshi buyer, so
// that's who picks it. See the longer note in CartView.tsx.
//
// Mirrors CartView.tsx's SSLCommerz flow: instead of redirecting straight
// to the gateway, it first fetches a quote (/api/sslcommerz/quote?listingId=)
// and shows SslcommerzConfirmModal so the buyer sees the exact BDT amount,
// the USD->BDT rate, and (for a listing over the online deposit cap) how
// the remainder is handled, before ever leaving Durqo. Stripe has no such
// step — it charges USD directly, so it still redirects immediately.
export default function BuyNowButton({ listingId, sold }: { listingId: string; sold?: boolean }) {
  const router = useRouter();
  const [stripeBusy, setStripeBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDemo = !isRealListingId(listingId);
  const locked = isDemo || sold;

  // SSLCommerz confirm-modal state — "closed" means no modal is shown.
  const [sslStatus, setSslStatus] = useState<"closed" | "loading" | "ready" | "error">("closed");
  const [sslQuote, setSslQuote] = useState<SslcommerzQuote | null>(null);
  const [sslError, setSslError] = useState<string | null>(null);
  const [sslConfirming, setSslConfirming] = useState(false);

  async function handleStripe() {
    if (stripeBusy || locked || sslStatus !== "closed") return;
    setStripeBusy(true);
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
        setStripeBusy(false);
        return;
      }
      // Deliberately don't reset `stripeBusy` — the browser is about to
      // navigate away to Stripe's hosted page.
      window.location.href = data.url;
    } catch {
      setError("Couldn't start checkout. Please try again.");
      setStripeBusy(false);
    }
  }

  async function openSslModal() {
    if (stripeBusy || locked) return;
    setError(null);
    setSslStatus("loading");
    setSslQuote(null);
    setSslError(null);
    try {
      const res = await fetch(`/api/sslcommerz/quote?listingId=${encodeURIComponent(listingId)}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setSslError(data.error ?? "Couldn't calculate this order's total. Please try again.");
        setSslStatus("error");
        return;
      }
      setSslQuote(data);
      setSslStatus("ready");
    } catch {
      setSslError("Couldn't calculate this order's total. Please try again.");
      setSslStatus("error");
    }
  }

  function closeSslModal() {
    if (sslConfirming) return;
    setSslStatus("closed");
    setSslQuote(null);
    setSslError(null);
  }

  async function confirmSsl() {
    if (sslConfirming) return;
    setSslConfirming(true);
    try {
      const res = await fetch("/api/sslcommerz/init", {
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
        setSslError(data.error ?? "Something went wrong. Please try again.");
        setSslStatus("error");
        setSslConfirming(false);
        return;
      }
      // Deliberately not resetting `sslConfirming` on success — this
      // component is about to be torn down by the navigation.
      window.location.href = data.url;
    } catch {
      setSslError("Something went wrong. Please try again.");
      setSslStatus("error");
      setSslConfirming(false);
    }
  }

  if (sold || isDemo) {
    return (
      <button
        type="button"
        disabled
        title={sold ? "This listing has already been sold." : "This is a sample listing — buying opens up once real listings are live."}
        className="rounded-xl bg-brand-strong py-2.5 text-sm font-semibold text-paper-raised shadow-[0_1px_2px_rgba(15,23,42,0.08)] opacity-60"
      >
        {sold ? "Sold" : "Sample listing"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={handleStripe}
        disabled={stripeBusy || sslStatus !== "closed"}
        className="rounded-xl bg-brand-strong py-2.5 text-sm font-semibold text-paper-raised shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-colors hover:bg-brand disabled:opacity-60"
      >
        {stripeBusy ? "Starting checkout…" : "Buy Now — Card (Stripe)"}
      </button>
      <button
        type="button"
        onClick={openSslModal}
        disabled={stripeBusy || sslStatus !== "closed"}
        className="rounded-xl bg-brand-strong py-2.5 text-sm font-semibold text-paper-raised shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-colors hover:bg-brand disabled:opacity-60"
      >
        Buy Now — SSLCommerz (bKash/Rocket/Nagad/Bank)
      </button>
      {/* Placeholder only — per the merchant ("banaiye rakho, pore details add
          korbo"): the button should exist now, with the actual escrow
          payment flow (checkout route, terms copy, confirmation step, etc.)
          wired up in a later pass. Disabled so it can't be clicked into a
          dead end in the meantime; no onClick, no backend call. */}
      <button
        type="button"
        disabled
        title="Coming soon"
        className="rounded-xl border border-rule-strong bg-transparent py-2.5 text-sm font-semibold text-ink-faint opacity-60"
      >
        Buy Now — Escrow (coming soon)
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}

      {sslStatus !== "closed" && (
        <SslcommerzConfirmModal
          status={sslStatus}
          quote={sslQuote}
          error={sslError}
          confirming={sslConfirming}
          onConfirm={confirmSsl}
          onCancel={closeSslModal}
        />
      )}
    </div>
  );
}
