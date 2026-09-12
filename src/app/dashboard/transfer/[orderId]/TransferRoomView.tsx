"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Pencil,
  Check,
  X,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { fmtUSD } from "@/lib/format";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import {
  markItemInProgress,
  submitItem,
  markItemReceived,
  approveTransfer,
  reportIssue,
  proposeAmendment,
  decideAmendment,
  sendTransferMessage,
} from "@/lib/actions/transfer";

// Phase 3 — Transfer Room UI. Renders two arrangements of the same
// sub-pieces from one dataset: a `md:hidden` mobile flow in the order the
// feasibility report's Section 9 spec calls for (status -> compact
// timeline -> Next Action -> Assets -> Post-Sale Support -> inspection
// note -> Messages -> Activity -> Order Summary, with a sticky bottom
// primary action), and a `hidden md:grid` desktop flow (a 68/32 two-column
// split: Assets / Post-Sale Support / Messages / Activity on the left,
// a sticky Next Action + Report an Issue + Order Summary rail on the
// right). Duplicating the JSX arrangement (not the logic — every piece is
// its own function reading from the same `data`/handlers) is a deliberate
// tradeoff: chasing one Tailwind `order-*` grid for two structurally
// different layouts was a lot more fragile than just arranging the same
// pieces twice.

export type ItemStatus = "not_started" | "in_progress" | "submitted" | "received" | "accepted";

export interface TransferAssetItem {
  itemId: string;
  snapshotAssetId: string;
  position: number;
  name: string;
  buyerReceives: string | null;
  transferMethod: string | null;
  note: string | null;
  status: ItemStatus;
  sellerReference: string | null;
  submittedAt: string | null;
  receivedAt: string | null;
  acceptedAt: string | null;
}

