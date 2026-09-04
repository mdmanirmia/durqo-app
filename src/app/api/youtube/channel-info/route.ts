import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchYoutubeChannelOverview } from "@/lib/youtube";

export const dynamic = "force-dynamic";

// Auto-fills the Channel Statistics form fields (Total Subscribers/Total
// Views/Total Videos/Channel Age) AND supplies the extra fields needed for
// the public "YouTube Channel Overview" panel (identity, avg views/video,
// recent avg views/likes, engagement rate) — GET ?url=<youtube channel url>.
// Same auth gating rationale as /api/youtube/video-info: any signed-in user
// may call this (the seller "new listing" form calls it before the listing
// row exists), not an open unauthenticated relay for the platform's quota.
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: userData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!userData.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const channelUrl = searchParams.get("url");
  if (!channelUrl) {
    return NextResponse.json({ error: "Missing channel URL." }, { status: 400 });
  }

  const overview = await fetchYoutubeChannelOverview(channelUrl);
  if (!overview) {
    return NextResponse.json({ error: "Couldn't fetch channel details from YouTube." }, { status: 404 });
  }

  return NextResponse.json(overview);
}
