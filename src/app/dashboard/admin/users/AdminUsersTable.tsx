"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { setUserRole, setUserActive, inviteUser } from "../actions";

export interface AdminUserRow {
  id: string;
  email: string;
  fullName: string;
  role: string;
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

function statusControl(u: AdminUserRow, busy: boolean, isSelf: boolean, toggleActive: (id: string, active: boolean) => void) {
  return u.isActive ? (
    <button
      type="button"
      disabled={busy || isSelf}
      onClick={() => toggleActive(u.id, false)}
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

  return (
    <div>
      <AddUserForm />

      {rows.length === 0 ? (
        <p className="text-sm text-ink-faint">No users found.</p>
      ) : (
        <>
          {/* Desktop: unchanged table, horizontal-scroll fallback only. */}
          <div className="hidden overflow-x-auto rounded-xl border border-rule md:block">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Verified</th>
                  <th className="px-4 py-3 font-medium">Purchases / Sales</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const busy = isPending && pendingId === u.id;
                  const isSelf = u.id === selfId;
                  return (
                    <tr key={u.id} className={`border-b border-rule align-top last:border-b-0 ${!u.isActive ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3 font-medium text-ink">{u.fullName}</td>
                      <td className="px-4 py-3 text-ink-soft">{u.email}</td>
                      <td className="px-4 py-3">{roleSelect(u, busy, isSelf, errorId, changeRole)}</td>
                      <td className="px-4 py-3 text-ink-soft">{u.isVerified ? "Yes" : "No"}</td>
                      <td className="mono px-4 py-3 text-ink-soft">{u.totalPurchases} / {u.totalSales}</td>
                      <td className="mono px-4 py-3 text-ink-faint">{u.createdAt}</td>
                      <td className="px-4 py-3">{statusControl(u, busy, isSelf, toggleActive)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: same data as a stacked card list. */}
          <div className="grid gap-3 md:hidden">
            {rows.map((u) => {
              const busy = isPending && pendingId === u.id;
              const isSelf = u.id === selfId;
              return (
                <div key={u.id} className={`rounded-xl border border-rule bg-paper-raised p-4 ${!u.isActive ? "opacity-60" : ""}`}>
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
                  <div className="border-t border-rule pt-3">{statusControl(u, busy, isSelf, toggleActive)}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
