"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

type Item = { question: string; answer: string };

// A small, page-scoped accordion (rather than reusing the shared
// FaqAccordion component used on /contact) so this accuracy-sensitive
// redesign doesn't touch a component another page also depends on. Real
// <button> headers, aria-expanded/aria-controls wired to a stable id, native
// keyboard support (Tab/Enter/Space on a real button), and exactly one
// panel open by default, per the Sell-page brief's accessibility spec.
export default function SellFaq({ items }: { items: Item[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="rounded-xl border border-rule bg-paper-raised">
      {items.map((item, i) => {
        const open = openIndex === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        return (
          <div key={item.question} className={i > 0 ? "border-t border-rule" : ""}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50"
              >
                {item.question}
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-ink-faint transition-transform ${open ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
            </h3>
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
  );
}
