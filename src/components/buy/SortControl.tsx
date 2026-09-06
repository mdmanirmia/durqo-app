"use client";

import { useMarketplaceNav } from "@/lib/use-marketplace-nav";
import { SortOption } from "@/lib/marketplace-filters";

const OPTIONS: { value: SortOption; label: string; compactLabel: string }[] = [
  { value: "newest", label: "Newest first", compactLabel: "Newest" },
  { value: "price-asc", label: "Price: low to high", compactLabel: "Price ↑" },
  { value: "price-desc", label: "Price: high to low", compactLabel: "Price ↓" },
  { value: "income-desc", label: "Income: high to low", compactLabel: "Income ↓" },
];

// `compact` is the mobile sticky-toolbar version — short option labels so
// the native <select> stays narrow enough for the fixed toolbar budget
// (button + result count + this) at 320px, rather than relying on CSS
// text-overflow support on a closed <select>, which isn't consistent.
export default function SortControl({ compact = false }: { compact?: boolean }) {
  const { filters, navigate, isPending } = useMarketplaceNav();

  return (
    <div className={compact ? "shrink-0" : "flex items-center gap-2"}>
      {!compact && <span className="hidden text-sm text-ink-soft lg:inline">Sort by</span>}
      <select
        aria-label="Sort listings"
        value={filters.sort}
        disabled={isPending}
        onChange={(e) => navigate({ ...filters, sort: e.target.value as SortOption, page: 1 })}
        className={
          compact
            ? "min-h-11 max-w-[92px] rounded-md border border-rule-strong bg-paper-raised px-1.5 text-xs text-ink disabled:opacity-60"
            : "rounded-md border border-rule-strong bg-paper-raised px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none disabled:opacity-60"
        }
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {compact ? o.compactLabel : o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
