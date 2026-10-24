"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

type Item = { question: string; answer: string };
type Group = { heading: string; items: Item[] };

// A small, page-scoped accordion (rather than reusing the shared
// FaqAccordion component used on /contact) so this accuracy-sensitive page
// doesn't touch a component another page also depends on. Real <button>
// headers with aria-expanded/aria-controls, native keyboard support.
//
// Oct 24, 2026: grouped into topic tabs (General, Verification, Fees &
// payments, Payouts) with a smooth open/close animation, since the list
// grew from 5 to 21 questions.
export default function SellFaq({ groups }: { groups: Group[] }) {
  const [tab, setTab] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();
  const items = groups[tab]?.items ?? [];

  return (
    <div>
      <div className="mb-5 flex flex-wrap justify-center gap-2" role="tablist" aria-label="FAQ topics">
        {groups.map((g, i) => {
          const active = i === tab;
          return (
            <button
              key={g.heading}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setTab(i);
                setOpenIndex(0);
              }}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "border-brand bg-brand text-white shadow-[0_8px_18px_-10px_rgba(16,185,129,0.9)]"
                  : "border-rule bg-paper-raised text-ink-soft hover:border-rule-strong hover:text-ink"
              }`}
            >
              {g.heading}
              <span className={`ml-1.5 text-xs ${active ? "text-white/80" : "text-ink-faint"}`}>{g.items.length}</span>
            </button>
          );
        })}
      </div>

      <div key={tab} className="dq-scene-in overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-[0_1px_2px_rgba(11,19,36,0.04)]">
        {items.map((item, i) => {
          const open = openIndex === i;
          const panelId = `${baseId}-${tab}-panel-${i}`;
          const buttonId = `${baseId}-${tab}-button-${i}`;
          return (
            <div key={item.question} className={`${i > 0 ? "border-t border-rule" : ""} ${open ? "bg-brand-soft/30" : ""} transition-colors`}>
              <h3>
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-ink transition-colors hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50"
                >
                  {item.question}
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition-all duration-300 ${
                      open ? "rotate-180 bg-brand text-white" : "bg-paper-sunk text-ink-faint"
                    }`}
                    aria-hidden
                  >
                    <ChevronDown size={15} />
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                aria-hidden={!open}
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 text-sm leading-relaxed text-ink-soft">{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
