"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMarketplaceNav } from "@/lib/use-marketplace-nav";
import { PAGE_SIZE } from "@/lib/marketplace-filters";

function pageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("ellipsis");
    result.push(p);
    prev = p;
  }
  return result;
}

// Preserves every other filter/sort/view param (navigate() always carries
// the full current filters forward) and scrolls back to the results heading
// after a page change (Section 16).
export default function Pagination({ total }: { total: number }) {
  const { filters, navigate, isPending } = useMarketplaceNav();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (totalPages <= 1) return null;

  function go(page: number) {
    if (page < 1 || page > totalPages || page === filters.page) return;
    navigate({ ...filters, page });
    requestAnimationFrame(() => {
      document.getElementById("results-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => go(filters.page - 1)}
        disabled={filters.page <= 1 || isPending}
        aria-label="Previous page"
        className="grid h-9 w-9 place-items-center rounded-md border border-rule-strong text-ink disabled:opacity-40"
      >
        <ChevronLeft size={15} />
      </button>
      {pageNumbers(filters.page, totalPages).map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e${i}`} className="px-1 text-sm text-ink-faint">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => go(p)}
            aria-current={p === filters.page ? "page" : undefined}
            disabled={isPending}
            className={`h-9 min-w-9 rounded-md px-2.5 text-sm font-medium transition ${
              p === filters.page ? "bg-brand-strong text-white" : "border border-rule-strong text-ink hover:border-brand-strong"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => go(filters.page + 1)}
        disabled={filters.page >= totalPages || isPending}
        aria-label="Next page"
        className="grid h-9 w-9 place-items-center rounded-md border border-rule-strong text-ink disabled:opacity-40"
      >
        <ChevronRight size={15} />
      </button>
    </nav>
  );
}
