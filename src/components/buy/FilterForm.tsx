"use client";

import { useId } from "react";
import { Check, Coins, LayoutGrid, CircleDollarSign, CalendarClock, Tag, Globe } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { FilterDraft, FilterDraftErrors } from "@/lib/filter-draft";

// Oct 22, 2026 ("left er filter card ta aro valo kore deisgn"): premium
// redesign. Same fields, same draft shape and validation; only the
// presentation changed (segmented income control, icon category rows,
// prefixed range inputs with quick price presets, status chips). Native
// inputs are kept (visually hidden where restyled) so keyboard and screen
// reader behavior is unchanged.
const fieldWrap =
  "flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border border-rule bg-paper-raised px-3 shadow-[inset_0_1px_2px_rgba(11,19,36,0.04)] transition hover:border-rule-strong focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/25";
const fieldInput = "w-full min-w-0 bg-transparent py-2.5 text-sm font-medium text-ink placeholder:font-normal placeholder:text-ink-faint focus:outline-none";

const PRICE_PRESETS: { label: string; min: string; max: string }[] = [
  { label: "Under $1K", min: "", max: "1000" },
  { label: "$1K to $10K", min: "1000", max: "10000" },
  { label: "$10K to $50K", min: "10000", max: "50000" },
  { label: "$50K+", min: "50000", max: "" },
];

function Section({ icon: Icon, title, children }: { icon: typeof Coins; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0 border-t border-rule pt-5 first:border-t-0 first:pt-0">
      <legend className="float-left mb-3 flex w-full items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-soft text-brand">
          <Icon size={13} aria-hidden />
        </span>
        {title}
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition ${
        checked ? "border-brand bg-brand text-white" : "border-rule-strong bg-paper-raised text-transparent"
      }`}
      aria-hidden
    >
      <Check size={12} strokeWidth={3} />
    </span>
  );
}

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
    <div className="flex flex-col gap-5">
      <Section icon={Coins} title="Income generating">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-paper-sunk p-1">
          {(["any", "yes", "no"] as const).map((v) => {
            const on = draft.income === v;
            return (
              <label
                key={v}
                className={`cursor-pointer rounded-lg py-1.5 text-center text-sm font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40 ${
                  on ? "bg-brand-strong text-white shadow-[0_4px_10px_-4px_rgba(11,19,36,0.5)]" : "text-ink-soft hover:text-ink"
                }`}
              >
                <input type="radio" name={incomeId} checked={on} onChange={() => onChange({ income: v })} className="sr-only" />
                {v === "any" ? "Any" : v === "yes" ? "Yes" : "No"}
              </label>
            );
          })}
        </div>
      </Section>

      <Section icon={LayoutGrid} title="Categories">
        <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto pr-1 [mask-image:linear-gradient(to_bottom,#000_88%,transparent)]">
          {CATEGORIES.map((c) => {
            const on = draft.categoryIds.includes(c.id);
            const Icon = CATEGORY_ICONS[c.id] ?? Globe;
            return (
              <label
                key={c.id}
                className={`flex min-h-[36px] cursor-pointer items-center gap-2.5 rounded-lg px-2 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40 ${
                  on ? "bg-brand-soft font-semibold text-ink shadow-[inset_3px_0_0_#10B981]" : "text-ink-soft hover:bg-paper-sunk hover:text-ink"
                }`}
              >
                <input type="checkbox" checked={on} onChange={() => toggleCategory(c.id)} className="sr-only" />
                <CheckBox checked={on} />
                <Icon size={15} className={on ? "text-brand" : "text-ink-faint"} aria-hidden />
                <span className="truncate">{c.name}</span>
              </label>
            );
          })}
        </div>
      </Section>

      <Section icon={CircleDollarSign} title="Asking price">
        <div className="flex items-center gap-2">
          <label className={fieldWrap}>
            <span className="text-sm text-ink-faint">$</span>
            <input
              value={draft.priceMin}
              onChange={(e) => onChange({ priceMin: e.target.value.replace(/[^0-9]/g, "") })}
              inputMode="numeric"
              placeholder="Min"
              aria-label="Minimum asking price"
              className={fieldInput}
            />
          </label>
          <span className="text-xs text-ink-faint">to</span>
          <label className={fieldWrap}>
            <span className="text-sm text-ink-faint">$</span>
            <input
              value={draft.priceMax}
              onChange={(e) => onChange({ priceMax: e.target.value.replace(/[^0-9]/g, "") })}
              inputMode="numeric"
              placeholder="Max"
              aria-label="Maximum asking price"
              className={fieldInput}
            />
          </label>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map((p) => {
            const on = draft.priceMin === p.min && draft.priceMax === p.max;
            return (
              <button
                key={p.label}
                type="button"
                aria-pressed={on}
                onClick={() => onChange(on ? { priceMin: "", priceMax: "" } : { priceMin: p.min, priceMax: p.max })}
                className={`rounded-full border px-2.5 py-1 text-[0.72rem] font-medium transition ${
                  on ? "border-brand-strong bg-brand-strong text-white" : "border-rule bg-paper-raised text-ink-soft hover:border-brand/50 hover:text-ink"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        {errors.price && (
          <p role="alert" className="mt-1.5 text-xs text-danger">
            {errors.price}
          </p>
        )}
      </Section>

      <Section icon={CalendarClock} title="Business age">
        <div className="flex items-center gap-2">
          <label className={fieldWrap}>
            <input
              value={draft.ageMin}
              onChange={(e) => onChange({ ageMin: e.target.value.replace(/[^0-9]/g, "") })}
              inputMode="numeric"
              placeholder="Min"
              aria-label="Minimum business age"
              className={fieldInput}
            />
            <span className="text-xs text-ink-faint">yrs</span>
          </label>
          <span className="text-xs text-ink-faint">to</span>
          <label className={fieldWrap}>
            <input
              value={draft.ageMax}
              onChange={(e) => onChange({ ageMax: e.target.value.replace(/[^0-9]/g, "") })}
              inputMode="numeric"
              placeholder="Max"
              aria-label="Maximum business age"
              className={fieldInput}
            />
            <span className="text-xs text-ink-faint">yrs</span>
          </label>
        </div>
        {errors.age && (
          <p role="alert" className="mt-1.5 text-xs text-danger">
            {errors.age}
          </p>
        )}
      </Section>

      <Section icon={Tag} title="Listing status">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Available", on: draft.statusAvailable, key: "statusAvailable" as const },
            { label: "Sold", on: draft.statusSold, key: "statusSold" as const },
          ].map(({ label, on, key }) => (
            <label
              key={label}
              className={`flex min-h-[38px] cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40 ${
                on ? "border-brand bg-brand-soft font-semibold text-ink" : "border-rule text-ink-soft hover:border-rule-strong"
              }`}
            >
              <input type="checkbox" checked={on} onChange={(e) => onChange({ [key]: e.target.checked })} className="sr-only" />
              <CheckBox checked={on} />
              {label}
            </label>
          ))}
        </div>
      </Section>
    </div>
  );
}
