"use client";

import { Plus, Trash2 } from "lucide-react";

export type QaRow = { question: string; answer: string };

const inputCls = "rounded-md border border-rule-strong bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand-strong focus:outline-none";

function emptyRow(): QaRow {
  return { question: "", answer: "" };
}

// Seller-authored Questions & Answers (2026-09-13, per the site owner:
// every listing should let the seller pre-write Q&A pairs at listing-creation
// time, not just react to buyer questions after the fact). Backed by
// `listing_faqs` — a table and RLS policy pair that already existed in the
// base schema (schema.sql) and was already wired into the public listing
// page (FaqAccordion, rendered at the top of the "FAQ with Seller" card,
// above the live buyer-comment feed — see src/app/listing/[id]/page.tsx)
// but had no seller-facing form to actually write rows into it until now.
//
// One card per Q&A pair, same "cards over a dense table" reasoning as
// AssetListEditor: a question can run long and an answer is genuinely
// multi-line, so a table row would either truncate or force horizontal
// scroll on mobile.
export default function QaListEditor({ rows, setRows }: { rows: QaRow[]; setRows: (rows: QaRow[]) => void }) {
  function update(i: number, key: keyof QaRow, v: string) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-ink-faint">
        Answer the questions buyers ask most — these show up first, above the live comment feed, so buyers see them before they ever have to ask.
      </p>

      <div className="flex flex-col gap-3">
        {rows.map((r, i) => (
          <div key={i} className="rounded-lg border border-rule-strong bg-paper p-3">
            <div className="flex flex-col gap-2.5">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-ink-soft">Question</span>
                <input placeholder="e.g. Why are you selling?" value={r.question} onChange={(e) => update(i, "question", e.target.value)} className={`${inputCls} w-full`} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-ink-soft">Answer</span>
                <textarea rows={2} placeholder="Your answer" value={r.answer} onChange={(e) => update(i, "answer", e.target.value)} className={`${inputCls} w-full`} />
              </label>
            </div>
            <button
              type="button"
              onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
              className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-ink-faint hover:text-danger"
            >
              <Trash2 size={13} /> Remove question
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => setRows([...rows, emptyRow()])} className="flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-strong">
        <Plus size={14} /> Add question
      </button>
    </div>
  );
}
