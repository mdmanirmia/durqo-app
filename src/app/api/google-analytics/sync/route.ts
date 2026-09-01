import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncListingGaStats } from "@/lib/data/ga-sync.server";

// "Sync now" button on the seller's Google Analytics connection status.
// Also where a future scheduled job would call in to match Flippa's
// "metrics auto-update monthly" cadence — not built yet (see project doc).
export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 500 });

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "You need to be logged in." }, { status: 401 });

  let listingId: string | undefined;
  try {
    const body = await request.json();
    listingId = body.listingId;
  } catch {
    // fall through — listingId stays undefined, caught below
  }
  if (!listingId) return NextResponse.json({ error: "Missing listingId." }, { status: 400 });

  const { data: listing } = await supabase.from("listings").select("id, seller_id").eq("id", listingId).single();
  if (!listing || listing.seller_id !== userData.user.id) {
    return NextResponse.json({ error: "You don't own this listing." }, { status: 403 });
  }

  try {
    await syncListingGaStats(listingId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
