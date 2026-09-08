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
export default function WishlistButton({
  listingId,
  variant = "icon",
  size = "sm",
}: {
  listingId: string;
  variant?: "icon" | "full";
  // "lg" gives the icon variant a 44×44px hit target (WCAG/mobile target-size
  // guidance) — used on ListingCard (buy-page redesign, Section 9) where the
  // wishlist button must be independently, comfortably tappable.
  size?: "sm" | "lg";
}) {
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
    // This branch is exclusive to the listing-detail page's purchase card
    // (the icon-only branch below is the one shared with ListingCard/the
    // homepage spotlight), so its styling was updated for that page's Sep
    // 2026 visual redesign without touching the icon variant.
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={handleClick}
          disabled={busy || isDemo}
          title={title}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-[#E2E7E4] bg-white text-sm font-semibold text-[#0C1830] transition-colors hover:border-[#0C1830] disabled:opacity-60"
        >
          <Heart size={15} className={saved ? "fill-[#0EAE7A] text-[#0EAE7A]" : ""} aria-hidden />
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
        "grid place-items-center rounded-full border transition disabled:opacity-60",
        size === "lg" ? "h-11 w-11" : "h-8 w-8",
        error ? "border-red-400 text-red-500" : saved ? "border-brand text-brand" : "border-rule-strong text-ink-soft hover:border-brand hover:text-brand"
      )}
    >
      <Heart size={size === "lg" ? 16 : 14} className={saved ? "fill-brand" : ""} />
    </button>
  );
}
