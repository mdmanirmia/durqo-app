import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "dq_vid";
const DEDUPE_MS = 30 * 60 * 1000;
const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|uptime/i;

// Nov 21, 2026: records one listing page view (see migration 065). Called
// once per page load by <ListingViewTracker />. Everything is decided here
// on the server: published listings only, the seller and admins are not
// counted, obvious bots are ignored, and the same visitor re-opening the
// same listing within 30 minutes counts once.
export async function POST(request: Request) {
  let listingId = "";
  try {
    const body = (await request.json()) as { listingId?: unknown };
    if (typeof body.listingId === "string") listingId = body.listingId;
  } catch {
    // ignore malformed bodies
  }
  if (!/^[0-9a-f-]{36}$/i.test(listingId)) return NextResponse.json({ ok: false });

  const ua = (await headers()).get("user-agent") ?? "";
  if (!ua || BOT_RE.test(ua)) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false });

  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  const { data: listing } = await admin.from("listings").select("seller_id, status").eq("id", listingId).maybeSingle();
  if (!listing || (listing.status !== "published" && listing.status !== "sold")) return NextResponse.json({ ok: true });
  if (user && user.id === listing.seller_id) return NextResponse.json({ ok: true });
  if (user) {
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role === "admin") return NextResponse.json({ ok: true });
  }

  const jar = await cookies();
  let visitorKey = user?.id ?? jar.get(VISITOR_COOKIE)?.value ?? "";
  let setCookie = false;
  if (!visitorKey) {
    visitorKey = `anon:${crypto.randomUUID()}`;
    setCookie = true;
  } else if (!user && !visitorKey.startsWith("anon:")) {
    visitorKey = `anon:${visitorKey}`;
  }

  const since = new Date(Date.now() - DEDUPE_MS).toISOString();
  const { data: recent } = await admin
    .from("listing_views")
    .select("id")
    .eq("listing_id", listingId)
    .eq("visitor_key", visitorKey)
    .gte("viewed_at", since)
    .limit(1);
  if (!recent || recent.length === 0) {
    await admin.from("listing_views").insert({ listing_id: listingId, viewer_id: user?.id ?? null, visitor_key: visitorKey });
  }

  const res = NextResponse.json({ ok: true });
  if (setCookie) {
    res.cookies.set(VISITOR_COOKIE, visitorKey, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}
