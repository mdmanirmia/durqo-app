"use client";

import { useEffect, useState } from "react";
import { Landmark, Wallet, Info } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SELLER_NAV } from "@/lib/dashboard-nav";
import { fmtUSD, fmtUSD2, fmtBDTWhole } from "@/lib/format";
import { fmtRate } from "@/lib/fees";
import {
  getAvailableBalance,
  getMyWithdrawals,
  type AvailableBalance,
  type WithdrawalRow,
  type WithdrawalStatus,
} from "@/lib/data/earnings.client";
import { requestWithdrawal, getMfsWithdrawalRate } from "./actions";

const PAYOUT_METHODS = [
  { id: "bank_transfer", label: "Bank Transfer" },
  { id: "bkash", label: "bKash" },
  { id: "rocket", label: "Rocket" },
  { id: "nagad", label: "Nagad" },
  { id: "paypal", label: "PayPal" },
  { id: "wise", label: "Wise" },
] as const;

type PayoutMethodId = (typeof PAYOUT_METHODS)[number]["id"];

// The three MFS methods the ৳50,000/day, ৳300,000/month cap (and the
// -1.50 BDT withdrawal rate) applies to — Bank Transfer, PayPal and Wise
// are never subject to any of this UI.
const MFS_METHOD_IDS = new Set<PayoutMethodId>(["bkash", "rocket", "nagad"]);

// Per-method payout-detail fields, shown as a small structured form instead
// of one free-text box (site owner, Sep 11 2026: "alada kore input deyar
// option koro like form fill up er moto" — separate inputs per field, like
// filling out a form). Each field's value is combined into a single
// "Label: value, Label: value" string before submission (buildPayoutDetails
// below), so no backend/database change was needed — the RPC and
// withdrawal_requests table still just store one payout_details string.
type PayoutField = { key: string; label: string; placeholder: string; optional?: boolean };

const METHOD_FIELDS: Record<PayoutMethodId, PayoutField[]> = {
  bank_transfer: [
    { key: "bankName", label: "Bank Name", placeholder: "e.g. Dutch-Bangla Bank" },
    { key: "accountName", label: "Account Name", placeholder: "Account holder's full name" },
    { key: "accountNumber", label: "Account Number", placeholder: "Account number" },
    { key: "routingSwift", label: "Routing / SWIFT", placeholder: "Routing number or SWIFT code" },
  ],
  bkash: [
    { key: "number", label: "bKash Number", placeholder: "01XXXXXXXXX" },
    { key: "accountName", label: "Account Holder Name", placeholder: "Name on the bKash account" },
  ],
  rocket: [
    { key: "number", label: "Rocket Number", placeholder: "01XXXXXXXXX" },
    { key: "accountName", label: "Account Holder Name", placeholder: "Name on the Rocket account" },
  ],
  nagad: [
    { key: "number", label: "Nagad Number", placeholder: "01XXXXXXXXX" },
    { key: "accountName", label: "Account Holder Name", placeholder: "Name on the Nagad account" },
  ],
  paypal: [{ key: "email", label: "PayPal Email", placeholder: "you@example.com" }],
  wise: [
    { key: "email", label: "Wise Email", placeholder: "you@example.com" },
    { key: "details", label: "Additional Account Details", placeholder: "Any extra details Wise needs", optional: true },
  ],
};

// Daily MFS cap in BDT (031_withdrawal_mfs_partial_claim.sql) — the USD
// equivalent shown below is 50000 / today's withdrawal rate.
const MFS_DAILY_CAP_BDT = 50000;

const STATUS_LABEL: Record<WithdrawalStatus, string> = {
  pending: "Pending review",
  approved: "Approved — payout in progress",
  rejected: "Rejected",
  paid: "Paid",
};

const STATUS_TONE: Record<WithdrawalStatus, "gold" | "brand" | "danger" | "dark"> = {
  pending: "gold",
  approved: "brand",
  rejected: "danger",
  paid: "dark",
};

