"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { ComposedChart, Bar, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { UserPlus, CalendarDays } from "lucide-react";

// Nov 9, 2026 ("admin dashboard e akta graph add korba per day user
// registration and total users, buyers and sellers thakbe graph e. daily,
// Last 7 Days, Last 30 Days, This Month, This Week, Last 4 Months, This Year,
// Last Year, Custom date range thakbe"): sign-ups over time on the admin
// Overview. Bars = new buyers / new sellers per period (stacked), lines =
// running totals of users, buyers and sellers at the end of each period.
// Everything is computed in the browser from one compact list of
// {created_at, role}, so switching ranges is instant and always current.

export type SignupPoint = { t: number; r: "buyer" | "seller" | "other" };

type Preset = "today" | "7d" | "30d" | "week" | "month" | "4m" | "year" | "lastYear" | "custom";

const PRESETS: { id: Preset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "4m", label: "Last 4 Months" },
  { id: "year", label: "This Year" },
  { id: "lastYear", label: "Last Year" },
  { id: "custom", label: "Custom" },
];

const DAY = 24 * 60 * 60 * 1000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const toInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromInput = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

function rangeFor(preset: Preset, customFrom: string, customTo: string): { start: Date; end: Date } {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  switch (preset) {
    case "today":
      return { start: today, end: tomorrow };
    case "7d":
      return { start: addDays(today, -6), end: tomorrow };
    case "30d":
      return { start: addDays(today, -29), end: tomorrow };
    case "week": {
      // Week starts on Monday.
      const offset = (today.getDay() + 6) % 7;
      return { start: addDays(today, -offset), end: tomorrow };
    }
    case "month":
      return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: tomorrow };
    case "4m":
      return { start: new Date(today.getFullYear(), today.getMonth() - 3, 1), end: tomorrow };
    case "year":
      return { start: new Date(today.getFullYear(), 0, 1), end: tomorrow };
    case "lastYear":
      return { start: new Date(today.getFullYear() - 1, 0, 1), end: new Date(today.getFullYear(), 0, 1) };
    case "custom": {
      const f = fromInput(customFrom) ?? addDays(today, -29);
      const t = fromInput(customTo) ?? today;
      const [a, b] = f <= t ? [f, t] : [t, f];
      return { start: a, end: addDays(b, 1) };
    }
  }
}

type Bucket = { start: Date; end: Date; label: string; full: string };

function bucketsFor(start: Date, end: Date): { unit: "hour" | "day" | "month"; buckets: Bucket[] } {
  const days = Math.round((end.getTime() - start.getTime()) / DAY);
  const buckets: Bucket[] = [];
  if (days <= 1) {
    for (let h = 0; h < 24; h++) {
      const s = new Date(start.getFullYear(), start.getMonth(), start.getDate(), h);
      const e = new Date(start.getFullYear(), start.getMonth(), start.getDate(), h + 1);
      const label = `${String(h).padStart(2, "0")}:00`;
      buckets.push({ start: s, end: e, label, full: `${start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${label}` });
    }
    return { unit: "hour", buckets };
  }
  if (days <= 120) {
    for (let d = start; d < end; d = addDays(d, 1)) {
      buckets.push({
        start: d,
        end: addDays(d, 1),
        label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        full: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
      });
    }
    return { unit: "day", buckets };
  }
  for (let m = new Date(start.getFullYear(), start.getMonth(), 1); m < end; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
    buckets.push({
      start: m < start ? start : m,
      end: new Date(m.getFullYear(), m.getMonth() + 1, 1),
      label: m.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
      full: m.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    });
  }
  return { unit: "month", buckets };
}

