// 2026-09-19 ("Business Overview porjonto login chara dekha jabe, full
// listing dekhte hole log in korte hobe" — gate the listing page behind
// login/register): shared guard for the `?next=` param that carries a
// visitor back to whatever page they were trying to view (e.g. a listing)
// once they've logged in or registered. Used by LoginForm.tsx,
// RegisterForm.tsx, and /auth/callback/route.ts — all three take a `next`
// value that ultimately came from a URL, so all three re-validate it here
// rather than trusting it blindly, since /auth/callback in particular hands
// it straight to NextResponse.redirect().
//
// Only ever allows a same-origin, root-relative path: must start with a
// single "/", never "//" (protocol-relative, e.g. "//evil.com") and never
// contain "://" (an absolute URL, e.g. "/x?u=https://evil.com" wouldn't
// match either of those but also isn't a bare path issue — "://" anywhere
// in the string is enough to reject it). Anything else returns null so the
// caller falls back to its normal default destination instead of ever
// redirecting off-site.
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) return null;
  return value;
}
