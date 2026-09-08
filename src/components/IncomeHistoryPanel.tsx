"use client";

import { useState } from "react";
import { BarChart3, Table2 } from "lucide-react";
import TrendChart from "@/components/charts/TrendChart";
import ProofGalleryButton from "@/components/ProofGalleryButton";
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
export default function IncomeHistoryPanel({ data, images }: { data: MonthlyIncomePoint[]; images?: string[] }) {
  const [view, setView] = useState<"chart" | "table">("chart");

  const withIncome = data.filter((d): d is { month: string; income: number } => typeof d.income === "number");
  const last3 = average(withIncome.slice(-3).map((d) => d.income));
  const last6 = average(withIncome.slice(-6).map((d) => d.income));
  const last12Values = withIncome.slice(-12).map((d) => d.income);
  const last12 = average(last12Values);
  const totalLast12 = last12Values.reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-2xl border border-[#E2E7E4] bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-[#101828] sm:text-base">Monthly Income History</h3>
        <div className="flex items-center gap-1 rounded-[10px] border border-[#E2E7E4] bg-[#F6F7F5] p-0.5">
          <button
            type="button"
            onClick={() => setView("chart")}
            aria-label="Show chart view"
            aria-pressed={view === "chart"}
            className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${
              view === "chart" ? "bg-[#0EAE7A] text-white" : "text-[#98A2B3] hover:text-[#101828]"
            }`}
          >
            <BarChart3 size={14} />
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            aria-label="Show table view"
            aria-pressed={view === "table"}
            className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${
              view === "table" ? "bg-[#0EAE7A] text-white" : "text-[#98A2B3] hover:text-[#101828]"
            }`}
          >
            <Table2 size={14} />
          </button>
        </div>
      </div>

      {view === "chart" ? (
        <TrendChart data={data} dataKey="income" color="#0EAE7A" format="usd" />
      ) : (
        <div className="max-h-[220px] overflow-y-auto overflow-x-auto rounded-[10px] border border-[#E2E7E4]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[#F6F7F5]">
              <tr>
                <th className="mono px-3 py-2 text-xs font-normal uppercase tracking-wide text-[#98A2B3]">Month</th>
                <th className="mono px-3 py-2 text-right text-xs font-normal uppercase tracking-wide text-[#98A2B3]">Income</th>
              </tr>
            </thead>
            <tbody>
              {withIncome.map((d) => (
                <tr key={d.month} className="border-t border-[#E2E7E4]">
                  <td className="px-3 py-2 text-[#667085]">{monthLabel(d.month)}</td>
                  <td className="mono px-3 py-2 text-right text-[#101828]">{fmtUSD(d.income)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5 border-t border-[#E2E7E4] pt-5">
        <h4 className="mb-3 text-sm font-semibold text-[#101828]">Income Averages</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <div className="text-xs text-[#98A2B3]">Last 3 Month Average</div>
            <div className="mono text-lg font-semibold text-[#0EAE7A]">{fmtUSD(last3)}</div>
          </div>
          <div>
            <div className="text-xs text-[#98A2B3]">Last 6 Month Average</div>
            <div className="mono text-lg font-semibold text-[#0EAE7A]">{fmtUSD(last6)}</div>
          </div>
          <div>
            <div className="text-xs text-[#98A2B3]">Last 12 Month Average</div>
            <div className="mono text-lg font-semibold text-[#0EAE7A]">{fmtUSD(last12)}</div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[#E2E7E4] pt-5">
        <span className="text-sm font-semibold text-[#101828]">Total Income (Last 12 Months)</span>
        <span className="mono text-lg font-bold text-[#0EAE7A]">{fmtUSD(totalLast12)}</span>
      </div>

      {/* The "View Proof of Income Images" trigger lives inside this same
          card (Sep 2026 layout fix, matching the reference mockup) rather
          than as a separate floating button below it. */}
      <div className="mt-5 border-t border-[#E2E7E4] pt-5">
        <ProofGalleryButton label="Proof of Income" images={images} count={4} />
      </div>
    </div>
  );
}
