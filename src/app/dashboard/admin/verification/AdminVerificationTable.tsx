"use client";

import { useState, useTransition } from "react";
import { FileText } from "lucide-react";
import { setVerificationStatus } from "../actions";

export interface AdminVerificationRow {
  id: string;
  sellerName: string;
  sellerEmail: string | null;
  method: string | null;
  status: string;
  documentUrls: string[];
  submittedAt: string | null;
}

const METHOD_LABEL: Record<string, string> = {
  passport: "Passport",
  national_id: "National ID",
  driving_license: "Driving License",
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

  function decide(id: string, decision: "verified" | "rejected") {
    setPendingId(id);
    setErrorId(null);
    startTransition(async () => {
      try {
        await setVerificationStatus(id, decision);
      } catch {
        setErrorId(id);
      } finally {
        setPendingId(null);
      }
    });
  }

  if (rows.length === 0) {
    return <p className="text-sm text-ink-faint">No verification requests yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-rule">
      <table className="w-full min-w-[820px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
            <th className="px-4 py-3 font-medium">Seller</th>
            <th className="px-4 py-3 font-medium">Document type</th>
            <th className="px-4 py-3 font-medium">Documents</th>
            <th className="px-4 py-3 font-medium">Status</th>
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
                        onClick={() => decide(r.id, "rejected")}
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
  );
}
