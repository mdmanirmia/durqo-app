import "server-only";
import crypto from "node:crypto";

// 2026-10-02 ("lead hisebe ki excel file e auto sync kora jai" — can leads
// auto-sync to an excel file, pointed at
// https://docs.google.com/spreadsheets/d/1rDqryJg_Cfs3gwt2H5LalYtUELVPB2cGVQfPTaw3T0g):
// pushes every new /valuation submission into the site owner's own Google
// Sheet as it arrives. Scope, per the site owner's own choice, is new leads
// only — this never reflects a later status/note change made on the admin
// dashboard back into the sheet; see replaceAllValuationLeadsInSheet()
// below for the separate one-time full-mirror backfill.
//
// Talks to the Sheets API directly over a signed service-account JWT
// (RFC 7523) rather than pulling in the `googleapis` package — the only
// two HTTP calls this needs (exchange the JWT for an access token, then one
// values.append/update REST call) don't justify a large dependency, and
// every other third-party integration in this codebase (Stripe, Resend,
// Supabase) already talks to its own REST/SDK surface directly rather than
// through a heavyweight wrapper.
//
// Requires two env vars, set directly in the Vercel project settings (never
// passed through chat or committed to the repo):
//   GOOGLE_SHEETS_CLIENT_EMAIL  - the service account's "client_email"
//   GOOGLE_SHEETS_PRIVATE_KEY   - the service account's "private_key"
// from a Google Cloud service account JSON key, where that same service
// account email has been given Editor access on the sheet itself (shared
// the same way you'd share it with any other Google account). Every
// function below degrades to a silent no-op (or a reported, non-throwing
// error for the admin-triggered backfill) when those env vars are missing
// — a misconfigured or not-yet-set-up integration must never block a lead
// from being saved, or block the admin dashboard from working.

const SPREADSHEET_ID = "1rDqryJg_Cfs3gwt2H5LalYtUELVPB2cGVQfPTaw3T0g";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

const HEADER_ROW = [
  "Submitted At",
  "Name",
  "Email",
  "Phone",
  "Category",
  "Monthly Revenue (USD)",
  "Monthly Profit (USD)",
  "Business Age (yrs)",
  "Category Metric",
  "Estimated Low (USD)",
  "Estimated High (USD)",
  "Status",
];

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Service-account JWT bearer flow (RFC 7523) — signs a short-lived claim
// set with the service account's private key and exchanges it for an
// access token. This is the same flow the googleapis SDK performs
// internally; reimplemented by hand here to avoid the dependency.
async function getAccessToken(): Promise<string | null> {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  if (!clientEmail || !privateKeyRaw) return null;

  // A literal multi-line PEM key doesn't survive most env var UIs intact,
  // so the conventional fix (same as every other "paste a service account
  // key into an env var" setup) is pasting it with escaped \n sequences,
  // unescaped here before use.
  const privateKey = privateKeyRaw.includes("\\n") ? privateKeyRaw.replace(/\\n/g, "\n") : privateKeyRaw;

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claimSet = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope: SHEETS_SCOPE,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const signatureInput = `${header}.${claimSet}`;
  let signature: string;
  try {
    signature = base64url(crypto.sign("RSA-SHA256", Buffer.from(signatureInput), privateKey));
  } catch (err) {
    console.error("[google-sheets] failed to sign JWT - check GOOGLE_SHEETS_PRIVATE_KEY formatting:", err);
    return null;
  }
  const assertion = `${signatureInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    console.error("[google-sheets] token exchange failed:", await res.text());
    return null;
  }
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

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

async function sheetHasHeaderRow(accessToken: string): Promise<boolean> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A1:A1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return true; // can't tell - don't risk clobbering real data with a header write
  const data = (await res.json()) as { values?: unknown[][] };
  return !!data.values && data.values.length > 0;
}

async function writeHeaderRow(accessToken: string): Promise<void> {
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A1?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: [HEADER_ROW] }),
  });
}

// Appends a single row after whatever's already in the sheet — the ongoing
// "a new lead arrives -> one new row shows up" sync the site owner asked
// for. Writes the header row first if the sheet still looks empty (e.g.
// the admin hasn't run the one-time backfill below yet), so the very first
// lead synced this way still lands with column headers in place. Never
// throws: every caller treats this as fire-and-forget, the same posture as
// the email notifications sent alongside the same submission.
export async function appendValuationLeadToSheet(row: ValuationLeadSheetRow): Promise<void> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return; // not configured yet - silently skip

    if (!(await sheetHasHeaderRow(accessToken))) {
      await writeHeaderRow(accessToken);
    }

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A1:L1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [toRowValues(row)] }),
      }
    );
    if (!res.ok) {
      console.error("[google-sheets] append failed:", await res.text());
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
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { ok: false, error: "Google Sheets isn't set up yet (GOOGLE_SHEETS_CLIENT_EMAIL / GOOGLE_SHEETS_PRIVATE_KEY aren't configured)." };
  }

  try {
    const clearRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A1:Z10000:clear`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!clearRes.ok) return { ok: false, error: await clearRes.text() };

    const values = [HEADER_ROW, ...rows.map(toRowValues)];
    const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A1?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });
    if (!updateRes.ok) return { ok: false, error: await updateRes.text() };

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error talking to Google Sheets." };
  }
}
