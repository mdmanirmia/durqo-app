import Link from "next/link";

// Section 15's empty state — shown only when a real, successful query
// returned zero matches (never confused with the error state below).
export default function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-rule-strong py-16 text-center">
      <div>
        <h3 className="text-base font-semibold text-ink">No businesses match these filters.</h3>
        <p className="mt-1.5 text-sm text-ink-soft">Try removing a filter or adjusting your search.</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/buy" className="rounded-md border border-rule-strong px-4 py-2 text-sm font-semibold text-ink hover:border-brand-strong">
          Clear filters
        </Link>
        <Link href="/buy" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">
          Browse all businesses
        </Link>
      </div>
    </div>
  );
}
