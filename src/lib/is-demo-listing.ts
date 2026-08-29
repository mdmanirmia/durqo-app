// Demo/mock listings (src/lib/mock-data.ts) are what several pages fall
// back to whenever a Supabase read comes back empty or errors — e.g. the
// `listings` table has no `published` rows yet. Those mock entries use
// human-readable ids like "DQ-0412" as placeholders; they don't exist as
// rows in the database at all. Real listings always have a uuid primary
// key (see supabase/schema.sql: `id uuid primary key default
// uuid_generate_v4()`).
//
// Any write keyed on a listing id (wishlists.listing_id, cart_items.listing_id,
// orders.listing_id — all typed `uuid` in schema.sql) will be rejected by
// Postgres with a 22P02 "invalid input syntax for type uuid" error if the
// id isn't a real uuid. Buttons that trigger those writes should check this
// first and disable themselves for demo listings instead of silently
// failing on click.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isRealListingId(id: string): boolean {
  return UUID_RE.test(id);
}
