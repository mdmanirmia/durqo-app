"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { UserPlus, ShoppingBag, Store, Users } from "lucide-react";

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

  return (
    <div className="rounded-2xl border border-rule bg-paper-raised p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-hover">
            <UserPlus size={15} />
          </div>
          <div>
            <h2 className="text-lg">User registrations</h2>
            <p className="text-xs text-ink-faint">New sign-ups per {per}, with running totals</p>
          </div>
        </div>
      </div>

      {/* Range picker: a scrollable chip row on phones. */}
      <div className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPreset(p.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              preset === p.id
                ? "border-brand-strong bg-brand-strong text-white"
                : "border-rule-strong text-ink-soft hover:border-ink-faint hover:text-ink"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset === "custom" && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-2 text-ink-soft">
            From
            <input
              type="date"
              value={customFrom}
              max={customTo}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border border-rule-strong bg-paper px-2.5 py-1.5 text-ink"
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
              className="rounded-lg border border-rule-strong bg-paper px-2.5 py-1.5 text-ink"
            />
          </label>
        </div>
      )}

      {!mounted ? (
        <div className="h-[420px] animate-pulse rounded-xl bg-paper-sunk sm:h-[460px]" />
      ) : (
      <>
      {/* Totals for the selected range */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { icon: UserPlus, label: "New sign-ups", value: summary.newUsers, chip: "bg-brand-soft text-brand-hover" },
          { icon: ShoppingBag, label: "New buyers", value: summary.newBuyers, chip: "bg-brand-soft text-brand-hover" },
          { icon: Store, label: "New sellers", value: summary.newSellers, chip: "bg-gold-soft text-[#92730F]" },
          { icon: Users, label: "Total users (end of range)", value: summary.totalUsers, chip: "bg-paper-sunk text-ink" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2.5 rounded-xl border border-rule bg-paper px-3 py-2.5">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${s.chip}`}>
              <s.icon size={15} />
            </span>
            <span className="min-w-0">
              <span className="mono block text-lg font-semibold leading-tight">{s.value}</span>
              <span className="block truncate text-xs text-ink-faint">{s.label}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="h-[300px] w-full sm:h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-rule)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
              axisLine={{ stroke: "var(--color-rule)" }}
              tickLine={false}
              minTickGap={18}
            />
            <YAxis
              yAxisId="new"
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <YAxis
              yAxisId="total"
              orientation="right"
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ fill: "rgba(16,185,129,0.06)" }}
              labelFormatter={(_, payload) => (payload?.[0]?.payload as { full?: string } | undefined)?.full ?? ""}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--color-rule)",
                background: "var(--color-paper-raised)",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconSize={10} />
            <Bar yAxisId="new" dataKey="New buyers" stackId="new" fill="#10B981" radius={[0, 0, 0, 0]} maxBarSize={28} />
            <Bar yAxisId="new" dataKey="New sellers" stackId="new" fill="#D4A72C" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Line yAxisId="total" type="monotone" dataKey="Total users" stroke="#0B1324" strokeWidth={2} dot={false} />
            <Line yAxisId="total" type="monotone" dataKey="Total buyers" stroke="#059669" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
            <Line yAxisId="total" type="monotone" dataKey="Total sellers" stroke="#B8860B" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      </>
      )}
      <p className="mt-2 text-xs text-ink-faint">
        Bars (left axis): new buyers and sellers per {per}. Lines (right axis): total users, buyers and sellers. Times in your
        local time zone.
      </p>
    </div>
  );
}