function computeSeries(sorted: SignupPoint[], preset: Preset, customFrom: string, customTo: string) {
  const { start, end } = rangeFor(preset, customFrom, customTo);
  const { unit, buckets } = bucketsFor(start, end);

  // Running totals as of the start of the range.
  let totalUsers = 0;
  let totalBuyers = 0;
  let totalSellers = 0;
  let i = 0;
  while (i < sorted.length && sorted[i].t < start.getTime()) {
    totalUsers++;
    if (sorted[i].r === "buyer") totalBuyers++;
    if (sorted[i].r === "seller") totalSellers++;
    i++;
  }

  let newUsers = 0;
  let newBuyers = 0;
  let newSellers = 0;
  const rows = [];
  for (const b of buckets) {
    let nb = 0;
    let ns = 0;
    let nAll = 0;
    while (i < sorted.length && sorted[i].t < b.end.getTime()) {
      const p = sorted[i];
      nAll++;
      if (p.r === "buyer") nb++;
      if (p.r === "seller") ns++;
      i++;
    }
    totalUsers += nAll;
    totalBuyers += nb;
    totalSellers += ns;
    newUsers += nAll;
    newBuyers += nb;
    newSellers += ns;
    rows.push({
      label: b.label,
      full: b.full,
      "New buyers": nb,
      "New sellers": ns,
      "New sign-ups": nAll,
      "Total users": totalUsers,
      "Total buyers": totalBuyers,
      "Total sellers": totalSellers,
    });
  }
  return {
    data: rows,
    unit,
    summary: { newUsers, newBuyers, newSellers, totalUsers, totalBuyers, totalSellers },
  };
}

