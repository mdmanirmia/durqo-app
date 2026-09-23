"use client";

import { useState, useTransition } from "react";
import { FileText, ShieldCheck } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { setVerificationStatus, setPayoutVerified } from "../actions";

export interface AdminVerificationRow {
  id: string;
  sellerName: string;
  // KYC policy (Sep 2026) — the name typed at submission time, exactly as
  // it appears on the uploaded ID (see legal_name, 053_kyc_name_match_and_
  // buyer_verification.sql). Shown here so an admin can compare it against
  // the ID photos, and it's what AdminWithdrawalsTable.tsx later compares
  // against a payout request's account holder name.
  legalName: string | null;
  sellerEmail: string | null;
  method: string | null;
  status: string;
  documentUrls: string[];
  submittedAt: string | null;
  // 2026-09-13 audit follow-up: what the admin told the seller was wrong,
  // captured at the moment of rejection (setVerificationStatus). Shown here
  // so a second admin reviewing a resubmission can see what was already
  // flagged, without having to dig through email.
  rejectionReason: string | null;
  // 2026-09-13 payout-policy v2: DELIBERATELY separate from `status` above —
  // the public Verified badge and payout eligibility are two independent
  // flags reviewed from this same screen (045_payout_policy_v2.sql). See
  // setPayoutVerified()'s comment in dashboard/admin/actions.ts.
  payoutVerified: boolean;
}

const METHOD_LABEL: Record<string, string> = {
  passport: "Passport",
  national_id: "National ID",
  driving_license: "Driving License",
  birth_certificate: "Birth Certificate",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "border border-gold/30 bg-gold-soft text-[#92730F]",
  verified: "border border-brand/30 bg-brand-soft text-brand-strong",
  rejected: "border border-danger/30 bg-danger-soft text-danger",
};

