"use client";

import { useState } from "react";
import { useMarketplaceNav } from "@/lib/use-marketplace-nav";
import { draftFromFilters, draftToFilters, validateDraft, FilterDraft } from "@/lib/filter-draft";
import FilterForm from "./FilterForm";

const RESET_PATCH = { income: "any" as const, categoryIds: [] as string[], priceMin: null, priceMax: null, ageMin: null, ageMax: null, status: "available" as const };

// Sticky desktop filter panel (Section 6/7) — hidden below md, where the
// mobile drawer takes over. Edits are staged in local `draft` state and only
// reach the URL (and therefore the results) when Apply is pressed.
export default function DesktopFilterSidebar() {
  const { filters, navigate, isPending } = useMarketplaceNav();
  const [draft, setDraft] = useState<FilterDraft>(() => draftFromFilters(filters));

  // Re-sync when the URL changes from elsewhere (a chip removed, a category
  // shortcut clicked, Clear all) so the panel never shows stale selections.
  // Adjusting state during render (rather than in an effect) per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  const key = JSON.stringify(filters);
  const [prevKey, setPrevKey] = useState(key);
  if (key !== prevKey) {
    setPrevKey(key);
    setDraft(draftFromFilters(filters));
  }

  const errors = validateDraft(draft);
  const hasErrors = Boolean(errors.price || errors.age);

  function apply() {
    if (hasErrors) return;
    navigate(draftToFilters(draft, filters));
  }

  function reset() {
    const next = { ...filters, ...RESET_PATCH, page: 1 };
    setDraft(draftFromFilters(next));
    navigate(next);
  }

  return (
    <aside className="hidden h-max flex-col gap-6 rounded-xl border border-rule bg-paper-raised p-5 md:sticky md:top-24 md:flex md:max-h-[calc(100vh-7rem)] md:overflow-y-auto">
      <p className="mono text-xs font-semibold uppercase tracking-wide text-ink-faint">Filter listings</p>
      <FilterForm draft={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} errors={errors} />
      <div className="flex flex-col gap-2 border-t border-rule pt-4">
        <button
          type="button"
          onClick={apply}
          disabled={hasErrors || isPending}
          className="rounded-md bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Applying…" : "Apply filters"}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={isPending}
          className="rounded-md border border-rule-strong py-2.5 text-sm font-semibold text-ink transition hover:border-brand-strong disabled:opacity-60"
        >
          Reset filters
        </button>
      </div>
    </aside>
  );
}
