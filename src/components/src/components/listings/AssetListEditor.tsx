"use client";

import { useState } from "react";
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
// or suggestions of any kind. Lives inside the existing "Sale Includes"
// card, alongside — never replacing — the original free-text Assets
// paragraph.
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
  onConfirm,
  confirming,
  showConfirm,
  pendingSave,
}: {
  rows: AssetRow[];
  setRows: (rows: AssetRow[]) => void;
  confirmedAt: string | null;
  onConfirm?: () => void;
  confirming?: boolean;
  showConfirm: boolean;
  // true when `rows` has changed since the listing was last saved — the
  // confirm action reads listing_assets from the database, so confirming
  // against an unsaved edit would either fail or (worse) confirm the wrong
  // list. Shown as a nudge to save first instead of a confirm button.
  pendingSave?: boolean;
}) {
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const hasAtLeastOneNamedRow = rows.some((r) => r.name.trim());

  function update(i: number, key: keyof AssetRow, v: string) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
  }

  async function handleConfirm() {
    setConfirmError(null);
    if (!hasAtLeastOneNamedRow) {
      setConfirmError("Add at least one asset before confirming.");
      return;
    }
    try {
      await onConfirm?.();
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : "Couldn't confirm the list.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-ink-faint">
        This is the exact list buyers will see, and — once confirmed — the exact list frozen into their Transfer Room the moment they pay. Only what you enter here, nothing auto-generated.
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

      {showConfirm && (
        <div className="flex flex-col gap-2 rounded-lg border border-rule-strong bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {confirmedAt ? (
              <span className="mono inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-soft px-2 py-1 text-[0.7rem] font-semibold uppercase text-brand-strong">
                Confirmed
              </span>
            ) : (
              <span className="mono inline-flex w-fit items-center gap-1.5 rounded-full bg-gold-soft px-2 py-1 text-[0.7rem] font-semibold uppercase text-gold">
                Not confirmed — can&rsquo;t be sold yet
              </span>
            )}
            {confirmedAt && <p className="mt-1.5 text-xs text-ink-faint">Editing and saving the list above will require re-confirming.</p>}
            {!confirmedAt && pendingSave && <p className="mt-1.5 text-xs text-ink-faint">Save your changes above first, then confirm.</p>}
            {confirmError && <p className="mt-1.5 text-xs text-danger">{confirmError}</p>}
          </div>
          {!confirmedAt && !pendingSave && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming || !hasAtLeastOneNamedRow}
              className="w-full shrink-0 rounded-md bg-brand-strong px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 sm:w-auto"
            >
              {confirming ? "Confirming…" : "Confirm this list"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
