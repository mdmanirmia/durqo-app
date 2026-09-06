import { Suspense } from "react";
import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import MarketplaceHero from "@/components/buy/MarketplaceHero";
import DesktopFilterSidebar from "@/components/buy/DesktopFilterSidebar";
import ResultsSkeleton from "@/components/buy/ResultsSkeleton";
import BottomCTA from "@/components/buy/BottomCTA";
import { parseFilters } from "@/lib/marketplace-filters";
import MarketplaceMain from "./MarketplaceMain";

// Section 19.
export const metadata: Metadata = {
  title: "Digital Businesses for Sale | Durqo Marketplace",
  description:
    "Browse verified websites, SaaS products, apps, e-commerce brands, digital agencies and other online businesses for sale on Durqo.",
  alternates: { canonical: "https://www.durqo.com/buy" },
};

export default async function BuyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
