"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isInCart, toggleCart } from "@/lib/data/cart.client";

// "Add to Cart" / "In Cart — Remove" toggle for the listing detail sidebar.
export default function CartButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [inCart, setInCart] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isInCart(listingId).then((v) => {
      if (!cancelled) setInCart(v);
    });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await toggleCart(listingId);
      if (result === null) {
        router.push("/login");
        return;
      }
      setInCart(result);
    } catch {
      // no-op — see WishlistButton for the same reasoning
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="rounded-lg border border-rule-strong py-2.5 text-sm font-semibold hover:border-brand-strong disabled:opacity-60"
    >
      {inCart ? "In Cart — Remove" : "Add to Cart"}
    </button>
  );
}
