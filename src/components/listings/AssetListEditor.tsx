"use client";

import { Plus, Trash2 } from "lucide-react";

export type AssetRow = { id?: string; name: string; buyerReceives: string; transferMethod: string; note: string };

const inputCls = "rounded-md border border-rule-strong bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand-strong focus:outline-none";

function emptyRow(): AssetRow {
  return { name: "", buyerReceives: "", transferMethod: "", note: "" };
}

// The structured, seller-authored asset list behind the Asset Transfer
// System v2 (feasibility report, Part 1: "100% seller-authored — no
// category templates, no auto-suggestion, no AI-derived asset list,
// ever"). Deliberately just four plain text fields per row, no dropdowns
// or suggestions of any kind.
//
// IS "Assets included" now (2026-09-12, per the site owner's explicit
// correction) — not a second, separately-named thing living underneath
// it. There used to be a free-text "Assets included" textarea plus this
// component under its own "Structured Asset List" heading below; both the
// separate heading and the free-text box are gone. The caller renders this
// directly under a plain "Assets included" label (see ListingEditForm.tsx
// / seller/listings/new/page.tsx), and the old free-text column is now
// auto-derived from these same rows' names rather than typed separately —
// exactly what buyers see, what confirms instantly, and what freezes into
// the Transfer Room are all one and the same list.
//
// Confirmation used to be a separate manual step (a "Confirm this list"
// button, gated on saving first) — removed 2026-09-12 per the site owner's
// explicit request: saving a non-empty list now confirms it instantly, in
// the same Server Action call (see updateListingFull in
// src/lib/actions/listing-edit.ts, and the equivalent insert-time logic in
// the "new listing" page). This component is now display-only about
// confirmation status — there is nothing left here to click to confirm.
//
// One card per asset rather than a table: at 3-4 fields per row a table
// forces horizontal scrolling on mobile, while a stacked card reflows
// cleanly at any width (grid-cols-1 below sm:grid-cols-2) — the same
// "cards over dense tables" preference the report's wireframe section
// asked for in the Transfer Room itself.
export default function AssetListEditor({
  rows,
  setRows,
  confirmedAt,
}: {
  rows: AssetRow[];
  setRows: (rows: AssetRow[]) => void;
  // Last-saved server truth (listings.assets_confirmed_at). Only reflects
  // what's actually in the database — the caller is responsible for
  // updating this right after a successful save, since a save now also
  // confirms (or un-confirms, if the list was cleared out) in the same
  // step.
  confirmedAt: string | null;
}) {
  const hasAtLeastOneNamedRow = rows.some((r) => r.name.trim());

  function update(i: number, key: keyof AssetRow, v: string) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-ink-faint">
        Add each asset the buyer is getting. This exact list is what buyers see on the listing, confirms the moment you save, and freezes into their Transfer Room when they pay — nothing auto-generated, only what you enter here.
      </p>

      <div className="flex flex-col gap-3">
        {rows.map((r, i) => (
          <div key={i} className="rounded-lg border border-rule-strong bg-paper p-3">
            <div className="grid gap-2.5 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-ink-soft">Asset name</span>
                <input placeholder="e.g. Domain name" value={r.name} onChange={(e) => update(i, "name", e.target.value)} className={`${inputCls} w-full`} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-ink-soft">What the buyer receives</span>
                <input placeholder="e.g. Full ownership transfer" value={r.buyerReceives} onChange={(e) => update(i, "buyerReceives", e.target.value)} className={`${inputCls} w-full`} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-ink-soft">How it will be transferred</span>
                <input placeholder="e.g. Registrar transfer" value={r.transferMethod} onChange={(e) => update(i, "transferMethod", e.target.value)} className={`${inputCls} w-full`} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-ink-soft">Note (optional)</span>
                <input placeholder="Anything the buyer should know" value={r.note} onChange={(e) => update(i, "note", e.target.value)} className={`${inputCls} w-full`} />
              </label>
            </div>
            <button
              type="button"
              onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
              className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-ink-faint hover:text-danger"
            >
              <Trash2 size={13} /> Remove asset
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setRows([...rows, emptyRow()])}
        className="flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-strong"
      >
        <Plus size={14} /> Add asset
      </button>

      <div className="rounded-lg border border-rule-strong bg-paper p-3">
        {confirmedAt ? (
          <span className="mono inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-soft px-2 py-1 text-[0.7rem] font-semibold uppercase text-brand-strong">
            Confirmed
          </span>
        ) : hasAtLeastOneNamedRow ? (
          <span className="mono inline-flex w-fit items-center gap-1.5 rounded-full bg-gold-soft px-2 py-1 text-[0.7rem] font-semibold uppercase text-gold">
            Will confirm when you save
          </span>
        ) : (
          <span className="mono inline-flex w-fit items-center gap-1.5 rounded-full bg-gold-soft px-2 py-1 text-[0.7rem] font-semibold uppercase text-gold">
            No assets listed yet — can&rsquo;t be sold
          </span>
        )}
        <p className="mt-1.5 text-xs text-ink-faint">
          {confirmedAt
            ? "Editing and saving this list again will re-confirm it instantly with your new changes."
            : "Add at least one asset and save — it's confirmed the moment you save, no separate step."}
        </p>
      </div>
    </div>
  );
}
