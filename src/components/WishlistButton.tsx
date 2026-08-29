"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import clsx from "clsx";
import { isWishlisted, toggleWishlist } from "@/lib/data/wishlist.client";
import { isRealListingId } from "@/lib/is-demo-listing";

// Heart toggle used on ListingCard and the listing detail sidebar. Checks
// membership on mount (cheap single-row lookup) and optimistically flips on
// click; redirects to /login if the buyer isn't signed in.
export default function WishlistButton({ listingId, variant = "icon" }: { listingId: string; variant?: "icon" | "full" }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const isDemo = !isRealListingId(listingId);

  useEffect(() => {
    if (isDemo) return; // demo/mock listing — nothing in the DB to look up
    let cancelled = false;
    isWishlisted(listingId).then((v) => {
      if (!cancelled) setSaved(v);
    });
    return () => {
      cancelled = true;
    };
  }, [listingId, isDemo]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      const result = await toggleWishlist(listingId);
      if (result === null) {
        router.push("/login");
        return;
      }
      setSaved(result);
    } catch {
      // A real (non-demo) listing failed to save — surface it instead of
      // leaving the click looking like it did nothing.
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const title = isDemo ? "This is a sample listing — wishlist opens up once real listings are live." : undefined;

  if (variant === "full") {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={handleClick}
          disabled={busy || isDemo}
          title={title}
          className="flex items-center justify-center gap-2 rounded-lg border border-rule-strong py-2.5 text-sm font-semibold hover:border-brand-strong disabled:opacity-60"
        >
          <Heart size={15} className={saved ? "fill-brand text-brand" : ""} />
          {isDemo ? "Sample listing" : saved ? "Saved to wishlist" : "Add to wishlist"}
        </button>
        {error && <span className="text-xs text-red-600">Couldn&apos;t save — please try again.</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      onClick={handleClick}
      disabled={busy || isDemo}
      title={title}
      className={clsx(
        "grid h-8 w-8 place-items-center rounded-full border transition disabled:opacity-60",
        error ? "border-red-400 text-red-500" : saved ? "border-brand text-brand" : "border-rule-strong text-ink-soft hover:border-brand hover:text-brand"
      )}
    >
      <Heart size={14} className={saved ? "fill-brand" : ""} />
    </button>
  );
}
