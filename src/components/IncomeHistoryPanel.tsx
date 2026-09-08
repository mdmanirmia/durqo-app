"use client";

import { useState } from "react";
import { BarChart3, Table2 } from "lucide-react";
import TrendChart from "@/components/charts/TrendChart";
import { fmtUSD, monthLabel } from "@/lib/format";

interface MonthlyIncomePoint {
  month: string;
  income?: number;
  [key: string]: string | number | undefined;
}

function average(values: number[]): number | undefined {
  if (!values.length) return undefined;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

// Proof-of-Income card for the listing detail page: a chart/table toggle
// over the monthly income series, plus the 3/6/12-month averages and the
// trailing-12-month total the seller-verification spec (Design &
// Development.docx) asked to have surfaced here, modeled on the reference
// "Monthly Income History" panel supplied with that spec.
export default function IncomeHistoryPanel({ data }: { data: MonthlyIncomePoint[] }) {
  const [view, setView] = useState<"chart" | "table">("chart");

  const withIncome = data.filter((d): d is { month: string; income: number } => typeof d.income === "number");
  const last3 = average(withIncome.slice(-3).map((d) => d.income));
  const last6 = average(withIncome.slice(-6).map((d) => d.income));
  const last12Values = withIncome.slice(-12).map((d) => d.income);
  const last12 = average(last12Values);
  const totalLast12 = last12Values.reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-xl border border-rule bg-paper-raised p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink">Monthly Income History</h3>
        <div className="flex items-center gap-1 rounded-md border border-rule-strong bg-paper p-0.5">
          <button
            type="button"
            onClick={() => setView("chart")}
            aria-label="Show chart view"
            aria-pressed={view === "chart"}
            className={`grid h-7 w-7 place-items-center rounded transition-colors ${
              view === "chart" ? "bg-brand text-white" : "text-ink-faint hover:text-ink"
            }`}
          >
            <BarChart3 size={14} />
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            aria-label="Show table view"
            aria-pressed={view === "table"}
            className={`grid h-7 w-7 place-items-center rounded transition-colors ${
              view === "table" ? "bg-brand text-white" : "text-ink-faint hover:text-ink"
            }`}
          >
            <Table2 size={14} />
          </button>
        </div>
      </div>

      {view === "chart" ? (
        <TrendChart data={data} dataKey="income" color="#10B981" format="usd" />
      ) : (
        <div className="max-h-[220px] overflow-y-auto overflow-x-auto rounded-md border border-rule">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-paper-sunk">
              <tr>
                <th className="mono px-3 py-2 text-xs font-normal uppercase tracking-wide text-ink-faint">Month</th>
                <th className="mono px-3 py-2 text-right text-xs font-normal uppercase tracking-wide text-ink-faint">Income</th>
              </tr>
            </thead>
            <tbody>
              {withIncome.map((d) => (
                <tr key={d.month} className="border-t border-rule">
                  <td className="px-3 py-2 text-ink-soft">{monthLabel(d.month)}</td>
                  <td className="mono px-3 py-2 text-right text-ink">{fmtUSD(d.income)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5 border-t border-rule pt-5">
        <h4 className="mb-3 text-sm font-semibold text-ink">Income Averages</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <div className="text-xs text-ink-faint">Last 3 Month Average</div>
            <div className="mono text-lg font-semibold text-brand-hover">{fmtUSD(last3)}</div>
          </div>
          <div>
            <div className="text-xs text-ink-faint">Last 6 Month Average</div>
            <div className="mono text-lg font-semibold text-brand-hover">{fmtUSD(last6)}</div>
          </div>
          <div>
            <div className="text-xs text-ink-faint">Last 12 Month Average</div>
            <div className="mono text-lg font-semibold text-brand-hover">{fmtUSD(last12)}</div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-rule pt-5">
        <span className="text-sm font-semibold text-ink">Total Income (Last 12 Months)</span>
        <span className="mono text-lg font-bold text-brand-hover">{fmtUSD(totalLast12)}</span>
      </div>
    </div>
  );
}