export default function AdminVerificationTable({ rows }: { rows: AdminVerificationRow[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [rejectTarget, setRejectTarget] = useState<{ id: string; sellerName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  function decide(id: string, decision: "verified" | "rejected", reason?: string) {
    setPendingId(id);
    setErrorId(null);
    startTransition(async () => {
      try {
        await setVerificationStatus(id, decision, reason);
      } catch {
        setErrorId(id);
      } finally {
        setPendingId(null);
      }
    });
  }

  function openReject(id: string, sellerName: string) {
    setRejectReason("");
    setRejectTarget({ id, sellerName });
  }

  function togglePayout(id: string, next: boolean) {
    setPendingId(id);
    setErrorId(null);
    startTransition(async () => {
      try {
        await setPayoutVerified(id, next);
      } catch {
        setErrorId(id);
      } finally {
        setPendingId(null);
      }
    });
  }

  if (rows.length === 0) {
    return <EmptyState icon={ShieldCheck} title="No verification requests yet" body="Submissions from sellers wanting the verified badge will show up here." />;
  }

  return (
    <>
      {/* Desktop: unchanged table, horizontal-scroll fallback only. */}
      <div className="hidden overflow-x-auto rounded-xl border border-rule md:block">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
              <th className="px-4 py-3 font-medium">Seller</th>
              <th className="px-4 py-3 font-medium">Document type</th>
              <th className="px-4 py-3 font-medium">Documents</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Payout access</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
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
                    {r.legalName && <div className="mt-1 text-xs text-ink-faint">Legal name: {r.legalName}</div>}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{r.method ? METHOD_LABEL[r.method] ?? r.method : "—"}</td>
                  <td className="px-4 py-3">
                    {r.documentUrls.length === 0 ? (
                      <span className="text-ink-faint">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {r.documentUrls.map((url, i) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-md border border-rule-strong px-2 py-1 text-xs font-medium text-ink-soft hover:border-brand-strong hover:text-brand-strong"
                          >
                            <FileText size={13} /> Doc {i + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${
                        STATUS_STYLE[r.status] ?? "border border-rule bg-paper-sunk text-ink-soft"
                      }`}
                    >
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                    {r.status === "rejected" && r.rejectionReason && (
                      <div className="mt-1 max-w-[200px] text-xs text-ink-faint">{r.rejectionReason}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePayout(r.id, !r.payoutVerified)}
                      disabled={busy}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold disabled:opacity-60 ${
                        r.payoutVerified
                          ? "border border-brand/30 bg-brand-soft text-brand-strong"
                          : "border border-rule-strong text-ink-soft hover:border-brand-strong"
                      }`}
                    >
                      {r.payoutVerified ? "Granted — revoke" : "Grant payout access"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{r.submittedAt ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {r.status !== "verified" && (
                        <button
                          onClick={() => decide(r.id, "verified")}
                          disabled={busy}
                          className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
                        >
                          Approve
                        </button>
                      )}
                      {r.status !== "rejected" && (
                        <button
                          onClick={() => openReject(r.id, r.sellerName)}
                          disabled={busy}
                          className="rounded-md border border-rule-strong px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-danger/40 hover:text-danger disabled:opacity-60"
                        >
                          Reject
                        </button>
                      )}
                      {errorId === r.id && <span className="self-center text-xs text-danger">Failed — retry</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: same data as a stacked card list. */}
      <div className="grid gap-3 md:hidden">
        {rows.map((r) => {
          const busy = isPending && pendingId === r.id;
          return (
            <div key={r.id} className="min-w-0 rounded-xl border border-rule bg-paper-raised p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium text-ink">{r.sellerName}</div>
                  {r.sellerEmail && <div className="truncate text-xs text-ink-faint">{r.sellerEmail}</div>}
                  {r.legalName && <div className="truncate text-xs text-ink-faint">Legal name: {r.legalName}</div>}
                </div>
                <span
                  className={`shrink-0 inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${
                    STATUS_STYLE[r.status] ?? "border border-rule bg-paper-sunk text-ink-soft"
                  }`}
                >
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </div>
              {r.status === "rejected" && r.rejectionReason && (
                <div className="mb-3 text-xs text-ink-faint">{r.rejectionReason}</div>
              )}
              <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <div className="text-xs text-ink-faint">Document type</div>
                  <div className="text-ink-soft">{r.method ? METHOD_LABEL[r.method] ?? r.method : "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-faint">Submitted</div>
                  <div className="text-ink-soft">{r.submittedAt ?? "—"}</div>
                </div>
              </div>
              <div className="mb-3">
                <div className="mb-1 text-xs text-ink-faint">Documents</div>
                {r.documentUrls.length === 0 ? (
                  <span className="text-sm text-ink-faint">—</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {r.documentUrls.map((url, i) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-md border border-rule-strong px-2 py-1 text-xs font-medium text-ink-soft hover:border-brand-strong hover:text-brand-strong"
                      >
                        <FileText size={13} /> Doc {i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="mb-3 flex items-center justify-between gap-2 border-t border-rule pt-3">
                <span className="text-xs text-ink-faint">Payout access</span>
                <button
                  onClick={() => togglePayout(r.id, !r.payoutVerified)}
                  disabled={busy}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold disabled:opacity-60 ${
                    r.payoutVerified
                      ? "border border-brand/30 bg-brand-soft text-brand-strong"
                      : "border border-rule-strong text-ink-soft hover:border-brand-strong"
                  }`}
                >
                  {r.payoutVerified ? "Granted — revoke" : "Grant"}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-3">
                {r.status !== "verified" && (
                  <button
                    onClick={() => decide(r.id, "verified")}
                    disabled={busy}
                    className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
                  >
                    Approve
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button
                    onClick={() => openReject(r.id, r.sellerName)}
                    disabled={busy}
                    className="rounded-md border border-rule-strong px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-danger/40 hover:text-danger disabled:opacity-60"
                  >
                    Reject
                  </button>
                )}
                {errorId === r.id && <span className="self-center text-xs text-danger">Failed — retry</span>}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={rejectTarget !== null}
        title={`Reject ${rejectTarget?.sellerName}'s verification?`}
        body={
          <>
            <p className="mb-2">They&rsquo;ll get an email with this reason so they know what to fix before resubmitting.</p>
            <textarea
              rows={3}
              autoFocus
              placeholder="e.g. Photo is too blurry to read the ID number"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-md border border-rule-strong bg-paper px-3 py-2 text-sm text-ink focus:border-brand-strong focus:outline-none"
            />
          </>
        }
        confirmLabel="Reject verification"
        danger
        busy={isPending && pendingId === rejectTarget?.id}
        onConfirm={() => {
          if (rejectTarget) decide(rejectTarget.id, "rejected", rejectReason);
          setRejectTarget(null);
        }}
        onCancel={() => setRejectTarget(null)}
      />
    </>
  );
}
