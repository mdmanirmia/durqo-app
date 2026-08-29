"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { getCartListings, removeFromCart } from "@/lib/data/cart.client";
import { CATEGORY_MAP } from "@/lib/categories";
import { fmtUSD } from "@/lib/format";
import type { Listing } from "@/lib/types";

export default function CartPage() {
  const [items, setItems] = useState<Listing[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleRequest() {
    if (!items || items.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      // Full browser navigation to Stripe's hosted checkout page — the
      // buyer pays there, then Stripe redirects back to /checkout/success
      // (or straight back here on cancel). Deliberately not resetting
      // `busy` on success: this component is about to be torn down by the
      // navigation, and staying disabled avoids a flash of the enabled
      // button in the moment before that happens.
      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:px-7">
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
                <div key={l.id} className="flex items-center gap-4 rounded-lg border border-rule bg-paper-raised p-4">
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
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-paper-sunk hover:text-danger"
                  >
                    <X size={15} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg border border-rule bg-paper-raised p-5">
            <div className="mono mb-4 flex justify-between text-lg">
              <span>Total</span>
              <span className="font-semibold">{fmtUSD(total)}</span>
            </div>
            <button
              type="button"
              onClick={handleRequest}
              disabled={busy}
              className="w-full rounded-lg bg-brand-strong py-3 text-sm font-semibold text-paper-raised hover:bg-brand disabled:opacity-60"
            >
              {busy ? "Redirecting to checkout…" : "Request to purchase"}
            </button>
            {error && <p className="mt-3 text-center text-sm text-danger">{error}</p>}
            <p className="mt-3 text-center text-xs text-ink-faint">
              You&rsquo;ll pay securely via Stripe, then we&rsquo;ll connect you with each seller to release escrow.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
