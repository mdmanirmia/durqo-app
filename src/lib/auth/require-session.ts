import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Server-side login gate for every buyer/seller dashboard route (mirrors
// requireAdmin() in lib/auth/admin.ts, minus the role check — either
// dashboard is open to any signed-in account, buyer or seller, since a
// seller browsing their own purchases as a buyer, or vice versa via the
// "Switch dashboard" link, is expected behavior here, not a privilege
// boundary). Re-derives the caller from the session cookie so an
// unauthenticated visitor is bounced to /login before the dashboard shell,
// the "Add New Business" form, the messages inbox, or any other page nested
// under here ever renders — instead of the page rendering an empty/loading
// state and only failing silently later when a write hits RLS.
//
// Mounted via a layout.tsx in both dashboard/buyer and dashboard/seller, so
// it runs once per route tree rather than needing to be called from every
// individual page.
export async function requireSession() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return user;
}
