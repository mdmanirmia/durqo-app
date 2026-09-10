import { createClient } from "@/lib/supabase/server";

// Backs /dashboard/buyer/comments (Sep 10, 2026 request: a buyer should be
// able to see, in their own dashboard, every question they've asked across
// any listing plus whatever replies came back — not just on the listing
// page where they originally asked — and reply from there too). Mirrors the
// shape and RLS assumptions of getSellerQuestions()
// (src/lib/data/seller-questions.server.ts): `comments_select_all` is public
// read, and `listings_select_published` already lets anyone read a
// published listing's id/title/seller_id, so no new RLS is needed for a
// buyer to look up listings they don't own.
export interface BuyerComment {
  id: string;
  listingId: string;
  listingTitle: string;
  body: string;
  createdAt: string;
  // Flat, chronological thread — the seller's answer(s) and this buyer's own
  // follow-up(s), same one-level-deep shape postComment() enforces on write
  // (see its Sep 10, 2026 comment).
  replies: { author: string; isSeller: boolean; body: string; createdAt: string }[];
}

export async function getBuyerComments(buyerId: string): Promise<BuyerComment[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: own } = await supabase
    .from("comments")
    .select("id, listing_id, body, created_at")
    .eq("author_id", buyerId)
    .is("parent_id", null)
    .order("created_at", { ascending: false });
  if (!own || own.length === 0) return [];

  const ownIds = own.map((c) => c.id);
  const listingIds = [...new Set(own.map((c) => c.listing_id as string))];

  const [{ data: listings }, { data: replies }] = await Promise.all([
    supabase.from("listings").select("id, title, seller_id").in("id", listingIds),
    supabase
      .from("comments")
      .select("id, parent_id, author_id, body, created_at")
      .in("parent_id", ownIds)
      .order("created_at", { ascending: true }),
  ]);
  const listingById = new Map((listings ?? []).map((l) => [l.id, l]));

  const authorIds = [...new Set((replies ?? []).map((r) => r.author_id as string))];
  const { data: authors } =
    authorIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", authorIds)
      : { data: [] as { id: string; full_name: string | null }[] };
  const authorNames = Object.fromEntries((authors ?? []).map((a) => [a.id, a.full_name ?? "Member"]));

  const repliesByParent = new Map<string, NonNullable<typeof replies>>();
  for (const r of replies ?? []) {
    const list = repliesByParent.get(r.parent_id as string) ?? [];
    list.push(r);
    repliesByParent.set(r.parent_id as string, list);
  }

  return own.map((c) => {
    const listing = listingById.get(c.listing_id as string);
    return {
      id: c.id,
      listingId: c.listing_id,
      listingTitle: listing?.title ?? "Listing",
      body: c.body,
      createdAt: String(c.created_at).slice(0, 10),
      replies: (repliesByParent.get(c.id) ?? []).map((r) => ({
        author: authorNames[r.author_id as string] ?? "Member",
        isSeller: !!listing && r.author_id === listing.seller_id,
        body: r.body,
        createdAt: String(r.created_at).slice(0, 10),
      })),
    };
  });
}
