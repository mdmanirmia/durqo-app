"use client";

import { useState, useTransition } from "react";
import { StatusBadge } from "@/components/ui/Badge";
import { fmtUSD } from "@/lib/format";
import { setOrderStatus, setOrderPaymentChannel } from "../actions";
import OrderAmountBreakdown from "@/components/OrderAmountBreakdown";

export interface AdminOrderRow {
  id: string;
  listingTitle: string;
  buyerName: string;
  sellerName: string;
  amount: number;
  status: string;
  paymentChannel: string;
  createdAt: string;
  // Payment breakdown (Sep 2026) — see OrderAmountBreakdown.tsx.
  onlineChargeUsd: number | undefined;
  remainderUsd: number | undefined;
  sslcommerzBdtAmount: number | undefined;
  sslcommerzRate: number | undefined;
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
// "Escrow.com" (Sep 10, 2026) is different from all of the above: it's set
// automatically by /api/escrow/init, not picked by hand, for an order that
// actually went through the real Escrow.com API integration — kept as a
// selectable option here too so admin can still correct it by hand if ever
// needed, same as every other channel.
const PAYMENT_CHANNELS = ["stripe", "durqo_platform", "bangladesh_gateway", "escrow", "escrow_com"] as const;

const PAYMENT_CHANNEL_LABEL: Record<string, string> = {
  stripe: "In Stripe",
  durqo_platform: "In Durqo Platform",
  bangladesh_gateway: "In Bangladesh Payment Gateway",
  escrow: "In Escrow",
  escrow_com: "Escrow.com",
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
    <>
      {/* Desktop: unchanged table, horizontal-scroll fallback only. */}
      <div className="hidden overflow-x-auto rounded-xl border border-rule md:block">
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
                  <td className="px-4 py-3">
                    <span className="mono">{fmtUSD(o.amount)}</span>
                    <OrderAmountBreakdown
                      paymentChannel={o.paymentChannel}
                      onlineChargeUsd={o.onlineChargeUsd}
                      remainderUsd={o.remainderUsd}
                      sslcommerzBdtAmount={o.sslcommerzBdtAmount}
                      sslcommerzRate={o.sslcommerzRate}
                      orderStatus={o.status}
                    />
                  </td>
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

      {/* Mobile: same data as a stacked card list. */}
      <div className="grid gap-3 md:hidden">
        {rows.map((o) => {
          const busy = isPending && pendingId === o.id;
          const channelBusy = isChannelPending && pendingChannelId === o.id;
          return (
            <div key={o.id} className="min-w-0 rounded-xl border border-rule bg-paper-raised p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium text-ink">{o.listingTitle}</div>
                  <div className="text-xs text-ink-faint">
                    Buyer: {o.buyerName} &middot; Seller: {o.sellerName}
                  </div>
                </div>
                <span className="mono shrink-0 text-xs text-ink-faint">{o.createdAt}</span>
              </div>
              <div className="mb-3">
                <span className="mono text-sm font-semibold">{fmtUSD(o.amount)}</span>
                <OrderAmountBreakdown
                  paymentChannel={o.paymentChannel}
                  onlineChargeUsd={o.onlineChargeUsd}
                  remainderUsd={o.remainderUsd}
                  sslcommerzBdtAmount={o.sslcommerzBdtAmount}
                  sslcommerzRate={o.sslcommerzRate}
                  orderStatus={o.status}
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-xs text-ink-faint">Status</label>
                <StatusBadge status={o.status} className="mb-1.5" />
                <select
                  value={o.status}
                  disabled={busy}
                  onChange={(e) => changeStatus(o.id, e.target.value)}
                  className="mono block w-full rounded-md border border-rule-strong bg-paper px-2 py-1.5 text-xs disabled:opacity-60"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
                {errorId === o.id && <div className="mt-1 text-xs text-red-600">Couldn&rsquo;t update — try again.</div>}
              </div>
              <div>
                <label className="mb-1 block text-xs text-ink-faint">Payment Channel</label>
                <select
                  value={o.paymentChannel}
                  disabled={channelBusy}
                  onChange={(e) => changeChannel(o.id, e.target.value)}
                  className="mono block w-full rounded-md border border-rule-strong bg-paper px-2 py-1.5 text-xs disabled:opacity-60"
                >
                  {PAYMENT_CHANNELS.map((c) => (
                    <option key={c} value={c}>{PAYMENT_CHANNEL_LABEL[c]}</option>
                  ))}
                </select>
                {errorChannelId === o.id && <div className="mt-1 text-xs text-red-600">Couldn&rsquo;t update — try again.</div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
