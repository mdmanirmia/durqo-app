"use client";

import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
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
    <div className="rounded-2xl border border-[#E2E7E4] bg-white p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mono text-xs uppercase tracking-wide text-[#98A2B3]">Date Range</span>
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
                  ? "border-[#0EAE7A] bg-[#0EAE7A] text-white"
                  : "border-[#E2E7E4] bg-white text-[#667085] hover:border-[#0EAE7A] hover:text-[#0EAE7A]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {loading && (
          <span className="flex items-center gap-1.5 text-xs text-[#98A2B3]">
            <Loader2 size={12} className="animate-spin" /> Loading…
          </span>
        )}
      </div>

      {preset === "custom" && (
        <div className="mb-4 flex flex-wrap items-end gap-2 rounded-[10px] border border-[#E2E7E4] bg-[#F6F7F5] p-3">
          <label className="flex flex-col gap-1 text-xs text-[#98A2B3]">
            From
            <input
              type="date"
              value={customStart}
              max={customEnd}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-md border border-[#E2E7E4] bg-white px-2 py-1 text-sm text-[#101828]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[#98A2B3]">
            To
            <input
              type="date"
              value={customEnd}
              min={customStart}
              max={todayIso()}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-md border border-[#E2E7E4] bg-white px-2 py-1 text-sm text-[#101828]"
            />
          </label>
          <button
            type="button"
            disabled={loading}
            onClick={applyCustomRange}
            className="rounded-md bg-[#0EAE7A] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0c9668] disabled:opacity-60"
          >
            Apply
          </button>
        </div>
      )}

      {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

      <div className="mb-2 flex items-center justify-between">
        <p className="mono text-xs uppercase tracking-wide text-[#98A2B3]">Page Views Over Time</p>
        <span className="text-xs text-[#98A2B3]">{stats.dateRangeLabel}</span>
      </div>
      <TrendChart data={chartData} dataKey="views" color="#0EAE7A" format="number" />

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#E2E7E4] pt-5 sm:grid-cols-5">
        <div>
          <div className="mono text-lg font-semibold text-[#0C1830]">{fmtNumber(stats.pageViews)}</div>
          <div className="text-xs text-[#98A2B3]">Page Views</div>
        </div>
        <div>
          <div className="mono text-lg font-semibold text-[#0C1830]">{fmtNumber(stats.uniqueVisitors)}</div>
          <div className="text-xs text-[#98A2B3]">Unique Visitors</div>
        </div>
        <div>
          <div className="mono text-lg font-semibold text-[#0C1830]">{fmtNumber(stats.sessions)}</div>
          <div className="text-xs text-[#98A2B3]">Sessions</div>
        </div>
        <div>
          <div className="mono text-lg font-semibold text-[#0C1830]">{stats.bounceRate}%</div>
          <div className="text-xs text-[#98A2B3]">Bounce Rate</div>
        </div>
        <div>
          <div className="mono text-lg font-semibold text-[#0C1830]">{fmtDuration(stats.avgSessionSeconds)}</div>
          <div className="text-xs text-[#98A2B3]">Avg. Session</div>
        </div>
      </div>

      {stats.trafficAcquisition.length > 0 && (
        <div className="mt-5 border-t border-[#E2E7E4] pt-5">
          <p className="mono mb-3 text-xs uppercase tracking-wide text-[#98A2B3]">Traffic Acquisition</p>
          <div className="space-y-2">
            {stats.trafficAcquisition.map((c) => {
              const pct = totalAcquisition ? Math.round((c.sessions / totalAcquisition) * 100) : 0;
              return (
                <div key={c.channel} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-sm text-[#667085]">{c.channel}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F6F7F5]">
                    <div className="h-full rounded-full bg-[#0EAE7A]" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="mono w-14 shrink-0 text-right text-xs text-[#98A2B3]">{fmtNumber(c.sessions)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-5 border-t border-[#E2E7E4] pt-3 text-xs text-[#98A2B3]">
        {preset === "custom" || stats !== initialStats ? "Loaded" : "Last synced"} {fmtDate(stats.lastSyncedAt.slice(0, 10))} · pulled directly
        from this seller&rsquo;s connected Google Analytics 4 property.
      </p>
    </div>
  );
}
