"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { PlaySquare } from "lucide-react";
import { CATEGORY_MAP } from "@/lib/categories";
import { fmtUSD } from "@/lib/format";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { setListingStatus, setListingGaVerified } from "../actions";

export interface AdminListingRow {
  id: string;
  title: string;
  categoryId: string;
  status: string;
  price: number;
  sellerName: string;
  createdAt: string;
  // Google Analytics verification (Motion Invest / Flippa style — manual GA
  // "Viewer" access review). gaAccessConfirmed is the seller's own
  // self-declared checkbox from the listing form; gaVerified is admin-only,
  // set after an admin actually logs into the GA property and confirms the
  // submitted numbers look real (see setListingGaVerified in ../actions.ts).
  gaAccessConfirmed: boolean;
  gaVerified: boolean;
  loomVideoUrl?: string;
}

const BTN_NEUTRAL =
  "rounded-md border border-rule-strong px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-brand-strong hover:text-brand-strong disabled:opacity-60";
const BTN_CONFIRM =
  "rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-60";
const BTN_DANGER =
  "rounded-md border border-danger px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger-soft disabled:opacity-60";

export default function AdminListingsTable({ rows }: { rows: AdminListingRow[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateStatus(id: string, status: string) {
    setPendingId(id);
    setErrorId(null);
    startTransition(async () => {
      try {
        await setListingStatus(id, status as never);
      } catch {
        setErrorId(id);
      } finally {
        setPendingId(null);
      }
    });
  }

  function toggleGaVerified(id: string, verified: boolean) {
    setPendingId(id);
    setErrorId(null);
    startTransition(async () => {
      try {
        await setListingGaVerified(id, verified);
      } catch {
        setErrorId(id);
      } finally {
        setPendingId(null);
      }
    });
  }

  if (rows.length === 0) {
    return <p className="text-sm text-ink-faint">No listings match this filter.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-rule">
      <table className="w-full min-w-[820px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Seller</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">GA</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Listed</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => {
            const busy = isPending && pendingId === l.id;
            return (
              <tr key={l.id} className="border-b border-rule align-top last:border-b-0 hover:bg-paper-sunk">
                <td className="px-4 py-3 font-medium text-ink">
                  <Link href={`/listing/${l.id}`} className="hover:text-brand-strong">{l.title}</Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">{l.sellerName}</td>
                <td className="px-4 py-3 text-ink-soft">{CATEGORY_MAP[l.categoryId]?.name ?? l.categoryId}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={l.status} />
                  {errorId === l.id && <div className="mt-1 text-xs text-danger">Action failed — try again.</div>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1.5">
                    {l.gaVerified ? (
                      <Badge tone="brand">GA Verified</Badge>
                    ) : l.gaAccessConfirmed ? (
                      <Badge tone="gold">Access confirmed</Badge>
                    ) : (
                      <Badge tone="neutral">No access yet</Badge>
                    )}
                    {l.loomVideoUrl && (
                      <a
                        href={l.loomVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs font-semibold text-brand-strong hover:text-brand-hover"
                      >
                        <PlaySquare size={12} /> Loom
                      </a>
                    )}
                    {l.gaAccessConfirmed && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => toggleGaVerified(l.id, !l.gaVerified)}
                        className={`${BTN_NEUTRAL} !px-2 !py-1`}
                      >
                        {l.gaVerified ? "Unverify" : "Mark GA Verified"}
                      </button>
                    )}
                  </div>
                </td>
                <td className="mono px-4 py-3">{fmtUSD(l.price)}</td>
                <td className="mono px-4 py-3 text-ink-faint">{l.createdAt}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={`/dashboard/admin/listings/${l.id}/edit`}
                      className={BTN_NEUTRAL}
                    >
                      Edit
                    </Link>
                    {l.status === "draft" && (
                      <button type="button" disabled={busy} onClick={() => updateStatus(l.id, "published")}
                        className={BTN_CONFIRM}>
                        Publish
                      </button>
                    )}
                    {l.status === "pending_review" && (
                      <>
                        <button type="button" disabled={busy} onClick={() => updateStatus(l.id, "published")}
                          className={BTN_CONFIRM}>
                          Approve
                        </button>
                        <button type="button" disabled={busy} onClick={() => updateStatus(l.id, "archived")}
                          className={BTN_DANGER}>
                          Reject
                        </button>
                      </>
                    )}
                    {l.status === "published" && (
                      <>
                        <button type="button" disabled={busy} onClick={() => updateStatus(l.id, "sold")}
                          className={BTN_NEUTRAL}>
                          Mark as Sold
                        </button>
                        <button type="button" disabled={busy} onClick={() => updateStatus(l.id, "draft")}
                          className={BTN_NEUTRAL}>
                          Unpublish
                        </button>
                      </>
                    )}
                    {l.status === "sold" && (
                      <button type="button" disabled={busy} onClick={() => updateStatus(l.id, "published")}
                        className={BTN_NEUTRAL}>
                        Revert to Published
                      </button>
                    )}
                    {l.status !== "archived" && (
                      <button type="button" disabled={busy} onClick={() => updateStatus(l.id, "archived")}
                        className={BTN_DANGER}>
                        Delete
                      </button>
                    )}
                    {l.status === "archived" && (
                      <button type="button" disabled={busy} onClick={() => updateStatus(l.id, "draft")}
                        className={BTN_NEUTRAL}>
                        Restore
                      </button>
                    )}
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
