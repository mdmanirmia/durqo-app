import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listGa4Properties, refreshAccessToken } from "@/lib/google-analytics";

// Backs the property-picker page: re-lists the GA4 properties visible to
// the Google account that was just connected, for a listing still sitting
// in "pending_property_selection". We don't persist the property list
// itself (only the tokens), so this re-fetches it live each time the
// picker page loads.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const listingId = url.searchParams.get("listingId");
  if (!listingId) return NextResponse.json({ error: "Missing listingId." }, { status: 400 });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 500 });

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "You need to be logged in." }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 500 });

  const { data: connection } = await admin
    .from("listing_ga_connections")
    .select("refresh_token, seller_id")
    .eq("listing_id", listingId)
    .single();

  if (!connection || connection.seller_id !== userData.user.id || !connection.refresh_token) {
    return NextResponse.json({ error: "No pending Google Analytics connection for this listing." }, { status: 404 });
  }

  try {
    const fresh = await refreshAccessToken(connection.refresh_token);
    const properties = await listGa4Properties(fresh.access_token);
    return NextResponse.json({ properties });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Couldn't load properties." }, { status: 500 });
  }
}
