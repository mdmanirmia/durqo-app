"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/types";

// Page-scoped accordion for the Sep 2026 listing-detail redesign — kept
// separate from the shared `FaqAccordion` component (also used by
// /contact) so this page's restyle can't affect that other page, matching
// the same "duplicate rather than modify a shared component" pattern
// already used for /sell's own SellFaq.tsx. Same empty-state copy and
// single-open-by-default behavior as the original shared component;
// improved with real aria-expanded/aria-controls wiring for keyboard/
// screen-reader users.
export default function ListingFaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  if (!items.length) {
    return <p className="text-sm text-[#98A2B3]">The seller hasn&rsquo;t answered any questions yet — ask one below.</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E7E4] bg-white">
      {items.map((item, i) => {
        const open = openIndex === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        return (
          <div key={item.question} className={i > 0 ? "border-t border-[#E2E7E4]" : ""}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-[#101828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0EAE7A]/50"
              >
                {item.question}
                <ChevronDown size={16} className={`shrink-0 text-[#98A2B3] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!open} className="px-5 pb-4 text-sm leading-relaxed text-[#667085]">
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
