"use client";

// Split out of cart/page.tsx (Sep 8, 2026 technical-SEO pass, Section 15):
// page.tsx needs to be a Server Component to export a server-rendered
// noindex robots tag. Same component, same logic — only the file changed.
//
// Sep 9, 2026: gained a second payment rail (SSLCommerz, for bKash/Rocket/
// Nagad/bank buyers in Bangladesh) alongside the existing Stripe checkout —
// the buyer picks which one to use, matching how BuyNowButton on the
// listing detail page offers the same choice. No country detection/gating:
// the button is just labeled "SSLCommerz (bKash/Rocket/Nagad/Bank)", which
// is self-explanatory to Bangladeshi buyers and meaningless to anyone else
// — per the merchant's own call, that's enough to keep non-Bangladeshi
// buyers from picking a payment method that can't actually charge them
// (SSLCommerz only settles in BDT). Reading `sslcommerz_error` off the URL
// (set by /api/sslcommerz/fail|cancel when SSLCommerz sends the buyer back
// here) needs useSearchParams, which requires a Suspense boundary — same
// pattern already used in CheckoutSuccessView.tsx.
//
// The SSLCommerz button no longer redirects straight to the gateway: it
// first fetches a quote (/api/sslcommerz/quote) and shows
// SslcommerzConfirmModal so the buyer sees the exact BDT amount, the
// USD->BDT rate, and (for a listing over the online deposit cap) how the
// remainder is handled, before ever leaving Durqo. Stripe has no such step
// — it charges USD directly, so "Pay with card" still redirects immediately.
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { getCartListings, removeFromCart } from "@/lib/data/cart.client";
import { CATEGORY_MAP } from "@/lib/categories";
import { fmtUSD } from "@/lib/format";
import type { Listing } from "@/lib/types";
import Container from "@/components/ui/Container";
import SslcommerzConfirmModal, { type SslcommerzQuote } from "@/components/SslcommerzConfirmModal";

// Reads the one-time `sslcommerz_error` redirect flag into an initial error
// message. Computed as a plain function (not an effect) since the value is
// already available synchronously from the URL on first render — a
// `useEffect` calling `setState` here would just trigger an avoidable extra
// render, the same `react-hooks/set-state-in-effect` pitfall this codebase
// already hit and fixed elsewhere (see seller/page.tsx, GaPropertyPicker.tsx).
function initialSslErrorMessage(searchParams: URLSearchParams): string | null {
  const sslError = searchParams.get("sslcommerz_error");
  if (sslError === "failed") {
    return "Your Bangladesh payment gateway checkout couldn't be completed. Please try again.";
  }
  if (sslError === "cancelled") {
    return "You cancelled the Bangladesh payment gateway checkout.";
  }
  return null;
}

function CartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Listing[] | null>(null);
  const [stripeBusy, setStripeBusy] = useState(false);
  const [error, setError] = useState<string | null>(() => initialSslErrorMessage(searchParams));

  // SSLCommerz confirm-modal state — "closed" means no modal is shown.
  const [sslStatus, setSslStatus] = useState<"closed" | "loading" | "ready" | "error">("closed");
  const [sslQuote, setSslQuote] = useState<SslcommerzQuote | null>(null);
  const [sslError, setSslError] = useState<string | null>(null);
  const [sslConfirming, setSslConfirming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCartListings().then((data) => {
      if (!cancelled) setItems(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = (items ?? []).reduce((sum, l) => sum + (l.discountedPrice ?? l.price), 0);

  async function handleRemove(listingId: string) {
    setItems((prev) => (prev ?? []).filter((l) => l.id !== listingId));
    try {
      await removeFromCart(listingId);
    } catch {
      // leave it removed from view — a stray row left in cart_items isn't
      // harmful and re-fetching would just flicker it back in
    }
  }

  async function handleStripe() {
    if (!items || items.length === 0 || stripeBusy) return;
    setStripeBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      // Matches BuyNowButton's handling — a signed-out visitor whose stale
      // cart/session somehow got them this far is sent to /login instead of
      // just being shown "you need to be logged in" as inline error text.
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setStripeBusy(false);
        return;
      }
      // Full browser navigation to Stripe's hosted checkout page — staying
      // disabled avoids a flash of the enabled button before the
      // navigation tears this component down.
      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setStripeBusy(false);
    }
  }

  async function openSslModal() {
    if (!items || items.length === 0) return;
    setError(null);
    setSslStatus("loading");
    setSslQuote(null);
    setSslError(null);
    try {
      const res = await fetch("/api/sslcommerz/quote");
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
      const res = await fetch("/api/sslcommerz/init", { method: "POST" });
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

  return (
    <Container className="max-w-3xl py-12">
      <h1 className="mb-8 text-3xl">Your cart</h1>

      {items === null ? (
        <p className="text-ink-faint">Loading your cart&hellip;</p>
      ) : items.length === 0 ? (
        <p className="text-ink-faint">Your cart is empty. <Link href="/buy" className="font-semibold text-brand-strong">Browse listings &rarr;</Link></p>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            {items.map((l) => {
              const category = CATEGORY_MAP[l.categoryId];
              return (
                <div key={l.id} className="flex items-center gap-4 rounded-xl border border-rule bg-paper-raised p-4">
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-paper-sunk" />
                  <div className="flex-grow">
                    <p className="mono text-[0.65rem] uppercase tracking-wide text-brand-strong">{category?.name}</p>
                    <h4 className="text-lg font-semibold">{l.title}</h4>
                  </div>
                  <span className="mono font-semibold text-brand-strong">{fmtUSD(l.discountedPrice ?? l.price)}</span>
                  <button
                    type="button"
                    aria-label="Remove from cart"
                    onClick={() => handleRemove(l.id)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-rule-strong text-ink-faint hover:border-danger hover:text-danger"
                  >
                    <X size={15} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-rule bg-paper-raised p-5">
            <div className="mono mb-4 flex justify-between text-lg">
              <span>Total</span>
              <span className="font-semibold">{fmtUSD(total)}</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleStripe}
                disabled={stripeBusy || sslStatus !== "closed"}
                className="w-full rounded-md bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
              >
                {stripeBusy ? "Redirecting to checkout…" : "Pay with card (Stripe)"}
              </button>
              <button
                type="button"
                onClick={openSslModal}
                disabled={stripeBusy || sslStatus !== "closed"}
                className="w-full rounded-md bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
              >
                SSLCommerz (bKash/Rocket/Nagad/Bank)
              </button>
            </div>
            {error && <p className="mt-3 text-center text-sm text-danger">{error}</p>}
            <p className="mt-3 text-center text-xs text-ink-faint">
              You&rsquo;ll pay securely via Stripe or SSLCommerz, then we&rsquo;ll connect you with each seller to release
              escrow.
            </p>
          </div>
        </div>
      )}

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
    </Container>
  );
}

export default function CartView() {
  return (
    <Suspense fallback={<Container className="max-w-3xl py-12 text-ink-faint">Loading&hellip;</Container>}>
      <CartContent />
    </Suspense>
  );
}
