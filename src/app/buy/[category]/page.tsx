import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Container from "@/components/ui/Container";
import MarketplaceHero from "@/components/buy/MarketplaceHero";
import DesktopFilterSidebar from "@/components/buy/DesktopFilterSidebar";
import ResultsSkeleton from "@/components/buy/ResultsSkeleton";
import BottomCTA from "@/components/buy/BottomCTA";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";
import { DEFAULT_FILTERS, parseFilters } from "@/lib/marketplace-filters";
import { getMarketplaceListings } from "@/lib/data/listings.server";
import MarketplaceMain from "../MarketplaceMain";

// Sep 8, 2026 technical-SEO pass (Section 7): categories previously existed
// only as a ?category= filter on /buy — there was no indexable, unique-
// metadata URL per category for Google to rank. This route is a thin
// wrapper around the exact same marketplace UI/data (MarketplaceHero,
// DesktopFilterSidebar, MarketplaceMain, BottomCTA — byte-identical
// components to /buy) pre-filtered to one category, so it adds new URLs
// and one small category heading without changing any existing page's
// design. See build-plan-and-decisions.md-style rationale in the PR notes.
//
// One known, accepted limitation: DesktopFilterSidebar/MobileFilterControls
// read "current filters" from the query string only (useMarketplaceNav),
// not from this path segment, so their category checkbox doesn't show
// pre-checked on first load here. Results are still correctly filtered
// (this page forces categoryIds from the URL segment below), and any
// filter the visitor *does* apply through the sidebar still works and
// stays on this same path — the checkbox's initial visual state is the
// only thing affected. Reworking those shared client components to be
// path-aware would touch /buy's existing, already-shipped interactive
// filtering — out of scope for a metadata-only SEO pass.
type SearchParams = Record<string, string | string[] | undefined>;

function isDefault<K extends keyof typeof DEFAULT_FILTERS>(filters: typeof DEFAULT_FILTERS, key: K) {
  return JSON.stringify(filters[key]) === JSON.stringify(DEFAULT_FILTERS[key]);
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.id }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = CATEGORY_MAP[slug];
  if (!category) return {};

  const title = `${category.name} for Sale | Durqo`;
  const description = `Browse available ${category.name} for sale and compare their existing business information and asking prices on Durqo.`;
  const canonicalBase = `https://www.durqo.com/buy/${slug}`;

  const filters = parseFilters(await searchParams);
  const onlyPageDiffers =
    isDefault(filters, "q") &&
    isDefault(filters, "income") &&
    filters.priceMin === null &&
    filters.priceMax === null &&
    filters.ageMin === null &&
    filters.ageMax === null &&
    isDefault(filters, "status") &&
    isDefault(filters, "sort") &&
    (filters.categoryIds.length === 0 || (filters.categoryIds.length === 1 && filters.categoryIds[0] === slug));

  if (!onlyPageDiffers) {
    return {
      title,
      description,
      robots: { index: false, follow: true },
      alternates: { canonical: canonicalBase },
    };
  }

  const canonical = filters.page > 1 ? `${canonicalBase}?page=${filters.page}` : canonicalBase;
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: { type: "website", siteName: "Durqo", title, description, url: canonical },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { category: slug } = await params;
  const category = CATEGORY_MAP[slug];
  if (!category) notFound();

  const queryFilters = parseFilters(await searchParams);
  // The path segment is the category unless the visitor explicitly picked a
  // different one through the (query-string-driven) filter UI — see the
  // top-of-file note on why that UI can't fully sync with this path.
  const filters = queryFilters.categoryIds.length > 0 ? queryFilters : { ...queryFilters, categoryIds: [slug] };

  // Fetched once here (Section 13's CollectionPage/ItemList needs the same
  // listings MarketplaceMain renders) and passed down so that component
  // doesn't re-query Supabase for the same page.
  const marketplaceData = await getMarketplaceListings(filters);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.durqo.com" },
      { "@type": "ListItem", position: 2, name: "Marketplace", item: "https://www.durqo.com/buy" },
      { "@type": "ListItem", position: 3, name: category.name, item: `https://www.durqo.com/buy/${slug}` },
    ],
  };

  // CollectionPage + ItemList (Section 13) — only the real listings this
  // indexable page currently shows, in the order shown, using only their
  // already-public id/title/url. No invented fields.
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} for Sale`,
    url: `https://www.durqo.com/buy/${slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: marketplaceData.listings.map((listing, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://www.durqo.com/listing/${listing.id}`,
        name: listing.title,
      })),
    },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />

      <MarketplaceHero headingLevel="h2" />

      <div className="border-b border-rule py-6">
        <Container>
          <nav aria-label="Breadcrumb" className="mono mb-3 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
            <Link href="/" className="hover:text-ink-soft">Home</Link>
            <span aria-hidden>/</span>
            <Link href="/buy" className="hover:text-ink-soft">Marketplace</Link>
            <span aria-hidden>/</span>
            <span className="text-ink-soft">{category.name}</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl">{category.name} for sale</h1>
        </Container>
      </div>

      <div className="border-b border-rule py-8 sm:py-10">
        <Container>
          <div className="grid gap-6 md:grid-cols-[270px_1fr]">
            <DesktopFilterSidebar />
            <Suspense key={JSON.stringify(filters)} fallback={<ResultsSkeleton />}>
              <MarketplaceMain filters={filters} data={marketplaceData} />
            </Suspense>
          </div>
        </Container>
      </div>

      <BottomCTA />
    </main>
  );
}
