"use client";

import { useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useMarketplaceNav } from "@/lib/use-marketplace-nav";

// Hero search box (Section 4): searches title/overview/category, debounces
// automatic search 300–500ms, submits immediately on Enter, stores the term
// in the URL, and clearing restores the full result set. Intentionally the
// only keyword input on the page — the filter panel doesn't get its own
// (Section 4: "Do not add another keyword input to the filter panel").
export default function MarketplaceSearchBox() {
  const { filters, navigate } = useMarketplaceNav();
  const [value, setValue] = useState(filters.q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stay in sync when the term changes elsewhere (a chip removal, Clear
  // all) — adjusting state during render rather than in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  const [prevQ, setPrevQ] = useState(filters.q);
  if (filters.q !== prevQ) {
    setPrevQ(filters.q);
    setValue(filters.q);
  }

  function commit(term: string) {
    if (timer.current) clearTimeout(timer.current);
    navigate({ ...filters, q: term.trim(), page: 1 });
  }

  function handleChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next), 400);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit(value);
    }
  }

  function handleClear() {
    setValue("");
    commit("");
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        commit(value);
      }}
      className="flex w-full flex-col gap-2 sm:flex-row"
    >
      <div className="relative flex-1">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden />
        <input
          type="search"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by business name, category or keyword"
          aria-label="Search by business name, category or keyword"
          className="w-full rounded-lg border border-transparent bg-white py-3 pl-10 pr-9 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-ink-faint hover:bg-paper-sunk hover:text-ink"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
      >
        Search listings
      </button>
    </form>
  );
}
