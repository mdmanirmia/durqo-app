import { createClient } from "@/lib/supabase/server";

// Backs /dashboard/seller/questions — the "seller er dashboard e notification
// jabe" half of the Sep 9, 2026 FAQ/Comments merge (see
// src/components/CommentsPanel.tsx and src/lib/actions/comments.ts for the
// listing-page half). Rather than adding a new "unread" column/migration,
// "needs the seller's attention" is derived directly from the data that
// already exists: a top-level comment (parent_id null) with a reply from the
// seller has already been handled; one with none yet (or only follow-ups
// from the buyer — see the Sep 10, 2026 comment below) is still open. No RLS
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
  // Sep 10, 2026: postComment() now lets the original asker follow up too
  // (not just the seller answering once), so a question can carry more than
  // one reply — a flat, chronological thread, same shape as CommentItem on
  // the listing page. `hasSellerReply` (rather than "replies.length > 0")
  // is what actually decides the "answered" split on the page below, since
  // a buyer's own follow-up shouldn't count as the seller having replied.
  replies: { author: string; isSeller: boolean; body: string; createdAt: string }[];
  hasSellerReply: boolean;
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
    .order("created_at", { ascending: true });
  if (!comments || comments.length === 0) return [];

  const authorIds = [...new Set(comments.map((c) => c.author_id))];
  const { data: authors } = await supabase.from("profiles").select("id, full_name").in("id", authorIds);
  const authorNames = Object.fromEntries((authors ?? []).map((a) => [a.id, a.full_name ?? "Member"]));

  const repliesByParent = new Map<string, (typeof comments)[number][]>();
  for (const c of comments) {
    if (!c.parent_id) continue;
    const list = repliesByParent.get(c.parent_id) ?? [];
    list.push(c);
    repliesByParent.set(c.parent_id, list);
  }

  return comments
    .filter((c) => !c.parent_id)
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .map((c) => {
      const replies = (repliesByParent.get(c.id) ?? []).map((r) => ({
        author: authorNames[r.author_id] ?? "Member",
        isSeller: r.author_id === sellerId,
        body: r.body,
        createdAt: String(r.created_at).slice(0, 10),
      }));
      return {
        id: c.id,
        listingId: c.listing_id,
        listingTitle: listingTitles[c.listing_id] ?? "Listing",
        author: authorNames[c.author_id] ?? "Member",
        body: c.body,
        createdAt: String(c.created_at).slice(0, 10),
        replies,
        hasSellerReply: replies.some((r) => r.isSeller),
      };
    });
}
