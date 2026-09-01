"use client";

export interface GaConnectionStatus {
  status: "pending_property_selection" | "active" | "error" | "disconnected" | "syncing";
  gaPropertyDisplayName?: string;
  lastSyncedAt?: string;
  errorMessage?: string;
}

// Thin client-side fetch over /api/google-analytics/status (see that
// route for why this isn't a direct Supabase query — the underlying table
// holds OAuth tokens and has no client-reachable RLS policies at all).
export async function getGaConnectionStatuses(): Promise<Record<string, GaConnectionStatus>> {
  try {
    const res = await fetch("/api/google-analytics/status");
    if (!res.ok) return {};
    const { connections } = await res.json();
    const out: Record<string, GaConnectionStatus> = {};
    for (const c of connections ?? []) {
      out[c.listing_id] = {
        status: c.status,
        gaPropertyDisplayName: c.ga_property_display_name ?? undefined,
        lastSyncedAt: c.last_synced_at ?? undefined,
        errorMessage: c.error_message ?? undefined,
      };
    }
    return out;
  } catch {
    return {};
  }
}
