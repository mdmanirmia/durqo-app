// Shared by all three buyer checkout-init routes (api/checkout,
// api/sslcommerz/init, api/escrow/init) — a single source of truth for the
// Asset Transfer System v2's checkout-blocking gate (feasibility report,
// Section 2.7, confirmed by the site owner): a listing with no confirmed
// structured asset list (`listings.assets_confirmed_at is null`, migration
// 036) cannot be bought, because there would be nothing correct to freeze
// into an order_asset_snapshot at purchase time. Kept as one function
// (rather than duplicated per route, as some other small pieces of this
// codebase deliberately are) specifically because this is a compliance-
// relevant gate that all three payment rails must apply identically —
// fixing it in one place later must fix it everywhere at once.
export function unconfirmedListingTitles<T extends { title: string; assets_confirmed_at?: string | null }>(
  listings: T[]
): string[] {
  return listings.filter((l) => !l.assets_confirmed_at).map((l) => l.title);
}

export function assetsNotConfirmedMessage(titles: string[]): string {
  if (titles.length === 1) {
    return `"${titles[0]}" isn't ready to sell yet — the seller hasn't confirmed its asset list. Please check back once they have.`;
  }
  return `Some items aren't ready to sell yet — the seller hasn't confirmed their asset list for: ${titles.join(", ")}. Please check back once they have.`;
}
