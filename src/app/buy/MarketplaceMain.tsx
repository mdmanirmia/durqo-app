import { getMarketplaceListings, MarketplaceQueryResult } from "@/lib/data/listings.server";
import { MarketplaceFilters } from "@/lib/marketplace-filters";
import ListingCard from "@/components/ListingCard";
import ResultsToolbar from "@/components/buy/ResultsToolbar";
import MobileFilterControls from "@/components/buy/MobileFilterControls";
import FilterChipsRow from "@/components/buy/FilterChipsRow";
import ListingsTable from "@/components/buy/ListingsTable";
import EmptyState from "@/components/buy/EmptyState";
import ErrorState from "@/components/buy/ErrorState";
import Pagination from "@/components/buy/Pagination";

// The async data-fetching heart of /buy — rendered inside a keyed Suspense
// boundary (see page.tsx) so every filter/sort/page change re-suspends and
// shows ResultsSkeleton rather than silently swapping in new results (or,
// worse, flashing a false "no results" state mid-fetch).
//
// `data` is optional (Sep 8, 2026 technical-SEO pass): /buy/[category] needs
// the same listings both for this grid and for its CollectionPage/ItemList
// JSON-LD, so it fetches once and passes the result down here instead of
// this component re-querying Supabase a second time. /buy itself never
// passes `data`, so its behavior is unchanged.
export default async function MarketplaceMain({
  filters,
  data,
}: {
  filters: MarketplaceFilters;
  data?: MarketplaceQueryResult;
}) {
  const { listings, total, error } = data ?? (await getMarketplaceListings(filters));

  return (
    // min-w-0 keeps this grid item shrinkable below its content's min-content
    // width (CSS Grid's default `min-width: auto`) — without it a wide
    // descendant can inflate the whole [270px_1fr] grid track and cause
    // page-level horizontal scroll on narrow viewports.
    <div className="min-w-0">
      <div id="results-heading" className="scroll-mt-24">
        <ResultsToolbar total={total} />
      </div>
      <MobileFilterControls total={total} />
      <div className="mt-3 md:mt-3">
        <FilterChipsRow />
      </div>

      <div className="mt-4">
        {error ? (
          <ErrorState />
        ) : listings.length === 0 ? (
          <EmptyState />
        ) : filters.view === "table" ? (
          <>
            <ListingsTable listings={listings} />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:hidden">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>

      {!error && <Pagination total={total} />}
    </div>
  );
}
