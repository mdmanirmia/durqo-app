import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Status for the seller's own Google Analytics connections (My Listings
// table). Deliberately goes through the admin client + a manual
// seller_id filter rather than exposing listing_ga_connections to the
// client at all (see migration 013 — that table has no RLS policies on
// purpose, since it holds OAuth tokens) and only ever returns the
// non-sensitive columns.
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ connections: [] });

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ connections: [] });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ connections: [] });

  const { data } = await admin
    .from("listing_ga_connections")
    .select("listing_id, status, ga_property_display_name, last_synced_at, error_message")
    .eq("seller_id", userData.user.id);

  return NextResponse.json({ connections: data ?? [] });
}