export default function SellerEarningsPage() {
  const [balance, setBalance] = useState<AvailableBalance | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[] | null>(null);
  const [methodId, setMethodId] = useState<PayoutMethodId>("bank_transfer");
  // Keyed by "methodId:fieldKey" so values are preserved when the seller
  // switches methods and switches back, and "number"/"accountName" (reused
  // across bKash/Rocket/Nagad) don't collide with each other.
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Today's bKash/Rocket/Nagad withdrawal rate (market rate minus the
  // ৳1.50 withdrawal margin — getUsdToBdtWithdrawalRate() in
  // src/lib/currency.ts, via the getMfsWithdrawalRate() action since that
  // module is server-only). Fetched once up front — it doesn't depend on
  // which payout method is selected, only used when one of the three is.
  const [mfsRate, setMfsRate] = useState<number | null>(null);

  function reload() {
    getAvailableBalance().then(setBalance);
    getMyWithdrawals().then(setWithdrawals);
  }

  useEffect(() => {
    let cancelled = false;
    getAvailableBalance().then((b) => {
      if (!cancelled) setBalance(b);
    });
    getMyWithdrawals().then((w) => {
      if (!cancelled) setWithdrawals(w);
    });
    getMfsWithdrawalRate().then((r) => {
      if (!cancelled) setMfsRate(r.rate);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isMfs = MFS_METHOD_IDS.has(methodId);
  // The live USD equivalent of the ৳50,000/day cap at today's rate — a
  // flat estimate (matches the site owner's requested formula exactly);
  // the seller's *actual* remaining allowance can be lower if they've
  // already withdrawn some via MFS today or this month, which
  // requestWithdrawal()'s returned netAmount reconciles after submission.
  const mfsDailyCapUsd = isMfs && mfsRate ? MFS_DAILY_CAP_BDT / mfsRate : null;
  // What this request would actually withdraw: the seller's full balance,
  // or the day's remaining MFS allowance — whichever is smaller. Below
  // the cap, this is just their balance (and its real BDT equivalent);
  // at or above it, this locks to the ৳50,000 cap and the rest of their
  // balance stays available for a future request.
  const mfsRequestUsd = isMfs && balance && mfsDailyCapUsd !== null ? Math.min(balance.netAmount, mfsDailyCapUsd) : null;
  const mfsRequestBdt = isMfs && mfsRate !== null && mfsRequestUsd !== null ? mfsRequestUsd * mfsRate : null;

  const currentFields = METHOD_FIELDS[methodId];
  function fieldValue(key: string) {
    return fieldValues[`${methodId}:${key}`] ?? "";
  }
  function setFieldValue(key: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [`${methodId}:${key}`]: value }));
  }
  // Combines the structured fields back into the single string
  // requestWithdrawal()/create_withdrawal_request() has always stored —
  // e.g. "Bank Name: Dutch-Bangla Bank, Account Name: Jane Doe, ...".
  function buildPayoutDetails(): string {
    return currentFields.map((f) => `${f.label}: ${fieldValue(f.key).trim()}`).join(", ");
  }
  function hasMissingRequiredField(): boolean {
    return currentFields.some((f) => !f.optional && !fieldValue(f.key).trim());
  }

  async function handleSubmit() {
    if (hasMissingRequiredField()) return setError("Please fill in all payout details.");
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const result = await requestWithdrawal(methodId, buildPayoutDetails());
      setFieldValues((prev) => {
        const next = { ...prev };
        currentFields.forEach((f) => delete next[`${methodId}:${f.key}`]);
        return next;
      });
      // For bKash/Rocket/Nagad the amount actually claimed can be less
      // than the balance shown above (see the notice under the payout
      // buttons) — state the real amount so it's never a surprise.
      setNotice(
        result.netAmount !== null
          ? `Withdrawal request submitted for ${fmtUSD(result.netAmount)} — we'll email you once it's reviewed.`
          : "Withdrawal request submitted — we'll email you once it's reviewed."
      );
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const hasBalance = !!balance && balance.netAmount > 0;

  return (
    <DashboardShell title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <h2 className="mb-2 text-xl">Earnings &amp; Withdrawals</h2>
      <p className="mb-6 max-w-[65ch] text-sm text-ink-soft">
        Your available balance is every completed order that hasn&rsquo;t already been claimed by a withdrawal request, minus Durqo&rsquo;s Success Fee.
      </p>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-rule bg-paper-raised p-5">
          <div className="mono text-2xl font-semibold text-brand-strong">{balance === null ? "…" : fmtUSD(balance.netAmount)}</div>
          <div className="text-sm text-ink-faint">Available to withdraw</div>
        </div>
        <div className="rounded-xl border border-rule bg-paper-raised p-5">
          <div className="mono text-2xl font-semibold">{balance === null ? "…" : fmtUSD(balance.grossAmount)}</div>
          <div className="text-sm text-ink-faint">Gross (before Success Fee)</div>
        </div>
        <div className="rounded-xl border border-rule bg-paper-raised p-5">
          <div className="mono text-2xl font-semibold">{balance === null ? "…" : fmtUSD(balance.successFeeAmount)}</div>
          <div className="text-sm text-ink-faint">Success Fee ({balance === null || balance.orderCount === 0 ? "—" : fmtRate(balance.successFeeAmount / balance.grossAmount)})</div>
        </div>
      </div>

      {balance !== null && balance.escrowComOrderCount > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold-soft px-5 py-4">
          <Info size={18} className="mt-0.5 shrink-0 text-gold" />
          <p className="text-sm text-ink-soft">
            {balance.escrowComOrderCount} of your {balance.orderCount} available order{balance.orderCount === 1 ? "" : "s"} went through Escrow.com,
            which pays you directly once it releases funds. Including it here is your available balance as tracked by Durqo — double-check what
            Escrow.com has already paid you before requesting a withdrawal that covers it.
          </p>
        </div>
      )}

      <div className="mb-10 rounded-xl border border-rule bg-paper-raised p-5">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-ink">
          <Wallet size={17} /> Request a withdrawal
        </h3>

        {!hasBalance ? (
          <p className="text-sm text-ink-faint">Nothing available to withdraw yet.</p>
        ) : (
          <>
            <p className="mono mb-2 text-[0.68rem] uppercase tracking-wide text-ink-faint">Payout method</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {PAYOUT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethodId(m.id)}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                    methodId === m.id ? "border-brand-strong bg-brand-soft text-brand-strong" : "border-rule-strong text-ink-soft hover:border-brand-strong"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {isMfs && (
              <p className="mb-4 text-xs text-ink-faint">
                {PAYOUT_METHODS.find((m) => m.id === methodId)?.label} withdrawals are limited to ৳50,000 per day and ৳300,000 per month.
              </p>
            )}

            {isMfs && mfsRequestUsd !== null && mfsRequestBdt !== null && (
              <p className="mb-4 text-sm font-medium text-ink">
                You can withdraw {fmtUSD2(mfsRequestUsd)} ({fmtBDTWhole(mfsRequestBdt)}) via {PAYOUT_METHODS.find((m) => m.id === methodId)?.label} right
                now.
              </p>
            )}

            <p className="mono mb-2 text-[0.68rem] uppercase tracking-wide text-ink-faint">Payout details</p>
            <div className="mb-4 grid gap-3 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
              {currentFields.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-xs text-ink-faint">
                    {f.label}
                    {f.optional ? " (optional)" : ""}
                  </label>
                  <input
                    type="text"
                    value={fieldValue(f.key)}
                    onChange={(e) => setFieldValue(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full rounded-md border border-rule-strong bg-paper px-3 py-2 text-sm focus:border-brand-strong focus:outline-none"
                  />
                </div>
              ))}
            </div>

            {error && <p className="mb-3 text-sm text-danger">{error}</p>}
            {notice && <p className="mb-3 text-sm text-brand-strong">{notice}</p>}

            <Button type="button" onClick={handleSubmit} disabled={submitting || (isMfs && mfsRate === null)}>
              {submitting
                ? "Submitting…"
                : isMfs
                ? mfsRequestUsd !== null && mfsRequestBdt !== null
                  ? `Request ${fmtUSD2(mfsRequestUsd)} (${fmtBDTWhole(mfsRequestBdt)})`
                  : "Loading…"
                : `Request ${fmtUSD(balance!.netAmount)}`}
            </Button>
          </>
        )}
      </div>

      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Landmark size={17} /> Withdrawal history
      </h3>
      {withdrawals === null ? (
        <p className="text-sm text-ink-faint">Loading&hellip;</p>
      ) : withdrawals.length === 0 ? (
        <p className="text-sm text-ink-faint">No withdrawal requests yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-rule">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
                <th className="px-4 py-3 font-medium">Requested</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Gross</th>
                <th className="px-4 py-3 font-medium">Fee</th>
                <th className="px-4 py-3 font-medium">Net</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-rule align-top last:border-b-0">
                  <td className="mono px-4 py-3 text-ink-soft">{w.requestedAt}</td>
                  <td className="mono px-4 py-3">{w.orderCount}</td>
                  <td className="mono px-4 py-3">{fmtUSD(w.grossAmount)}</td>
                  <td className="mono px-4 py-3 text-ink-faint">-{fmtUSD(w.successFeeAmount)}</td>
                  <td className="mono px-4 py-3 font-semibold">{fmtUSD(w.netAmount)}</td>
                  <td className="px-4 py-3 text-ink-soft">{PAYOUT_METHODS.find((m) => m.id === w.payoutMethod)?.label ?? w.payoutMethod}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[w.status]}>{STATUS_LABEL[w.status]}</Badge>
                    {w.status === "rejected" && w.adminNote && <div className="mt-1 text-xs text-ink-faint">{w.adminNote}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
