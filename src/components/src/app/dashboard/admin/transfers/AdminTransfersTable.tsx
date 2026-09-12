"use client";

import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { fmtUSD } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

export interface AdminTransferRow {
  roomId: string;
  orderId: string;
  listingTitle: string;
  buyerName: string;
  sellerName: string;
  amount: number;
  stage: string;
  openIssueCount: number;
  itemTotal: number;
  itemAccepted: number;
  updatedAt: string;
}

const STAGE_LABEL: Record<string, { label: string; tone: "neutral" | "brand" | "gold" | "danger" | "dark" }> = {
  order_created: { label: "Order Created", tone: "neutral" },
  room_locked_awaiting_payment: { label: "Awaiting Payment", tone: "gold" },
  room_unlocked: { label: "Unlocked", tone: "brand" },
  seller_transferring: { label: "Transferring", tone: "brand" },
  awaiting_buyer_receipt: { label: "Awaiting Receipt", tone: "gold" },
  inspection_active: { label: "Inspecting", tone: "gold" },
  admin_review: { label: "Needs Review", tone: "danger" },
  payout_eligible: { label: "Approved", tone: "dark" },
  resolved_refund: { label: "Refunded", tone: "dark" },
  resolved_settlement: { label: "Settled", tone: "dark" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

function StageBadge({ stage }: { stage: string }) {
  const entry = STAGE_LABEL[stage] ?? { label: stage, tone: "neutral" as const };
  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}

export default function AdminTransfersTable({ rows }: { rows: AdminTransferRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-faint">No transfers match this filter.</p>;
  }

  return (
    <>
      {/* Desktop: unchanged table, horizontal-scroll fallback only. */}
      <div className="hidden overflow-x-auto rounded-xl border border-rule md:block">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
              <th className="px-4 py-3 font-medium">Listing</th>
              <th className="px-4 py-3 font-medium">Buyer / Seller</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Assets</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.roomId} className="border-b border-rule align-top last:border-b-0">
                <td className="px-4 py-3 font-medium text-ink">{r.listingTitle}</td>
                <td className="px-4 py-3 text-ink-soft">
                  <div>{r.buyerName}</div>
                  <div className="text-xs text-ink-faint">sold by {r.sellerName}</div>
                </td>
                <td className="mono px-4 py-3">{fmtUSD(r.amount)}</td>
                <td className="mono px-4 py-3 text-ink-soft">{r.itemAccepted}/{r.itemTotal} accepted</td>
                <td className="px-4 py-3">
                  <StageBadge stage={r.stage} />
                  {r.openIssueCount > 0 && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-danger">
                      <AlertTriangle size={12} /> {r.openIssueCount} open issue{r.openIssueCount === 1 ? "" : "s"}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-faint">{r.updatedAt}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/dashboard/admin/transfers/${r.roomId}`} className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-brand-strong">
                    Review <ChevronRight size={13} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: same data as a stacked card list. */}
      <div className="grid gap-3 md:hidden">
        {rows.map((r) => (
          <Link
            key={r.roomId}
            href={`/dashboard/admin/transfers/${r.roomId}`}
            className="min-w-0 rounded-xl border border-rule bg-paper-raised p-4"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0 truncate font-medium text-ink">{r.listingTitle}</div>
              <StageBadge stage={r.stage} />
            </div>
            <div className="mb-2 text-xs text-ink-faint">
              {r.buyerName} · sold by {r.sellerName}
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="mono font-semibold">{fmtUSD(r.amount)}</span>
              <span className="mono text-xs text-ink-faint">{r.itemAccepted}/{r.itemTotal} accepted</span>
            </div>
            {r.openIssueCount > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-danger">
                <AlertTriangle size={12} /> {r.openIssueCount} open issue{r.openIssueCount === 1 ? "" : "s"}
              </div>
            )}
            <div className="mt-2 text-xs text-ink-faint">Updated {r.updatedAt}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
