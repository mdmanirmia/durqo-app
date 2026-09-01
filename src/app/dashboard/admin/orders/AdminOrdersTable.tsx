"use client";

import { useState, useTransition } from "react";
import { StatusBadge } from "@/components/ui/Badge";
import { fmtUSD } from "@/lib/format";
import { setOrderStatus, setOrderPaymentChannel } from "../actions";

export interface AdminOrderRow {
  id: string;
  listingTitle: string;
  buyerName: string;
  sellerName: string;
  amount: number;
  status: string;
  paymentChannel: string;
  createdAt: string;
}

const STATUSES = ["requested", "awaiting_payment", "in_escrow", "completed", "cancelled"] as const;

// Display labels only — the underlying status values (requested,
// awaiting_payment, in_escrow, completed, cancelled) are unchanged in the
// database; these are just friendlier wording for the same lifecycle:
// buyer hasn't paid yet -> paid and held in escrow -> released to the
// seller.
const STATUS_LABEL: Record<string, string> = {
  requested: "Payment Requested",
  awaiting_payment: "Awaiting Payment",
  in_escrow: "Payment Received from Buyer",
  completed: "Payment Released to Seller",
  cancelled: "Payment Cancelled",
};

// Which rail the order was actually paid through — a manual admin-set
// label (migration 009 + 010, payment_channel column), same "tracking
// only" spirit as status above. "In Bangladesh Payment Gateway" doesn't
// mean a gateway is actually wired up yet — it's just a bucket admin can
// pick for a sale settled that way outside Stripe. "In Escrow" is for a
// payment currently held (not yet released) rather than a rail of its own.
const PAYMENT_CHANNELS = ["stripe", "durqo_platform", "bangladesh_gateway", "escrow"] as const;

const PAYMENT_CHANNEL_LABEL: Record<string, string> = {
  stripe: "In Stripe",
  durqo_platform: "In Durqo Platform",
  bangladesh_gateway: "In Bangladesh Payment Gateway",
  escrow: "In Escrow",
};

// Status here is a manual admin override of the tracking label only — it
// does not touch Stripe or move any money. A real refund for a cancelled
// order still has to be issued separately from the Stripe dashboard; see
// setOrderStatus() in ../actions.ts.
export default function AdminOrdersTable({ rows }: { rows: AdminOrderRow[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [pendingChannelId, setPendingChannelId] = useState<string | null>(null);
  const [errorChannelId, setErrorChannelId] = useState<string | null>(null);
  const [isChannelPending, startChannelTransition] = useTransition();

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

  function changeChannel(id: string, channel: string) {
    setPendingChannelId(id);
    setErrorChannelId(null);
    startChannelTransition(async () => {
      try {
        await setOrderPaymentChannel(id, channel as never);
      } catch {
        setErrorChannelId(id);
      } finally {
        setPendingChannelId(null);
      }
    });
  }

  if (rows.length === 0) {
    return <p className="text-sm text-ink-faint">No orders yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-rule">
      <table className="w-full min-w-[780px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
            <th className="px-4 py-3 font-medium">Listing</th>
            <th className="px-4 py-3 font-medium">Buyer</th>
            <th className="px-4 py-3 font-medium">Seller</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Payment Channel</th>
            <th className="px-4 py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => {
            const busy = isPending && pendingId === o.id;
            const channelBusy = isChannelPending && pendingChannelId === o.id;
            return (
              <tr key={o.id} className="border-b border-rule align-top last:border-b-0">
                <td className="px-4 py-3 font-medium text-ink">{o.listingTitle}</td>
                <td className="px-4 py-3 text-ink-soft">{o.buyerName}</td>
                <td className="px-4 py-3 text-ink-soft">{o.sellerName}</td>
                <td className="mono px-4 py-3">{fmtUSD(o.amount)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} className="mb-1" />
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
                <td className="px-4 py-3">
                  <select
                    value={o.paymentChannel}
                    disabled={channelBusy}
                    onChange={(e) => changeChannel(o.id, e.target.value)}
                    className="mono block rounded-md border border-rule-strong bg-paper px-2 py-1 text-xs disabled:opacity-60"
                  >
                    {PAYMENT_CHANNELS.map((c) => (
                      <option key={c} value={c}>{PAYMENT_CHANNEL_LABEL[c]}</option>
                    ))}
                  </select>
                  {errorChannelId === o.id && <div className="mt-1 text-xs text-red-600">Couldn&rsquo;t update — try again.</div>}
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
