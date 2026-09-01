import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildGoogleAuthUrl, getGoogleOAuthConfig } from "@/lib/google-analytics";

// Entry point for the seller's "Connect Google Analytics" button
// (linked from /dashboard/seller, per listing). Verifies the caller owns
// the listing, then redirects straight to Google's OAuth consent screen.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const listingId = url.searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.json({ error: "Missing listingId." }, { status: 400 });
  }

  if (!getGoogleOAuthConfig()) {
    return NextResponse.redirect(
      new URL(`/dashboard/seller?ga_error=${encodeURIComponent("Google Analytics connection isn't set up yet.")}`, url.origin)
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 500 });
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, seller_id")
    .eq("id", listingId)
    .single();

  if (!listing || listing.seller_id !== userData.user.id) {
    return NextResponse.json({ error: "You don't own this listing." }, { status: 403 });
  }

  return NextResponse.redirect(buildGoogleAuthUrl(url.origin, listingId));
}
