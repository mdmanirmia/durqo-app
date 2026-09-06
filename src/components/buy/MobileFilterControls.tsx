"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useMarketplaceNav } from "@/lib/use-marketplace-nav";
import { draftFromFilters, draftToFilters, validateDraft, FilterDraft } from "@/lib/filter-draft";
import { buildChips } from "@/lib/marketplace-filters";
import FilterForm from "./FilterForm";
import SortControl from "./SortControl";

const RESET_PATCH = { income: "any" as const, categoryIds: [] as string[], priceMin: null, priceMax: null, ageMin: null, ageMax: null, status: "available" as const };

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Compact sticky mobile toolbar (Section 12) + the accessible filter drawer
// it opens (Section 13): heading, close button, scroll lock, focus trap,
// Escape-to-close, focus restored to the trigger, sticky bottom actions.
export default function MobileFilterControls({ total }: { total: number }) {
  const { filters, navigate, isPending } = useMarketplaceNav();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterDraft>(() => draftFromFilters(filters));
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const filterCount = buildChips(filters).filter((c) => c.key !== "q").length;

  function openDrawer() {
    setDraft(draftFromFilters(filters));
    setOpen(true);
  }

  function closeDrawer() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const dialog = dialogRef.current;
    const focusables = dialog ? Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];
    focusables[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDrawer();
        return;
      }
      if (e.key !== "Tab" || !dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const errors = validateDraft(draft);
  const hasErrors = Boolean(errors.price || errors.age);

  function apply() {
    if (hasErrors) return;
    navigate(draftToFilters(draft, filters));
    setOpen(false);
    triggerRef.current?.focus();
  }

  function reset() {
    const next = { ...filters, ...RESET_PATCH, page: 1 };
    setDraft(draftFromFilters(next));
    navigate(next);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className="md:hidden">
      <div className="sticky top-[64px] z-20 flex items-center gap-2 border-b border-rule bg-paper/95 px-3 py-2.5 backdrop-blur">
        <button
          ref={triggerRef}
          type="button"
          data-testid="mobile-filters-trigger"
          onClick={openDrawer}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border border-rule-strong bg-paper-raised px-2.5 text-xs font-semibold text-ink"
        >
          <SlidersHorizontal size={13} />
          Filters{filterCount > 0 ? ` (${filterCount})` : ""}
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-xs text-ink-soft">
          {total} result{total === 1 ? "" : "s"}
        </p>
        <SortControl compact />
      </div>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeDrawer} aria-hidden />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-filter-drawer-heading"
            className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-paper-raised shadow-[0_-16px_40px_-16px_rgba(15,23,41,0.35)]"
          >
            <div className="flex items-center justify-between border-b border-rule px-5 py-4">
              <h2 id="mobile-filter-drawer-heading" className="text-base font-semibold text-ink">
                Filter listings
              </h2>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close filters"
                className="grid h-11 w-11 place-items-center rounded-md border border-rule-strong text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <FilterForm draft={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} errors={errors} />
            </div>

            <div className="flex gap-3 border-t border-rule bg-paper-raised px-5 py-4 max-[390px]:flex-col" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
              <button
                type="button"
                onClick={reset}
                disabled={isPending}
                className="min-h-11 flex-1 rounded-md border border-rule-strong text-sm font-semibold text-ink disabled:opacity-60"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={apply}
                disabled={hasErrors || isPending}
                className="min-h-11 flex-1 rounded-md bg-brand text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Applying…" : "Apply filters"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
