"use client";

import { useEffect, useRef, useState } from "react";
import { useMarketplaceNav } from "@/lib/use-marketplace-nav";
import { draftFromFilters, draftToFilters, validateDraft, FilterDraft } from "@/lib/filter-draft";
import { SlidersHorizontal, RotateCcw, ArrowRight } from "lucide-react";
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
    <aside className="hidden h-max flex-col overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-[0_1px_3px_rgba(11,19,36,0.05),0_18px_40px_-28px_rgba(11,19,36,0.35)] md:sticky md:top-24 md:flex md:max-h-[calc(100vh-7rem)]">
      {/* Dark premium header with a soft brand glow. */}
      <div className="relative overflow-hidden bg-brand-strong px-5 py-4">
        <span className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-brand/30 blur-2xl" aria-hidden />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-brand ring-1 ring-white/15">
              <SlidersHorizontal size={16} aria-hidden />
            </span>
            <div>
              <p className="text-[0.95rem] font-bold text-white">Filters</p>
              <p className="text-[0.7rem] text-white/55">{activeCount > 0 ? `${activeCount} active` : "Refine your search"}</p>
            </div>
          </div>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={reset}
              disabled={isPending}
              className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[0.7rem] font-semibold text-white/85 ring-1 ring-white/15 transition hover:bg-white/20 hover:text-white disabled:opacity-60"
            >
              <RotateCcw size={11} aria-hidden /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <FilterForm draft={draft} onChange={handleFormChange} errors={errors} />
      </div>

      <div className="flex flex-col gap-2.5 border-t border-rule bg-paper-sunk/50 px-5 py-4">
        <button
          type="button"
          onClick={apply}
          disabled={hasErrors || isPending}
          className="group flex items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_-12px_rgba(16,185,129,0.9)] transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Applying…" : "Apply filters"}
          {!isPending && <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden />}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={isPending}
          className="rounded-xl py-1.5 text-xs font-semibold text-ink-soft transition hover:text-ink disabled:opacity-60"
        >
          Reset all filters
        </button>
      </div>
    </aside>
  );
}
