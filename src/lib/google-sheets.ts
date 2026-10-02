import "server-only";

// 2026-10-02 ("lead hisebe ki excel file e auto sync kora jai" — can leads
// auto-sync to an excel file, pointed at
// https://docs.google.com/spreadsheets/d/1rDqryJg_Cfs3gwt2H5LalYtUELVPB2cGVQfPTaw3T0g):
// pushes every new /valuation submission into the site owner's own Google
// Sheet as it arrives. Scope, per the site owner's own choice, is new leads
// only — this never reflects a later status/note change made on the admin
// dashboard back into the sheet; see replaceAllValuationLeadsInSheet()
// below for the separate one-time full-mirror backfill.
//
// 2026-10-02 same-day pivot: this originally talked to the Sheets API
// directly over a signed service-account JWT, but the site owner's Google
// Cloud organization enforces the "Secure by Default" baseline constraint
// that blocks service-account key creation org-wide (and it isn't
// project-scoped, so a fresh project hits the same wall), with no
// self-serve way to lift it. Rather than requiring an org admin to disable
// a security policy, this now talks to a small Apps Script "Web App"
// deployed from inside the sheet itself — no GCP project, no service
// account, no key, nothing for an org policy to block. The site owner
// deploys the script (see the companion snippet handed over alongside this
// file) and picks their own shared-secret string; neither of us ever
// handles a Google credential this way.
//
// Requires two env vars, set directly in the Vercel project settings:
//   GOOGLE_SHEETS_WEBHOOK_URL     - the Apps Script Web App's /exec URL
//   GOOGLE_SHEETS_WEBHOOK_SECRET  - the shared secret the site owner chose,
//                                   matching the SHARED_SECRET constant in
//                                   the Apps Script
// Every function below degrades to a silent no-op (or a reported,
// non-throwing error for the admin-triggered backfill) when those env vars
// are missing — a misconfigured or not-yet-set-up integration must never
// block a lead from being saved, or block the admin dashboard from
// working.

export type ValuationLeadSheetRow = {
  createdAt: string;
  name: string;
  email: string;
  phone: string | null;
  categoryName: string;
  monthlyRevenue: number;
  monthlyProfit: number;
  businessAgeYears: number;
  categoryMetricLabel: string | null;
  estimatedLow: number;
  estimatedHigh: number;
  status: string;
};

// Column order here must match the HEADER_ROW the Apps Script writes — see
// the companion snippet. Keeping the header itself on the Apps Script side
// (rather than asserting it from here, as the old service-account version
// did) since the webhook has no separate "am I talking to an empty sheet"
// read step; it just appends/overwrites rows in this fixed order.
function toRowValues(row: ValuationLeadSheetRow): (string | number)[] {
  return [
    row.createdAt,
    row.name,
    row.email,
    row.phone ?? "",
    row.categoryName,
    row.monthlyRevenue,
    row.monthlyProfit,
    row.businessAgeYears,
    row.categoryMetricLabel ?? "",
    row.estimatedLow,
    row.estimatedHigh,
    row.status,
  ];
}

async function callSheetsWebhook(action: "append" | "replaceAll", payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;
  if (!url || !secret) {
    return { ok: false, error: "Google Sheets isn't set up yet (GOOGLE_SHEETS_WEBHOOK_URL / GOOGLE_SHEETS_WEBHOOK_SECRET aren't configured)." };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, action, ...payload }),
      redirect: "follow",
    });
    const text = await res.text();
    let data: { ok?: boolean; error?: string } | null = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
    if (!res.ok || !data || data.ok !== true) {
      return { ok: false, error: data?.error ?? text.slice(0, 500) ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error talking to the Sheets webhook." };
  }
}

// Appends a single row after whatever's already in the sheet — the ongoing
// "a new lead arrives -> one new row shows up" sync the site owner asked
// for. Never throws: every caller treats this as fire-and-forget, the same
// posture as the email notifications sent alongside the same submission.
export async function appendValuationLeadToSheet(row: ValuationLeadSheetRow): Promise<void> {
  try {
    const result = await callSheetsWebhook("append", { row: toRowValues(row) });
    if (!result.ok) {
      console.error("[google-sheets] append failed:", result.error);
    }
  } catch (err) {
    console.error("[google-sheets] append threw:", err);
  }
}

// One-time (or re-run-whenever) full mirror: clears the sheet and rewrites
// the header + every row passed in, in the given order. Used by the admin
// "Sync all leads to Google Sheet" button to backfill everything that
// existed before this integration was wired up. Safe to re-run later too
// (it's a full overwrite, not an append) — but ongoing sync after that
// first backfill happens one row at a time via appendValuationLeadToSheet()
// above; this function is never called automatically.
export async function replaceAllValuationLeadsInSheet(rows: ValuationLeadSheetRow[]): Promise<{ ok: boolean; error?: string }> {
  return callSheetsWebhook("replaceAll", { rows: rows.map(toRowValues) });
}
