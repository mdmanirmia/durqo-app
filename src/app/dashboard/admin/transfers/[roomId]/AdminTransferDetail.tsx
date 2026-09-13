"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { fmtUSD } from "@/lib/format";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { resolveTransferDispute } from "../../actions";

export interface AdminTransferDetailData {
  roomId: string;
  orderId: string;
  stage: string;
  listingTitle: string;
  buyerName: string;
  sellerName: string;
  amount: number;
  orderStatus: string;
  unlockedAt: string | null;
  inspectionDeadlineAt: string | null;
  payoutEligibleAt: string | null;
  items: {
    itemId: string;
    name: string;
    buyerReceives: string | null;
    transferMethod: string | null;
    note: string | null;
    status: string;
    sellerReference: string | null;
  }[];
  issues: {
    id: string;
    itemId: string | null;
    itemName: string | null;
    reporterName: string;
    category: string;
    explanation: string;
    status: string;
    resolution: string | null;
    resolutionType: string | null;
    resolvedAt: string | null;
    createdAt: string;
  }[];
  amendments: {
    id: string;
    itemId: string | null;
    itemName: string | null;
    field: string;
    originalValue: string | null;
    proposedValue: string;
    proposedByName: string;
    status: string;
    createdAt: string;
  }[];
  messages: { id: string; senderName: string; body: string; createdAt: string }[];
  events: { id: string; actorName: string; eventType: string; reason: string | null; createdAt: string }[];
  support: { terms: string | null; status: string; startDate: string | null } | null;
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

const RESOLUTION_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: "returned_to_seller", label: "Send back to seller", hint: "Reopens the flagged asset (or the whole room) for the seller to redo." },
  { value: "approved_despite_report", label: "Approve despite report", hint: "Sides with the seller — finishes the transfer as if the buyer had approved." },
  { value: "refund_authorized", label: "Refund authorized", hint: "Closes the transfer as refunded. Process the actual refund on the payment rail separately." },
  { value: "settlement_recorded", label: "Settlement recorded", hint: "Closes the transfer with a recorded settlement between the parties." },
  { value: "order_cancelled", label: "Order cancelled", hint: "Closes the transfer as cancelled. Update the order's own status separately if needed." },
];

