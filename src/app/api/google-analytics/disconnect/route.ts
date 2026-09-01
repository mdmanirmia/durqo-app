import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revokeToken } from "@/lib/google-analytics";

// Removes a listing's Google Analytics connection: revokes the token with
// Google (best-effort) and deletes both the connection row and the public
// stats row, so the listing page falls back to the manual GA section.
export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 500 });

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "You need to be logged in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const listingId: string | undefined = body?.listingId;
  if (!listingId) return NextResponse.json({ error: "Missing listingId." }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 500 });

  const { data: connection } = await admin
    .from("listing_ga_connections")
    .select("seller_id, refresh_token, access_token")
    .eq("listing_id", listingId)
    .single();
  if (!connection || connection.seller_id !== userData.user.id) {
    return NextResponse.json({ error: "You don't own this listing." }, { status: 403 });
  }

  if (connection.refresh_token) await revokeToken(connection.refresh_token);

  await admin.from("listing_ga_connections").delete().eq("listing_id", listingId);
  await admin.from("listing_ga_public_stats").delete().eq("listing_id", listingId);

  return NextResponse.json({ ok: true });
}
