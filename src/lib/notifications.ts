import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

// Auth emails aren't stored on `profiles` — Supabase only exposes them via
// the admin API. This generalizes the lookup pattern first written in
// submitVerification() (dashboard/seller/verification/actions.ts) so the
// listing-update and purchase notification flows don't each re-implement
// it. `perPage: 1000` is deliberately higher than the other call sites in
// this codebase (which default to ~50) — a miss here silently drops a
// buyer/seller notification instead of just an admin one, so it's worth
// being generous.
export async function getUserEmails(admin: AdminClient, userIds: string[]): Promise<Record<string, string>> {
  if (userIds.length === 0) return {};
  const wanted = new Set(userIds);
  const out: Record<string, string> = {};
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  for (const u of data?.users ?? []) {
    if (wanted.has(u.id) && u.email) out[u.id] = u.email;
  }
  return out;
}
