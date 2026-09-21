"use client";

import { useMemo, useState, useTransition } from "react";
import { Trash2, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { setUserRole, setUserActive, inviteUser, deleteUnverifiedUsers } from "../actions";

export interface AdminUserRow {
  id: string;
  email: string;
  fullName: string;
  role: string;
  // What the user picked at signup ("Buy a business" / "Sell a business" on
  // the register form) — null for accounts created via the admin "Add
  // User" invite flow, which never records a self-selected signup role.
  // Kept separate from `role` (above), which is admin-editable and can
  // drift from this over time.
  joinedAs: "buyer" | "seller" | null;
  // Whether this account has clicked its email confirmation link
  // (auth.users.email_confirmed_at). Sep 21 2026: a wave of bot signups
  // that never confirm — full_name is a random string, the inbox is never
  // opened — was cluttering this table. Since the app requires a confirmed
  // email to log in at all, an unconfirmed row can't actually act as a
  // buyer or seller yet, so these live on their own "Unverified" tab below
  // (see `view` below) instead of the main list, with their own bulk
  // delete rather than being treated as real accounts.
  emailVerified: boolean;
  isVerified: boolean;
  isActive: boolean;
  totalPurchases: number;
  totalSales: number;
  createdAt: string;
}

const ROLES = ["buyer", "seller", "admin"] as const;

function AddUserForm() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("buyer");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      await inviteUser(email, fullName, role);
      setSent(true);
      setEmail("");
      setFullName("");
      setRole("buyer");
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the invite — try again.");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 flex items-center gap-1.5 rounded-lg bg-brand-strong px-4 py-2 text-sm font-semibold text-paper-raised hover:bg-brand"
      >
        <UserPlus size={15} /> Add User
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-rule bg-paper-raised p-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-ink-soft">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          className="rounded-md border border-rule-strong bg-paper px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-ink-soft">Name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          className="rounded-md border border-rule-strong bg-paper px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-ink-soft">Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])} className="mono rounded-md border border-rule-strong bg-paper px-2 py-2 text-xs">
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <button type="submit" disabled={sending} className="rounded-md bg-brand-strong px-4 py-2 text-sm font-semibold text-paper-raised disabled:opacity-60">
        {sending ? "Sending invite…" : "Send invite"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-rule-strong px-4 py-2 text-sm font-semibold text-ink-soft">
        Cancel
      </button>
      {sent && <p className="w-full text-xs text-brand-strong">Invite sent — they&rsquo;ll get an email to set their password and sign in.</p>}
      {error && <p className="w-full text-xs text-danger">{error}</p>}
    </form>
  );
}

// Shared between the desktop table cell and the mobile card layout below —
// called as a plain function (not a JSX component) so it doesn't trip
// react-hooks/static-components.
function roleSelect(
  u: AdminUserRow,
  busy: boolean,
  isSelf: boolean,
  errorId: string | null,
  changeRole: (id: string, role: string) => void
) {
  return (
    <>
      <select
        value={u.role}
        disabled={busy || isSelf}
        onChange={(e) => changeRole(u.id, e.target.value)}
        className="mono block w-full rounded-md border border-rule-strong bg-paper px-2 py-1.5 text-xs disabled:opacity-60"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      {isSelf && <div className="mt-1 text-xs text-ink-faint">This is you</div>}
      {errorId === u.id && <div className="mt-1 text-xs text-danger">Couldn&rsquo;t update — try again.</div>}
    </>
  );
}

// Shared between the desktop table cell and the mobile card layout, same
// reasoning as roleSelect()/statusControl() above.
function joinedAsBadge(u: AdminUserRow) {
  if (u.joinedAs === "seller") return <Badge tone="brand">Seller</Badge>;
  if (u.joinedAs === "buyer") return <Badge tone="neutral">Buyer</Badge>;
  return (
    <span className="text-xs text-ink-faint" title="Created via admin invite — no self-selected signup role">
      Invited
    </span>
  );
}

function statusControl(u: AdminUserRow, busy: boolean, isSelf: boolean, requestBlock: (id: string, name: string) => void, toggleActive: (id: string, active: boolean) => void) {
  return u.isActive ? (
    <button
      type="button"
      disabled={busy || isSelf}
      onClick={() => requestBlock(u.id, u.fullName)}
      title={isSelf ? "You can't deactivate your own account" : "Block this user's login"}
      className="rounded-md border border-danger px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger-soft disabled:opacity-60"
    >
      Block
    </button>
  ) : (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="danger" className="w-fit">Blocked</Badge>
      <button
        type="button"
        disabled={busy}
        onClick={() => toggleActive(u.id, true)}
        className="w-fit rounded-md border border-rule-strong px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-brand-strong hover:text-brand-strong disabled:opacity-60"
      >
        Unblock
      </button>
    </div>
  );
}

