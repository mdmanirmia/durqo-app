"use client";

import { useState, useTransition } from "react";
import { Check, Copy, FileSpreadsheet, Mail, Phone, Trash2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { fmtUSD } from "@/lib/format";
import { getCategoryMetricConfig } from "@/lib/valuation";
import {
  setValuationLeadStatus,
  deleteValuationLead,
  deleteValuationLeads,
  syncAllValuationLeadsToSheet,
  type ValuationLeadStatus,
} from "../actions";

export interface AdminValuationLeadRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  categoryId: string;
  categoryName: string;
  monthlyRevenue: number;
  monthlyProfit: number;
  businessAgeYears: number;
  // Sep 27, 2026 same-day follow-up: the one category-specific Quick Stat
  // the /valuation form asks for (see src/lib/valuation.ts's
  // CATEGORY_METRICS) — null when the category has no configured metric,
  // the seller left it blank, or the lead predates this column.
  categoryMetricValue: number | null;
  estimatedLow: number;
  estimatedHigh: number;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

// e.g. "Subscribers: 50,000" — reads the label from the same config the
// form itself uses, so a change to the wording there never has to be
// duplicated here.
function categoryMetricLabel(row: AdminValuationLeadRow): string | null {
  if (row.categoryMetricValue === null) return null;
  const config = getCategoryMetricConfig(row.categoryId);
  if (!config) return null;
  return `${config.label}: ${row.categoryMetricValue.toLocaleString("en-US")}`;
}

const STATUS_TONE: Record<string, "brand" | "gold" | "neutral"> = {
  new: "gold",
  contacted: "brand",
  closed: "neutral",
};

function ageLabel(years: number): string {
  if (years < 1) return `${Math.round(years * 12)} mo`;
  return `${years.toFixed(years % 1 === 0 ? 0 : 1)} yr`;
}

function statusSelect(row: AdminValuationLeadRow, busy: boolean, onChange: (status: ValuationLeadStatus) => void) {
  return (
    <select
      value={row.status}
      disabled={busy}
      onChange={(e) => onChange(e.target.value as ValuationLeadStatus)}
      className="mono rounded-md border border-rule-strong bg-paper px-2 py-1.5 text-xs disabled:opacity-60"
    >
      <option value="new">New</option>
      <option value="contacted">Contacted</option>
      <option value="closed">Closed</option>
    </select>
  );
}

// 2026-10-02 ("email gulo jeno copy kora jai sei besbostah koro" - arrange
// it so the emails can be copied): a one-click copy affordance for the
// lead's email/phone, which were previously plain unselectable-looking text
// next to their icon. navigator.clipboard can reject in rare contexts
// (non-HTTPS, permissions) - caught and ignored rather than surfaced, since
// the value is still right there in the row to select and copy by hand.
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard unavailable - nothing to do; the text is still visible.
        }
      }}
      title={copied ? "Copied" : `Copy ${label}`}
      aria-label={`Copy ${label}`}
      className="shrink-0 rounded p-0.5 text-ink-faint hover:bg-paper-sunk hover:text-brand-strong"
    >
      {copied ? <Check size={11} className="text-brand-strong" /> : <Copy size={11} />}
    </button>
  );
}

// A real component (not a plain helper function like statusSelect above) —
// it needs its own per-row useState for the in-progress note text, and a
// hook can only be called from an actual component/hook, never from a
// plain function invoked in a loop during another component's render.
function NoteInput({
  row,
  busy,
  onSave,
}: {
  row: AdminValuationLeadRow;
  busy: boolean;
  onSave: (note: string) => void;
}) {
  const [value, setValue] = useState(row.adminNote ?? "");
  return (
    <input
      value={value}
      disabled={busy}
      placeholder="Add a note..."
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== (row.adminNote ?? "")) onSave(value);
      }}
      className="w-full rounded-md border border-rule-strong bg-paper px-2 py-1.5 text-xs disabled:opacity-60"
    />
  );
}

