"use client";

import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { fmtUSD } from "@/lib/format";
import { setWithdrawalStatus } from "../actions";

export interface AdminWithdrawalRow {
  id: string;
  sellerName: string;
  sellerEmail: string | null;
  grossAmount: number;
  successFeeAmount: number;
  netAmount: number;
  orderCount: number;
  escrowComOrderCount: number;
  payoutMethod: string;
  payoutDetails: string;
  status: string;
  adminNote: string | null;
  requestedAt: string;
}

const METHOD_LABEL: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  bkash: "bKash",
  rocket: "Rocket",
  nagad: "Nagad",
  paypal: "PayPal",
  wise: "Wise",
  // Historical requests only — no longer offered to sellers.
  other: "Other",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "border border-gold/30 bg-gold-soft text-[#92730F]",
  approved: "border border-brand/30 bg-brand-soft text-brand-strong",
  paid: "border border-brand-strong/30 bg-brand-strong/10 text-brand-strong",
  rejected: "border border-danger/30 bg-danger-soft text-danger",
};

export default function AdminWithdrawalsTable({ rows }: { rows: AdminWithdrawalRow[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [noteByRow, setNoteByRow] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function decide(id: string, decision: "approved" | "rejected" | "paid") {
    setPendingId(id);
    setErrorId(null);
    startTransition(async () => {
      try {
        await setWithdrawalStatus(id, decision, noteByRow[id]);
      } catch {
        setErrorId(id);
      } finally {
        setPendingId(null);
      }
    });
  }

  if (rows.length === 0) {
    return <p className="text-sm text-ink-faint">No withdrawal requests yet.</p>;
  }

  return (
    <>
      {/* Desktop: unchanged table, horizontal-scroll fallback only. */}
      <div className="hidden overflow-x-auto rounded-xl border border-rule md:block">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
              <th className="px-4 py-3 font-medium">Seller</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Gross / Fee / Net</th>
              <th className="px-4 py-3 font-medium">Payout to</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Requested</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const busy = isPending && pendingId === r.id;
              return (
                <tr key={r.id} className="border-b border-rule align-top last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{r.sellerName}</div>
                    {r.sellerEmail && <div className="text-xs text-ink-faint">{r.sellerEmail}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="mono">{r.orderCount}</div>
                    {r.escrowComOrderCount > 0 && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-gold">
                        <AlertTriangle size={12} /> {r.escrowComOrderCount} via Escrow.com
                      </div>
                    )}
                  </td>
                  <td className="mono px-4 py-3">
                    <div>{fmtUSD(r.grossAmount)}</div>
                    <div className="text-xs text-ink-faint">-{fmtUSD(r.successFeeAmount)} fee</div>
                    <div className="font-semibold">{fmtUSD(r.netAmount)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-soft">{METHOD_LABEL[r.payoutMethod] ?? r.payoutMethod}</div>
                    <div className="max-w-[220px] whitespace-pre-wrap text-xs text-ink-faint">{r.payoutDetails}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[r.status] ?? "border border-rule bg-paper-sunk text-ink-soft"}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                    {r.adminNote && <div className="mt-1 max-w-[200px] text-xs text-ink-faint">{r.adminNote}</div>}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{r.requestedAt}</td>
                  <td className="px-4 py-3">
                    {r.status === "pending" && (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Note (optional)"
                          value={noteByRow[r.id] ?? ""}
                          onChange={(e) => setNoteByRow((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          className="w-40 rounded-md border border-rule-strong px-2 py-1 text-xs focus:border-brand-strong focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => decide(r.id, "approved")}
                            disabled={busy}
                            className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => decide(r.id, "rejected")}
                            disabled={busy}
                            className="rounded-md border border-rule-strong px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-danger/40 hover:text-danger disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                    {r.status === "approved" && (
                      <button
                        onClick={() => decide(r.id, "paid")}
                        disabled={busy}
                        className="rounded-md bg-brand-strong px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                      >
                        Mark Paid
                      </button>
                    )}
                    {errorId === r.id && <span className="mt-1 block text-xs text-danger">Failed — retry</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: same data as a stacked card list — matches the "Recent
          transactions" card style from the site owner's example-design
          mockup for this exact page. */}
      <div className="grid gap-3 md:hidden">
        {rows.map((r) => {
          const busy = isPending && pendingId === r.id;
          return (
            <div key={r.id} className="rounded-xl border border-rule bg-paper-raised p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium text-ink">{r.sellerName}</div>
                  {r.sellerEmail && <div className="truncate text-xs text-ink-faint">{r.sellerEmail}</div>}
                </div>
                <span
                  className={`shrink-0 inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${
                    STATUS_STYLE[r.status] ?? "border border-rule bg-paper-sunk text-ink-soft"
                  }`}
                >
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <div className="text-xs text-ink-faint">Orders</div>
                  <div className="mono">{r.orderCount}</div>
                  {r.escrowComOrderCount > 0 && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-gold">
                      <AlertTriangle size={12} /> {r.escrowComOrderCount} via Escrow.com
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-ink-faint">Requested</div>
                  <div className="text-ink-soft">{r.requestedAt}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-faint">Gross / Fee / Net</div>
                  <div className="mono">{fmtUSD(r.grossAmount)}</div>
                  <div className="mono text-xs text-ink-faint">-{fmtUSD(r.successFeeAmount)} fee</div>
                  <div className="mono font-semibold">{fmtUSD(r.netAmount)}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-faint">Payout to</div>
                  <div className="font-medium text-ink-soft">{METHOD_LABEL[r.payoutMethod] ?? r.payoutMethod}</div>
                  <div className="whitespace-pre-wrap text-xs text-ink-faint">{r.payoutDetails}</div>
                </div>
              </div>
              {r.adminNote && <div className="mb-3 text-xs text-ink-faint">{r.adminNote}</div>}
              <div className="border-t border-rule pt-3">
                {r.status === "pending" && (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Note (optional)"
                      value={noteByRow[r.id] ?? ""}
                      onChange={(e) => setNoteByRow((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      className="w-full rounded-md border border-rule-strong px-2 py-1.5 text-xs focus:border-brand-strong focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => decide(r.id, "approved")}
                        disabled={busy}
                        className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => decide(r.id, "rejected")}
                        disabled={busy}
                        className="rounded-md border border-rule-strong px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-danger/40 hover:text-danger disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
                {r.status === "approved" && (
                  <button
                    onClick={() => decide(r.id, "paid")}
                    disabled={busy}
                    className="rounded-md bg-brand-strong px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    Mark Paid
                  </button>
                )}
                {errorId === r.id && <span className="mt-1 block text-xs text-danger">Failed — retry</span>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
