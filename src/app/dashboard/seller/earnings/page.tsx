"use client";

import { useEffect, useState } from "react";
import { Landmark, Wallet, Info } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SELLER_NAV } from "@/lib/dashboard-nav";
import { fmtUSD } from "@/lib/format";
import { fmtRate } from "@/lib/fees";
import {
  getAvailableBalance,
  getMyWithdrawals,
  type AvailableBalance,
  type WithdrawalRow,
  type WithdrawalStatus,
} from "@/lib/data/earnings.client";
import { requestWithdrawal } from "./actions";

const PAYOUT_METHODS = [
  { id: "bank_transfer", label: "Bank Transfer" },
  { id: "bkash", label: "bKash" },
  { id: "rocket", label: "Rocket" },
  { id: "nagad", label: "Nagad" },
  { id: "paypal", label: "PayPal" },
  { id: "wise", label: "Wise" },
] as const;

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
  const [methodId, setMethodId] = useState<(typeof PAYOUT_METHODS)[number]["id"]>("bank_transfer");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit() {
    if (!details.trim()) return setError("Enter where the payout should go.");
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await requestWithdrawal(methodId, details);
      setDetails("");
      setNotice("Withdrawal request submitted — we'll email you once it's reviewed.");
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

      <div className="mb-10 max-w-md rounded-xl border border-rule bg-paper-raised p-5">
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

            <p className="mono mb-2 text-[0.68rem] uppercase tracking-wide text-ink-faint">Payout details</p>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={
                methodId === "bank_transfer"
                  ? "Bank name, account name, account number, routing/SWIFT"
                  : methodId === "bkash"
                  ? "bKash number (Personal/Agent) and account holder name"
                  : methodId === "rocket"
                  ? "Rocket number and account holder name"
                  : methodId === "nagad"
                  ? "Nagad number and account holder name"
                  : methodId === "paypal"
                  ? "PayPal email address"
                  : "Wise email address or account details"
              }
              rows={3}
              className="mb-4 w-full rounded-md border border-rule-strong bg-paper px-3 py-2 text-sm focus:border-brand-strong focus:outline-none"
            />

            {error && <p className="mb-3 text-sm text-danger">{error}</p>}
            {notice && <p className="mb-3 text-sm text-brand-strong">{notice}</p>}

            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : `Request ${fmtUSD(balance!.netAmount)}`}
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
