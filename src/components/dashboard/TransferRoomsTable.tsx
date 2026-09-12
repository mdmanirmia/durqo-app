"use client";

import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { fmtUSD } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

// Shared buyer/seller "Asset Transfers" list — the same row shape and
// stage-badge mapping as AdminTransfersTable.tsx (admin's own version of
// this table, at /dashboard/admin/transfers), minus the admin-only fields
// (open issue count as a standalone column, item accept counts) that don't
// mean much to either party of the transfer itself. Links to the existing
// per-order Transfer Room at /dashboard/transfer/{orderId} — the same page
// each row's "Open" already exists at, not a new route.
export interface TransferRoomRow {
  roomId: string;
  orderId: string;
  listingTitle: string;
  // The OTHER party's name — the seller's name on the buyer's list, the
  // buyer's name on the seller's list. Never both; a viewer only needs to
  // know who they're transacting with, not re-see their own name.
  counterpartyName: string;
  amount: number;
  stage: string;
  openIssueCount: number;
  updatedAt: string;
}

const STAGE_LABEL: Record<string, { label: string; tone: "neutral" | "brand" | "gold" | "danger" | "dark" }> = {
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

export default function TransferRoomsTable({
  rows,
  viewerSide,
}: {
  rows: TransferRoomRow[];
  viewerSide: "buyer" | "seller";
}) {
  const counterpartyLabel = viewerSide === "buyer" ? "Seller" : "Buyer";

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-rule bg-paper-raised p-5 text-sm text-ink-faint">
        {viewerSide === "buyer"
          ? "No Transfer Rooms yet — they open automatically once you complete a purchase."
          : "No Transfer Rooms yet — they open automatically once one of your listings sells."}
      </p>
    );
  }

  return (
    <>
      {/* Desktop: unchanged table, horizontal-scroll fallback only. */}
      <div className="hidden overflow-x-auto rounded-xl border border-rule md:block">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
              <th className="px-4 py-3 font-medium">Listing</th>
              <th className="px-4 py-3 font-medium">{counterpartyLabel}</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.roomId} className="border-b border-rule align-top last:border-b-0">
                <td className="px-4 py-3 font-medium text-ink">{r.listingTitle}</td>
                <td className="px-4 py-3 text-ink-soft">{r.counterpartyName}</td>
                <td className="mono px-4 py-3">{fmtUSD(r.amount)}</td>
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
                  <Link href={`/dashboard/transfer/${r.orderId}`} className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-brand-strong">
                    Open <ChevronRight size={13} />
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
          <Link key={r.roomId} href={`/dashboard/transfer/${r.orderId}`} className="min-w-0 rounded-xl border border-rule bg-paper-raised p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0 truncate font-medium text-ink">{r.listingTitle}</div>
              <StageBadge stage={r.stage} />
            </div>
            <div className="mb-2 text-xs text-ink-faint">
              {counterpartyLabel}: {r.counterpartyName}
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="mono font-semibold">{fmtUSD(r.amount)}</span>
              <span className="text-xs text-ink-faint">Updated {r.updatedAt}</span>
            </div>
            {r.openIssueCount > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-danger">
                <AlertTriangle size={12} /> {r.openIssueCount} open issue{r.openIssueCount === 1 ? "" : "s"}
              </div>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
