"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
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

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

type Preset = "7d" | "30d" | "90d" | "12m" | "custom";

const PRESETS: { key: Preset; label: string }[] = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "12m", label: "Last 12 months" },
  { key: "custom", label: "Custom" },
];

// The live, auto-updating Google Analytics panel — Durqo's version of
// Flippa's real GA3/GA4 integration (Users / Page Views / Pages per
// Session / Avg. Session Duration / Bounce Rate, auto-updated on a
// schedule), rendered on the public listing page once a seller has
// connected via OAuth (src/lib/google-analytics.ts) and at least one sync
// has completed. Styled to Durqo's own navy/emerald design tokens rather
// than copying the reference screenshot's dark/purple theme.
//
// `initialStats` is the last periodic-sync snapshot (always a fixed
// 90-day window — see src/lib/data/ga-sync.server.ts) and is what renders
// on first paint with no extra network round trip. Switching to any other
// preset, or applying a custom range, fetches that specific window live
// from /api/google-analytics/report (src/app/api/google-analytics/report/
// route.ts) — a Motion-Invest-style 7/30/90-day, 12-month, custom range
// picker, requested by the user after seeing Motion Invest's own dashboard.
export default function GoogleAnalyticsLivePanel({
  listingId,
  initialStats,
}: {
  listingId: string;
  initialStats: GaLiveStats;
}) {
  const [stats, setStats] = useState(initialStats);
  const [preset, setPreset] = useState<Preset>("90d");
  const [customStart, setCustomStart] = useState(daysAgoIso(30));
  const [customEnd, setCustomEnd] = useState(todayIso());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRange = useCallback(
    async (nextPreset: Preset, start?: string, end?: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ listingId, range: nextPreset });
        if (nextPreset === "custom" && start && end) {
          params.set("start", start);
          params.set("end", end);
        }
        const res = await fetch(`/api/google-analytics/report?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Couldn't load this range.");
        setStats(data as GaLiveStats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load this range.");
      } finally {
        setLoading(false);
      }
    },
    [listingId]
  );

  function selectPreset(next: Preset) {
    setPreset(next);
    setError(null);
    if (next === "custom") return; // wait for the seller/buyer to hit Apply
    void fetchRange(next);
  }

  function applyCustomRange() {
    if (!customStart || !customEnd || customStart > customEnd) {
      setError("Pick a valid start and end date.");
      return;
    }
    void fetchRange("custom", customStart, customEnd);
  }

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
        {loading && (
          <span className="flex items-center gap-1.5 text-xs text-ink-faint">
            <Loader2 size={12} className="animate-spin" /> Loading…
          </span>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mono text-xs uppercase tracking-wide text-ink-faint">Date Range</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              disabled={loading}
              onClick={() => selectPreset(p.key)}
              aria-pressed={preset === p.key}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
                preset === p.key
                  ? "border-brand bg-brand text-white"
                  : "border-rule-strong bg-paper text-ink-soft hover:border-brand hover:text-brand-hover"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {preset === "custom" && (
        <div className="mb-4 flex flex-wrap items-end gap-2 rounded-md border border-rule bg-paper p-3">
          <label className="flex flex-col gap-1 text-xs text-ink-faint">
            From
            <input
              type="date"
              value={customStart}
              max={customEnd}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-md border border-rule-strong bg-paper-raised px-2 py-1 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink-faint">
            To
            <input
              type="date"
              value={customEnd}
              min={customStart}
              max={todayIso()}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-md border border-rule-strong bg-paper-raised px-2 py-1 text-sm text-ink"
            />
          </label>
          <button
            type="button"
            disabled={loading}
            onClick={applyCustomRange}
            className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            Apply
          </button>
        </div>
      )}

      {error && <p className="mb-3 text-xs text-danger">{error}</p>}

      <div className="mb-2 flex items-center justify-between">
        <p className="mono text-xs uppercase tracking-wide text-ink-faint">Page Views Over Time</p>
        <span className="text-xs text-ink-faint">{stats.dateRangeLabel}</span>
      </div>
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
        {preset === "custom" || stats !== initialStats ? "Loaded" : "Last synced"} {fmtDate(stats.lastSyncedAt.slice(0, 10))} · pulled directly
        from this seller&rsquo;s connected Google Analytics 4 property.
      </p>
    </div>
  );
}
