"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isRealListingId } from "@/lib/is-demo-listing";
import SslcommerzConfirmModal, { type SslcommerzQuote } from "@/components/SslcommerzConfirmModal";
import EscrowConfirmModal, { type EscrowQuote } from "@/components/EscrowConfirmModal";

// "Buy Now" — skips the cart entirely and starts a checkout session for
// just this one listing, via Stripe (/api/checkout), SSLCommerz's
// Bangladesh payment gateway (/api/sslcommerz/init), or Escrow.com
// (/api/escrow/init), buyer's choice. Locked once the listing is sold (or
// is a demo/mock listing with nothing real in the database to buy). Sep 9,
// 2026: gained the SSLCommerz option alongside the already-live Stripe one,
// matching the same choice CartView now offers. No country detection/
// gating — the label itself ("bKash/Rocket/Nagad/Bank") is the filter: only
// makes sense to a Bangladeshi buyer, so that's who picks it. See the
// longer note in CartView.tsx.
//
// Mirrors CartView.tsx's SSLCommerz flow: instead of redirecting straight
// to the gateway, it first fetches a quote (/api/sslcommerz/quote?listingId=)
// and shows SslcommerzConfirmModal so the buyer sees the exact BDT amount,
// the USD->BDT rate, and (for a listing over the online deposit cap) how
// the remainder is handled, before ever leaving Durqo. Stripe has no such
// step — it charges USD directly, so it still redirects immediately.
//
// Sep 10, 2026: the "Buy Now — Escrow (coming soon)" placeholder button is
// now live, using the exact same quote-then-confirm-then-redirect shape as
// the SSLCommerz option, via EscrowConfirmModal.tsx / api/escrow/quote
// /api/escrow/init. Only difference in the confirm step: no currency
// conversion to show (Escrow.com charges the full USD price directly), and
// the copy sets expectations that the buyer will finish payment on
// Escrow.com's own hosted page, possibly signing into (or being issued) an
// Escrow.com account along the way.
export default function BuyNowButton({ listingId, sold }: { listingId: string; sold?: boolean }) {
  const router = useRouter();
  const [stripeBusy, setStripeBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDemo = !isRealListingId(listingId);
  const locked = isDemo || sold;

  // "Pay Later" — a 4th checkout option, live for every signed-in buyer
  // (site owner's explicit decision, 2026-09-12, made after being told this
  // means a listing can be marked "sold" and a real Transfer Room opened
  // with no payment actually collected). Creates a real order + Transfer
  // Room with no payment gateway involved at all. See
  // api/pay-later/init/route.ts for the server-side kill switch
  // (PAY_LATER_ENABLED env var) the site owner can flip off without a
  // redeploy if this needs to come down.
  const [payLaterBusy, setPayLaterBusy] = useState(false);

  // SSLCommerz confirm-modal state — "closed" means no modal is shown.
  const [sslStatus, setSslStatus] = useState<"closed" | "loading" | "ready" | "error">("closed");
  const [sslQuote, setSslQuote] = useState<SslcommerzQuote | null>(null);
  const [sslError, setSslError] = useState<string | null>(null);
  const [sslConfirming, setSslConfirming] = useState(false);

  // Escrow.com confirm-modal state — same "closed means hidden" shape as
  // the SSLCommerz one above. Sep 10, 2026: replaces the disabled "coming
  // soon" placeholder that used to sit here.
  const [escrowStatus, setEscrowStatus] = useState<"closed" | "loading" | "ready" | "error">("closed");
  const [escrowQuote, setEscrowQuote] = useState<EscrowQuote | null>(null);
  const [escrowError, setEscrowError] = useState<string | null>(null);
  const [escrowConfirming, setEscrowConfirming] = useState(false);

  async function handleStripe() {
    if (stripeBusy || locked || sslStatus !== "closed" || escrowStatus !== "closed") return;
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
    if (stripeBusy || locked || escrowStatus !== "closed") return;
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

  async function handlePayLater() {
    if (payLaterBusy || locked || stripeBusy || sslStatus !== "closed" || escrowStatus !== "closed") return;
    setPayLaterBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pay-later/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.orderId) {
        setError(data.error ?? "Couldn't complete this. Please try again.");
        setPayLaterBusy(false);
        return;
      }
      router.push(`/dashboard/transfer/${data.orderId}`);
    } catch {
      setError("Couldn't complete this. Please try again.");
      setPayLaterBusy(false);
    }
  }

  async function openEscrowModal() {
    if (stripeBusy || locked || sslStatus !== "closed") return;
    setError(null);
    setEscrowStatus("loading");
    setEscrowQuote(null);
    setEscrowError(null);
    try {
      const res = await fetch(`/api/escrow/quote?listingId=${encodeURIComponent(listingId)}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setEscrowError(data.error ?? "Couldn't calculate this order's total. Please try again.");
        setEscrowStatus("error");
        return;
      }
      setEscrowQuote(data);
      setEscrowStatus("ready");
    } catch {
      setEscrowError("Couldn't calculate this order's total. Please try again.");
      setEscrowStatus("error");
    }
  }

  function closeEscrowModal() {
    if (escrowConfirming) return;
    setEscrowStatus("closed");
    setEscrowQuote(null);
    setEscrowError(null);
  }

  async function confirmEscrow() {
    if (escrowConfirming) return;
    setEscrowConfirming(true);
    try {
      const res = await fetch("/api/escrow/init", {
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
        setEscrowError(data.error ?? "Something went wrong. Please try again.");
        setEscrowStatus("error");
        setEscrowConfirming(false);
        return;
      }
      // Deliberately not resetting `escrowConfirming` on success — this
      // component is about to be torn down by the navigation.
      window.location.href = data.url;
    } catch {
      setEscrowError("Something went wrong. Please try again.");
      setEscrowStatus("error");
      setEscrowConfirming(false);
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
        disabled={stripeBusy || sslStatus !== "closed" || escrowStatus !== "closed"}
        className="rounded-xl bg-brand-strong py-2.5 text-sm font-semibold text-paper-raised shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-colors hover:bg-brand disabled:opacity-60"
      >
        Buy Now — SSLCommerz (bKash/Rocket/Nagad/Bank)
      </button>
      <button
        type="button"
        onClick={openEscrowModal}
        disabled={stripeBusy || sslStatus !== "closed" || escrowStatus !== "closed"}
        className="rounded-xl border border-rule-strong bg-transparent py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-paper-sunk disabled:opacity-60"
      >
        Buy Now — Escrow.com
      </button>
      <button
        type="button"
        onClick={handlePayLater}
        disabled={payLaterBusy || stripeBusy || sslStatus !== "closed" || escrowStatus !== "closed"}
        className="rounded-xl border border-rule-strong bg-transparent py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-paper-sunk disabled:opacity-60"
      >
        {payLaterBusy ? "Starting…" : "Buy Now — Pay Later"}
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

      {escrowStatus !== "closed" && (
        <EscrowConfirmModal
          status={escrowStatus}
          quote={escrowQuote}
          error={escrowError}
          confirming={escrowConfirming}
          onConfirm={confirmEscrow}
          onCancel={closeEscrowModal}
        />
      )}
    </div>
  );
}
