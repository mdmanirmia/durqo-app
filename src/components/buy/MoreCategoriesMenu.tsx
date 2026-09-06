"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { MarketplaceFilters, filtersToHref } from "@/lib/marketplace-filters";

// "More categories" (Section 5) — every active main category that isn't
// already one of the five pinned shortcuts, in a simple dropdown so the
// shortcut bar doesn't have to grow to fit all 16.
export default function MoreCategoriesMenu({
  filters,
  excludeIds,
  active,
}: {
  filters: MarketplaceFilters;
  excludeIds: string[];
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const rest = CATEGORIES.filter((c) => !excludeIds.includes(c.id));

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-medium transition ${
          active ? "border-brand text-brand-hover" : "border-transparent text-ink-soft hover:text-ink"
        }`}
      >
        More categories
        <ChevronDown size={14} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-1 grid w-64 grid-cols-1 gap-0.5 rounded-lg border border-rule bg-paper-raised p-1.5 shadow-[0_16px_32px_-16px_rgba(15,23,41,0.3)]"
        >
          {rest.map((c) => {
            const Icon = CATEGORY_ICONS[c.id];
            const isActive = filters.categoryIds.length === 1 && filters.categoryIds[0] === c.id;
            return (
              <Link
                key={c.id}
                role="menuitem"
                href={filtersToHref({ ...filters, categoryIds: [c.id], page: 1 })}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-sm ${
                  isActive ? "bg-brand-soft text-brand-hover" : "text-ink hover:bg-paper-sunk"
                }`}
              >
                {Icon && <Icon size={15} />}
                {c.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