export interface TransferMessage {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

export interface TransferIssue {
  id: string;
  itemId: string | null;
  itemName: string | null;
  reporterName: string;
  category: string;
  explanation: string;
  status: string;
  sellerResponse: string | null;
  resolution: string | null;
  resolutionType: string | null;
  createdAt: string;
}

export interface TransferAmendment {
  id: string;
  itemId: string | null;
  itemName: string | null;
  field: string;
  originalValue: string | null;
  proposedValue: string;
  proposedByName: string;
  proposedBySelf: boolean;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface TransferEvent {
  id: string;
  actorName: string;
  eventType: string;
  reason: string | null;
  createdAt: string;
}

export interface TransferRoomSupport {
  terms: string | null;
  status: string;
  startDate: string | null;
}

export interface TransferRoomState {
  id: string;
  stage: string;
  unlockedAt: string | null;
  inspectionStartedAt: string | null;
  inspectionDeadlineAt: string | null;
  payoutEligibleAt: string | null;
  items: TransferAssetItem[];
  messages: TransferMessage[];
  issues: TransferIssue[];
  amendments: TransferAmendment[];
  events: TransferEvent[];
  support: TransferRoomSupport | null;
}

export interface TransferRoomData {
  orderId: string;
  viewerSide: "buyer" | "seller";
  listingTitle: string;
  buyerName: string;
  sellerName: string;
  amount: number;
  orderStatus: string;
  orderDate: string;
  room: TransferRoomState | null;
}

const CLOSED_STAGES = new Set(["payout_eligible", "resolved_refund", "resolved_settlement", "cancelled"]);

const STAGE_LABEL: Record<string, { label: string; tone: "neutral" | "brand" | "gold" | "danger" | "dark" }> = {
  order_created: { label: "Order Created", tone: "neutral" },
  room_locked_awaiting_payment: { label: "Awaiting Payment", tone: "gold" },
  room_unlocked: { label: "Transfer Unlocked", tone: "brand" },
  seller_transferring: { label: "Seller Transferring", tone: "brand" },
  awaiting_buyer_receipt: { label: "Awaiting Buyer Receipt", tone: "gold" },
  inspection_active: { label: "Inspection Window Open", tone: "gold" },
  admin_review: { label: "Under Admin Review", tone: "danger" },
  payout_eligible: { label: "Transfer Approved", tone: "dark" },
  resolved_refund: { label: "Resolved — Refunded", tone: "dark" },
  resolved_settlement: { label: "Resolved — Settlement", tone: "dark" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

const ITEM_STATUS_LABEL: Record<ItemStatus, { label: string; tone: "neutral" | "brand" | "gold" | "danger" | "dark" }> = {
  not_started: { label: "Not Started", tone: "neutral" },
  in_progress: { label: "In Progress", tone: "gold" },
  submitted: { label: "Submitted", tone: "brand" },
  received: { label: "Received", tone: "gold" },
  accepted: { label: "Accepted", tone: "dark" },
};

const ISSUE_CATEGORIES: { value: string; label: string }[] = [
  { value: "not_received", label: "Never received this asset" },
  { value: "not_working", label: "Doesn't work as described" },
  { value: "incomplete", label: "Incomplete transfer" },
  { value: "misrepresented", label: "Misrepresented on the listing" },
  { value: "credentials_invalid", label: "Login/credentials don't work" },
  { value: "other", label: "Other" },
];

const AMENDMENT_FIELD_OPTIONS: { value: "buyer_receives" | "transfer_method" | "note"; label: string }[] = [
  { value: "buyer_receives", label: "What the buyer receives" },
  { value: "transfer_method", label: "Transfer method" },
  { value: "note", label: "Note" },
];

const AMENDMENT_FIELD_LABEL: Record<string, string> = {
  buyer_receives: "What the buyer receives",
  transfer_method: "Transfer method",
  note: "Note",
  agreed_terms: "Post-sale support terms",
};

const EVENT_LABEL: Record<string, string> = {
  room_unlocked: "Transfer room unlocked — payment confirmed",
  item_in_progress: "marked an asset in progress",
  item_submitted: "submitted an asset",
  item_received: "confirmed receipt of an asset",
  buyer_approved: "approved the transfer",
  issue_reported: "reported an issue",
  amendment_proposed: "proposed a change",
  amendment_accepted: "accepted a proposed change",
  amendment_rejected: "declined a proposed change",
  inspection_expired: "Inspection window expired without a decision",
};

function formatEventType(type: string): string {
  return EVENT_LABEL[type] ?? type.replace(/_/g, " ");
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const inputCls =
  "rounded-md border border-rule-strong bg-paper px-3 py-2 text-sm text-ink focus:border-brand-strong focus:outline-none";

export default function TransferRoomView({ data }: { data: TransferRoomData }) {
  const { room } = data;
  const backHref = data.viewerSide === "buyer" ? "/dashboard/buyer/orders" : "/dashboard/seller/orders";

  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [sellerRefDraft, setSellerRefDraft] = useState<Record<string, string>>({});
  const [openAmendItem, setOpenAmendItem] = useState<string | "support" | null>(null);
  const [amendField, setAmendField] = useState<string>("buyer_receives");
  const [amendValue, setAmendValue] = useState("");
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueItemId, setIssueItemId] = useState<string>("");
  const [issueCategory, setIssueCategory] = useState(ISSUE_CATEGORIES[0].value);
  const [issueExplanation, setIssueExplanation] = useState("");

  function run(key: string, fn: () => Promise<unknown>) {
    setActionError(null);
    setBusyKey(key);
    fn()
      .catch((e) => setActionError(e instanceof Error ? e.message : "Something went wrong. Please try again."))
      .finally(() => setBusyKey(null));
  }

  const handlers = room
    ? {
        markInProgress: (itemId: string) => run(`progress:${itemId}`, () => markItemInProgress(data.orderId, itemId)),
        submit: (itemId: string) =>
          run(`submit:${itemId}`, () => submitItem(data.orderId, itemId, sellerRefDraft[itemId]?.trim() || null)),
        markReceived: (itemId: string) => run(`received:${itemId}`, () => markItemReceived(data.orderId, itemId)),
        approve: () => run("approve", () => approveTransfer(data.orderId, room.id)),
        proposeItemAmendment: (itemId: string) =>
          run(`amend:${itemId}`, async () => {
            await proposeAmendment(data.orderId, room.id, itemId, amendField, amendValue.trim());
            setOpenAmendItem(null);
            setAmendValue("");
          }),
        proposeSupportAmendment: () =>
          run("amend:support", async () => {
            await proposeAmendment(data.orderId, room.id, null, "agreed_terms", amendValue.trim());
            setOpenAmendItem(null);
            setAmendValue("");
          }),
        decide: (amendmentId: string, accept: boolean) =>
          run(`decide:${amendmentId}`, () => decideAmendment(data.orderId, amendmentId, accept)),
        sendMessage: () =>
          run("message", async () => {
            const body = messageBody.trim();
            if (!body) return;
            await sendTransferMessage(data.orderId, room.id, body);
            setMessageBody("");
          }),
        submitIssue: () =>
          run("issue", async () => {
            if (!issueExplanation.trim()) {
              setActionError("Please describe the issue before submitting.");
              return;
            }
            await reportIssue(data.orderId, room.id, issueItemId || null, issueCategory, issueExplanation.trim());
            setIssueModalOpen(false);
            setIssueExplanation("");
          }),
      }
    : null;

  // Computed in an effect (not during render) since it reads Date.now() —
  // an impure call render itself must never depend on. Re-runs once a
  // minute so the countdown actually counts down while the page is left
  // open, without needing a live subscription.
  const [inspectionLabel, setInspectionLabel] = useState<string | null>(null);
  useEffect(() => {
    function recompute() {
      if (!room || room.stage !== "inspection_active" || !room.inspectionDeadlineAt) {
        setInspectionLabel(null);
        return;
      }
      const msLeft = new Date(room.inspectionDeadlineAt).getTime() - Date.now();
      if (msLeft <= 0) {
        setInspectionLabel("Inspection window has ended — awaiting the sweep to admin review.");
        return;
      }
      const days = Math.floor(msLeft / 86_400_000);
      const hours = Math.floor((msLeft % 86_400_000) / 3_600_000);
      if (days > 0) {
        setInspectionLabel(`${days} day${days === 1 ? "" : "s"} ${hours}h remaining to inspect`);
        return;
      }
      const minutes = Math.floor((msLeft % 3_600_000) / 60_000);
      setInspectionLabel(`${hours}h ${minutes}m remaining to inspect`);
    }
    recompute();
    const id = setInterval(recompute, 60_000);
    return () => clearInterval(id);
  }, [room]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-28 md:py-10 md:pb-10">
      <Link href={backHref} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-brand-strong">
        <ArrowLeft size={15} /> Back to Orders
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mono text-xs uppercase tracking-wider text-ink-faint">Transfer Room · Order {data.orderId.slice(0, 8)}</p>
          <h1 className="mt-1 truncate text-2xl md:text-3xl">{data.listingTitle}</h1>
        </div>
        {room && <StageChip stage={room.stage} />}
      </div>

      {actionError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-danger/40 bg-danger-soft p-3 text-sm text-danger">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {!room ? (
        <NoRoomState data={data} />
      ) : (
        <>
          {/* ---------- Mobile flow ---------- */}
          <div className="flex flex-col gap-5 md:hidden">
            <PaymentStrip data={data} />
            <MobileTimeline stage={room.stage} />
            <NextActionCard data={data} room={room} inspectionLabel={inspectionLabel} busyKey={busyKey} handlers={handlers!} />
            <AssetsSection
              data={data}
              room={room}
              busyKey={busyKey}
              handlers={handlers!}
              sellerRefDraft={sellerRefDraft}
              setSellerRefDraft={setSellerRefDraft}
              openAmendItem={openAmendItem}
              setOpenAmendItem={setOpenAmendItem}
              amendField={amendField}
              setAmendField={setAmendField}
              amendValue={amendValue}
              setAmendValue={setAmendValue}
            />
            <PostSaleSupportSection
              data={data}
              room={room}
              busyKey={busyKey}
              handlers={handlers!}
              openAmendItem={openAmendItem}
              setOpenAmendItem={setOpenAmendItem}
              amendValue={amendValue}
              setAmendValue={setAmendValue}
            />
            {inspectionLabel && (
              <div className="flex items-center gap-2 rounded-lg border border-gold/40 bg-gold-soft px-3 py-2.5 text-sm text-[#92730F]">
                <Clock size={15} className="shrink-0" /> {inspectionLabel}
              </div>
            )}
            <ReportIssueButton
              data={data}
              room={room}
              onOpen={() => setIssueModalOpen(true)}
            />
            <MessagesSection room={room} messageBody={messageBody} setMessageBody={setMessageBody} busyKey={busyKey} handlers={handlers!} />
            <ActivityHistorySection room={room} />
            <OrderSummaryCard data={data} />
          </div>

          {/* ---------- Desktop flow ---------- */}
          <div className="hidden md:grid md:grid-cols-[1fr_320px] md:items-start md:gap-8">
            <div className="flex flex-col gap-6">
              <AssetsSection
                data={data}
                room={room}
                busyKey={busyKey}
                handlers={handlers!}
                sellerRefDraft={sellerRefDraft}
                setSellerRefDraft={setSellerRefDraft}
                openAmendItem={openAmendItem}
                setOpenAmendItem={setOpenAmendItem}
                amendField={amendField}
                setAmendField={setAmendField}
                amendValue={amendValue}
                setAmendValue={setAmendValue}
              />
              <PostSaleSupportSection
                data={data}
                room={room}
                busyKey={busyKey}
                handlers={handlers!}
                openAmendItem={openAmendItem}
                setOpenAmendItem={setOpenAmendItem}
                amendValue={amendValue}
                setAmendValue={setAmendValue}
              />
              <MessagesSection room={room} messageBody={messageBody} setMessageBody={setMessageBody} busyKey={busyKey} handlers={handlers!} />
              <ActivityHistorySection room={room} />
            </div>

            <div className="sticky top-6 flex flex-col gap-4">
              <NextActionCard data={data} room={room} inspectionLabel={inspectionLabel} busyKey={busyKey} handlers={handlers!} />
              <ReportIssueButton data={data} room={room} onOpen={() => setIssueModalOpen(true)} />
              <OrderSummaryCard data={data} />
            </div>
          </div>

          {/* ---------- Mobile sticky primary action ---------- */}
          <MobileStickyAction data={data} room={room} busyKey={busyKey} handlers={handlers!} />

          {issueModalOpen && (
            <ReportIssueModal
              items={room.items}
              category={issueCategory}
              setCategory={setIssueCategory}
              itemId={issueItemId}
              setItemId={setIssueItemId}
              explanation={issueExplanation}
              setExplanation={setIssueExplanation}
              busy={busyKey === "issue"}
              onCancel={() => setIssueModalOpen(false)}
              onSubmit={handlers!.submitIssue}
            />
          )}
        </>
      )}
    </main>
  );
}

function StageChip({ stage }: { stage: string }) {
  const entry = STAGE_LABEL[stage] ?? { label: stage, tone: "neutral" as const };
  return (
    <Badge tone={entry.tone} className="shrink-0">
      {entry.label}
    </Badge>
  );
}

function NoRoomState({ data }: { data: TransferRoomData }) {
  let message =
    "Your Transfer Room for this order hasn't been set up yet. This usually only takes a moment after payment — please check back shortly, or contact support if it's been a while.";
  if (data.orderStatus === "requested" || data.orderStatus === "awaiting_payment") {
    message = "This order hasn't been paid for yet. The Transfer Room unlocks automatically once payment is confirmed.";
  } else if (data.orderStatus === "cancelled") {
    message = "This order was cancelled — there's no Transfer Room for it.";
  }
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-rule bg-paper-raised p-5 text-sm text-ink-soft">{message}</div>
      <OrderSummaryCard data={data} />
    </div>
  );
}

function PaymentStrip({ data }: { data: TransferRoomData }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-rule bg-paper-raised px-3.5 py-2.5">
      <div>
        <div className="mono text-sm font-semibold text-ink">{fmtUSD(data.amount)}</div>
        <div className="text-xs text-ink-faint">{data.orderDate}</div>
      </div>
      <StatusBadge status={data.orderStatus} />
    </div>
  );
}

const TIMELINE_STEPS = [
  { stage: "room_unlocked", label: "Unlocked" },
  { stage: "seller_transferring", label: "Transferring" },
  { stage: "awaiting_buyer_receipt", label: "Awaiting Receipt" },
  { stage: "inspection_active", label: "Inspection" },
  { stage: "payout_eligible", label: "Approved" },
] as const;

function MobileTimeline({ stage }: { stage: string }) {
  if (CLOSED_STAGES.has(stage) && stage !== "payout_eligible") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2.5 text-sm text-danger">
        <ShieldAlert size={15} className="shrink-0" />
        {stage === "admin_review" ? "This transfer is under admin review." : STAGE_LABEL[stage]?.label ?? stage}
      </div>
    );
  }
  const currentIndex = TIMELINE_STEPS.findIndex((s) => s.stage === stage);
  return (
    <div className="flex items-center gap-1">
      {TIMELINE_STEPS.map((step, i) => {
        const done = currentIndex >= 0 && i < currentIndex;
        const current = i === currentIndex;
        return (
          <div key={step.stage} className="flex flex-1 items-center gap-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  done || current ? (current ? "bg-brand-strong ring-4 ring-brand-soft" : "bg-brand-strong") : "bg-rule-strong"
                }`}
              />
              <span className={`max-w-[4.5rem] truncate text-center text-[0.62rem] ${current ? "font-semibold text-ink" : "text-ink-faint"}`}>{step.label}</span>
            </div>
            {i < TIMELINE_STEPS.length - 1 && <div className={`h-px flex-1 ${done ? "bg-brand-strong" : "bg-rule-strong"}`} />}
          </div>
        );
      })}
    </div>
  );
}

interface Handlers {
  markInProgress: (itemId: string) => void;
  submit: (itemId: string) => void;
  markReceived: (itemId: string) => void;
  approve: () => void;
  proposeItemAmendment: (itemId: string) => void;
  proposeSupportAmendment: () => void;
  decide: (amendmentId: string, accept: boolean) => void;
  sendMessage: () => void;
  submitIssue: () => void;
}

function NextActionCard({
  data,
  room,
  inspectionLabel,
  busyKey,
  handlers,
}: {
  data: TransferRoomData;
  room: TransferRoomState;
  inspectionLabel: string | null;
  busyKey: string | null;
  handlers: Handlers;
}) {
  const isBuyer = data.viewerSide === "buyer";
  const title = "Next Action";
  let body: React.ReactNode = null;
  let action: React.ReactNode = null;

  switch (room.stage) {
    case "room_unlocked":
    case "seller_transferring":
      body = isBuyer
        ? "Waiting for the seller to start transferring the assets below."
        : "Start transferring each asset below, then mark it Submitted.";
      break;
    case "awaiting_buyer_receipt":
      body = isBuyer
        ? "All assets have been submitted. Check them below and mark each one Received."
        : "Waiting for the buyer to confirm receipt of each asset.";
      break;
    case "inspection_active":
      body = isBuyer
        ? "You've received everything. Review it, then approve the transfer or report an issue before the window closes."
        : "The buyer is inspecting what you transferred.";
      if (inspectionLabel) {
        body = (
          <>
            {body}
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#92730F]">
              <Clock size={13} /> {inspectionLabel}
            </div>
          </>
        );
      }
      if (isBuyer) {
        action = (
          <button
            type="button"
            onClick={handlers.approve}
            disabled={busyKey === "approve"}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
          >
            {busyKey === "approve" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            Approve Transfer
          </button>
        );
      }
      break;
    case "admin_review":
      body = "This transfer is under review by a Durqo admin. Funds are never released automatically — you'll hear back once it's resolved.";
      break;
    case "payout_eligible":
      body = "Transfer approved. The seller's payout for this order is now eligible for withdrawal.";
      break;
    case "resolved_settlement":
      body = "This transfer was resolved with a settlement recorded by a Durqo admin.";
      break;
    case "resolved_refund":
      body = "This order was resolved with a refund to the buyer.";
      break;
    case "cancelled":
      body = "This transfer was cancelled.";
      break;
    default:
      body = "Waiting for payment to be confirmed.";
  }

  return (
    <div className="rounded-xl border border-rule bg-paper-raised p-4">
      <h3 className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">{title}</h3>
      <div className="text-sm leading-relaxed text-ink-soft">{body}</div>
      {action}
    </div>
  );
}

function MobileStickyAction({ data, room, busyKey, handlers }: { data: TransferRoomData; room: TransferRoomState; busyKey: string | null; handlers: Handlers }) {
  if (data.viewerSide !== "buyer" || room.stage !== "inspection_active") return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper p-3 md:hidden" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
      <button
        type="button"
        onClick={handlers.approve}
        disabled={busyKey === "approve"}
        className="flex w-full items-center justify-center gap-1.5 rounded-md bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
      >
        {busyKey === "approve" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
        Approve Transfer
      </button>
    </div>
  );
}

function ReportIssueButton({ data, room, onOpen }: { data: TransferRoomData; room: TransferRoomState; onOpen: () => void }) {
  if (data.viewerSide !== "buyer") return null;
  const enabled = room.stage === "inspection_active";
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!enabled}
      className="flex w-full items-center justify-center gap-1.5 rounded-md border border-danger/40 px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-40"
      title={enabled ? undefined : "Issues can only be reported during the inspection window."}
    >
      <AlertTriangle size={15} /> Report an Issue
    </button>
  );
}

function AssetsSection({
  data,
  room,
  busyKey,
  handlers,
  sellerRefDraft,
  setSellerRefDraft,
  openAmendItem,
  setOpenAmendItem,
  amendField,
  setAmendField,
  amendValue,
  setAmendValue,
}: {
  data: TransferRoomData;
  room: TransferRoomState;
  busyKey: string | null;
  handlers: Handlers;
  sellerRefDraft: Record<string, string>;
  setSellerRefDraft: (v: Record<string, string>) => void;
  openAmendItem: string | "support" | null;
  setOpenAmendItem: (v: string | "support" | null) => void;
  amendField: string;
  setAmendField: (v: string) => void;
  amendValue: string;
  setAmendValue: (v: string) => void;
}) {
  const isSeller = data.viewerSide === "seller";
  const isBuyer = data.viewerSide === "buyer";
  const canAmend = !CLOSED_STAGES.has(room.stage);

  return (
    <div className="rounded-xl border border-rule bg-paper-raised p-4 md:p-5">
      <h2 className="mb-3 text-lg text-ink">Assets to Transfer</h2>
      <div className="flex flex-col gap-3">
        {room.items.map((item) => {
          const itemAmendments = room.amendments.filter((a) => a.itemId === item.itemId);
          const statusEntry = ITEM_STATUS_LABEL[item.status];
          return (
            <div key={item.itemId} className="rounded-lg border border-rule bg-paper p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{item.name}</p>
                  {item.buyerReceives && <p className="mt-0.5 text-sm text-ink-soft">{item.buyerReceives}</p>}
                  {item.transferMethod && <p className="mt-0.5 text-xs text-ink-faint">Transfer method: {item.transferMethod}</p>}
                  {item.note && <p className="mt-0.5 text-xs text-ink-faint">{item.note}</p>}
                </div>
                <Badge tone={statusEntry.tone} className="shrink-0">
                  {statusEntry.label}
                </Badge>
              </div>

              {item.sellerReference && <p className="mt-2 text-xs text-ink-faint">Seller note: {item.sellerReference}</p>}

              {isSeller && (item.status === "not_started" || item.status === "in_progress") && (
                <div className="mt-3 flex flex-col gap-2 border-t border-rule pt-3 sm:flex-row sm:items-center">
                  {item.status === "not_started" && (
                    <button
                      type="button"
                      onClick={() => handlers.markInProgress(item.itemId)}
                      disabled={busyKey === `progress:${item.itemId}`}
                      className="rounded-md border border-rule-strong px-3 py-2 text-xs font-semibold text-ink-soft hover:border-brand-strong disabled:opacity-60"
                    >
                      Mark In Progress
                    </button>
                  )}
                  <input
                    placeholder="Reference/note for the buyer (optional)"
                    value={sellerRefDraft[item.itemId] ?? ""}
                    onChange={(e) => setSellerRefDraft({ ...sellerRefDraft, [item.itemId]: e.target.value })}
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => handlers.submit(item.itemId)}
                    disabled={busyKey === `submit:${item.itemId}`}
                    className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
                  >
                    {busyKey === `submit:${item.itemId}` ? "Submitting…" : "Mark Submitted"}
                  </button>
                </div>
              )}

              {isBuyer && item.status === "submitted" && (
                <div className="mt-3 border-t border-rule pt-3">
                  <button
                    type="button"
                    onClick={() => handlers.markReceived(item.itemId)}
                    disabled={busyKey === `received:${item.itemId}`}
                    className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
                  >
                    {busyKey === `received:${item.itemId}` ? "Confirming…" : "Mark Received"}
                  </button>
                </div>
              )}

              {itemAmendments.length > 0 && (
                <div className="mt-3 flex flex-col gap-2 border-t border-rule pt-3">
                  {itemAmendments.map((a) => (
                    <AmendmentRow key={a.id} amendment={a} viewerSide={data.viewerSide} busyKey={busyKey} onDecide={handlers.decide} />
                  ))}
                </div>
              )}

              {isSeller && canAmend && (
                <div className="mt-3 border-t border-rule pt-3">
                  {openAmendItem === item.itemId ? (
                    <div className="flex flex-col gap-2">
                      <select value={amendField} onChange={(e) => setAmendField(e.target.value)} className={inputCls}>
                        {AMENDMENT_FIELD_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                      <textarea
                        rows={2}
                        placeholder="Proposed new value"
                        value={amendValue}
                        onChange={(e) => setAmendValue(e.target.value)}
                        className={`${inputCls} w-full`}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handlers.proposeItemAmendment(item.itemId)}
                          disabled={!amendValue.trim() || busyKey === `amend:${item.itemId}`}
                          className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
                        >
                          Propose Change
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenAmendItem(null);
                            setAmendValue("");
                          }}
                          className="rounded-md border border-rule-strong px-3 py-1.5 text-xs font-semibold text-ink-soft"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenAmendItem(item.itemId);
                        setAmendField("buyer_receives");
                        setAmendValue("");
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-brand-strong"
                    >
                      <Pencil size={12} /> Propose a change
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AmendmentRow({
  amendment,
  viewerSide,
  busyKey,
  onDecide,
}: {
  amendment: TransferAmendment;
  viewerSide: "buyer" | "seller";
  busyKey: string | null;
  onDecide: (id: string, accept: boolean) => void;
}) {
  const fieldLabel = AMENDMENT_FIELD_LABEL[amendment.field] ?? amendment.field;
  return (
    <div className="rounded-md border border-rule bg-paper-raised p-2.5 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-ink-soft">
          {fieldLabel} — {amendment.proposedByName} proposed
        </span>
        {amendment.status !== "pending" && (
          <Badge tone={amendment.status === "accepted" ? "brand" : "danger"}>{amendment.status === "accepted" ? "Accepted" : "Declined"}</Badge>
        )}
      </div>
      <p className="mt-1 text-ink-faint">
        {amendment.originalValue ? <span className="line-through">{amendment.originalValue}</span> : null} <span className="text-ink">→ {amendment.proposedValue}</span>
      </p>
      {viewerSide === "buyer" && amendment.status === "pending" && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onDecide(amendment.id, true)}
            disabled={busyKey === `decide:${amendment.id}`}
            className="flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
          >
            <Check size={11} /> Accept
          </button>
          <button
            type="button"
            onClick={() => onDecide(amendment.id, false)}
            disabled={busyKey === `decide:${amendment.id}`}
            className="flex items-center gap-1 rounded-md border border-rule-strong px-2.5 py-1 font-semibold text-ink-soft"
          >
            <X size={11} /> Decline
          </button>
        </div>
      )}
    </div>
  );
}

function PostSaleSupportSection({
  data,
  room,
  busyKey,
  handlers,
  openAmendItem,
  setOpenAmendItem,
  amendValue,
  setAmendValue,
}: {
  data: TransferRoomData;
  room: TransferRoomState;
  busyKey: string | null;
  handlers: Handlers;
  openAmendItem: string | "support" | null;
  setOpenAmendItem: (v: string | "support" | null) => void;
  amendValue: string;
  setAmendValue: (v: string) => void;
}) {
  if (!room.support) return null;
  const isSeller = data.viewerSide === "seller";
  const canAmend = !CLOSED_STAGES.has(room.stage);
  const supportAmendments = room.amendments.filter((a) => a.itemId === null);
  const statusLabel = room.support.status === "active" ? "Active" : room.support.status === "completed" ? "Completed" : "Not Started";
  const statusTone = room.support.status === "active" ? "brand" : room.support.status === "completed" ? "dark" : "neutral";

  return (
    <div className="rounded-xl border border-rule bg-paper-raised p-4 md:p-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-lg text-ink">Post-Sale Support</h2>
        <Badge tone={statusTone}>{statusLabel}</Badge>
      </div>
      <p className="text-sm text-ink-soft">{room.support.terms || "No post-sale support terms were listed for this order."}</p>
      {room.support.startDate && <p className="mt-1 text-xs text-ink-faint">Started {formatDate(room.support.startDate)}</p>}

      {supportAmendments.length > 0 && (
        <div className="mt-3 flex flex-col gap-2 border-t border-rule pt-3">
          {supportAmendments.map((a) => (
            <AmendmentRow key={a.id} amendment={a} viewerSide={data.viewerSide} busyKey={busyKey} onDecide={handlers.decide} />
          ))}
        </div>
      )}

      {isSeller && canAmend && (
        <div className="mt-3 border-t border-rule pt-3">
          {openAmendItem === "support" ? (
            <div className="flex flex-col gap-2">
              <textarea
                rows={2}
                placeholder="Proposed new support terms"
                value={amendValue}
                onChange={(e) => setAmendValue(e.target.value)}
                className={`${inputCls} w-full`}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlers.proposeSupportAmendment}
                  disabled={!amendValue.trim() || busyKey === "amend:support"}
                  className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
                >
                  Propose Change
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenAmendItem(null);
                    setAmendValue("");
                  }}
                  className="rounded-md border border-rule-strong px-3 py-1.5 text-xs font-semibold text-ink-soft"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOpenAmendItem("support");
                setAmendValue("");
              }}
              className="flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-brand-strong"
            >
              <Pencil size={12} /> Propose a change
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MessagesSection({
  room,
  messageBody,
  setMessageBody,
  busyKey,
  handlers,
}: {
  room: TransferRoomState;
  messageBody: string;
  setMessageBody: (v: string) => void;
  busyKey: string | null;
  handlers: Handlers;
}) {
  return (
    <div className="rounded-xl border border-rule bg-paper-raised p-4 md:p-5">
      <h2 className="mb-3 text-lg text-ink">Deal Messages</h2>
      {room.messages.length === 0 ? (
        <p className="text-sm text-ink-faint">No messages yet.</p>
      ) : (
        <div className="mb-3 flex max-h-80 flex-col gap-2.5 overflow-y-auto">
          {room.messages.map((m) => (
            <div key={m.id} className="rounded-lg border border-rule bg-paper p-2.5">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-ink">{m.senderName}</span>
                <span className="mono text-[0.65rem] text-ink-faint">{formatDateTime(m.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-ink-soft">{m.body}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          placeholder="Write a message…"
          value={messageBody}
          onChange={(e) => setMessageBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && messageBody.trim()) handlers.sendMessage();
          }}
          className={`${inputCls} flex-1`}
        />
        <button
          type="button"
          onClick={handlers.sendMessage}
          disabled={!messageBody.trim() || busyKey === "message"}
          className="grid w-10 shrink-0 place-items-center rounded-md bg-brand text-white hover:bg-brand-hover disabled:opacity-60"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

function ActivityHistorySection({ room }: { room: TransferRoomState }) {
  return (
    <div className="rounded-xl border border-rule bg-paper-raised p-4 md:p-5">
      <h2 className="mb-3 text-lg text-ink">Activity History</h2>
      {room.events.length === 0 ? (
        <p className="text-sm text-ink-faint">No activity yet.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {room.events.map((e) => (
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
  );
}

function OrderSummaryCard({ data }: { data: TransferRoomData }) {
  return (
    <div className="rounded-xl border border-rule bg-paper-raised p-4 md:p-5">
      <h3 className="mono mb-3 text-xs uppercase tracking-wide text-ink-faint">Order Summary</h3>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-faint">Buyer</dt>
          <dd className="text-right text-ink">{data.buyerName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-faint">Seller</dt>
          <dd className="text-right text-ink">{data.sellerName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-faint">Amount</dt>
          <dd className="mono text-right font-semibold text-ink">{fmtUSD(data.amount)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-faint">Order Status</dt>
          <dd>
            <StatusBadge status={data.orderStatus} />
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-faint">Date</dt>
          <dd className="mono text-right text-ink">{data.orderDate}</dd>
        </div>
      </dl>
      <Link
        href={`/dashboard/receipt/${data.orderId}`}
        className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-brand-strong"
      >
        <FileText size={13} /> View Receipt
      </Link>
    </div>
  );
}

function ReportIssueModal({
  items,
  category,
  setCategory,
  itemId,
  setItemId,
  explanation,
  setExplanation,
  busy,
  onCancel,
  onSubmit,
}: {
  items: TransferAssetItem[];
  category: string;
  setCategory: (v: string) => void;
  itemId: string;
  setItemId: (v: string) => void;
  explanation: string;
  setExplanation: (v: string) => void;
  busy: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={busy ? undefined : onCancel} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-issue-heading"
        className="absolute left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-rule bg-paper-raised p-6 shadow-[0_16px_40px_-16px_rgba(15,23,41,0.35)]"
      >
        <h3 id="report-issue-heading" className="text-lg font-semibold text-ink">
          Report an Issue
        </h3>
        <p className="mt-1 text-xs text-ink-faint">This goes to a Durqo admin for review — funds stay held until it&apos;s resolved.</p>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink-soft">Which asset (optional)</span>
            <select value={itemId} onChange={(e) => setItemId(e.target.value)} className={inputCls}>
              <option value="">General issue with this order</option>
              {items.map((i) => (
                <option key={i.itemId} value={i.itemId}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink-soft">Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {ISSUE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink-soft">Explain what happened</span>
            <textarea rows={4} value={explanation} onChange={(e) => setExplanation(e.target.value)} className={`${inputCls} w-full`} />
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-rule-strong px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-paper-sunk disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy || !explanation.trim()}
            className="rounded-md bg-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Submitting…" : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}
