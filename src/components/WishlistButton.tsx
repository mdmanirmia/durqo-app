"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import clsx from "clsx";
import { isWishlisted, toggleWishlist } from "@/lib/data/wishlist.client";

// Heart toggle used on ListingCard and the listing detail sidebar. Checks
// membership on mount (cheap single-row lookup) and optimistically flips on
// click; redirects to /login if the buyer isn't signed in.
export default function WishlistButton({ listingId, variant = "icon" }: { listingId: string; variant?: "icon" | "full" }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isWishlisted(listingId).then((v) => {
      if (!cancelled) setSaved(v);
    });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const result = await toggleWishlist(listingId);
      if (result === null) {
        router.push("/login");
        return;
      }
      setSaved(result);
    } catch {
      // Leave state as-is; a silent failure here just means the click didn't
      // register — safer than misleading the buyer with a flipped heart
      // that isn't actually saved.
    } finally {
      setBusy(false);
    }
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="flex items-center justify-center gap-2 rounded-lg border border-rule-strong py-2.5 text-sm font-semibold hover:border-brand-strong disabled:opacity-60"
      >
        <Heart size={15} className={saved ? "fill-brand text-brand" : ""} />
        {saved ? "Saved to wishlist" : "Add to wishlist"}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      onClick={handleClick}
      disabled={busy}
      className={clsx(
        "grid h-8 w-8 place-items-center rounded-full border transition disabled:opacity-60",
        saved ? "border-brand text-brand" : "border-rule-strong text-ink-soft hover:border-brand hover:text-brand"
      )}
    >
      <Heart size={14} className={saved ? "fill-brand" : ""} />
    </button>
  );
}
