import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FETCH_TIMEOUT_MS = 6000;

// Best-effort Open Graph / Twitter preview-image lookup for a business's
// website — the same image Facebook/Slack/Twitter show when the link is
// shared. Used to auto-fill a listing's cover photo from its Business URL
// so sellers don't have to upload one themselves. Any failure (site blocks
// scraping, times out, isn't HTML, has no preview image) resolves to
// { imageUrl: null } rather than an error — a missing cover photo should
// never block creating or viewing a listing.
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return NextResponse.json({ imageUrl: null }, { status: 400 });

  let target: URL;
  try {
    target = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return NextResponse.json({ imageUrl: null }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(target.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DurqoLinkPreview/1.0; +https://durqo.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return NextResponse.json({ imageUrl: null });

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) return NextResponse.json({ imageUrl: null });

    const html = await res.text();
    const head = html.slice(0, 100_000); // the relevant <meta> tags are always near the top

    const match =
      head.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ||
      head.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i) ||
      head.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
      head.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);

    if (!match) return NextResponse.json({ imageUrl: null });

    const imageUrl = new URL(match[1], target).toString();
    return NextResponse.json({ imageUrl });
  } catch {
    return NextResponse.json({ imageUrl: null });
  } finally {
    clearTimeout(timer);
  }
}
