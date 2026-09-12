"use client";

import { useState, useTransition } from "react";
import { StatusBadge } from "@/components/ui/Badge";
import { fmtUSD } from "@/lib/format";
import { setOrderStatus, setOrderPaymentChannel, startAssetTransfer } from "../actions";
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
  // Asset Transfer System v2 — whether a Transfer Room already exists for
  // this order. Drives the "Start Asset Transfer" button below: shown only
  // when payment has landed (in_escrow/in_durqo) and no room exists yet —
  // which, since 2026-09-12, is the normal state for a SSLCommerz order
  // with money still owed (remainder_usd > 0), held back on purpose until
  // the site owner has collected the rest by hand. It's also a manual
  // recovery path for any order whose webhook-triggered auto-create ever
  // failed silently.
  hasTransferRoom: boolean;
}

const STATUSES = ["requested", "awaiting_payment", "in_escrow", "in_durqo", "completed", "cancelled"] as const;

// Display labels only — the underlying status values are unchanged in the
// database; these are just friendlier wording for the same lifecycle:
// buyer hasn't paid yet -> paid (held by Escrow.com, or sitting with Durqo
// directly) -> released to the seller. Since 2026-09-12, "in_escrow" is
// used only for orders actually paid through Escrow.com; every other paid
// order (Stripe, SSLCommerz, Pay Later) uses "in_durqo" instead, since that
// money isn't held by any neutral third party.
const STATUS_LABEL: Record<string, string> = {
  requested: "Payment Requested",
  awaiting_payment: "Awaiting Payment",
  in_escrow: "Held by Escrow.com",
  in_durqo: "Payment Received (Durqo)",
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

  const [pendingTransferId, setPendingTransferId] = useState<string | null>(null);
  const [errorTransferId, setErrorTransferId] = useState<string | null>(null);
  const [startedTransferIds, setStartedTransferIds] = useState<string[]>([]);
  const [isTransferPending, startTransferTransition] = useTransition();

  function startTransfer(id: string) {
    setPendingTransferId(id);
    setErrorTransferId(null);
    startTransferTransition(async () => {
      try {
        await startAssetTransfer(id);
        setStartedTransferIds((prev) => [...prev, id]);
      } catch {
        setErrorTransferId(id);
      } finally {
        setPendingTransferId(null);
      }
    });
  }

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
              <th className="px-4 py-3 font-medium">Asset Transfer</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const busy = isPending && pendingId === o.id;
              const channelBusy = isChannelPending && pendingChannelId === o.id;
              const transferBusy = isTransferPending && pendingTransferId === o.id;
              const hasRoom = o.hasTransferRoom || startedTransferIds.includes(o.id);
              const paymentLanded = o.status === "in_escrow" || o.status === "in_durqo";
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
                  <td className="px-4 py-3">
                    {hasRoom ? (
                      <span className="text-xs text-ink-faint">Room open</span>
                    ) : paymentLanded ? (
                      <>
                        <button
                          type="button"
                          disabled={transferBusy}
                          onClick={() => startTransfer(o.id)}
                          className="rounded-md border border-rule-strong bg-transparent px-2 py-1 text-xs font-medium text-ink hover:bg-paper-raised disabled:opacity-60"
                        >
                          {transferBusy ? "Starting…" : "Start Asset Transfer"}
                        </button>
                        {errorTransferId === o.id && <div className="mt-1 text-xs text-red-600">Couldn&rsquo;t start — try again.</div>}
                      </>
                    ) : (
                      <span className="text-xs text-ink-faint">—</span>
                    )}
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
          const transferBusy = isTransferPending && pendingTransferId === o.id;
          const hasRoom = o.hasTransferRoom || startedTransferIds.includes(o.id);
          const paymentLanded = o.status === "in_escrow" || o.status === "in_durqo";
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
              {(hasRoom || paymentLanded) && (
                <div className="mt-3">
                  <label className="mb-1 block text-xs text-ink-faint">Asset Transfer</label>
                  {hasRoom ? (
                    <span className="text-xs text-ink-faint">Room open</span>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={transferBusy}
                        onClick={() => startTransfer(o.id)}
                        className="mono block w-full rounded-md border border-rule-strong bg-transparent px-2 py-1.5 text-xs font-medium text-ink disabled:opacity-60"
                      >
                        {transferBusy ? "Starting…" : "Start Asset Transfer"}
                      </button>
                      {errorTransferId === o.id && <div className="mt-1 text-xs text-red-600">Couldn&rsquo;t start — try again.</div>}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
