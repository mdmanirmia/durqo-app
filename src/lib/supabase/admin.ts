import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SERVER-ONLY Supabase client authenticated with the service_role key —
// bypasses Row Level Security entirely. Never import this from a "use
// client" component or a file that could end up in the client bundle (the
// `server-only` import above makes that a build-time error, not just a
// convention).
//
// This exists for the admin dashboard (src/app/dashboard/admin/**): admin
// actions need to read/write listings, orders and profiles regardless of
// who owns them, which the regular RLS-scoped clients (src/lib/supabase/
// client.ts, server.ts) correctly refuse to do. Every call site MUST verify
// the caller is an actual admin (see requireAdmin() in
// src/lib/auth/admin.ts) before using this client — it enforces nothing on
// its own.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
