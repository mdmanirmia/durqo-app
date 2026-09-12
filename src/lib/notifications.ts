import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;
type AuthUser = Awaited<ReturnType<AdminClient["auth"]["admin"]["listUsers"]>>["data"]["users"][number];

// Auth emails aren't stored on `profiles` — Supabase only exposes them via
// the admin API, which pages results (a single listUsers() call defaults to
// ~50 users, and even the app's own more-generous perPage:200/1000 calls
// still have a ceiling). A 2026-09-12 audit found three admin list pages
// (users, verification, withdrawals) calling listUsers() for a single page
// only, silently showing "—"/null for any user past that page's cutoff —
// increasingly likely as the marketplace grows past that many signups.
// This pages through every result once so every call site gets the same
// complete answer regardless of how many auth users now exist. Capped at
// 50 pages (50,000 users at the 1000/page size below) purely as a loop
// safety net, not an expected ceiling.
export async function listAllAuthUsers(admin: AdminClient): Promise<AuthUser[]> {
  const perPage = 1000;
  const all: AuthUser[] = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data) break;
    all.push(...data.users);
    if (data.users.length < perPage) break;
  }
  return all;
}

export async function getUserEmails(admin: AdminClient, userIds: string[]): Promise<Record<string, string>> {
  if (userIds.length === 0) return {};
  const wanted = new Set(userIds);
  const out: Record<string, string> = {};
  for (const u of await listAllAuthUsers(admin)) {
    if (wanted.has(u.id) && u.email) out[u.id] = u.email;
  }
  return out;
}
