"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Wallet } from "lucide-react";
import { fmtUSD } from "@/lib/format";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PayoutMethodIcon from "@/components/ui/PayoutMethodIcon";
import EmptyState from "@/components/ui/EmptyState";
import { setWithdrawalStatus } from "../actions";

export interface AdminWithdrawalRow {
  id: string;
  sellerName: string;
  // KYC policy (Sep 2026) — the seller's verified legal name and this
  // request's own typed account-holder name, shown side by side so an
  // admin can manually check they match before approving. Deliberately
  // not enforced automatically here (a real name can have harmless
  // spelling/format differences — "Md." vs "Mohammad", a missing middle
  // name) — see nameMismatchLikely() below, which only ever produces a
  // soft warning badge, never blocks an action.
  sellerLegalName: string | null;
  payoutAccountHolderName: string | null;
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
  payoutReference: string | null;
  reviewedByName: string | null;
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

// 2026-09-13 payout-policy v2: expanded from the original 4-value model
// (pending/approved/rejected/paid) to the owner's 9-value model — see
// 045_payout_policy_v2.sql and setWithdrawalStatus()'s LEGAL_TRANSITIONS.
const STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  under_review: "Under review",
  action_required: "Action required",
  approved: "Approved",
  processing: "Processing",
  paid: "Paid",
  on_hold: "On hold",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<string, string> = {
  requested: "border border-gold/30 bg-gold-soft text-[#92730F]",
  under_review: "border border-gold/30 bg-gold-soft text-[#92730F]",
  action_required: "border border-danger/30 bg-danger-soft text-danger",
  approved: "border border-brand/30 bg-brand-soft text-brand-strong",
  processing: "border border-brand/30 bg-brand-soft text-brand-strong",
  paid: "border border-brand-strong/30 bg-brand-strong/10 text-brand-strong",
  on_hold: "border border-danger/30 bg-danger-soft text-danger",
  rejected: "border border-danger/30 bg-danger-soft text-danger",
  cancelled: "border border-rule bg-paper-sunk text-ink-soft",
};

// Which action buttons show for a given current status — mirrors
// LEGAL_TRANSITIONS in dashboard/admin/actions.ts exactly, so a button
// here never triggers a transition the server would reject.
type Decision = "under_review" | "action_required" | "approved" | "processing" | "paid" | "on_hold" | "rejected";
const ACTIONS_FOR_STATUS: Record<string, Decision[]> = {
  requested: ["under_review", "approved", "action_required", "on_hold", "rejected"],
  under_review: ["approved", "action_required", "on_hold", "rejected"],
  action_required: ["under_review", "approved", "on_hold", "rejected"],
  on_hold: ["under_review", "approved", "action_required", "rejected"],
  approved: ["processing", "on_hold"],
  processing: ["paid"],
  paid: [],
  rejected: [],
  cancelled: [],
};

const ACTION_LABEL: Record<Decision, string> = {
  under_review: "Start review",
  action_required: "Need action from seller",
  approved: "Approve",
  processing: "Mark processing",
  paid: "Mark paid",
  on_hold: "Put on hold",
  rejected: "Reject",
};

const ACTION_STYLE: Record<Decision, string> = {
  under_review: "border border-rule-strong text-ink-soft hover:border-brand-strong",
  action_required: "border border-gold/40 text-[#92730F] hover:border-gold",
  approved: "bg-brand text-white hover:bg-brand-hover",
  processing: "bg-brand-strong text-white hover:opacity-90",
  paid: "bg-brand-strong text-white hover:opacity-90",
  on_hold: "border border-danger/40 text-danger hover:bg-danger-soft",
  rejected: "border border-rule-strong text-ink-soft hover:border-danger/40 hover:text-danger",
};

// Decisions where a confirm dialog (and, for reject/hold, a required note;
// for paid, an optional provider reference) is shown instead of firing
// immediately — matches the sensitivity of each transition.
const NEEDS_DIALOG: ReadonlySet<Decision> = new Set(["rejected", "on_hold", "action_required", "paid"]);

// Soft, informational-only heuristic (KYC policy, Sep 2026) — normalizes
// both names (lowercase, strip punctuation/titles, collapse whitespace)
// and flags a likely mismatch only when neither name contains the other's
// normalized form. Deliberately loose (a substring match, not an exact
// one) so "Md. Rahman Ahmed" vs "Rahman Ahmed" or "MOHAMMAD KARIM" vs
// "Mohammad Karim" don't false-positive — the goal is to catch a genuinely
// different name (a friend/relative's payout account, a typo like a
// different last name), not to police formatting. Never blocks anything;
// it only shows a warning badge for the admin's own manual judgment call,
// per the site owner's explicit "admin manual review" decision.
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(md|mohammad|mohammed|mohd|shaikh|sheikh|mr|mrs|ms|miss)\b\.?/g, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function namesLikelyMismatch(legalName: string | null, accountHolderName: string | null): boolean {
  if (!legalName || !accountHolderName) return false;
  const a = normalizeName(legalName);
  const b = normalizeName(accountHolderName);
  if (!a || !b) return false;
  if (a === b) return false;
  return !a.includes(b) && !b.includes(a);
}

export default function AdminWithdrawalsTable({ rows }: { rows: AdminWithdrawalRow[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dialogTarget, setDialogTarget] = useState<{ id: string; sellerName: string; decision: Decision } | null>(null);
  const [dialogNote, setDialogNote] = useState("");
  const [dialogReference, setDialogReference] = useState("");

  function decide(id: string, decision: Decision, note?: string, reference?: string) {
    setPendingId(id);
    setErrorId(null);
    setErrorMessage(null);
    startTransition(async () => {
      try {
        await setWithdrawalStatus(id, decision, note, reference);
      } catch (e) {
        setErrorId(id);
        setErrorMessage(e instanceof Error ? e.message : "Failed - retry");
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleAction(row: AdminWithdrawalRow, decision: Decision) {
    if (NEEDS_DIALOG.has(decision)) {
      setDialogNote("");
      setDialogReference("");
      setDialogTarget({ id: row.id, sellerName: row.sellerName, decision });
    } else {
      decide(row.id, decision);
    }
  }

  if (rows.length === 0) {
    return <EmptyState icon={Wallet} title="No withdrawal requests yet" body="Sellers' payout requests will show up here once they have a balance to withdraw." />;
  }

  function renderActions(r: AdminWithdrawalRow, busy: boolean) {
    const actions = ACTIONS_FOR_STATUS[r.status] ?? [];
    if (actions.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a}
            onClick={() => handleAction(r, a)}
            disabled={busy}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${ACTION_STYLE[a]}`}
          >
            {ACTION_LABEL[a]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Desktop: unchanged table, horizontal-scroll fallback only. */}
      <div className="hidden overflow-x-auto rounded-xl border border-rule md:block">
        <table className="w-full min-w-[1040px] border-collapse text-sm">
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
                    <div className="flex items-center gap-2">
                      <PayoutMethodIcon method={r.payoutMethod} />
                      <div className="font-medium text-ink-soft">{METHOD_LABEL[r.payoutMethod] ?? r.payoutMethod}</div>
                    </div>
                    <div className="mt-1 max-w-[220px] whitespace-pre-wrap text-xs text-ink-faint">{r.payoutDetails}</div>
                    {(r.sellerLegalName || r.payoutAccountHolderName) && (
                      <div className="mt-2 max-w-[220px] rounded-md border border-rule bg-paper px-2 py-1.5 text-xs">
                        <div className="text-ink-faint">
                          Legal name: <span className="text-ink-soft">{r.sellerLegalName ?? "-"}</span>
                        </div>
                        <div className="text-ink-faint">
                          Account holder: <span className="text-ink-soft">{r.payoutAccountHolderName ?? "-"}</span>
                        </div>
                        {namesLikelyMismatch(r.sellerLegalName, r.payoutAccountHolderName) && (
                          <div className="mt-1 flex items-center gap-1 font-semibold text-gold">
                            <AlertTriangle size={11} /> Name may not match
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[r.status] ?? "border border-rule bg-paper-sunk text-ink-soft"}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                    {r.adminNote && <div className="mt-1 max-w-[200px] text-xs text-ink-faint">{r.adminNote}</div>}
                    {r.status === "paid" && r.payoutReference && (
                      <div className="mt-1 max-w-[200px] text-xs text-ink-faint">Ref: {r.payoutReference}</div>
                    )}
                    {r.reviewedByName && <div className="mt-1 text-xs text-ink-faint">By {r.reviewedByName}</div>}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{r.requestedAt}</td>
                  <td className="px-4 py-3">
                    {renderActions(r, busy)}
                    {errorId === r.id && <span className="mt-1 block max-w-[180px] text-xs text-danger">{errorMessage}</span>}
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
            <div key={r.id} className="min-w-0 rounded-xl border border-rule bg-paper-raised p-4">
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
                  <div className="flex items-center gap-2">
                    <PayoutMethodIcon method={r.payoutMethod} />
                    <div className="font-medium text-ink-soft">{METHOD_LABEL[r.payoutMethod] ?? r.payoutMethod}</div>
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-xs text-ink-faint">{r.payoutDetails}</div>
                </div>
              </div>
              {(r.sellerLegalName || r.payoutAccountHolderName) && (
                <div className="mb-3 rounded-md border border-rule bg-paper px-2.5 py-2 text-xs">
                  <div className="text-ink-faint">
                    Legal name: <span className="text-ink-soft">{r.sellerLegalName ?? "-"}</span>
                  </div>
                  <div className="text-ink-faint">
                    Account holder: <span className="text-ink-soft">{r.payoutAccountHolderName ?? "-"}</span>
                  </div>
                  {namesLikelyMismatch(r.sellerLegalName, r.payoutAccountHolderName) && (
                    <div className="mt-1 flex items-center gap-1 font-semibold text-gold">
                      <AlertTriangle size={11} /> Name may not match
                    </div>
                  )}
                </div>
              )}
              {r.adminNote && <div className="mb-3 text-xs text-ink-faint">{r.adminNote}</div>}
              {r.status === "paid" && r.payoutReference && <div className="mb-3 text-xs text-ink-faint">Ref: {r.payoutReference}</div>}
              {r.reviewedByName && <div className="mb-3 text-xs text-ink-faint">By {r.reviewedByName}</div>}
              <div className="border-t border-rule pt-3">
                {renderActions(r, busy)}
                {errorId === r.id && <span className="mt-1 block text-xs text-danger">{errorMessage}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={dialogTarget !== null}
        title={
          dialogTarget
            ? dialogTarget.decision === "rejected"
              ? `Reject ${dialogTarget.sellerName}'s withdrawal request?`
              : dialogTarget.decision === "on_hold"
              ? `Put ${dialogTarget.sellerName}'s withdrawal on hold?`
              : dialogTarget.decision === "action_required"
              ? `Request action from ${dialogTarget.sellerName}?`
              : `Mark ${dialogTarget.sellerName}'s withdrawal paid?`
            : ""
        }
        body={
          <>
            {dialogTarget?.decision === "rejected" && (
              <p className="mb-2">They&rsquo;ll get an email with your note (if you added one). The orders this request claimed go back into their available balance, so this doesn&rsquo;t lose them any money - they can submit a new request any time.</p>
            )}
            {dialogTarget?.decision === "on_hold" && (
              <p className="mb-2">They&rsquo;ll get an email letting them know it&rsquo;s on hold, not rejected. The claimed orders stay reserved for this request while it&rsquo;s on hold.</p>
            )}
            {dialogTarget?.decision === "action_required" && (
              <p className="mb-2">They&rsquo;ll get an email asking them to check their seller dashboard. Explain what needs fixing below.</p>
            )}
            {dialogTarget?.decision === "paid" && (
              <p className="mb-2">Optionally record a payout/provider reference (a bank confirmation number, a PayPal transaction ID) so it&rsquo;s on file for this request.</p>
            )}
            {dialogTarget?.decision === "paid" ? (
              <input
                type="text"
                autoFocus
                placeholder="Payout reference (optional)"
                value={dialogReference}
                onChange={(e) => setDialogReference(e.target.value)}
                className="w-full rounded-md border border-rule-strong bg-paper px-3 py-2 text-sm text-ink focus:border-brand-strong focus:outline-none"
              />
            ) : (
              <textarea
                rows={3}
                autoFocus
                placeholder={dialogTarget?.decision === "rejected" ? "Reason (optional, but seller will see it)" : "Note for the seller"}
                value={dialogNote}
                onChange={(e) => setDialogNote(e.target.value)}
                className="w-full rounded-md border border-rule-strong bg-paper px-3 py-2 text-sm text-ink focus:border-brand-strong focus:outline-none"
              />
            )}
          </>
        }
        confirmLabel={dialogTarget ? ACTION_LABEL[dialogTarget.decision] : "Confirm"}
        danger={dialogTarget?.decision === "rejected" || dialogTarget?.decision === "on_hold"}
        busy={isPending && pendingId === dialogTarget?.id}
        onConfirm={() => {
          if (dialogTarget) {
            if (dialogTarget.decision === "paid") decide(dialogTarget.id, "paid", undefined, dialogReference);
            else decide(dialogTarget.id, dialogTarget.decision, dialogNote);
          }
          setDialogTarget(null);
        }}
        onCancel={() => setDialogTarget(null)}
      />
    </>
  );
}
