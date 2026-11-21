"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";

// Nov 21, 2026 ("admin dashboard e top 10 viewed listing ... kon listing
// kotbar view hoiche ... koto jon user view koreche"): the 10 most viewed
// listings for a chosen period, from listing_views (migration 065).
export type ViewedRow = {
  listingId: string;
  title: string;
  slug: string | null;
  category: string;
  status: string;
  views: number;
  uniqueVisitors: number;
  signedInViewers: number;
  lastViewedAt: string;
};

type Range = "7d" | "30d" | "all";
const RANGES: { id: Range; label: string }[] = [
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "all", label: "All Time" },
];

function ago(iso: string, now: number) {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default function TopViewedListings({ data, now }: { data: Record<Range, ViewedRow[]>; now: number }) {
  const [range, setRange] = useState<Range>("30d");
  const rows = data[range];
  const max = rows.reduce((m, r) => Math.max(m, r.views), 1);

  return (
    <div className="overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 border-b border-rule px-5 pb-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0B1324] text-white">
            <Eye size={16} />
          </div>
          <div>
            <h2 className="text-lg leading-tight">Top 10 most viewed listings</h2>
            <p className="text-xs text-ink-faint">Listing page views (sellers viewing their own listing and admins are not counted)</p>
          </div>
        </div>
        <div className="inline-flex shrink-0 gap-0.5 self-start rounded-xl border border-rule bg-paper-sunk p-1 sm:self-auto">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                range === r.id ? "bg-paper-raised text-ink shadow-[0_1px_3px_rgba(11,19,36,0.12)] ring-1 ring-rule" : "text-ink-faint hover:text-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-ink-faint">
          No listing views recorded {range === "all" ? "yet. Counting starts from the first visit after this feature went live." : "in this period."}
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead className="bg-paper-sunk">
                <tr className="text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="w-10 px-5 py-2.5 font-medium">#</th>
                  <th className="px-3 py-2.5 font-medium">Listing</th>
                  <th className="px-3 py-2.5 text-right font-medium">Views</th>
                  <th className="px-3 py-2.5 text-right font-medium">Unique visitors</th>
                  <th className="px-3 py-2.5 text-right font-medium">Signed-in users</th>
                  <th className="px-5 py-2.5 text-right font-medium">Last viewed</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.listingId} className="border-t border-rule">
                    <td className="mono px-5 py-3 text-ink-faint">{i + 1}</td>
                    <td className="max-w-[340px] px-3 py-3">
                      {r.slug ? (
                        <Link href={`/listing/${r.slug}`} className="block truncate font-medium text-ink hover:text-brand-hover">
                          {r.title}
                        </Link>
                      ) : (
                        <span className="block truncate font-medium text-ink">{r.title}</span>
                      )}
                      <span className="text-xs text-ink-faint">
                        {r.category}
                        {r.status !== "published" && ` · ${r.status.replace(/_/g, " ")}`}
                      </span>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-sunk">
                        <div className="h-full rounded-full bg-gradient-to-r from-brand to-[#059669]" style={{ width: `${(r.views / max) * 100}%` }} />
                      </div>
                    </td>
                    <td className="mono px-3 py-3 text-right text-base font-semibold">{r.views}</td>
                    <td className="mono px-3 py-3 text-right">{r.uniqueVisitors}</td>
                    <td className="mono px-3 py-3 text-right">{r.signedInViewers}</td>
                    <td className="px-5 py-3 text-right text-xs text-ink-faint">{ago(r.lastViewedAt, now)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phones */}
          <ul className="divide-y divide-rule sm:hidden">
            {rows.map((r, i) => (
              <li key={r.listingId} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-2">
                    <span className="mono pt-0.5 text-xs text-ink-faint">{i + 1}</span>
                    <div className="min-w-0">
                      {r.slug ? (
                        <Link href={`/listing/${r.slug}`} className="block truncate text-sm font-medium text-ink">
                          {r.title}
                        </Link>
                      ) : (
                        <span className="block truncate text-sm font-medium text-ink">{r.title}</span>
                      )}
                      <span className="text-xs text-ink-faint">{r.category}</span>
                    </div>
                  </div>
                  <span className="mono shrink-0 text-base font-semibold">
                    {r.views} <span className="text-xs font-normal text-ink-faint">views</span>
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-sunk">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand to-[#059669]" style={{ width: `${(r.views / max) * 100}%` }} />
                </div>
                <div className="mono mt-1.5 flex flex-wrap gap-x-3 text-xs text-ink-faint">
                  <span>{r.uniqueVisitors} unique visitors</span>
                  <span>{r.signedInViewers} signed-in</span>
                  <span>{ago(r.lastViewedAt, now)}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
