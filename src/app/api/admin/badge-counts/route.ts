import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Powers the live admin nav badges in DashboardShell.tsx (2026-09-13
// dashboard audit follow-up — "admin nav badge counts" deferred item):
// pending listings, pending verification submissions, and pending
// withdrawal requests are exactly the three things an admin needs to check
// on without going and looking, mirroring what the Admin Overview page
// already surfaces as stat cards/links.
//
// A plain API route rather than a `.client.ts` Supabase call like every
// other nav badge (Messages, Wishlist, My Listings…) because none of these
// three counts are readable through RLS with the admin's own session
// client — schema.sql has no admin-aware policy on `listings`,
// `withdrawal_requests`, or the verification columns on `profiles`, so
// every other admin page already goes through the service-role client
// (createAdminClient) via a Server Component or Server Action instead.
// This route does the same, gated the same way requireAdmin() gates every
// other admin route — just returning JSON instead of redirecting, since a
// redirect response isn't meaningful to a fetch() caller.
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 500 });

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userData.user.id).single();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Not an admin." }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ listings: 0, verification: 0, withdrawals: 0 });

  const [{ count: listings }, { count: verification }, { count: withdrawals }] = await Promise.all([
    admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("verification_status", "pending"),
    admin.from("withdrawal_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return NextResponse.json({ listings: listings ?? 0, verification: verification ?? 0, withdrawals: withdrawals ?? 0 });
}
