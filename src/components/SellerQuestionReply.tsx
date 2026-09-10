"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postComment } from "@/lib/actions/comments";
import { emitCountsChanged } from "@/lib/count-events";

// Reply box for one open question on /dashboard/seller/questions. Deliberately
// separate from CommentsPanel (the listing page's own feed) rather than
// reused there — that component renders a single listing's whole thread
// inline; this one is a standalone control dropped into a flat, cross-listing
// question list, with no thread/composer chrome of its own to share.
export default function SellerQuestionReply({ questionId, listingId }: { questionId: string; listingId: string }) {
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
    emitCountsChanged();
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-brand-hover"
      >
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
        placeholder="Write your answer…"
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
          {busy ? "Posting…" : "Post answer"}
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
