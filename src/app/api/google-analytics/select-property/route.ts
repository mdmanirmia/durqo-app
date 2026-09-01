import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncListingGaStats } from "@/lib/data/ga-sync.server";
import type { Ga4Property } from "@/lib/google-analytics";

// Finishes connecting when the seller's Google account had more than one
// GA4 property — called from the /dashboard/seller/listings/ga-connect
// picker page once they choose one from the list.
export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 500 });

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "You need to be logged in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const listingId: string | undefined = body?.listingId;
  const property: Ga4Property | undefined = body?.property;
  if (!listingId || !property?.propertyId) {
    return NextResponse.json({ error: "Missing listingId or property." }, { status: 400 });
  }

  const { data: listing } = await supabase.from("listings").select("id, seller_id").eq("id", listingId).single();
  if (!listing || listing.seller_id !== userData.user.id) {
    return NextResponse.json({ error: "You don't own this listing." }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 500 });

  const { error } = await admin
    .from("listing_ga_connections")
    .update({
      ga_property_id: property.propertyId,
      ga_property_display_name: property.propertyDisplayName,
      ga_account_display_name: property.accountDisplayName,
      status: "active",
    })
    .eq("listing_id", listingId)
    .eq("seller_id", userData.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    await syncListingGaStats(listingId);
  } catch (err) {
    // Property is saved either way — surface the sync error but don't fail
    // the selection itself, the seller can retry with "Sync now".
    return NextResponse.json({ ok: true, syncError: err instanceof Error ? err.message : "Sync failed." });
  }

  return NextResponse.json({ ok: true });
}
