"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { MarketplaceFilters, filtersToHref, parseFilters } from "@/lib/marketplace-filters";

// Shared client-side navigation hook for every interactive /buy control
// (search box, filter panel, sort, view toggle, chips, pagination) — reads
// the current filters straight from the URL (the single source of truth,
// per the redesign spec's URL-state requirement) and pushes a new URL for
// any change, wrapped in a transition so callers can disable buttons /
// suspend the results while the server re-renders.
export function useMarketplaceNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = parseFilters(searchParams);

  function navigate(next: MarketplaceFilters, opts: { scroll?: boolean } = {}) {
    const href = filtersToHref(next, pathname);
    startTransition(() => router.push(href, { scroll: opts.scroll ?? false }));
  }

  return { filters, navigate, isPending };
}
