"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Wallet,
  Landmark,
  ShieldCheck,
  Lock,
  ClipboardCheck,
  Search,
  Layers,
  Handshake,
  Globe2,
  Calculator,
} from "lucide-react";

// Icons are passed by name: component functions can't cross the
// server -> client boundary as props.
const ICONS = { Wallet, Landmark, ShieldCheck, Lock, ClipboardCheck, Search, Layers, Handshake, Globe2, Calculator };
export type ProblemIconName = keyof typeof ICONS;

// Oct 30, 2026: interactive "Problems & Solutions" for /durqo-bangladesh.
// Same 10 problem/solution pairs as before (passed in from page.tsx, copy
// unchanged); now filterable by audience, with the selected row's solution
// shown in a large animated panel on desktop and expanding inline on
// mobile. Every solution stays in the DOM for search engines and screen
// readers. Auto-advances until the visitor interacts.
export type ProblemItem = {
  audience: "For Buyers" | "For Sellers" | "For Everyone";
  icon: ProblemIconName;
  problem: string;
  solution: string;
};

const FILTERS = ["All", "For Buyers", "For Sellers", "For Everyone"] as const;
type Filter = (typeof FILTERS)[number];

const TONE: Record<ProblemItem["audience"], { chip: string; dot: string; panel: string }> = {
  "For Buyers": { chip: "bg-brand-soft text-brand-strong", dot: "bg-brand", panel: "from-[#10B981] to-[#0D9488]" },
  "For Sellers": { chip: "bg-gold-soft text-[#92730F]", dot: "bg-gold", panel: "from-[#D97706] to-[#B45309]" },
  "For Everyone": { chip: "bg-[#EEF2FF] text-[#4F46E5]", dot: "bg-[#6366F1]", panel: "from-[#6366F1] to-[#4338CA]" },
};

export default function ProblemExplorer({ items }: { items: ProblemItem[] }) {
  const [filter, setFilter] = useState<Filter>("All");
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);

  const visible = useMemo(
    () => items.map((it, i) => ({ ...it, i })).filter((it) => filter === "All" || it.audience === filter),
    [items, filter],
  );
  const current = visible.find((v) => v.i === active) ?? visible[0];
  const CurrentIcon = current ? ICONS[current.icon] : null;

  useEffect(() => {
    if (!auto) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(max-width: 1023px)").matches) return;
    const id = window.setInterval(() => {
      setActive((a) => {
        const pos = visible.findIndex((v) => v.i === a);
        return visible[(pos + 1) % visible.length].i;
      });
    }, 5200);
    return () => window.clearInterval(id);
  }, [auto, visible]);

  function pick(i: number) {
    setAuto(false);
    setActive((a) => (a === i && window.matchMedia("(max-width: 1023px)").matches ? -1 : i));
  }

  return (
    <div>
      {/* Audience filter */}
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter by audience">
        {FILTERS.map((f) => {
          const count = f === "All" ? items.length : items.filter((it) => it.audience === f).length;
          const on = f === filter;
          return (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                setFilter(f);
                setAuto(false);
                const first = items.findIndex((it) => f === "All" || it.audience === f);
                setActive(first);
              }}
              className={`mono flex min-h-10 items-center gap-2 rounded-full border px-4 text-xs font-semibold transition ${
                on
                  ? "border-ink bg-ink text-white shadow-[0_10px_24px_-14px_rgba(11,19,36,0.8)]"
                  : "border-rule bg-paper-raised text-ink-soft hover:border-rule-strong hover:text-ink"
              }`}
            >
              {f === "All" ? "All problems" : f}
              <span className={`rounded-full px-1.5 py-0.5 text-[0.6rem] ${on ? "bg-white/15" : "bg-paper-sunk"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
        {/* List */}
        <ol className="flex flex-col gap-2.5">
          {visible.map(({ audience, icon, problem, solution, i }) => {
            const Icon = ICONS[icon];
            const on = current?.i === i && active !== -1;
            const tone = TONE[audience];
            return (
              <li key={problem} className="dq-scene-in">
                <button
                  type="button"
                  onClick={() => pick(i)}
                  aria-expanded={on}
                  className={`group relative flex w-full items-start gap-4 overflow-hidden rounded-2xl border p-4 text-left transition duration-300 sm:p-5 ${
                    on
                      ? "border-ink/80 bg-paper-raised shadow-[0_22px_44px_-28px_rgba(11,19,36,0.55)]"
                      : "border-rule bg-paper-raised/70 hover:-translate-y-0.5 hover:border-rule-strong hover:bg-paper-raised"
                  }`}
                >
                  {on && auto && <span key={`p-${i}`} className="dq-progress absolute bottom-0 left-0 hidden h-0.5 bg-brand lg:block" style={{ animationDuration: "5.2s" }} aria-hidden />}
                  <span className={`mono grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-bold transition ${on ? "bg-ink text-white" : "bg-paper-sunk text-ink-faint group-hover:text-ink"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`mono mb-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider ${tone.chip}`}>
                      <Icon size={11} />
                      {audience}
                    </span>
                    <span className={`block text-[0.92rem] leading-relaxed ${on ? "font-semibold text-ink" : "font-medium text-ink-soft"}`}>{problem}</span>
                  </span>
                  <ChevronDown size={16} className={`mt-2 shrink-0 text-ink-faint transition lg:-rotate-90 ${on ? "rotate-180 text-ink lg:rotate-0 lg:opacity-0" : ""}`} />
                </button>
                {/* Mobile: inline solution */}
                <div className={`grid transition-[grid-template-rows] duration-300 lg:hidden ${on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <div className={`mt-2 rounded-2xl bg-gradient-to-br ${tone.panel} p-5 text-white`}>
                      <p className="mono mb-2 flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-wider text-white/80">
                        <CheckCircle2 size={12} />
                        Durqo&rsquo;s solution
                      </p>
                      <p className="text-[0.92rem] leading-relaxed">{solution}</p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Desktop: big animated answer panel */}
        {current && (
          <div className="sticky top-24 hidden lg:block" onMouseEnter={() => setAuto(false)}>
            <div key={current.i} className={`dq-scene-in relative overflow-hidden rounded-3xl bg-gradient-to-br ${TONE[current.audience].panel} p-9 text-white shadow-[0_40px_80px_-40px_rgba(11,19,36,0.7)]`}>
              <span className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" aria-hidden />
              <span className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_80%_70%_at_100%_0%,#000_10%,transparent_70%)]" aria-hidden />
              <span className="mono pointer-events-none absolute bottom-4 right-6 text-[7rem] font-bold leading-none text-white/10" aria-hidden>
                {String(current.i + 1).padStart(2, "0")}
              </span>
              <div className="relative">
                <span className="dq-icon-pop mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                  {CurrentIcon && <CurrentIcon size={24} />}
                </span>
                <p className="mono mb-2 text-[0.65rem] font-semibold uppercase tracking-wider text-white/70">The problem</p>
                <p className="text-base leading-relaxed text-white/85">{current.problem}</p>
                <div className="my-6 h-px bg-white/20" aria-hidden />
                <p className="mono mb-2 flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-white">
                  <CheckCircle2 size={13} />
                  Durqo&rsquo;s solution
                </p>
                <p className="text-xl font-semibold leading-snug">{current.solution}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
