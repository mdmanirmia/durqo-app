"use client";

import { useState, useTransition } from "react";
import { fmtUSD } from "@/lib/format";
import { setOrderStatus } from "../actions";

export interface AdminOrderRow {
  id: string;
  listingTitle: string;
  buyerName: string;
  sellerName: string;
  amount: number;
  status: string;
  createdAt: string;
}

const STATUSES = ["requested", "awaiting_payment", "in_escrow", "completed", "cancelled"] as const;

const STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  awaiting_payment: "Awaiting payment",
  in_escrow: "In escrow",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<string, string> = {
  requested: "bg-paper-raised text-ink-faint",
  awaiting_payment: "bg-amber-100 text-amber-800",
  in_escrow: "bg-blue-100 text-blue-800",
  completed: "bg-brand-soft text-brand-strong",
  cancelled: "bg-red-100 text-red-700",
};

// Status here is a manual admin override of the tracking label only — it
// does not touch Stripe or move any money. A real refund for a cancelled
// order still has to be issued separately from the Stripe dashboard; see
// setOrderStatus() in ../actions.ts.
export default function AdminOrdersTable({ rows }: { rows: AdminOrderRow[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function changeStatus(id: string, status: string) {
    setPendingId(id);
    setErrorId(null);
    startTransition(async () => {
      try {
        await setOrderStatus(id, status as never);
      } catch {
        setErrorId(id);
      } finally {
        setPendingId(null);
      }
    });
  }

  if (rows.length === 0) {
    return <p className="text-sm text-ink-faint">No orders yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-rule">
      <table className="w-full min-w-[780px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
            <th className="px-4 py-3 font-medium">Listing</th>
            <th className="px-4 py-3 font-medium">Buyer</th>
            <th className="px-4 py-3 font-medium">Seller</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => {
            const busy = isPending && pendingId === o.id;
            return (
              <tr key={o.id} className="border-b border-rule align-top last:border-b-0">
                <td className="px-4 py-3 font-medium text-ink">{o.listingTitle}</td>
                <td className="px-4 py-3 text-ink-soft">{o.buyerName}</td>
                <td className="px-4 py-3 text-ink-soft">{o.sellerName}</td>
                <td className="mono px-4 py-3">{fmtUSD(o.amount)}</td>
                <td className="px-4 py-3">
                  <span className={`mb-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[o.status] ?? "bg-paper-raised text-ink-faint"}`}>
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                  <select
                    value={o.status}
                    disabled={busy}
                    onChange={(e) => changeStatus(o.id, e.target.value)}
                    className="mono block rounded-md border border-rule-strong bg-paper px-2 py-1 text-xs disabled:opacity-60"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                  {errorId === o.id && <div className="mt-1 text-xs text-red-600">Couldn&rsquo;t update — try again.</div>}
                </td>
                <td className="mono px-4 py-3 text-ink-faint">{o.createdAt}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
