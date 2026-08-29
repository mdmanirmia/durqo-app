"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { monthLabel, fmtUSD, fmtNumber } from "@/lib/format";

export default function TrendChart({
  data,
  dataKey,
  color = "#4FAF83",
  format = "number",
}: {
  data: { month: string; [key: string]: number | string | undefined }[];
  dataKey: string;
  color?: string;
  format?: "usd" | "number";
}) {
  const clean = data.filter((d) => d[dataKey] !== undefined && d[dataKey] !== null);
  if (!clean.length) return <p className="text-sm text-ink-faint">No data yet.</p>;

  const formatValue = format === "usd" ? fmtUSD : fmtNumber;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={clean} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--color-rule)" vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={monthLabel}
          tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
          axisLine={{ stroke: "var(--color-rule)" }}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }} axisLine={false} tickLine={false} width={44} />
        <Tooltip
          labelFormatter={(v) => monthLabel(String(v))}
          formatter={(v) => [formatValue(Number(v)), ""]}
          contentStyle={{ background: "var(--color-paper-raised)", border: "1px solid var(--color-rule-strong)", borderRadius: 4, fontSize: 12 }}
        />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#grad-${dataKey})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
