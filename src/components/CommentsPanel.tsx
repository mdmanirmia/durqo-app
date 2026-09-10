"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { CommentItem } from "@/lib/types";
import { postComment } from "@/lib/actions/comments";

// Sep 9, 2026: the live question/answer feed that now lives directly inside
// the listing page's single "FAQ with Seller" card — the separate "Comments"
// card that used to sit next to it (read-only, dead "Log in to leave a
// comment" link) is gone; this is what replaced both its display and, new
// this pass, an actual working submit path for both a buyer's question and
// the seller's reply. See src/lib/actions/comments.ts for the write side and
// the auth rules (only the listing's own seller may reply).
export default function CommentsPanel({
  listingId,
  comments,
  isSeller,
  loggedIn,
}: {
  listingId: string;
  comments: CommentItem[];
  isSeller: boolean;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [replyOpenFor, setReplyOpenFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const [newText, setNewText] = useState("");
  const [newBusy, setNewBusy] = useState(false);
  const [newError, setNewError] = useState<string | null>(null);

  async function submitReply(parentId: string) {
    if (replyBusy || !replyText.trim()) return;
    setReplyBusy(true);
    setReplyError(null);
    const res = await postComment(listingId, replyText, parentId);
    setReplyBusy(false);
    if (res.error) {
      setReplyError(res.error);
      return;
    }
    setReplyText("");
    setReplyOpenFor(null);
    router.refresh();
  }

  async function submitNew() {
    if (newBusy || !newText.trim()) return;
    setNewBusy(true);
    setNewError(null);
    const res = await postComment(listingId, newText, null);
    setNewBusy(false);
    if (res.error) {
      setNewError(res.error);
      return;
    }
    setNewText("");
    router.refresh();
  }

  return (
    <div className="flex flex-col">
      {comments.length === 0 && (
        <p className="px-5 py-4 text-sm text-ink-faint sm:px-6">No questions yet — ask one below.</p>
      )}
      {comments.map((c, i) => (
        <div key={c.id} className={clsx("px-5 py-4 sm:px-6", i < comments.length - 1 && "border-b border-rule")}>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-ink">{c.author}</span>
            <span className="text-xs text-ink-faint">{c.createdAt}</span>
          </div>
          <p className="text-sm text-ink-soft">{c.body}</p>

          {c.replies?.map((r) => (
            <div key={r.id} className="mt-3 ml-4 border-l-2 border-rule pl-4">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-ink">{r.author}</span>
                <span className="text-xs text-ink-faint">{r.createdAt}</span>
              </div>
              <p className="text-sm text-ink-soft">{r.body}</p>
            </div>
          ))}

          {isSeller && !c.replies?.length && (
            <div className="mt-3 ml-4">
              {replyOpenFor === c.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                    placeholder="Write your answer…"
                    className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-brand"
                  />
                  {replyError && <span className="text-xs text-red-600">{replyError}</span>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => submitReply(c.id)}
                      disabled={replyBusy || !replyText.trim()}
                      className="rounded-md bg-brand-strong px-3 py-1.5 text-xs font-semibold text-paper-raised disabled:opacity-60"
                    >
                      {replyBusy ? "Posting…" : "Post answer"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyOpenFor(null);
                        setReplyError(null);
                      }}
                      className="rounded-md border border-rule px-3 py-1.5 text-xs font-semibold text-ink-soft"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setReplyOpenFor(c.id);
                    setReplyText("");
                    setReplyError(null);
                  }}
                  className="text-xs font-semibold text-brand-hover"
                >
                  Reply as seller &rarr;
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="border-t border-rule bg-paper-sunk px-5 py-4 sm:px-6">
        {loggedIn ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              rows={2}
              placeholder="Ask the seller a question…"
              className="rounded-lg border border-rule bg-paper-raised px-3 py-2 text-sm text-ink outline-none focus:border-brand"
            />
            {newError && <span className="text-xs text-red-600">{newError}</span>}
            <div>
              <button
                type="button"
                onClick={submitNew}
                disabled={newBusy || !newText.trim()}
                className="rounded-md bg-brand-strong px-4 py-2 text-sm font-semibold text-paper-raised disabled:opacity-60"
              >
                {newBusy ? "Posting…" : "Post question"}
              </button>
            </div>
          </div>
        ) : (
          <Link href="/login" className="text-sm font-semibold text-brand-hover">
            Log in to leave a comment &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}
