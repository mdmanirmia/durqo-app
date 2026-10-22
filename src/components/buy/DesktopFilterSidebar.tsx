"use client";

import { useEffect, useRef, useState } from "react";
import { useMarketplaceNav } from "@/lib/use-marketplace-nav";
import { draftFromFilters, draftToFilters, validateDraft, FilterDraft } from "@/lib/filter-draft";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
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

  const activeCount =
    (draft.income !== "any" ? 1 : 0) +
    draft.categoryIds.length +
    (draft.priceMin || draft.priceMax ? 1 : 0) +
    (draft.ageMin || draft.ageMax ? 1 : 0) +
    (draft.statusSold ? 1 : 0);

  return (
    <aside className="hidden h-max flex-col overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-[0_1px_3px_rgba(11,19,36,0.05),0_12px_32px_-24px_rgba(11,19,36,0.25)] md:sticky md:top-24 md:flex md:max-h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between gap-3 border-b border-rule bg-gradient-to-b from-brand-soft/60 to-paper-raised px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white">
            <SlidersHorizontal size={15} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Filters</p>
            <p className="text-[0.68rem] text-ink-faint">{activeCount > 0 ? `${activeCount} active` : "Refine your search"}</p>
          </div>
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={reset}
            disabled={isPending}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-ink-soft transition hover:bg-paper-sunk hover:text-ink disabled:opacity-60"
          >
            <RotateCcw size={12} aria-hidden /> Reset
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <FilterForm draft={draft} onChange={handleFormChange} errors={errors} />
      </div>

      <div className="flex flex-col gap-2 border-t border-rule bg-paper-sunk/40 px-5 py-4">
        <button
          type="button"
          onClick={apply}
          disabled={hasErrors || isPending}
          className="rounded-lg bg-brand py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(16,185,129,0.8)] transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Applying…" : "Apply filters"}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={isPending}
          className="rounded-lg border border-rule-strong bg-paper-raised py-2.5 text-sm font-semibold text-ink transition hover:border-brand-strong disabled:opacity-60"
        >
          Reset filters
        </button>
      </div>
    </aside>
  );
}
