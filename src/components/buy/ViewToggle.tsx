"use client";

import { LayoutGrid, List } from "lucide-react";
import { useMarketplaceNav } from "@/lib/use-marketplace-nav";

export default function ViewToggle() {
  const { filters, navigate, isPending } = useMarketplaceNav();

  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-rule-strong bg-paper-raised p-0.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() => navigate({ ...filters, view: "cards" })}
        aria-pressed={filters.view === "cards"}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
          filters.view === "cards" ? "bg-brand-strong text-white" : "text-ink-soft hover:text-ink"
        }`}
      >
        <LayoutGrid size={13} /> Card
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => navigate({ ...filters, view: "table" })}
        aria-pressed={filters.view === "table"}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
          filters.view === "table" ? "bg-brand-strong text-white" : "text-ink-soft hover:text-ink"
        }`}
      >
        <List size={13} /> Table
      </button>
    </div>
  );
}
