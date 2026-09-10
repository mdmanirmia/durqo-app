"use client";

import { createClient } from "@/lib/supabase/client";

// Lightweight client-side count powering the seller dashboard's live
// "Comments" nav badge (Sep 10, 2026 request: "joto gulo comment due
// thakbe, oi gulor shongkha thakbe Comment-er pashe" — show how many
// questions are still waiting for a seller reply, right next to the nav
// item). Mirrors the same "unanswered = a top-level comment with no reply
// row" rule as getSellerQuestions() (src/lib/data/seller-questions.server.ts),
// but only counts rather than hydrating listing titles/author names, since
// this is called from DashboardShell (a client component rendered on every
// seller dashboard page) rather than from a single Server Component page.
export async function getSellerUnansweredCommentsCount(): Promise<number> {
  const supabase = createClient();
  if (!supabase) return 0;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: listings } = await supabase.from("listings").select("id").eq("seller_id", user.id);
  if (!listings || listings.length === 0) return 0;
  const listingIds = listings.map((l) => l.id);

  const { data: comments } = await supabase.from("comments").select("id, parent_id").in("listing_id", listingIds);
  if (!comments || comments.length === 0) return 0;

  const repliedParentIds = new Set(comments.filter((c) => c.parent_id).map((c) => c.parent_id));
  return comments.filter((c) => !c.parent_id && !repliedParentIds.has(c.id)).length;
}
