// Startup Business category only (user request, Sep 5, 2026) — how far
// along the startup's fundraising is, shown as a single-select dropdown on
// the seller form (a startup is only ever at one stage) and stored as a
// single plain-text id in the new `funding_stage` column (migration 022) —
// unlike Business Type/Account Type/Platform, this is a single value, not a
// comma-separated multi-select, so it's turned into a display name by a
// dedicated branch in buildQuickStats() in map-listing.ts rather than the
// split/join treatment those use.
export const FUNDING_STAGES: { id: string; name: string }[] = [
  { id: "bootstrapped", name: "Bootstrapped / No External Funding" },
  { id: "pre-seed", name: "Pre-Seed" },
  { id: "seed", name: "Seed" },
  { id: "series-a", name: "Series A" },
  { id: "series-b-plus", name: "Series B+" },
];

export const FUNDING_STAGE_MAP: Record<string, string> = Object.fromEntries(FUNDING_STAGES.map((s) => [s.id, s.name]));
