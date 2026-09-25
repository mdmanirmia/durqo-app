"use client";

import { useEffect, useState } from "react";
import { Landmark, Wallet, Info } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import PayoutMethodIcon from "@/components/ui/PayoutMethodIcon";
import EmptyState from "@/components/ui/EmptyState";
import { SELLER_NAV } from "@/lib/dashboard-nav";
import { fmtUSD, fmtUSD2, fmtBDTWhole } from "@/lib/format";
import { fmtRate } from "@/lib/fees";
import { estimatePayoutProcessingDate, fmtPayoutEta } from "@/lib/payout-eta";
import {
  getAvailableBalance,
  getMyWithdrawals,
  getMyPayoutVerified,
  cancelWithdrawal,
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
  // accountName added to PayPal/Wise (KYC policy, Sep 2026) — every method
  // now has one, so buildAccountHolderName() below can read the same key
  // regardless of which method is selected. Previously PayPal/Wise never
  // asked for a name at all, which also meant Durqo had no way to check
  // whose account a payout was actually going to for these two methods.
  paypal: [
    { key: "email", label: "PayPal Email", placeholder: "you@example.com" },
    { key: "accountName", label: "Account Holder Name", placeholder: "Name on the PayPal account" },
  ],
  wise: [
    { key: "email", label: "Wise Email", placeholder: "you@example.com" },
    { key: "accountName", label: "Account Holder Name", placeholder: "Name on the Wise account" },
    { key: "details", label: "Additional Account Details", placeholder: "Any extra details Wise needs", optional: true },
  ],
};

// Daily MFS cap in BDT (031_withdrawal_mfs_partial_claim.sql) — the USD
// equivalent shown below is 50000 / today's withdrawal rate.
const MFS_DAILY_CAP_BDT = 50000;

