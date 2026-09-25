"use client";

// Mutual buyer/seller reviews after a sale completes (Sep 24, 2026 —
// see 057_order_reviews.sql for the full design/rationale). Every write
// goes through the submit_order_review() RPC, which does all validation
// server-side (order actually completed, caller really a party to it,
// rating in range, no double-submit) — this file is a thin client
// wrapper, same shape as buyer-verification.client.ts.
//
// Reads go through a plain table select. RLS (order_reviews_select_
// participant) already implements the double-blind reveal: a row you
// authored always comes back; a row written *about* you only comes back
// once the other side has also reviewed the same order, or 14 days have
// passed — so this file never has to re-implement that logic itself.
import { createClient } from "@/lib/supabase/client";

export type ReviewerRole = "buyer" | "seller";

export interface OrderReview {
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerRole: ReviewerRole;
  rating: number;
  comment: string | null;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(r: any): OrderReview {
  return {
    orderId: r.order_id,
    reviewerId: r.reviewer_id,
    revieweeId: r.reviewee_id,
    reviewerRole: r.reviewer_role,
    rating: Number(r.rating),
    comment: r.comment ?? null,
    createdAt: r.created_at,
  };
}

export async function getOrderReviews(orderIds: string[]): Promise<OrderReview[]> {
  const supabase = createClient();
  if (!supabase || orderIds.length === 0) return [];
  const { data, error } = await supabase.from("order_reviews").select("*").in("order_id", orderIds);
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function submitOrderReview(
  orderId: string,
  reviewerRole: ReviewerRole,
  revieweeId: string,
  rating: number,
  comment: string
): Promise<{ ok: true; review: OrderReview } | { ok: false; message: string }> {
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend isn't connected." };
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, message: "Please log in again." };
  const trimmedComment = comment.trim();
  const { error } = await supabase.rpc("submit_order_review", {
    p_order_id: orderId,
    p_rating: rating,
    p_comment: trimmedComment || null,
  });
  if (error) {
    // Postgres RAISE EXCEPTION messages come through as error.message
    // verbatim (see submit_order_review()'s own friendly wording) —
    // shown as-is rather than a generic fallback, same as every other
    // RPC-backed action in this codebase.
    return { ok: false, message: error.message || "Couldn't submit your review - try again." };
  }
  // Built from what we already know rather than parsed back off the RPC
  // response — every value here is exactly what the RPC was just asked
  // to write (and validated server-side), so there's nothing to gain by
  // round-tripping it, and it sidesteps depending on PostgREST's exact
  // single-row-vs-array shape for a function that returns a composite
  // row rather than SETOF.
  return {
    ok: true,
    review: {
      orderId,
      reviewerId: userData.user.id,
      revieweeId,
      reviewerRole,
      rating,
      comment: trimmedComment || null,
      createdAt: new Date().toISOString(),
    },
  };
}
