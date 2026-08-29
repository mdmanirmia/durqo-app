"use client";

import { useState, useTransition } from "react";
import { setUserRole } from "../actions";

export interface AdminUserRow {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isVerified: boolean;
  totalPurchases: number;
  totalSales: number;
  createdAt: string;
}

const ROLES = ["buyer", "seller", "admin"] as const;

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

  if (rows.length === 0) {
    return <p className="text-sm text-ink-faint">No users found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-rule">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Verified</th>
            <th className="px-4 py-3 font-medium">Purchases / Sales</th>
            <th className="px-4 py-3 font-medium">Joined</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => {
            const busy = isPending && pendingId === u.id;
            const isSelf = u.id === selfId;
            return (
              <tr key={u.id} className="border-b border-rule align-top last:border-b-0">
                <td className="px-4 py-3 font-medium text-ink">{u.fullName}</td>
                <td className="px-4 py-3 text-ink-soft">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={busy || isSelf}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="mono rounded-md border border-rule-strong bg-paper px-2 py-1 text-xs disabled:opacity-60"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {isSelf && <div className="mt-1 text-xs text-ink-faint">This is you</div>}
                  {errorId === u.id && <div className="mt-1 text-xs text-red-600">Couldn&rsquo;t update — try again.</div>}
                </td>
                <td className="px-4 py-3 text-ink-soft">{u.isVerified ? "Yes" : "No"}</td>
                <td className="mono px-4 py-3 text-ink-soft">{u.totalPurchases} / {u.totalSales}</td>
                <td className="mono px-4 py-3 text-ink-faint">{u.createdAt}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
