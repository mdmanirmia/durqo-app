import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/categories";

const BASE_URL = "https://www.durqo.com";

// Section 16. Only canonical, indexable URLs — no login/register/account/
// dashboard/cart/checkout/wishlist/messages/search-result/filter/sort/
// draft/preview/rejected/private/API/non-canonical URLs. `lastModified`
// uses each listing's real `updated_at` column (never "now" for every URL) —
// see the code comment in src/lib/data/listings.server.ts's
// getSitemapListings() for the one caveat: nothing in this app writes to
// that column on an edit today, so it currently equals `created_at` for
// every row. That's still the real, honest database value, not a
// fabricated one; wiring listing edits to bump it is a separate,
// non-SEO change worth doing later.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/buy`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/sell`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${BASE_URL}/buy/${c.id}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  let listingEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("listings")
        .select("id, updated_at")
        .in("status", ["published", "sold"]);
      if (!error && data) {
        listingEntries = data.map((row: { id: string; updated_at: string | null }) => ({
          url: `${BASE_URL}/listing/${row.id}`,
          lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }));
      } else if (error) {
        console.warn("[sitemap] listings query failed, sitemap will omit listing URLs:", error.message);
      }
    }
  } catch (err) {
    console.warn("[sitemap] unexpected error building listing entries:", err);
  }

  return [...staticEntries, ...categoryEntries, ...listingEntries];
}
