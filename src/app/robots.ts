import type { MetadataRoute } from "next";

// Section 14. Private/auth/transactional routes get an explicit Disallow
// here as a courtesy to crawlers (it saves them a wasted fetch), but per
// Section 14/15 the real protection is each page's own server-rendered
// noindex directive (see the pages themselves) plus real auth gating
// (requireSession()/requireAdmin()) — robots.txt alone is never relied on
// for privacy, and login/register are deliberately NOT disallowed here so
// Google can still read their page-level noindex tag.
//
// Deliberately NOT disallowing /buy's sort/filter/category query
// combinations here, even though the spec's draft robots.txt listed
// `Disallow: /?sort=` / `Disallow: /?filter=` as an example: this app's
// actual sort/filter state lives on /buy's query string (not the root
// path those patterns match), and — per this same spec's own Section 14
// caveat about login/register — disallowing a URL in robots.txt stops
// Google from ever crawling it, which means it never sees that URL's
// noindex tag either. /buy/page.tsx's generateMetadata already emits the
// correct noindex,follow for every non-canonical filter/sort/search
// combination (Section 17); blocking those same URLs here would work
// against that, not reinforce it. /admin/ is listed even though the app
// has no top-level /admin route today (only /dashboard/admin) — kept for
// spec fidelity and as a no-cost guard if one is ever added.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/dashboard/",
        "/account/",
        "/checkout/",
        "/cart",
        "/wishlist/",
        "/messages/",
        "/api/",
      ],
    },
    sitemap: "https://www.durqo.com/sitemap.xml",
  };
}