const CATEGORY_LABEL: Record<string, string> = {
  not_received: "Never received this asset",
  not_working: "Doesn't work as described",
  incomplete: "Incomplete transfer",
  misrepresented: "Misrepresented on the listing",
  credentials_invalid: "Login/credentials don't work",
  other: "Other",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatEventType(type: string): string {
  return type.replace(/^admin_resolved_/, "admin resolved — ").replace(/_/g, " ");
}

export default function AdminTransferDetail({ data }: { data: AdminTransferDetailData }) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolutionType, setResolutionType] = useState<Record<string, string>>({});
  const [resolutionText, setResolutionText] = useState<Record<string, string>>({});

  const stageEntry = STAGE_LABEL[data.stage] ?? { label: data.stage, tone: "neutral" as const };
  const openIssues = data.issues.filter((i) => i.status !== "resolved");
  const canResolve = data.stage === "admin_review";

  function resolve(key: string, issueId: string | null) {
    const type = resolutionType[key];
    const text = (resolutionText[key] ?? "").trim();
    if (!type) {
      setError("Choose a resolution before submitting.");
      return;
    }
    if (!text) {
      setError("A resolution note is required.");
      return;
    }
    setError(null);
    setBusyKey(key);
    resolveTransferDispute(data.roomId, type as Parameters<typeof resolveTransferDispute>[1], text, issueId)
      .catch((e) => setError(e instanceof Error ? e.message : "Something went wrong."))
      .finally(() => setBusyKey(null));
  }

  return (
    <div>
      <Link href="/dashboard/admin/transfers" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-brand-strong">
        <ArrowLeft size={15} /> Back to Asset Transfers
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mono text-xs uppercase tracking-wider text-ink-faint">Order {data.orderId.slice(0, 8)}</p>
          <h2 className="mt-1 text-2xl">{data.listingTitle}</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {data.buyerName} (buyer) · {data.sellerName} (seller) · <span className="mono">{fmtUSD(data.amount)}</span>
          </p>
        </div>
        <Badge tone={stageEntry.tone}>{stageEntry.label}</Badge>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-danger/40 bg-danger-soft p-3 text-sm text-danger">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-rule bg-paper-raised p-5">
            <h3 className="mb-3 text-lg text-ink">Assets</h3>
            <div className="flex flex-col gap-3">
              {data.items.map((item) => (
                <div key={item.itemId} className="rounded-lg border border-rule bg-paper p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{item.name}</p>
                      {item.buyerReceives && <p className="mt-0.5 text-sm text-ink-soft">{item.buyerReceives}</p>}
                      {item.transferMethod && <p className="mt-0.5 text-xs text-ink-faint">Transfer method: {item.transferMethod}</p>}
                    </div>
                    <Badge tone="neutral" className="shrink-0">
                      {item.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  {item.sellerReference && <p className="mt-2 text-xs text-ink-faint">Seller note: {item.sellerReference}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-rule bg-paper-raised p-5">
            <h3 className="mb-3 text-lg text-ink">Issues</h3>
            {data.issues.length === 0 ? (
              <p className="text-sm text-ink-faint">No issues have been reported on this transfer.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {data.issues.map((issue) => (
                  <div key={issue.id} className="rounded-lg border border-rule bg-paper p-3.5">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">
                        {CATEGORY_LABEL[issue.category] ?? issue.category}
                        {issue.itemName ? ` — ${issue.itemName}` : " — general"}
                      </span>
                      <Badge tone={issue.status === "resolved" ? "dark" : "danger"}>{issue.status.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="text-xs text-ink-faint">
                      Reported by {issue.reporterName} · {formatDateTime(issue.createdAt)}
                    </p>
                    <p className="mt-2 text-sm text-ink-soft">{issue.explanation}</p>

                    {issue.status === "resolved" ? (
                      <div className="mt-3 rounded-md border border-rule bg-paper-raised p-2.5 text-xs">
                        <span className="font-semibold text-ink">Resolved — {issue.resolutionType?.replace(/_/g, " ")}</span>
                        <p className="mt-1 text-ink-soft">{issue.resolution}</p>
                        {issue.resolvedAt && <p className="mt-1 text-ink-faint">{formatDateTime(issue.resolvedAt)}</p>}
                      </div>
                    ) : canResolve ? (
                      <ResolutionForm
                        rowKey={`issue:${issue.id}`}
                        busyKey={busyKey}
                        resolutionType={resolutionType}
                        setResolutionType={setResolutionType}
                        resolutionText={resolutionText}
                        setResolutionText={setResolutionText}
                        onSubmit={() => resolve(`issue:${issue.id}`, issue.id)}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {canResolve && openIssues.length === 0 && (
              <div className="mt-4 border-t border-rule pt-4">
                <p className="mb-2 text-sm text-ink-soft">
                  This transfer is under admin review with no open reported issue — likely an expired inspection window. Resolve it directly:
                </p>
                <ResolutionForm
                  rowKey="room"
                  busyKey={busyKey}
                  resolutionType={resolutionType}
                  setResolutionType={setResolutionType}
                  resolutionText={resolutionText}
                  setResolutionText={setResolutionText}
                  onSubmit={() => resolve("room", null)}
                />
              </div>
            )}
          </div>

          {data.amendments.length > 0 && (
            <div className="rounded-xl border border-rule bg-paper-raised p-5">
              <h3 className="mb-3 text-lg text-ink">Proposed Changes (read-only — buyer decides)</h3>
              <div className="flex flex-col gap-2">
                {data.amendments.map((a) => (
                  <div key={a.id} className="rounded-md border border-rule bg-paper p-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink-soft">
                        {a.itemName ?? "Post-sale support"} — {a.field.replace(/_/g, " ")} — proposed by {a.proposedByName}
                      </span>
                      <Badge tone={a.status === "pending" ? "gold" : a.status === "accepted" ? "brand" : "danger"}>{a.status}</Badge>
                    </div>
                    <p className="mt-1 text-ink-faint">
                      {a.originalValue ? <span className="line-through">{a.originalValue}</span> : null} <span className="text-ink">→ {a.proposedValue}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-rule bg-paper-raised p-5">
            <h3 className="mb-3 text-lg text-ink">Deal Messages</h3>
            {data.messages.length === 0 ? (
              <p className="text-sm text-ink-faint">No messages yet.</p>
            ) : (
              <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
                {data.messages.map((m) => (
                  <div key={m.id} className="rounded-lg border border-rule bg-paper p-2.5 text-sm">
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-ink">{m.senderName}</span>
                      <span className="mono text-[0.65rem] text-ink-faint">{formatDateTime(m.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-ink-soft">{m.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-rule bg-paper-raised p-5">
            <h3 className="mb-3 text-lg text-ink">Activity History</h3>
            {data.events.length === 0 ? (
              <p className="text-sm text-ink-faint">No activity yet.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {data.events.map((e) => (
                  <li key={e.id} className="flex items-start gap-2.5 text-sm">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rule-strong" />
                    <div className="min-w-0">
                      <p className="text-ink-soft">
                        <span className="font-semibold text-ink">{e.actorName}</span> {formatEventType(e.eventType)}
                        {e.reason ? ` — ${e.reason}` : ""}
                      </p>
                      <p className="mono text-[0.65rem] text-ink-faint">{formatDateTime(e.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {data.support && (
            <div className="rounded-xl border border-rule bg-paper-raised p-4">
              <h3 className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Post-Sale Support</h3>
              <p className="text-sm text-ink-soft">{data.support.terms || "No terms listed."}</p>
              <p className="mt-1 text-xs text-ink-faint">Status: {data.support.status.replace(/_/g, " ")}</p>
            </div>
          )}

          <div className="rounded-xl border border-rule bg-paper-raised p-4">
            <h3 className="mono mb-3 text-xs uppercase tracking-wide text-ink-faint">Order Summary</h3>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Order Status</dt>
                <dd>
                  <StatusBadge status={data.orderStatus} />
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Amount</dt>
                <dd className="mono text-right font-semibold text-ink">{fmtUSD(data.amount)}</dd>
              </div>
              {data.unlockedAt && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Room Unlocked</dt>
                  <dd className="text-right text-ink">{formatDateTime(data.unlockedAt)}</dd>
                </div>
              )}
              {data.inspectionDeadlineAt && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Inspection Deadline</dt>
                  <dd className="text-right text-ink">{formatDateTime(data.inspectionDeadlineAt)}</dd>
                </div>
              )}
              {data.payoutEligibleAt && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Payout Eligible</dt>
                  <dd className="text-right text-ink">{formatDateTime(data.payoutEligibleAt)}</dd>
                </div>
              )}
            </dl>
            <Link href={`/dashboard/admin/orders`} className="mt-3 inline-block text-xs font-semibold text-ink-soft hover:text-brand-strong">
              Manage order status →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResolutionForm({
  rowKey,
  busyKey,
  resolutionType,
  setResolutionType,
  resolutionText,
  setResolutionText,
  onSubmit,
}: {
  rowKey: string;
  busyKey: string | null;
  resolutionType: Record<string, string>;
  setResolutionType: (v: Record<string, string>) => void;
  resolutionText: Record<string, string>;
  setResolutionText: (v: Record<string, string>) => void;
  onSubmit: () => void;
}) {
  const inputCls = "rounded-md border border-rule-strong bg-paper px-3 py-2 text-sm text-ink focus:border-brand-strong focus:outline-none";
  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-rule pt-3">
      <select
        value={resolutionType[rowKey] ?? ""}
        onChange={(e) => setResolutionType({ ...resolutionType, [rowKey]: e.target.value })}
        className={inputCls}
      >
        <option value="">Choose a resolution…</option>
        {RESOLUTION_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {resolutionType[rowKey] && (
        <p className="text-xs text-ink-faint">{RESOLUTION_OPTIONS.find((o) => o.value === resolutionType[rowKey])?.hint}</p>
      )}
      <textarea
        rows={2}
        placeholder="Resolution note (shown in the audit log)"
        value={resolutionText[rowKey] ?? ""}
        onChange={(e) => setResolutionText({ ...resolutionText, [rowKey]: e.target.value })}
        className={`${inputCls} w-full`}
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={busyKey === rowKey}
        className="w-fit rounded-md bg-brand-strong px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {busyKey === rowKey ? "Submitting…" : "Submit Resolution"}
      </button>
    </div>
  );
}
