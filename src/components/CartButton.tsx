"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isInCart, toggleCart } from "@/lib/data/cart.client";
import { isRealListingId } from "@/lib/is-demo-listing";

// "Add to Cart" / "In Cart — Remove" toggle for the listing detail sidebar.
export default function CartButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [inCart, setInCart] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const isDemo = !isRealListingId(listingId);

  useEffect(() => {
    if (isDemo) return; // demo/mock listing — nothing in the DB to look up
    let cancelled = false;
    isInCart(listingId).then((v) => {
      if (!cancelled) setInCart(v);
    });
    return () => {
      cancelled = true;
    };
  }, [listingId, isDemo]);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      const result = await toggleCart(listingId);
      if (result === null) {
        router.push("/login");
        return;
      }
      setInCart(result);
    } catch {
      // A real (non-demo) listing failed to save — see WishlistButton.
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || isDemo}
        title={isDemo ? "This is a sample listing — cart opens up once real listings are live." : undefined}
        className="rounded-lg border border-rule-strong py-2.5 text-sm font-semibold hover:border-brand-strong disabled:opacity-60"
      >
        {isDemo ? "Sample listing" : inCart ? "In Cart — Remove" : "Add to Cart"}
      </button>
      {error && <span className="text-xs text-red-600">Couldn&apos;t save — please try again.</span>}
    </div>
  );
}
