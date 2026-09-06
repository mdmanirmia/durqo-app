import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { CATEGORY_MAP } from "@/lib/categories";
import { fmtUSD, fmtUSDOrNA, fmtAgeOrNA } from "@/lib/format";
import type { Listing } from "@/lib/types";

// Table view (Section 11) — preserved and restyled, not squeezed into
// mobile widths (Card view is the mobile default; this only renders on
// md+ screens, matching the toggle that produces it).
export default function ListingsTable({ listings }: { listings: Listing[] }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-rule bg-paper-raised md:block">
      <table className="w-full min-w-[820px] border-collapse text-sm">
        <thead className="bg-paper-sunk">
          <tr className="border-b border-rule-strong text-left">
            <th className="px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-wide text-ink-faint">Business</th>
            <th className="px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-wide text-ink-faint">Category</th>
            <th className="px-4 py-3 text-right text-[0.68rem] font-semibold uppercase tracking-wide text-ink-faint">Revenue/mo</th>
            <th className="px-4 py-3 text-right text-[0.68rem] font-semibold uppercase tracking-wide text-ink-faint">Profit/mo</th>
            <th className="px-4 py-3 text-right text-[0.68rem] font-semibold uppercase tracking-wide text-ink-faint">Age</th>
            <th className="px-4 py-3 text-right text-[0.68rem] font-semibold uppercase tracking-wide text-ink-faint">Asking price</th>
            <th className="px-4 py-3 text-center text-[0.68rem] font-semibold uppercase tracking-wide text-ink-faint">Status</th>
            <th className="px-4 py-3 text-right text-[0.68rem] font-semibold uppercase tracking-wide text-ink-faint">Action</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => {
            const category = CATEGORY_MAP[l.categoryId];
            const revenue = l.quickStats.monthly_income as number | undefined;
            const expenseTotal = l.monthlyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
            const profit = revenue !== undefined ? (l.monthlyExpenses.length > 0 ? revenue - expenseTotal : revenue) : undefined;
            const isSold = l.status === "sold";
            return (
              <tr key={l.id} className="border-b border-rule last:border-0 hover:bg-paper-sunk">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/listing/${l.id}`} className="font-semibold text-ink hover:text-brand-strong hover:underline">
                      {l.title}
                    </Link>
                    {l.isVerified && <BadgeCheck size={14} className="shrink-0 text-brand" aria-label="Listing verified by Durqo" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-soft">{category?.name ?? l.categoryId}</td>
                <td className="mono px-4 py-3 text-right">{fmtUSDOrNA(revenue)}</td>
                <td className="mono px-4 py-3 text-right">{fmtUSDOrNA(profit)}</td>
                <td className="mono px-4 py-3 text-right">{fmtAgeOrNA(l.businessAgeYears)}</td>
                <td className="mono px-4 py-3 text-right">{fmtUSD(l.discountedPrice ?? l.price)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`mono inline-block rounded-md px-2 py-0.5 text-[0.65rem] font-semibold uppercase ${isSold ? "bg-brand-strong text-white" : "bg-brand-soft text-brand-hover"}`}>
                    {isSold ? "Sold" : "Available"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/listing/${l.id}`} className="text-sm font-semibold text-brand-hover hover:underline">
                    View listing
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
