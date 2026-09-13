import { type LucideIcon } from "lucide-react";

// Shared "nothing here yet" placeholder — 2026-09-13 dashboard audit polish
// pass. Before this, every empty table/list across the dashboards
// (admin tables, buyer/seller orders and listings) was a single bare line
// of gray text, which read as unfinished rather than intentional. A small
// icon + heading + one line of supporting copy is the same pattern this
// app already uses for its richer status cards (e.g. the buyer Account
// page's success/error states) — just applied consistently everywhere a
// list can be empty.
export default function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-rule-strong bg-paper-raised px-6 py-10 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-paper-sunk text-ink-faint">
        <Icon size={20} />
      </div>
      <p className="font-medium text-ink">{title}</p>
      {body && <p className="max-w-sm text-sm text-ink-faint">{body}</p>}
    </div>
  );
}
