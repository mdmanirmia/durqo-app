import { NamedValue } from "@/lib/types";
import { fmtNumber } from "@/lib/format";

export default function BarList({ title, items }: { title: string; items: NamedValue[] }) {
  if (!items?.length) return null;
  const max = Math.max(...items.map((i) => i.users));

  return (
    <div>
      <h5 className="mono mb-3 text-xs uppercase tracking-wide text-ink-faint">{title}</h5>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.name} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-24 shrink-0 truncate text-ink-soft sm:w-32">{item.name}</span>
              <div className="h-2 flex-grow rounded-full bg-rule">
                <div className="h-2 rounded-full bg-brand" style={{ width: `${(item.users / max) * 100}%` }} />
              </div>
            </div>
            <span className="mono text-xs text-ink">{fmtNumber(item.users)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
