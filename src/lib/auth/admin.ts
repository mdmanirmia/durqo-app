import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
};

// Server-side gate for every admin route/action. Re-derives the caller's
// identity from the session cookie (never trusts anything the client sends)
// and checks profiles.role === 'admin' in the database on every call — per
// Next.js Server Actions guidance, render-time gating alone is not a
// security boundary, so this must be called again inside each Server
// Action, not just at the top of the page component.
//
// Redirects to /login (no session) or /dashboard/buyer (signed in, not an
// admin) rather than throwing, so it's safe to call directly from a page
// component's top level.
export async function requireAdmin(): Promise<AdminProfile> {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard/buyer");
  }

  // profiles has no email column — it comes from the auth session itself.
  return { ...profile, email: user.email ?? null } as AdminProfile;
}