export default function AdminUsersTable({ rows, selfId }: { rows: AdminUserRow[]; selfId: string }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [blockTarget, setBlockTarget] = useState<{ id: string; name: string } | null>(null);

  // Sep 21 2026 ("unverified account gulo alada folder e dekhao jeno bulk
  // select kore delete korte pari" — show unverified accounts in their own
  // folder so they can be bulk-selected and deleted): split into two tabs
  // rather than one filtered list — "Users" (real, email-confirmed
  // accounts, the only ones that can actually log in and act as a buyer or
  // seller) and "Unverified" (the bot/spam-signup holding pen, with its own
  // bulk-select + delete). See AdminUserRow.emailVerified's comment.
  const [view, setView] = useState<"verified" | "unverified">("verified");
  const verifiedRows = useMemo(() => rows.filter((u) => u.emailVerified), [rows]);
  const unverifiedRows = useMemo(() => rows.filter((u) => !u.emailVerified), [rows]);
  const visibleRows = view === "verified" ? verifiedRows : unverifiedRows;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);
  const selectableIds = useMemo(() => unverifiedRows.map((u) => u.id), [unverifiedRows]);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));

  function switchView(next: "verified" | "unverified") {
    setView(next);
    setSelectedIds(new Set());
    setDeleteNotice(null);
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(selectableIds));
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDeleteSelected() {
    const ids = Array.from(selectedIds);
    setDeleteNotice(null);
    startDeleteTransition(async () => {
      try {
        const result = await deleteUnverifiedUsers(ids);
        setSelectedIds(new Set());
        setDeleteConfirmOpen(false);
        if (result.skipped > 0) {
          setDeleteNotice(
            `Deleted ${result.deleted} account${result.deleted === 1 ? "" : "s"}. ${result.skipped} skipped (already verified, no longer found, or your own account).`
          );
        }
      } catch (err) {
        setDeleteConfirmOpen(false);
        setDeleteNotice(err instanceof Error ? err.message : "Couldn't delete the selected accounts — try again.");
      }
    });
  }

  function changeRole(id: string, role: string) {
    setPendingId(id);
    setErrorId(null);
    startTransition(async () => {
      try {
        await setUserRole(id, role as never);
      } catch {
        setErrorId(id);
      } finally {
        setPendingId(null);
      }
    });
  }

  function toggleActive(id: string, active: boolean) {
    setPendingId(id);
    setErrorId(null);
    startTransition(async () => {
      try {
        await setUserActive(id, active);
      } catch {
        setErrorId(id);
      } finally {
        setPendingId(null);
      }
    });
  }

  function requestBlock(id: string, name: string) {
    setBlockTarget({ id, name });
  }

  return (
    <div>
      <AddUserForm />

      <div className="mb-4 flex items-center gap-1 border-b border-rule">
        <button
          type="button"
          onClick={() => switchView("verified")}
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${
            view === "verified" ? "border-brand-strong text-brand-strong" : "border-transparent text-ink-faint hover:text-ink-soft"
          }`}
        >
          Users ({verifiedRows.length})
        </button>
        <button
          type="button"
          onClick={() => switchView("unverified")}
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${
            view === "unverified" ? "border-brand-strong text-brand-strong" : "border-transparent text-ink-faint hover:text-ink-soft"
          }`}
        >
          Unverified ({unverifiedRows.length})
        </button>
      </div>

      {view === "unverified" && unverifiedRows.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rule-strong bg-paper-raised p-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-rule-strong" />
            Select all {selectableIds.length}
          </label>
          <button
            type="button"
            disabled={selectedIds.size === 0}
            onClick={() => setDeleteConfirmOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-danger px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={14} /> Delete selected{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
          </button>
        </div>
      )}

      {deleteNotice && <p className="mb-4 rounded-md border border-rule-strong bg-paper-raised px-3 py-2 text-xs text-ink-soft">{deleteNotice}</p>}

      {visibleRows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={view === "verified" ? "No users found" : "No unverified accounts"}
          body={
            view === "verified"
              ? "Everyone who signs up on Durqo will show up here."
              : "Every signup here has confirmed their email — nothing to clean up right now."
          }
        />
      ) : view === "verified" ? (
        <>
          {/* Desktop: unchanged table, horizontal-scroll fallback only. */}
          <div className="hidden overflow-x-auto rounded-xl border border-rule md:block">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Joined As</th>
                  <th className="px-4 py-3 font-medium">Verified</th>
                  <th className="px-4 py-3 font-medium">Purchases / Sales</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {verifiedRows.map((u) => {
                  const busy = isPending && pendingId === u.id;
                  const isSelf = u.id === selfId;
                  return (
                    <tr key={u.id} className={`border-b border-rule align-top last:border-b-0 ${!u.isActive ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3 font-medium text-ink">{u.fullName}</td>
                      <td className="px-4 py-3 text-ink-soft">{u.email}</td>
                      <td className="px-4 py-3">{roleSelect(u, busy, isSelf, errorId, changeRole)}</td>
                      <td className="px-4 py-3">{joinedAsBadge(u)}</td>
                      <td className="px-4 py-3 text-ink-soft">{u.isVerified ? "Yes" : "No"}</td>
                      <td className="mono px-4 py-3 text-ink-soft">{u.totalPurchases} / {u.totalSales}</td>
                      <td className="mono px-4 py-3 text-ink-faint">{u.createdAt}</td>
                      <td className="px-4 py-3">{statusControl(u, busy, isSelf, requestBlock, toggleActive)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: same data as a stacked card list. */}
          <div className="grid gap-3 md:hidden">
            {verifiedRows.map((u) => {
              const busy = isPending && pendingId === u.id;
              const isSelf = u.id === selfId;
              return (
                <div key={u.id} className={`min-w-0 rounded-xl border border-rule bg-paper-raised p-4 ${!u.isActive ? "opacity-60" : ""}`}>
                  <div className="mb-3 min-w-0">
                    <div className="truncate font-medium text-ink">{u.fullName}</div>
                    <div className="truncate text-xs text-ink-faint">{u.email}</div>
                  </div>
                  <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <div className="mb-1 text-xs text-ink-faint">Role</div>
                      {roleSelect(u, busy, isSelf, errorId, changeRole)}
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-ink-faint">Joined As</div>
                      {joinedAsBadge(u)}
                    </div>
                    <div>
                      <div className="text-xs text-ink-faint">Verified</div>
                      <div>{u.isVerified ? "Yes" : "No"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-ink-faint">Purchases / Sales</div>
                      <div className="mono">{u.totalPurchases} / {u.totalSales}</div>
                    </div>
                    <div>
                      <div className="text-xs text-ink-faint">Joined</div>
                      <div className="mono text-ink-faint">{u.createdAt}</div>
                    </div>
                  </div>
                  <div className="border-t border-rule pt-3">{statusControl(u, busy, isSelf, requestBlock, toggleActive)}</div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Unverified tab: a deliberately lean column set — Status/Block,
              Verified, and Purchases/Sales are all meaningless for an
              account that has never been able to log in, so they're left
              out rather than shown as permanent zeroes/No. */}
          <div className="hidden overflow-x-auto rounded-xl border border-rule md:block">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-rule-strong" />
                  </th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Joined As</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {unverifiedRows.map((u) => (
                  <tr key={u.id} className="border-b border-rule align-top last:border-b-0">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelected(u.id)} className="h-4 w-4 rounded border-rule-strong" />
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{u.fullName}</td>
                    <td className="px-4 py-3 text-ink-soft">{u.email}</td>
                    <td className="px-4 py-3">{joinedAsBadge(u)}</td>
                    <td className="mono px-4 py-3 text-ink-faint">{u.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {unverifiedRows.map((u) => (
              <div key={u.id} className="min-w-0 rounded-xl border border-rule bg-paper-raised p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-ink">{u.fullName}</div>
                    <div className="truncate text-xs text-ink-faint">{u.email}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(u.id)}
                    onChange={() => toggleSelected(u.id)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-rule-strong"
                  />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <div className="mb-1 text-xs text-ink-faint">Joined As</div>
                    {joinedAsBadge(u)}
                  </div>
                  <div>
                    <div className="text-xs text-ink-faint">Joined</div>
                    <div className="mono text-ink-faint">{u.createdAt}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={blockTarget !== null}
        title={`Block ${blockTarget?.name}?`}
        body="They'll be signed out and won't be able to log back in, create or edit listings, send messages (including in an active deal), or request a payout withdrawal until you unblock them. Their existing listings, orders, and history are untouched and this can be reversed at any time."
        confirmLabel="Block user"
        danger
        busy={isPending && pendingId === blockTarget?.id}
        onConfirm={() => {
          if (blockTarget) toggleActive(blockTarget.id, false);
          setBlockTarget(null);
        }}
        onCancel={() => setBlockTarget(null)}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={`Delete ${selectedIds.size} unverified account${selectedIds.size === 1 ? "" : "s"}?`}
        body="These accounts never confirmed their email, so they've never been able to log in or do anything on Durqo. Deleting them removes the account permanently — this can't be undone. Any account that verifies in the meantime is skipped automatically."
        confirmLabel="Delete accounts"
        danger
        busy={isDeleting}
        onConfirm={handleDeleteSelected}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
