"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postComment } from "@/lib/actions/comments";

// Reply box for one of the buyer's own questions on
// /dashboard/buyer/comments (Sep 10, 2026 request — "answer pele dashboard e
// dekhte pabe and reply korte parbe": once a buyer's question gets an
// answer, they should be able to see it and reply, right from their own
// dashboard). Deliberately a separate small component from
// SellerQuestionReply rather than a shared/parameterized one — same reasoning
// as that component's own comment: this drops into a flat, cross-listing
// question list with no thread/composer chrome of its own, just different
// copy and, on the write side, postComment() enforces that only the
// original asker (or the seller) may post into a given question's replies.
export default function BuyerCommentReply({ questionId, listingId }: { questionId: string; listingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy || !text.trim()) return;
    setBusy(true);
    setError(null);
    const res = await postComment(listingId, text, questionId);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setText("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-brand-hover">
        Reply &rarr;
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Write your reply…"
        className="rounded-lg border border-rule bg-paper-raised px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        autoFocus
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={busy || !text.trim()}
          className="rounded-md bg-brand-strong px-3 py-1.5 text-xs font-semibold text-paper-raised disabled:opacity-60"
        >
          {busy ? "Posting…" : "Post reply"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-md border border-rule px-3 py-1.5 text-xs font-semibold text-ink-soft"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
