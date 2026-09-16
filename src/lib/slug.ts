// Human-readable listing permalinks ("listing er url business name e hobe" —
// Sep 16, 2026 site owner request): every listing's public URL is its
// business name (e.g. durqo.com/listing/voyra-ai-trip-planner) instead of
// its raw UUID. The slug is generated once, from the title, at
// listing-creation time (see the insert in
// src/app/dashboard/seller/listings/new/page.tsx) and never regenerated
// when the title is edited later — so a listing's URL stays stable even
// after a rename, and nothing needs to redirect just because a seller or
// admin tweaked the title.
//
// `listings.slug` has a unique index (supabase/migrations/046_listing_slug.sql).
// Two sellers can title their listing the same thing, so any insert can
// collide — the caller retries the insert with nextSlugAttempt() on a
// unique-violation until it lands (see POSTGRES_UNIQUE_VIOLATION below).

const MAX_SLUG_LENGTH = 80;

export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
  return base || "listing";
}

// Postgres's unique_violation error code — what a slug-collision insert
// fails with, so the caller knows to retry rather than surface the error.
export const POSTGRES_UNIQUE_VIOLATION = "23505";

// attempt 1 is the bare slug; attempt 2+ appends a numbered suffix.
export function nextSlugAttempt(baseSlug: string, attempt: number): string {
  return attempt <= 1 ? baseSlug : `${baseSlug}-${attempt}`;
}

// A bare Durqo listing UUID (the old URL shape). The listing page uses this
// to recognize an old `/listing/<uuid>` link — shared or already indexed
// before this change — and 301/308-redirect it to the listing's canonical
// slug URL instead of 404ing.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
