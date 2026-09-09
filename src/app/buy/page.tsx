import { Suspense } from "react";
import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import MarketplaceHero from "@/components/buy/MarketplaceHero";
import DesktopFilterSidebar from "@/components/buy/DesktopFilterSidebar";
import ResultsSkeleton from "@/components/buy/ResultsSkeleton";
import BottomCTA from "@/components/buy/BottomCTA";
import { DEFAULT_FILTERS, parseFilters } from "@/lib/marketplace-filters";
import { CATEGORY_MAP } from "@/lib/categories";
import MarketplaceMain from "./MarketplaceMain";

type SearchParams = Record<string, string | string[] | undefined>;

const TITLE = "Digital Businesses for Sale | Durqo";
const DESCRIPTION =
  "Browse websites, SaaS products, apps, e-commerce stores, domains and other digital businesses for sale on Durqo.";

// Sep 8, 2026 technical-SEO pass (Section 17): /buy carries dozens of
// possible filter/sort/pagination combinations in its query string, and
// only a few of those are worth letting Google index as separate pages:
//
//  - The bare marketplace (no filters, or only the default page=1) is the
//    one canonical, indexable "Digital Businesses for Sale" page.
//  - A genuine later page of the *unfiltered* list (?page=2, ?page=3, ...)
//    is a real, distinct set of results, so it gets its own indexable,
//    self-referencing canonical rather than being folded into page 1.
//  - A single-category filter with nothing else applied duplicates the new
//    dedicated /buy/[category] page (Section 7), so it's noindex,follow
//    and canonicalizes there instead of indexing the same listings twice.
//  - Every other filter/sort/search combination is noindex,follow and
//    canonicalizes back to the clean /buy, per Section 17 ("do not create
//    thousands of indexable URL combinations from categories, prices,
//    ages, statuses, sort orders, search terms").
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  const isDefault = (key: keyof typeof DEFAULT_FILTERS) =>
    JSON.stringify(filters[key]) === JSON.stringify(DEFAULT_FILTERS[key]);

  const onlyCategoryDiffers =
    filters.categoryIds.length === 1 &&
    isDefault("q") &&
    isDefault("income") &&
    filters.priceMin === null &&
    filters.priceMax === null &&
    filters.ageMin === null &&
    filters.ageMax === null &&
    isDefault("status") &&
    isDefault("sort") &&
    isDefault("page");

  const noOtherFiltersThanPage =
    filters.categoryIds.length === 0 &&
    isDefault("q") &&
    isDefault("income") &&
    filters.priceMin === null &&
    filters.priceMax === null &&
    filters.ageMin === null &&
    filters.ageMax === null &&
    isDefault("status") &&
    isDefault("sort");

  if (onlyCategoryDiffers && CATEGORY_MAP[filters.categoryIds[0]]) {
    return {
      title: TITLE,
      description: DESCRIPTION,
      robots: { index: false, follow: true },
      alternates: { canonical: `https://www.durqo.com/buy/${filters.categoryIds[0]}` },
    };
  }

  if (noOtherFiltersThanPage) {
    const canonical =
      filters.page > 1 ? `https://www.durqo.com/buy?page=${filters.page}` : "https://www.durqo.com/buy";
    return {
      title: TITLE,
      description: DESCRIPTION,
      robots: { index: true, follow: true },
      alternates: { canonical },
      openGraph: { type: "website", siteName: "Durqo", title: TITLE, description: DESCRIPTION, url: canonical },
      twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
    };
  }

  // Any other filter/sort/search combination: still worth crawling through
  // (so Googlebot can reach every listing via its links), just not worth
  // indexing as its own page.
  return {
    title: TITLE,
    description: DESCRIPTION,
    robots: { index: false, follow: true },
    alternates: { canonical: "https://www.durqo.com/buy" },
  };
}

export default async function BuyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = parseFilters(await searchParams);

  return (
    <main>
      <MarketplaceHero />

      <div className="border-b border-rule py-8 sm:py-10">
        <Container>
          <div className="grid gap-6 md:grid-cols-[270px_1fr]">
            <DesktopFilterSidebar />
            {/* Keyed so every filter/sort/page change remounts this boundary
                and shows ResultsSkeleton again, instead of React keeping the
                previous (now stale) results on screen during the transition. */}
            <Suspense key={JSON.stringify(filters)} fallback={<ResultsSkeleton />}>
              <MarketplaceMain filters={filters} />
            </Suspense>
          </div>
        </Container>
      </div>

      <BottomCTA />
    </main>
  );
}
