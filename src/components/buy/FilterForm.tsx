"use client";

import { useId } from "react";
import { CATEGORIES } from "@/lib/categories";
import { FilterDraft, FilterDraftErrors } from "@/lib/filter-draft";

const fieldCls =
  "w-full rounded-md border border-rule-strong bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";

// The full filter field set (Section 7) — shared verbatim between the
// desktop sidebar and the mobile drawer so the two never drift apart.
// Deliberately does NOT include a keyword field (Section 4) or a
// Monetization filter (Section 7's explicit removal — monetization info
// stays on the card as tags, just not as a filter here).
export default function FilterForm({
  draft,
  onChange,
  errors,
}: {
  draft: FilterDraft;
  onChange: (patch: Partial<FilterDraft>) => void;
  errors: FilterDraftErrors;
}) {
  const incomeId = useId();

  function toggleCategory(id: string) {
    onChange({
      categoryIds: draft.categoryIds.includes(id) ? draft.categoryIds.filter((c) => c !== id) : [...draft.categoryIds, id],
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Income generating</legend>
        <div className="flex flex-col gap-1">
          {(["any", "yes", "no"] as const).map((v) => (
            <label key={v} className="flex min-h-[28px] items-center gap-2 text-sm text-ink">
              <input
                type="radio"
                name={incomeId}
                checked={draft.income === v}
                onChange={() => onChange({ income: v })}
                className="h-4 w-4 accent-brand"
              />
              {v === "any" ? "Any" : v === "yes" ? "Yes" : "No"}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Categories</legend>
        <div className="flex max-h-64 flex-col gap-1 overflow-y-auto pr-1">
          {CATEGORIES.map((c) => (
            <label key={c.id} className="flex min-h-[28px] items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={draft.categoryIds.includes(c.id)}
                onChange={() => toggleCategory(c.id)}
                className="h-4 w-4 accent-brand"
              />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Asking price</legend>
        <div className="flex gap-2">
          <input
            value={draft.priceMin}
            onChange={(e) => onChange({ priceMin: e.target.value.replace(/[^0-9]/g, "") })}
            inputMode="numeric"
            placeholder="Min (USD)"
            aria-label="Minimum asking price"
            className={fieldCls}
          />
          <input
            value={draft.priceMax}
            onChange={(e) => onChange({ priceMax: e.target.value.replace(/[^0-9]/g, "") })}
            inputMode="numeric"
            placeholder="Max (USD)"
            aria-label="Maximum asking price"
            className={fieldCls}
          />
        </div>
        {errors.price && (
          <p role="alert" className="mt-1.5 text-xs text-danger">
            {errors.price}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Business age (years)</legend>
        <div className="flex gap-2">
          <input
            value={draft.ageMin}
            onChange={(e) => onChange({ ageMin: e.target.value.replace(/[^0-9]/g, "") })}
            inputMode="numeric"
            placeholder="Min"
            aria-label="Minimum business age"
            className={fieldCls}
          />
          <input
            value={draft.ageMax}
            onChange={(e) => onChange({ ageMax: e.target.value.replace(/[^0-9]/g, "") })}
            inputMode="numeric"
            placeholder="Max"
            aria-label="Maximum business age"
            className={fieldCls}
          />
        </div>
        {errors.age && (
          <p role="alert" className="mt-1.5 text-xs text-danger">
            {errors.age}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Listing status</legend>
        <div className="flex flex-col gap-1">
          <label className="flex min-h-[28px] items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={draft.statusAvailable}
              onChange={(e) => onChange({ statusAvailable: e.target.checked })}
              className="h-4 w-4 accent-brand"
            />
            Available
          </label>
          <label className="flex min-h-[28px] items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={draft.statusSold}
              onChange={(e) => onChange({ statusSold: e.target.checked })}
              className="h-4 w-4 accent-brand"
            />
            Sold
          </label>
        </div>
      </fieldset>
    </div>
  );
}
