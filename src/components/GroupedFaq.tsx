"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FaqEntry {
  question: string;
  answer: React.ReactNode;
}

export interface FaqGroup {
  heading: string;
  items: FaqEntry[];
}

// Shared, accessible FAQ accordion for the guide/FAQ pages built together in
// this pass — Buyer FAQ, Seller FAQ, and Payment & Withdrawal (Sep 11,
// 2026) — grouped under category headings, one panel open at a time across
// the whole page. Same accessibility pattern as src/app/sell/SellFaq.tsx
// (real <button> headers, aria-expanded/aria-controls wired to a stable id,
// native keyboard support, exactly one panel open by default): kept as a
// genuinely shared component rather than duplicated three times, since it
// wasn't split out of an existing page — SellFaq's own comment explains why
// *that* one stays page-scoped (so an accuracy-sensitive redesign of one
// page doesn't touch a component another unrelated page depends on); that
// reasoning doesn't apply here because all three consumers were built
// together in this same pass and are meant to share this exact behavior.
export default function GroupedFaq({ groups }: { groups: FaqGroup[] }) {
  const [openKey, setOpenKey] = useState<string | null>("0-0");
  const baseId = useId();

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group, gi) => (
        <div key={group.heading}>
          <h3 className="mono mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">{group.heading}</h3>
          <div className="rounded-xl border border-rule bg-paper-raised">
            {group.items.map((item, ii) => {
              const key = `${gi}-${ii}`;
              const open = openKey === key;
              const panelId = `${baseId}-panel-${key}`;
              const buttonId = `${baseId}-button-${key}`;
              return (
                <div key={item.question} className={ii > 0 ? "border-t border-rule" : ""}>
                  <h4>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => setOpenKey(open ? null : key)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50"
                    >
                      {item.question}
                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-ink-faint transition-transform ${open ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </button>
                  </h4>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    hidden={!open}
                    className="px-5 pb-4 text-sm leading-relaxed text-ink-soft"
                  >
                    {item.answer}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
