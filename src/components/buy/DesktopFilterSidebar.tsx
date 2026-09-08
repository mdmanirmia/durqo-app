"use client";

import { useEffect, useRef, useState } from "react";
import { useMarketplaceNav } from "@/lib/use-marketplace-nav";
import { draftFromFilters, draftToFilters, validateDraft, FilterDraft } from "@/lib/filter-draft";
import FilterForm from "./FilterForm";

const RESET_PATCH = { income: "any" as const, categoryIds: [] as string[], priceMin: null, priceMax: null, ageMin: null, ageMax: null, status: "available" as const };

// Sep 8 2026 ("filter e kono akta input click korle sathe sathei update
// hobe auto" — picking a filter should update the results immediately,
// with no separate Apply step): how long to wait after the draft last
// changed before auto-navigating. Short enough that a checkbox/radio click
// reads as instant, long enough that typing a multi-digit price/age value
// coalesces into one navigation instead of one per keystroke.
const AUTO_APPLY_DELAY_MS = 300;

// Sticky desktop filter panel (Section 6/7) — hidden below md, where the
// mobile drawer takes over. Edits are staged in local `draft` state and
// auto-applied to the URL (and therefore the results) a short debounce
// after the last change — every FilterForm field change schedules it
// directly (see handleFormChange), so an external resync of `draft` (the
// effect below, for a chip removed elsewhere) never itself triggers a
// navigation. Apply remains as a manual "commit now" action that skips the
// debounce wait; Reset cancels any pending auto-apply before navigating.
export default function DesktopFilterSidebar() {
  const { filters, navigate, isPending } = useMarketplaceNav();
  const [draft, setDraft] = useState<FilterDraft>(() => draftFromFilters(filters));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Clear any pending debounce on unmount so it can't navigate after this
  // panel is gone.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const errors = validateDraft(draft);
  const hasErrors = Boolean(errors.price || errors.age);

  function scheduleAutoApply(nextDraft: FilterDraft) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const nextErrors = validateDraft(nextDraft);
    if (nextErrors.price || nextErrors.age) return; // don't auto-apply an invalid range
    debounceRef.current = setTimeout(() => {
      navigate(draftToFilters(nextDraft, filters));
    }, AUTO_APPLY_DELAY_MS);
  }

  function handleFormChange(patch: Partial<FilterDraft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    scheduleAutoApply(next);
  }

  function apply() {
    if (hasErrors) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    navigate(draftToFilters(draft, filters));
  }

  function reset() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const next = { ...filters, ...RESET_PATCH, page: 1 };
    setDraft(draftFromFilters(next));
    navigate(next);
  }

  return (
    <aside className="hidden h-max flex-col gap-6 rounded-xl border border-rule bg-paper-raised p-5 md:sticky md:top-24 md:flex md:max-h-[calc(100vh-7rem)] md:overflow-y-auto">
      <p className="mono text-xs font-semibold uppercase tracking-wide text-ink-faint">Filter listings</p>
      <FilterForm draft={draft} onChange={handleFormChange} errors={errors} />
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