// 2026-09-13 payout-policy v2: expanded from the original 4-value model
// (pending/approved/rejected/paid) to the 9-value model the owner
// specified — see 045_payout_policy_v2.sql and payout-eta.ts.
const STATUS_LABEL: Record<WithdrawalStatus, string> = {
  requested: "Requested",
  under_review: "Under review",
  action_required: "Action required",
  approved: "Approved",
  processing: "Processing",
  paid: "Paid",
  on_hold: "On hold",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<WithdrawalStatus, "gold" | "brand" | "danger" | "dark"> = {
  requested: "gold",
  under_review: "gold",
  action_required: "danger",
  approved: "brand",
  processing: "brand",
  paid: "dark",
  on_hold: "danger",
  rejected: "danger",
  cancelled: "dark",
};

// A seller can only cancel it themselves this early — matches
// cancel_withdrawal_request()'s own check (045_payout_policy_v2.sql).
const SELF_CANCELLABLE_STATUSES: ReadonlySet<WithdrawalStatus> = new Set(["requested", "under_review"]);

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
  const [payoutVerified, setPayoutVerified] = useState<boolean | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  // Today's bKash/Rocket/Nagad withdrawal rate (market rate minus the
  // ৳1.50 withdrawal margin — getUsdToBdtWithdrawalRate() in
  // src/lib/currency.ts, via the getMfsWithdrawalRate() action since that
  // module is server-only). Fetched once up front — it doesn't depend on
  // which payout method is selected, only used when one of the three is.
  const [mfsRate, setMfsRate] = useState<number | null>(null);

  function reload() {
    getAvailableBalance().then(setBalance);
    getMyWithdrawals().then(setWithdrawals);
    getMyPayoutVerified().then(setPayoutVerified);
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
    getMyPayoutVerified().then((v) => {
      if (!cancelled) setPayoutVerified(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCancel(id: string) {
    setCancellingId(id);
    try {
      const result = await cancelWithdrawal(id);
      if (!result.ok) {
        setError(result.message);
      } else {
        setNotice("Withdrawal request cancelled - the related orders are available in your balance again.");
        reload();
      }
    } finally {
      setCancellingId(null);
    }
  }

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
  // KYC policy (Sep 2026): every method's fields now include "accountName"
  // (see METHOD_FIELDS above), extracted here so it can be sent to
  // create_withdrawal_request() as its own column
  // (withdrawal_requests.payout_account_holder_name) rather than only
  // living inside the combined payoutDetails string — that's what lets an
  // admin see it next to the seller's verified legal_name without parsing
  // free text.
  function buildAccountHolderName(): string {
    return fieldValue("accountName").trim();
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
      const result = await requestWithdrawal(methodId, buildPayoutDetails(), buildAccountHolderName());
      // requestWithdrawal() returns { ok: false, message } for every
      // expected failure (bad input, no session, or one of
      // create_withdrawal_request()'s own validation messages — e.g. the
      // bKash/Rocket/Nagad daily/monthly cap) rather than throwing, so its
      // real message always reaches the seller here instead of the
      // generic "Minified React error #441" digest text a thrown Server
      // Action error gets redacted to in production (see the comment on
      // RequestWithdrawalResult in ./actions.ts).
      if (!result.ok) {
        setError(result.message);
        return;
      }
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
          ? `Your payout request for ${fmtUSD(result.netAmount)} has been submitted. We normally review and process eligible payout requests within 3–5 business days.`
          : "Your payout request has been submitted. We normally review and process eligible payout requests within 3–5 business days."
      );
      reload();
    } catch {
      setError("Something went wrong - please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const hasBalance = !!balance && balance.netAmount > 0;

  return (
    <DashboardShell title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <h2 className="mb-2 text-xl">Earnings &amp; Withdrawals</h2>
      <p className="mb-6 max-w-[65ch] text-sm text-ink-soft">
        Your available balance is what&rsquo;s left of your completed orders after any previous withdrawal requests, minus Durqo&rsquo;s Success Fee.
      </p>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          <div className="text-sm text-ink-faint">Success Fee ({balance === null || balance.orderCount === 0 ? "-" : fmtRate(balance.successFeeAmount / balance.grossAmount)})</div>
        </div>
      </div>

      {balance !== null && balance.escrowComOrderCount > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold-soft px-5 py-4">
          <Info size={18} className="mt-0.5 shrink-0 text-gold" />
          <p className="text-sm text-ink-soft">
            {balance.escrowComOrderCount} of your {balance.orderCount} available order{balance.orderCount === 1 ? "" : "s"} went through Escrow.com.
            Seller payment is being handled by the escrow provider and is subject to the provider&rsquo;s processing timeline - Escrow.com pays you
            directly once it releases funds, so double-check what it has already paid you before requesting a Durqo withdrawal that covers it.
          </p>
        </div>
      )}

      {payoutVerified === false && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold-soft px-5 py-4">
          <Info size={18} className="mt-0.5 shrink-0 text-gold" />
          <p className="text-sm text-ink-soft">
            Identity verification (KYC) is required before your first withdrawal - this is separate from the optional public Verified badge. Submit your
            identity documents from the{" "}
            <a href="/dashboard/seller/verification" className="font-semibold text-brand-strong hover:underline">
              Verification page
            </a>{" "}
            and our team will review them.
          </p>
        </div>
      )}

      {hasBalance && (
        <p className="mb-4 max-w-[65ch] text-xs text-ink-faint">
          The account holder name you enter below must match the legal name on your identity verification - our team checks this before approving a
          payout.
        </p>
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
                  onClick={() => {
                    // Switching methods used to leave a stale error/notice
                    // from a previous submit attempt on screen — e.g. a
                    // seller who tried Rocket, hit a rejection, then
                    // switched to bKash would still see Rocket's old error
                    // message sitting there, looking like it applied to
                    // the newly-selected method (site owner, Sep 11 2026:
                    // reported confusion from exactly this). Clearing both
                    // on every method switch keeps the messages scoped to
                    // whichever method was actually just submitted.
                    setMethodId(m.id);
                    setError(null);
                    setNotice(null);
                  }}
                  className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium ${
                    methodId === m.id ? "border-brand-strong bg-brand-soft text-brand-strong" : "border-rule-strong text-ink-soft hover:border-brand-strong"
                  }`}
                >
                  <PayoutMethodIcon method={m.id} size={13} />
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
            {/* Fixed 1-col (mobile) / 2-col (sm+) grid, capped at max-w-xl —
                the previous grid-cols-[repeat(auto-fit,minmax(200px,1fr))]
                let CSS Grid create as many ~200px tracks as the now-wide
                card allowed, then auto-fit stretched each filled track
                with 1fr to fill the leftover space, spreading Bank
                Transfer's 4 fields out unevenly with a large gap around
                the isolated Routing/SWIFT field on wide screens (site
                owner, Sep 11 2026 screenshot). A fixed 2-column grid with
                a capped width keeps every field a sane, consistent size
                regardless of how wide the card itself is. */}
            <div className="mb-4 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
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

            <div className="mb-4 rounded-lg border border-rule bg-paper-sunk px-4 py-3">
              <p className="text-xs font-semibold text-ink">Processing time: Normally 3–5 business days</p>
              <p className="mt-1 text-xs text-ink-faint">Your bank or payout provider may require additional time to credit the funds.</p>
            </div>

            {error && <p className="mb-3 text-sm text-danger">{error}</p>}
            {notice && <p className="mb-3 text-sm text-brand-strong">{notice}</p>}

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || (isMfs && mfsRate === null) || payoutVerified === false}
            >
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
        <EmptyState icon={Landmark} title="No withdrawal requests yet" body="Once you request a payout above, it'll show up here." />
      ) : (
        <>
          {/* Desktop: unchanged table, horizontal-scroll fallback only. */}
          <div className="hidden overflow-x-auto rounded-xl border border-rule md:block">
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
                  <th className="px-4 py-3 font-medium">Processing</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => {
                  const eta = estimatePayoutProcessingDate(new Date(w.requestedAtRaw), w.status);
                  return (
                  <tr key={w.id} className="border-b border-rule align-top last:border-b-0">
                    <td className="mono px-4 py-3 text-ink-soft">{w.requestedAt}</td>
                    <td className="mono px-4 py-3">{w.orderCount}</td>
                    <td className="mono px-4 py-3">{fmtUSD(w.grossAmount)}</td>
                    <td className="mono px-4 py-3 text-ink-faint">-{fmtUSD(w.successFeeAmount)}</td>
                    <td className="mono px-4 py-3 font-semibold">{fmtUSD(w.netAmount)}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      <div className="flex items-center gap-1.5">
                        <PayoutMethodIcon method={w.payoutMethod} size={12} />
                        {PAYOUT_METHODS.find((m) => m.id === w.payoutMethod)?.label ?? w.payoutMethod}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[w.status]}>{STATUS_LABEL[w.status]}</Badge>
                      {(w.status === "rejected" || w.status === "action_required" || w.status === "on_hold") && w.adminNote && (
                        <div className="mt-1 max-w-[200px] text-xs text-ink-faint">{w.adminNote}</div>
                      )}
                      {w.status === "paid" && w.payoutReference && (
                        <div className="mt-1 text-xs text-ink-faint">Ref: {w.payoutReference}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-faint">{fmtPayoutEta(eta)}</td>
                    <td className="px-4 py-3">
                      {SELF_CANCELLABLE_STATUSES.has(w.status) && (
                        <button
                          onClick={() => handleCancel(w.id)}
                          disabled={cancellingId === w.id}
                          className="rounded-md border border-rule-strong px-2.5 py-1 text-xs font-medium text-ink-soft hover:border-danger/40 hover:text-danger disabled:opacity-60"
                        >
                          {cancellingId === w.id ? "Cancelling…" : "Cancel"}
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: same data as a stacked card list — date + status pill up
              top, then a 2-column key:value grid beneath (site owner, Sep 11
              2026 screenshots: this table was cut off on phones). */}
          <div className="grid gap-3 md:hidden">
            {withdrawals.map((w) => {
              const eta = estimatePayoutProcessingDate(new Date(w.requestedAtRaw), w.status);
              return (
              <div key={w.id} className="min-w-0 rounded-xl border border-rule bg-paper-raised p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="mono text-sm text-ink-soft">{w.requestedAt}</span>
                  <Badge tone={STATUS_TONE[w.status]}>{STATUS_LABEL[w.status]}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <div className="text-xs text-ink-faint">Orders</div>
                    <div className="mono">{w.orderCount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink-faint">Method</div>
                    <div className="flex items-center gap-1.5 text-ink-soft">
                      <PayoutMethodIcon method={w.payoutMethod} size={12} />
                      {PAYOUT_METHODS.find((m) => m.id === w.payoutMethod)?.label ?? w.payoutMethod}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-ink-faint">Gross</div>
                    <div className="mono">{fmtUSD(w.grossAmount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink-faint">Fee</div>
                    <div className="mono text-ink-faint">-{fmtUSD(w.successFeeAmount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink-faint">Net</div>
                    <div className="mono font-semibold">{fmtUSD(w.netAmount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink-faint">Processing</div>
                    <div className="text-ink-soft">{fmtPayoutEta(eta)}</div>
                  </div>
                </div>
                {(w.status === "rejected" || w.status === "action_required" || w.status === "on_hold") && w.adminNote && (
                  <div className="mt-3 border-t border-rule pt-2 text-xs text-ink-faint">{w.adminNote}</div>
                )}
                {w.status === "paid" && w.payoutReference && (
                  <div className="mt-3 border-t border-rule pt-2 text-xs text-ink-faint">Ref: {w.payoutReference}</div>
                )}
                {SELF_CANCELLABLE_STATUSES.has(w.status) && (
                  <button
                    onClick={() => handleCancel(w.id)}
                    disabled={cancellingId === w.id}
                    className="mt-3 w-full rounded-md border border-rule-strong px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:border-danger/40 hover:text-danger disabled:opacity-60"
                  >
                    {cancellingId === w.id ? "Cancelling…" : "Cancel request"}
                  </button>
                )}
              </div>
              );
            })}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
