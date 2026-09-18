import { redirect } from "next/navigation";

// Sep 18, 2026: site owner asked that any broken/unknown URL (404s, and
// generally "broken page" navigation) send the visitor straight to the
// homepage instead of showing an error page. Per this Next.js version's own
// docs (node_modules/next/dist/docs/01-app/03-api-reference/03-file-
// conventions/not-found.md: "the root app/not-found.js ... handle[s] any
// unmatched URLs for your whole application"), a root-level not-found.tsx
// is exactly the hook that fires for every URL that doesn't match a real
// route — no proxy.ts/middleware change needed. It's a plain Server
// Component, so redirecting is just a normal redirect() call.
//
// This intentionally does NOT touch notFound() calls thrown deliberately
// from inside a specific route (e.g. an unknown listing slug) — those still
// render through this same file, which is correct: a link to a business
// that no longer exists is exactly the kind of "broken page" that should
// land the visitor back on the homepage rather than a dead end.
export default function NotFound() {
  redirect("/");
}
