// 2026-09-19 fix ("GA/GSC/Proof of Income images not always visible after
// publishing"): every gallery upload in this app builds its Supabase
// Storage object path by gluing the browser's original File.name straight
// onto the end (see uploadGallery() in
// src/app/dashboard/seller/listings/new/page.tsx, addListingImages() in
// src/lib/actions/listing-edit.ts, and uploadVerificationDocuments() in
// src/lib/data/verification.client.ts).
//
// That path is later handed to Supabase's getPublicUrl(), which only ever
// runs it through the browser's own encodeURI() — and encodeURI()
// deliberately leaves URL-*reserved* characters alone (#, ?, &, ;, =, %, +,
// among others) since they're technically legal URI characters. A screenshot
// whose original filename happens to contain one of those — "GSC Report
// #2.png", "Traffic breakdown (100%).png", "Q3 stats?.png" — gets a public
// URL that's silently truncated (or otherwise mis-parsed) at that
// character. The upload itself succeeds and the listing_images row saves
// fine, so nothing ever errors; the screenshot just fails to load on the
// published listing page, and only for the sellers unlucky enough to have
// picked a filename with one of those characters in it — hence "not always
// visible": it was never about GA vs. GSC vs. Proof of Income specifically,
// it was about whatever the seller's screenshot happened to be named.
//
// Stripping the original filename down to a safe, boring character set
// before it ever becomes part of a storage path removes this whole class of
// bug permanently, regardless of which character ends up mattering to some
// future URL/CDN layer — rather than trying to chase and allowlist/escape
// every individual special character one at a time.
export function sanitizeFileName(name: string): string {
  const lastDot = name.lastIndexOf(".");
  const hasExt = lastDot > 0 && lastDot < name.length - 1;
  const base = hasExt ? name.slice(0, lastDot) : name;
  const ext = hasExt ? name.slice(lastDot + 1) : "";

  const cleanBase =
    base
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "") || "file";
  const cleanExt = ext.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase();

  return cleanExt ? `${cleanBase}.${cleanExt}` : cleanBase;
}
