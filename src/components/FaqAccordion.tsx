"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FaqItem } from "@/lib/types";

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!items.length) return <p className="text-sm text-ink-faint">The seller hasn&rsquo;t answered any questions yet — ask one below.</p>;

  return (
    <div>
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.question} className="border-t border-rule last:border-b">
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold"
            >
              {item.question}
              <ChevronDown size={16} className={open ? "rotate-180 transition" : "transition"} />
            </button>
            {open && <p className="pb-4 text-sm text-ink-soft">{item.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}
