import { CheckCircle2 } from "lucide-react";
import TrendChart from "@/components/charts/TrendChart";
import { fmtNumber } from "@/lib/format";
import type { GaLiveStats } from "@/lib/types";

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

// The live, auto-updating Google Analytics panel — Durqo's version of
// Flippa's real GA3/GA4 integration (Users / Page Views / Pages per
// Session / Avg. Session Duration / Bounce Rate, auto-updated on a
// schedule), rendered on the public listing page once a seller has
// connected via OAuth (src/lib/google-analytics.ts) and at least one sync
// has completed. Styled to Durqo's own navy/emerald design tokens rather
// than copying the reference screenshot's dark/purple theme.
export default function GoogleAnalyticsLivePanel({ stats }: { stats: GaLiveStats }) {
  const chartData = stats.dailyPageViews.map((d) => ({ month: d.date, views: d.value }));
  const totalAcquisition = stats.trafficAcquisition.reduce((sum, c) => sum + c.sessions, 0);

  return (
    <div className="rounded-xl border border-rule bg-paper-raised p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-ink">Google Analytics</h3>
          <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-hover">
            <CheckCircle2 size={12} /> Connected
          </span>
        </div>
        <span className="text-xs text-ink-faint">{stats.dateRangeLabel}</span>
      </div>

      <p className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Page Views Over Time</p>
      <TrendChart data={chartData} dataKey="views" color="#10B981" format="number" />

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-rule pt-5 sm:grid-cols-5">
        <div>
          <div className="mono text-lg font-semibold text-ink">{fmtNumber(stats.pageViews)}</div>
          <div className="text-xs text-ink-faint">Page Views</div>
        </div>
        <div>
          <div className="mono text-lg font-semibold text-ink">{fmtNumber(stats.uniqueVisitors)}</div>
          <div className="text-xs text-ink-faint">Unique Visitors</div>
        </div>
        <div>
          <div className="mono text-lg font-semibold text-ink">{fmtNumber(stats.sessions)}</div>
          <div className="text-xs text-ink-faint">Sessions</div>
        </div>
        <div>
          <div className="mono text-lg font-semibold text-ink">{stats.bounceRate}%</div>
          <div className="text-xs text-ink-faint">Bounce Rate</div>
        </div>
        <div>
          <div className="mono text-lg font-semibold text-ink">{fmtDuration(stats.avgSessionSeconds)}</div>
          <div className="text-xs text-ink-faint">Avg. Session</div>
        </div>
      </div>

      {stats.trafficAcquisition.length > 0 && (
        <div className="mt-5 border-t border-rule pt-5">
          <p className="mono mb-3 text-xs uppercase tracking-wide text-ink-faint">Traffic Acquisition</p>
          <div className="space-y-2">
            {stats.trafficAcquisition.map((c) => {
              const pct = totalAcquisition ? Math.round((c.sessions / totalAcquisition) * 100) : 0;
              return (
                <div key={c.channel} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-sm text-ink-soft">{c.channel}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-sunk">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="mono w-14 shrink-0 text-right text-xs text-ink-faint">{fmtNumber(c.sessions)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-5 border-t border-rule pt-3 text-xs text-ink-faint">
        Last synced {fmtDate(stats.lastSyncedAt.slice(0, 10))} · pulled directly from this seller&rsquo;s connected Google Analytics 4 property.
      </p>
    </div>
  );
}
