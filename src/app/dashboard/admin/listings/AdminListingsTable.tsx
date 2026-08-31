"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CATEGORY_MAP } from "@/lib/categories";
import { fmtUSD } from "@/lib/format";
import { setListingStatus } from "../actions";

export interface AdminListingRow {
  id: string;
  title: string;
  categoryId: string;
  status: string;
  price: number;
  sellerName: string;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  published: "Published",
  sold: "Sold",
  archived: "Archived",
};

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-paper-raised text-ink-faint",
  pending_review: "bg-amber-100 text-amber-800",
  published: "bg-brand-soft text-brand-strong",
  sold: "bg-blue-100 text-blue-800",
  archived: "bg-red-100 text-red-700",
};

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

  if (rows.length === 0) {
    return <p className="text-sm text-ink-faint">No listings match this filter.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-rule">
      <table className="w-full min-w-[820px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Seller</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Listed</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => {
            const busy = isPending && pendingId === l.id;
            return (
              <tr key={l.id} className="border-b border-rule align-top last:border-b-0">
                <td className="px-4 py-3 font-medium text-ink">
                  <Link href={`/listing/${l.id}`} className="hover:text-brand-strong">{l.title}</Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">{l.sellerName}</td>
                <td className="px-4 py-3 text-ink-soft">{CATEGORY_MAP[l.categoryId]?.name ?? l.categoryId}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[l.status] ?? "bg-paper-raised text-ink-faint"}`}>
                    {STATUS_LABEL[l.status] ?? l.status}
                  </span>
                  {errorId === l.id && <div className="mt-1 text-xs text-red-600">Action failed — try again.</div>}
                </td>
                <td className="mono px-4 py-3">{fmtUSD(l.price)}</td>
                <td className="mono px-4 py-3 text-ink-faint">{l.createdAt}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={`/dashboard/admin/listings/${l.id}/edit`}
                      className="rounded-lg border border-rule-strong px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-brand-strong hover:text-brand-strong"
                    >
                      Edit
                    </Link>
                    {l.status === "draft" && (
                      <button type="button" disabled={busy} onClick={() => updateStatus(l.id, "published")}
                        className="rounded-lg bg-brand-strong px-3 py-1.5 text-xs font-semibold text-paper-raised disabled:opacity-60">
                        Publish
                      </button>
                    )}
                    {l.status === "pending_review" && (
                      <>
                        <button type="button" disabled={busy} onClick={() => updateStatus(l.id, "published")}
                          className="rounded-lg bg-brand-strong px-3 py-1.5 text-xs font-semibold text-paper-raised disabled:opacity-60">
                          Approve
                        </button>
                        <button type="button" disabled={busy} onClick={() => updateStatus(l.id, "archived")}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60">
                          Reject
                        </button>
                      </>
                    )}
                    {l.status === "published" && (
                      <>
                        <button type="button" disabled={busy} onClick={() => updateStatus(l.id, "sold")}
                          className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700 disabled:opacity-60">
                          Mark as Sold
                        </button>
                        <button type="button" disabled={busy} onClick={() => updateStatus(l.id, "draft")}
                          className="rounded-lg border border-rule-strong px-3 py-1.5 text-xs font-semibold text-ink-soft disabled:opacity-60">
                          Unpublish
                        </button>
                      </>
                    )}
                    {l.status === "sold" && (
                      <button type="button" disabled={busy} onClick={() => updateStatus(l.id, "published")}
                        className="rounded-lg border border-rule-strong px-3 py-1.5 text-xs font-semibold text-ink-soft disabled:opacity-60">
                        Revert to Published
                      </button>
                    )}
                    {l.status !== "archived" && (
                      <button type="button" disabled={busy} onClick={() => updateStatus(l.id, "archived")}
                        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60">
                        Delete
                      </button>
                    )}
                    {l.status === "archived" && (
                      <button type="button" disabled={busy} onClick={() => updateStatus(l.id, "draft")}
                        className="rounded-lg border border-rule-strong px-3 py-1.5 text-xs font-semibold text-ink-soft disabled:opacity-60">
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
