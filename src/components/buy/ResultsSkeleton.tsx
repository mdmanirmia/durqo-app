import { PAGE_SIZE } from "@/lib/marketplace-filters";

// Card-shaped loading skeleton (Section 15) — mirrors the real toolbar +
// grid layout so the results area doesn't change height between the
// fallback and the resolved content, and never reads as a false "no
// results" flash while a filter change is in flight.
export default function ResultsSkeleton() {
  return (
    <div aria-hidden className="min-w-0 animate-pulse">
      <div className="hidden items-center justify-between gap-4 md:flex">
        <div className="h-6 w-40 rounded bg-paper-sunk" />
        <div className="h-9 w-56 rounded bg-paper-sunk" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <div key={i} className="flex h-[21rem] flex-col overflow-hidden rounded-xl border border-rule bg-paper-raised">
            <div className="h-16 border-b border-rule bg-paper-sunk" />
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="h-3 w-1/3 rounded bg-paper-sunk" />
              <div className="h-4 w-3/4 rounded bg-paper-sunk" />
              <div className="h-3 w-full rounded bg-paper-sunk" />
              <div className="h-3 w-5/6 rounded bg-paper-sunk" />
              <div className="mt-auto h-10 w-full rounded bg-paper-sunk" />
              <div className="h-9 w-full rounded bg-paper-sunk" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
