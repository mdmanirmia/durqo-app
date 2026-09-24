"use client";

// Mutual buyer/seller review prompt for a completed order (Sep 24,
// 2026 — see 057_order_reviews.sql for the full design). Shared by both
// dashboard/buyer/orders and dashboard/seller/orders — the only thing
// that differs between the two sides is `myRole` and what the resulting
// rating is used for afterwards (a buyer's review of a seller feeds the
// public rating shown on that seller's listings; a seller's review of a
// buyer never surfaces anywhere public — see the migration's own
// top-of-file note on why that's a deliberate, scoped-down choice).
import { useState } from "react";
import { Star } from "lucide-react";
import { type OrderRow, canReviewOrder } from "@/lib/data/orders.client";
import { submitOrderReview, type ReviewerRole } from "@/lib/data/reviews.client";

function Stars({ value, onChange, size = 20 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={onChange ? `Rate ${n} out of 5` : undefined}
        >
          <Star size={size} className={n <= value ? "fill-gold text-gold" : "text-rule-strong"} />
        </button>
      ))}
    </div>
  );
}

export default function OrderReviewPanel({
  order,
  myRole,
  onSubmitted,
}: {
  order: OrderRow;
  myRole: ReviewerRole;
  onSubmitted: (review: { rating: number; comment: string | null }) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (order.status !== "completed") return null;

  const counterpartLabel = myRole === "buyer" ? "seller" : "buyer";

  async function handleSubmit() {
    if (rating === 0) {
      setError("Choose a star rating first.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await submitOrderReview(order.id, myRole, order.counterpartyId, rating, comment);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onSubmitted({ rating: result.review.rating, comment: result.review.comment });
    } finally {
      setSubmitting(false);
    }
  }

  if (order.myReview) {
    return (
      <div className="rounded-lg border border-rule bg-paper px-3 py-2.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-ink-soft">Your review of {order.counterpartyName}</span>
          <Stars value={order.myReview.rating} size={14} />
        </div>
        {order.myReview.comment && <p className="mt-1 text-ink-soft">{order.myReview.comment}</p>}
        {order.counterpartReview ? (
          <div className="mt-2 border-t border-rule pt-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-ink-soft">{order.counterpartyName}&rsquo;s review of you</span>
              <Stars value={order.counterpartReview.rating} size={14} />
            </div>
            {order.counterpartReview.comment && <p className="mt-1 text-ink-soft">{order.counterpartReview.comment}</p>}
          </div>
        ) : (
          <p className="mt-2 border-t border-rule pt-2 text-ink-faint">
            Once the {counterpartLabel} leaves their review too, you&rsquo;ll both see each other&rsquo;s.
          </p>
        )}
      </div>
    );
  }

  if (!canReviewOrder(order)) return null;

  return (
    <div className="rounded-lg border border-brand/30 bg-brand-soft px-3 py-3 text-xs">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-semibold text-brand-strong">Rate your experience with {order.counterpartyName}</span>
        <Stars value={rating} onChange={setRating} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment"
        rows={2}
        className="mb-2 w-full rounded-md border border-rule-strong bg-paper px-2.5 py-1.5 text-xs text-ink focus:border-brand-strong focus:outline-none"
      />
      {error && <p className="mb-2 text-danger">{error}</p>}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="rounded-md bg-brand px-3 py-1.5 font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </div>
  );
}
