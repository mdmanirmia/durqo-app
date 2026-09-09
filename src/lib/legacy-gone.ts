// Section 18: legacy WordPress/WooCommerce URLs (/product/*, /product-
// category/*, /shop/*) have no known mapping to a current listing or
// category in this app — nobody supplied the old site's URL-to-listing
// mapping, and guessing one would risk sending real traffic to the wrong
// business listing. Per the spec's own rule ("do not redirect every
// removed page to the homepage... if no relevant replacement exists,
// return 410 Gone"), these return a real 410 rather than a blanket
// redirect to / or /buy.
//
// If Durqo has the old site's indexed-URL export (Google Search Console's
// "Removed URLs" / "Not found (404)" report, or the WordPress export
// itself), a real slug -> listing/category mapping table should replace
// this file's blanket 410 with per-path 301s — see the final SEO report's
// "Legacy URLs handled" section for exactly what's needed to build that.
export function legacyGoneResponse(): Response {
  return new Response("This page has been permanently removed.", {
    status: 410,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
