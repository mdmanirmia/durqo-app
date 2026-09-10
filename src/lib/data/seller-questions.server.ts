import { createClient } from "@/lib/supabase/server";

// Backs /dashboard/seller/questions — the "seller er dashboard e notification
// jabe" half of the Sep 9, 2026 FAQ/Comments merge (see
// src/components/CommentsPanel.tsx and src/lib/actions/comments.ts for the
// listing-page half). Rather than adding a new "unread" column/migration,
// "needs the seller's attention" is derived directly from the data that
// already exists: a top-level comment (parent_id null) with no reply yet is
// an open question; one with a reply has already been handled. No RLS
// change was needed either — `comments_select_all`/`listings_select_published`
// (own listings always readable to their seller) already cover every read
// this does.
export interface SellerQuestion {
  id: string;
  listingId: string;
  listingTitle: string;
  author: string;
  body: string;
  createdAt: string;
  reply?: { author: string; body: string; createdAt: string };
}

export async function getSellerQuestions(sellerId: string): Promise<SellerQuestion[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: listings } = await supabase.from("listings").select("id, title").eq("seller_id", sellerId);
  if (!listings || listings.length === 0) return [];
  const listingTitles = Object.fromEntries(listings.map((l) => [l.id, l.title]));
  const listingIds = listings.map((l) => l.id);

  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .in("listing_id", listingIds)
    .order("created_at", { ascending: false });
  if (!comments || comments.length === 0) return [];

  const authorIds = [...new Set(comments.map((c) => c.author_id))];
  const { data: authors } = await supabase.from("profiles").select("id, full_name").in("id", authorIds);
  const authorNames = Object.fromEntries((authors ?? []).map((a) => [a.id, a.full_name ?? "Member"]));

  const repliesByParent = new Map<string, (typeof comments)[number]>();
  for (const c of comments) {
    if (c.parent_id) repliesByParent.set(c.parent_id, c);
  }

  return comments
    .filter((c) => !c.parent_id)
    .map((c) => {
      const reply = repliesByParent.get(c.id);
      return {
        id: c.id,
        listingId: c.listing_id,
        listingTitle: listingTitles[c.listing_id] ?? "Listing",
        author: authorNames[c.author_id] ?? "Member",
        body: c.body,
        createdAt: String(c.created_at).slice(0, 10),
        reply: reply
          ? {
              author: authorNames[reply.author_id] ?? "You",
              body: reply.body,
              createdAt: String(reply.created_at).slice(0, 10),
            }
          : undefined,
      };
    });
}
