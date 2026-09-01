import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeCodeForTokens, listGa4Properties } from "@/lib/google-analytics";
import { syncListingGaStats } from "@/lib/data/ga-sync.server";

// Google redirects the browser here after the seller approves (or denies)
// the consent screen. `state` is the listingId we sent in
// buildGoogleAuthUrl() — we don't trust it blindly, we re-verify the
// currently-logged-in seller actually owns it before storing anything.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const listingId = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const redirectToListings = (message?: string, ok?: string) => {
    const dest = new URL("/dashboard/seller", url.origin);
    if (message) dest.searchParams.set("ga_error", message);
    if (ok) dest.searchParams.set("ga_connected", ok);
    return NextResponse.redirect(dest);
  };

  if (oauthError) {
    return redirectToListings(oauthError === "access_denied" ? "Google Analytics access was declined." : oauthError);
  }
  if (!code || !listingId) {
    return redirectToListings("Something went wrong connecting Google Analytics.");
  }

  const supabase = await createClient();
  if (!supabase) return redirectToListings("Backend isn't connected yet.");

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.redirect(new URL("/login", url.origin));

  const { data: listing } = await supabase
    .from("listings")
    .select("id, seller_id")
    .eq("id", listingId)
    .single();
  if (!listing || listing.seller_id !== userData.user.id) {
    return redirectToListings("You don't own this listing.");
  }

  const admin = createAdminClient();
  if (!admin) return redirectToListings("Backend isn't connected yet.");

  try {
    const tokens = await exchangeCodeForTokens(url.origin, code);
    if (!tokens.refresh_token) {
      // Google only returns a refresh_token on the FIRST consent for a given
      // account+scope; if the seller previously connected then revoked
      // access outside our app, a re-consent can come back without one.
      // access_type=offline + prompt=consent (see buildGoogleAuthUrl)
      // should always force a fresh one, but guard anyway.
      return redirectToListings("Google didn't grant lasting access — please try connecting again.");
    }

    const properties = await listGa4Properties(tokens.access_token);
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    if (properties.length === 0) {
      return redirectToListings("No Google Analytics 4 properties found on that Google account.");
    }

    if (properties.length === 1) {
      // Only one property visible — skip the picker and connect + sync
      // immediately.
      const p = properties[0];
      await admin.from("listing_ga_connections").upsert({
        listing_id: listingId,
        seller_id: userData.user.id,
        ga_property_id: p.propertyId,
        ga_property_display_name: p.propertyDisplayName,
        ga_account_display_name: p.accountDisplayName,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokenExpiresAt,
        status: "active",
        error_message: null,
        connected_at: new Date().toISOString(),
      });
      await syncListingGaStats(listingId);
      return redirectToListings(undefined, "1");
    }

    // Multiple properties — store the tokens without a property yet and
    // send the seller to the picker page.
    await admin.from("listing_ga_connections").upsert({
      listing_id: listingId,
      seller_id: userData.user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: tokenExpiresAt,
      status: "pending_property_selection",
      error_message: null,
      connected_at: new Date().toISOString(),
    });

    return NextResponse.redirect(new URL(`/dashboard/seller/listings/ga-connect?listingId=${listingId}`, url.origin));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't connect Google Analytics.";
    return redirectToListings(message);
  }
}
