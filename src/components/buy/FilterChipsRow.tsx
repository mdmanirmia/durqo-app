"use client";

import { X } from "lucide-react";
import { useMarketplaceNav } from "@/lib/use-marketplace-nav";
import { buildChips, DEFAULT_FILTERS } from "@/lib/marketplace-filters";

// Removable active-filter chips + "Clear all" (Section 8). "Available" is
// the permanent default so it never earns a chip of its own — buildChips
// already encodes that rule.
export default function FilterChipsRow() {
  const { filters, navigate } = useMarketplaceNav();
  const chips = buildChips(filters);

  if (chips.length === 0) return null;

  return (
    <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto py-1">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-rule-strong bg-paper-raised py-1.5 pl-3 pr-2 text-xs text-ink"
        >
          {chip.label}
          <button
            type="button"
            aria-label={`Remove filter: ${chip.label}`}
            onClick={() => navigate(chip.remove(filters))}
            className="grid h-5 w-5 place-items-center rounded-full text-ink-faint hover:bg-paper-sunk hover:text-ink"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => navigate({ ...DEFAULT_FILTERS })}
        className="shrink-0 text-xs font-semibold text-brand-hover hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