export default function RegistrationsChart({ points }: { points: SignupPoint[] }) {
  const [preset, setPreset] = useState<Preset>("30d");
  const [customFrom, setCustomFrom] = useState(() => toInput(addDays(startOfDay(new Date()), -29)));
  const [customTo, setCustomTo] = useState(() => toInput(startOfDay(new Date())));

  const sorted = useMemo(() => [...points].sort((a, b) => a.t - b.t), [points]);

  // Dates are bucketed in the viewer's own time zone, which the server
  // doesn't know, so the numbers render only in the browser (a placeholder
  // fills the space for the first paint) to avoid a hydration mismatch.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const { data, unit, summary } = useMemo(
    () => computeSeries(sorted, preset, customFrom, customTo),
    [sorted, preset, customFrom, customTo]
  );

  const per = unit === "hour" ? "hour" : unit === "day" ? "day" : "month";

  // Nov 9, 2026 ("table er height ta arekta choto and design ta aro sundor
  // koro"): shorter plot, segmented range picker, one compact stats strip,
  // gradient bars + soft area for total users, and a custom tooltip.
  const stats = [
    { label: "New sign-ups", value: summary.newUsers, dot: "bg-ink" },
    { label: "New buyers", value: summary.newBuyers, dot: "bg-brand" },
    { label: "New sellers", value: summary.newSellers, dot: "bg-gold" },
    { label: "Total users", value: summary.totalUsers, dot: "bg-[#0B1324]", sub: `${summary.totalBuyers} buyers · ${summary.totalSellers} sellers` },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 border-b border-rule px-5 pb-4 pt-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-[#059669] text-white shadow-[0_8px_20px_-10px_rgba(16,185,129,0.9)]">
            <UserPlus size={16} />
          </div>
          <div>
            <h2 className="text-lg leading-tight">User registrations</h2>
            <p className="text-xs text-ink-faint">New sign-ups per {per} · local time</p>
          </div>
        </div>

        {/* Segmented range picker (scrolls sideways on phones). */}
        <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="inline-flex gap-0.5 rounded-xl border border-rule bg-paper-sunk p-1">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                  preset === p.id
                    ? "bg-paper-raised text-ink shadow-[0_1px_3px_rgba(11,19,36,0.12)] ring-1 ring-rule"
                    : "text-ink-faint hover:text-ink"
                }`}
              >
                {p.id === "custom" && <CalendarDays size={12} />}
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {preset === "custom" && (
        <div className="flex flex-wrap items-center gap-2 border-b border-rule bg-paper px-5 py-3 text-sm">
          <label className="flex items-center gap-2 text-ink-soft">
            From
            <input
              type="date"
              value={customFrom}
              max={customTo}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border border-rule-strong bg-paper-raised px-2.5 py-1.5 text-ink"
            />
          </label>
          <label className="flex items-center gap-2 text-ink-soft">
            To
            <input
              type="date"
              value={customTo}
              min={customFrom}
              max={toInput(new Date())}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg border border-rule-strong bg-paper-raised px-2.5 py-1.5 text-ink"
            />
          </label>
        </div>
      )}

      {!mounted ? (
        <div className="m-5 h-[300px] animate-pulse rounded-xl bg-paper-sunk" />
      ) : (
        <>
          {/* One compact strip of totals for the selected range */}
          <div className="grid grid-cols-2 border-b border-rule lg:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`px-5 py-3 ${i % 2 === 1 ? "border-l border-rule" : ""} ${i >= 2 ? "border-t border-rule lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}
              >
                <div className="flex items-center gap-1.5 text-xs text-ink-faint">
                  <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                  {s.label}
                </div>
                <div className="mono mt-0.5 text-xl font-semibold text-ink">{s.value}</div>
                {s.sub && <div className="mono truncate text-[0.68rem] text-ink-faint">{s.sub}</div>}
              </div>
            ))}
          </div>

          <div className="px-3 pb-3 pt-4 sm:px-4">
            <div className="mb-2 flex flex-wrap items-center justify-end gap-x-4 gap-y-1 px-2 text-[0.7rem] text-ink-faint">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-brand" />New buyers</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-gold" />New sellers</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[#0B1324]" />Total users</span>
              <span className="flex items-center gap-1.5"><span className="h-0 w-4 border-t-2 border-dashed border-[#059669]" />Total buyers</span>
              <span className="flex items-center gap-1.5"><span className="h-0 w-4 border-t-2 border-dashed border-[#B8860B]" />Total sellers</span>
            </div>
            <div className="h-[210px] w-full sm:h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 6, right: 0, left: -14, bottom: 0 }} barCategoryGap="22%">
                  <defs>
                    <linearGradient id="rg-buyers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34D399" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                    <linearGradient id="rg-sellers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F0C75E" />
                      <stop offset="100%" stopColor="#D4A72C" />
                    </linearGradient>
                    <linearGradient id="rg-total" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0B1324" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#0B1324" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-rule)" strokeDasharray="3 4" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10.5, fill: "var(--color-ink-faint)" }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={22}
                    dy={4}
                  />
                  <YAxis yAxisId="new" allowDecimals={false} tick={{ fontSize: 10.5, fill: "var(--color-ink-faint)" }} axisLine={false} tickLine={false} width={34} />
                  <YAxis yAxisId="total" orientation="right" allowDecimals={false} tick={{ fontSize: 10.5, fill: "var(--color-ink-faint)" }} axisLine={false} tickLine={false} width={34} />
                  <Tooltip cursor={{ fill: "rgba(16,185,129,0.07)", radius: 6 }} content={<ChartTooltip />} />
                  <Area yAxisId="total" type="monotone" dataKey="Total users" stroke="#0B1324" strokeWidth={2} fill="url(#rg-total)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  <Bar yAxisId="new" dataKey="New buyers" stackId="new" fill="url(#rg-buyers)" maxBarSize={22} />
                  <Bar yAxisId="new" dataKey="New sellers" stackId="new" fill="url(#rg-sellers)" radius={[5, 5, 0, 0]} maxBarSize={22} />
                  <Line yAxisId="total" type="monotone" dataKey="Total buyers" stroke="#059669" strokeWidth={1.5} strokeDasharray="4 4" dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
                  <Line yAxisId="total" type="monotone" dataKey="Total sellers" stroke="#B8860B" strokeWidth={1.5} strokeDasharray="4 4" dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="px-2 pt-1 text-[0.68rem] text-ink-faint">Bars: new sign-ups (left axis) · Lines: running totals (right axis)</p>
          </div>
        </>
      )}
    </div>
  );
}

type TipRow = { payload?: { full?: string; [k: string]: unknown } };
function ChartTooltip({ active, payload }: { active?: boolean; payload?: TipRow[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload ?? {};
  const n = (k: string) => Number(d[k] ?? 0);
  return (
    <div className="min-w-[180px] rounded-xl bg-[#0B1324] px-3.5 py-3 text-xs text-white shadow-[0_18px_40px_-16px_rgba(11,19,36,0.8)]">
      <p className="mb-2 font-semibold text-white/90">{d.full}</p>
      <div className="space-y-1">
        <Row color="bg-brand" label="New buyers" value={n("New buyers")} />
        <Row color="bg-gold" label="New sellers" value={n("New sellers")} />
        <div className="my-1.5 border-t border-white/10" />
        <Row color="bg-white" label="Total users" value={n("Total users")} />
        <Row color="bg-[#34D399]" label="Total buyers" value={n("Total buyers")} />
        <Row color="bg-[#F0C75E]" label="Total sellers" value={n("Total sellers")} />
      </div>
    </div>
  );
}

function Row({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-white/70">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        {label}
      </span>
      <span className="mono font-semibold">{value}</span>
    </div>
  );
}
