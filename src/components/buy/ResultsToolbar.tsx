import ViewToggle from "./ViewToggle";
import SortControl from "./SortControl";

// Desktop-only toolbar heading row (Section 8) — the mobile equivalent is
// MobileFilterControls' sticky compact bar. `total` comes from the same
// query the grid/table render from, so the count is always the real,
// current match count, never a placeholder.
export default function ResultsToolbar({ total }: { total: number }) {
  return (
    <div className="hidden items-center justify-between gap-x-4 gap-y-2 md:flex md:flex-wrap">
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-base font-semibold text-ink lg:text-lg">Businesses for sale</h2>
        <span className="text-sm text-ink-soft">
          {total} listing{total === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <ViewToggle />
        <SortControl />
      </div>
    </div>
  );
}
