import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractYoutubeVideoId } from "@/lib/format";
import { fetchYoutubeVideoInfo } from "@/lib/youtube";

export const dynamic = "force-dynamic";

// Auto-fills the Top Performing Videos form fields (Title/Views/Likes/
// Duration/Upload date) from a pasted YouTube video URL — GET
// ?url=<youtube video url>. Requires the caller to be signed in (any
// authenticated user, not scoped to a specific listing's owner — the
// seller "new listing" form calls this before the listing itself even
// exists as a DB row, so there's nothing to check ownership against yet;
// the admin/seller edit form reuses the same endpoint for consistency).
// This keeps the endpoint from being an open, unauthenticated relay for the
// platform's YouTube API quota, even though the video metadata itself is
// public data either way.
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: userData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!userData.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get("url");
  const videoId = extractYoutubeVideoId(videoUrl);
  if (!videoId) {
    return NextResponse.json({ error: "Not a recognizable YouTube video URL." }, { status: 400 });
  }

  const info = await fetchYoutubeVideoInfo(videoId);
  if (!info) {
    return NextResponse.json({ error: "Couldn't fetch video details from YouTube." }, { status: 404 });
  }

  return NextResponse.json(info);
}