export default function AdminValuationLeadsTable({ rows }: { rows: AdminValuationLeadRow[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 2026-10-02 ("delete korar o bebostha koro" - add a way to delete too):
  // one row at a time, behind the same ConfirmDialog pattern used for every
  // other destructive admin action in this codebase (see AdminUsersTable's
  // bulk delete) - deleteTarget holds the row so the dialog can name who
  // it's about to remove.
  const [deleteTarget, setDeleteTarget] = useState<AdminValuationLeadRow | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 2026-10-02 same-day follow-up ("bulk select kore delete korar option
  // koro" — add a bulk-select-and-delete option): same selectedIds/
  // toggleSelectAll/toggleSelected shape as AdminUsersTable's bulk delete,
  // kept entirely separate from the single-row deleteTarget flow above
  // (different confirm copy, different transition/notice state) rather than
  // routing a one-row delete through the bulk path, since the two already
  // existed as distinct, independently useful affordances.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const [isBulkDeleting, startBulkDeleteTransition] = useTransition();
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  // Holds either a success summary ("Deleted 3 leads.") or an error message —
  // same single-notice-string shape as AdminUsersTable's deleteNotice.
  const [bulkDeleteNotice, setBulkDeleteNotice] = useState<string | null>(null);

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // 2026-10-02 ("lead hisebe ki excel file e auto sync kora jai" — can
  // leads auto-sync to an excel file): ongoing per-submission sync happens
  // server-side with no UI at all (see src/app/valuation/actions.ts); this
  // button only covers the one-time (or re-run-whenever) full backfill into
  // the sheet, for leads that were already here before that was wired up.
  const [isSyncing, startSyncTransition] = useTransition();
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  function handleSyncToSheet() {
    setSyncNotice(null);
    startSyncTransition(async () => {
      const result = await syncAllValuationLeadsToSheet();
      setSyncNotice(
        result.ok
          ? `Synced ${result.count} lead${result.count === 1 ? "" : "s"} to the Google Sheet.`
          : (result.error ?? "Couldn't sync to the Google Sheet - try again.")
      );
    });
  }

  function handleBulkDeleteConfirmed() {
    const ids = Array.from(selectedIds);
    setBulkDeleteNotice(null);
    startBulkDeleteTransition(async () => {
      try {
        const result = await deleteValuationLeads(ids);
        setSelectedIds(new Set());
        setBulkDeleteConfirmOpen(false);
        setBulkDeleteNotice(`Deleted ${result.deleted} lead${result.deleted === 1 ? "" : "s"}.`);
      } catch (err) {
        setBulkDeleteConfirmOpen(false);
        setBulkDeleteNotice(err instanceof Error ? err.message : "Couldn't delete the selected leads - try again.");
      }
    });
  }

  function updateStatus(id: string, status: ValuationLeadStatus, note?: string) {
    setPendingId(id);
    setErrorId(null);
    startTransition(async () => {
      try {
        await setValuationLeadStatus(id, status, note);
      } catch {
        setErrorId(id);
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteError(null);
    startDeleteTransition(async () => {
      try {
        await deleteValuationLead(target.id);
        setDeleteTarget(null);
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Couldn't delete this lead - try again.");
      }
    });
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No valuation leads yet"
        body="Every submission from the /valuation tool will show up here."
      />
    );
  }

  return (
    <>
      {/* 2026-10-02 same-day follow-up ("bulk select kore delete korar
          option koro"): select-all + bulk delete toolbar, same shape as
          AdminUsersTable's. Shown whenever there's at least one row — every
          lead here is bulk-selectable (no admin/self/listings guard to
          apply, unlike the Users table). */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rule-strong bg-paper-raised p-3 shadow-[var(--shadow-card)]">
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
          <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-rule-strong" />
          Select all {rows.length}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSyncToSheet}
            title="One-time full backfill into the Google Sheet - new leads sync there automatically going forward"
            className="flex items-center gap-1.5 rounded-md border border-rule-strong px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper-sunk disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileSpreadsheet size={14} /> {isSyncing ? "Syncing…" : "Sync all to Google Sheet"}
          </button>
          <button
            type="button"
            disabled={selectedIds.size === 0}
            onClick={() => setBulkDeleteConfirmOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-danger px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={14} /> Delete selected{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
          </button>
        </div>
      </div>
      {syncNotice && (
        <p className="mb-4 rounded-md border border-rule-strong bg-paper-raised px-3 py-2 text-xs text-ink-soft">{syncNotice}</p>
      )}
      {bulkDeleteNotice && (
        <p className="mb-4 rounded-md border border-rule-strong bg-paper-raised px-3 py-2 text-xs text-ink-soft">{bulkDeleteNotice}</p>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-rule bg-paper-raised shadow-[var(--shadow-card)] md:block">
        <table className="w-full min-w-[1140px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-rule-strong" />
              </th>
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Revenue / Profit</th>
              <th className="px-4 py-3 font-medium">Age</th>
              <th className="px-4 py-3 font-medium">Estimated Range</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const busy = isPending && pendingId === row.id;
              return (
                <tr key={row.id} className="border-b border-rule align-top last:border-b-0">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleSelected(row.id)}
                      className="h-4 w-4 rounded border-rule-strong"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{row.name}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
                      <Mail size={11} className="shrink-0" />
                      <span>{row.email}</span>
                      <CopyButton value={row.email} label="email" />
                    </div>
                    {row.phone && (
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
                        <Phone size={11} className="shrink-0" />
                        <span>{row.phone}</span>
                        <CopyButton value={row.phone} label="phone number" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {row.categoryName}
                    {categoryMetricLabel(row) && (
                      <div className="mono mt-0.5 text-xs text-ink-faint">{categoryMetricLabel(row)}</div>
                    )}
                  </td>
                  <td className="mono px-4 py-3 text-ink-soft">
                    {fmtUSD(row.monthlyRevenue)} / {fmtUSD(row.monthlyProfit)}
                  </td>
                  <td className="mono px-4 py-3 text-ink-soft">{ageLabel(row.businessAgeYears)}</td>
                  <td className="mono px-4 py-3 font-semibold text-brand-strong">
                    {fmtUSD(row.estimatedLow)} &ndash; {fmtUSD(row.estimatedHigh)}
                  </td>
                  <td className="px-4 py-3">
                    <NoteInput row={row} busy={busy} onSave={(note) => updateStatus(row.id, row.status as ValuationLeadStatus, note)} />
                  </td>
                  <td className="mono px-4 py-3 text-ink-faint">{row.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1.5">
                      {statusSelect(row, busy, (status) => updateStatus(row.id, status))}
                      {errorId === row.id && <span className="text-[0.68rem] text-danger">Couldn&rsquo;t update - try again.</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(row)}
                      title="Delete lead"
                      aria-label="Delete lead"
                      className="rounded-md p-1.5 text-ink-faint hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {rows.map((row) => {
          const busy = isPending && pendingId === row.id;
          return (
            <div key={row.id} className="min-w-0 rounded-2xl border border-rule bg-paper-raised p-4 shadow-[var(--shadow-card)]">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={() => toggleSelected(row.id)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-rule-strong"
                  />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-ink">{row.name}</div>
                    <div className="flex items-center gap-1 text-xs text-ink-faint">
                      <span className="truncate">{row.email}</span>
                      <CopyButton value={row.email} label="email" />
                    </div>
                    {row.phone && (
                      <div className="flex items-center gap-1 text-xs text-ink-faint">
                        <span className="truncate">{row.phone}</span>
                        <CopyButton value={row.phone} label="phone number" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>{row.status}</Badge>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(row)}
                    title="Delete lead"
                    aria-label="Delete lead"
                    className="rounded-md p-1.5 text-ink-faint hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <div className="mb-1 text-xs text-ink-faint">Category</div>
                  <div className="text-ink-soft">{row.categoryName}</div>
                  {categoryMetricLabel(row) && (
                    <div className="mono mt-0.5 text-xs text-ink-faint">{categoryMetricLabel(row)}</div>
                  )}
                </div>
                <div>
                  <div className="mb-1 text-xs text-ink-faint">Age</div>
                  <div className="mono text-ink-soft">{ageLabel(row.businessAgeYears)}</div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-ink-faint">Revenue / Profit</div>
                  <div className="mono text-ink-soft">{fmtUSD(row.monthlyRevenue)} / {fmtUSD(row.monthlyProfit)}</div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-ink-faint">Estimated Range</div>
                  <div className="mono font-semibold text-brand-strong">{fmtUSD(row.estimatedLow)} &ndash; {fmtUSD(row.estimatedHigh)}</div>
                </div>
              </div>
              <div className="mb-3">
                <div className="mb-1 text-xs text-ink-faint">Note</div>
                <NoteInput row={row} busy={busy} onSave={(note) => updateStatus(row.id, row.status as ValuationLeadStatus, note)} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="mono text-xs text-ink-faint">{row.createdAt}</span>
                {statusSelect(row, busy, (status) => updateStatus(row.id, status))}
              </div>
              {errorId === row.id && <p className="mt-2 text-xs text-danger">Couldn&rsquo;t update - try again.</p>}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete this lead?`}
        body={
          <>
            This permanently removes {deleteTarget?.name ?? "this lead"}&rsquo;s valuation submission
            ({deleteTarget?.email}) - this can&rsquo;t be undone.
            {deleteError && <span className="mt-2 block text-danger">{deleteError}</span>}
          </>
        }
        confirmLabel="Delete lead"
        danger
        busy={isDeleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />

      <ConfirmDialog
        open={bulkDeleteConfirmOpen}
        title={`Delete ${selectedIds.size} lead${selectedIds.size === 1 ? "" : "s"}?`}
        body="This permanently removes the selected valuation submissions - this can't be undone."
        confirmLabel="Delete leads"
        danger
        busy={isBulkDeleting}
        onConfirm={handleBulkDeleteConfirmed}
        onCancel={() => setBulkDeleteConfirmOpen(false)}
      />
    </>
  );
}
