"use client";

// Fired whenever the signed-in buyer's wishlist or cart contents change
// (add/remove from any component — ListingCard, the listing detail
// sidebar, or the /cart page's own remove/checkout actions). The Header
// listens for this to refetch its badge counts without every call site
// needing a direct reference to Header state. One shared event (rather
// than separate wishlist/cart events) keeps this simple — both counts are
// cheap to refetch together.
export const COUNTS_CHANGED_EVENT = "durqo:counts-changed";

export function emitCountsChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(COUNTS_CHANGED_EVENT));
}
