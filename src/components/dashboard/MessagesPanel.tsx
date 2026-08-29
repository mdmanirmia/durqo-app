"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Send } from "lucide-react";
import DashboardShell, { DashboardNavItem } from "./DashboardShell";
import { createClient } from "@/lib/supabase/client";
import {
  getConversations,
  getThread,
  sendMessage,
  markThreadRead,
  getNewConversationInfo,
  type ConversationSummary,
  type MessageRow,
  type ThreadTarget,
} from "@/lib/data/messages.client";

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function MessagesPanel({
  title,
  nav,
  switchHref,
  switchLabel,
}: {
  title: string;
  nav: DashboardNavItem[];
  switchHref: string;
  switchLabel: string;
}) {
  const params = useSearchParams();
  const [myId, setMyId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [selected, setSelected] = useState<ThreadTarget | null>(null);
  const [thread, setThread] = useState<MessageRow[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const refreshConversations = useCallback(async () => {
    const convos = await getConversations();
    setConversations(convos);
    return convos;
  }, []);

  // Initial load: who am I, my conversation list, and — if we arrived via a
  // "Chat with Seller" deep link (?with=<userId>&listing=<listingId>) —
  // select or create that thread.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        if (!cancelled) setMyId(data.user?.id ?? null);
      }

      const convos = await refreshConversations();
      if (cancelled) return;

      const withId = params.get("with");
      const listingId = params.get("listing") ?? "";
      if (withId) {
        const existing = convos.find((c) => c.otherUserId === withId && c.listingId === listingId);
        if (existing) {
          setSelected(existing);
        } else {
          const info = await getNewConversationInfo(withId, listingId);
          if (!cancelled && info) setSelected(info);
        }
      } else if (convos.length > 0) {
        setSelected(convos[0]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Load the selected thread's messages and mark it read. When nothing is
  // selected there's nothing to fetch — `thread` just keeps its last value,
  // which is fine since it's never rendered while `selected` is null (the
  // "select a conversation" placeholder shows instead).
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    getThread(selected.otherUserId, selected.listingId).then((data) => {
      if (cancelled) return;
      setThread(data);
      markThreadRead(selected.otherUserId, selected.listingId).then(() => {
        if (!cancelled) refreshConversations();
      });
    });
    return () => {
      cancelled = true;
    };
  }, [selected, refreshConversations]);

  async function handleSend() {
    const body = draft.trim();
    if (!body || !selected || sending) return;
    setSending(true);
    setSendError(null);
    try {
      await sendMessage({ recipientId: selected.otherUserId, listingId: selected.listingId, body });
      setDraft("");
      const [freshThread] = await Promise.all([getThread(selected.otherUserId, selected.listingId), refreshConversations()]);
      setThread(freshThread);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Couldn't send that — please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <DashboardShell title={title} nav={nav} switchHref={switchHref} switchLabel={switchLabel}>
      <h2 className="mb-4 text-xl">Messages</h2>

      {conversations === null ? (
        <p className="text-sm text-ink-faint">Loading&hellip;</p>
      ) : conversations.length === 0 && !selected ? (
        <p className="text-sm text-ink-faint">No conversations yet — message a seller from any listing page to start one.</p>
      ) : (
        <div className="grid gap-4 overflow-hidden rounded-lg border border-rule sm:grid-cols-[240px_1fr] sm:h-[520px]">
          {/* Conversation list */}
          <div className="flex flex-col overflow-y-auto border-b border-rule bg-paper-raised sm:border-b-0 sm:border-r">
            {conversations.map((c) => {
              const active = selected?.otherUserId === c.otherUserId && selected?.listingId === c.listingId;
              return (
                <button
                  key={`${c.listingId}:${c.otherUserId}`}
                  type="button"
                  onClick={() => setSelected(c)}
                  className={clsx(
                    "flex flex-col gap-0.5 border-b border-rule px-4 py-3 text-left last:border-b-0",
                    active ? "bg-brand-soft" : "hover:bg-paper-sunk"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{c.otherUserName}</span>
                    {c.unreadCount > 0 && (
                      <span className="mono rounded-full bg-brand px-1.5 py-0.5 text-[0.65rem] text-white">{c.unreadCount}</span>
                    )}
                  </div>
                  <span className="text-xs text-ink-faint">{c.listingTitle}</span>
                  <span className="line-clamp-1 text-xs text-ink-soft">{c.lastMessage}</span>
                </button>
              );
            })}
          </div>

          {/* Thread */}
          <div className="flex flex-col">
            {!selected ? (
              <div className="flex flex-grow items-center justify-center p-6 text-sm text-ink-faint">Select a conversation</div>
            ) : (
              <>
                <div className="border-b border-rule bg-paper-raised px-4 py-3">
                  <p className="text-sm font-semibold">{selected.otherUserName}</p>
                  <p className="text-xs text-ink-faint">{selected.listingTitle}</p>
                </div>

                <div className="flex flex-grow flex-col gap-2 overflow-y-auto p-4">
                  {thread === null ? (
                    <p className="text-sm text-ink-faint">Loading&hellip;</p>
                  ) : thread.length === 0 ? (
                    <p className="text-sm text-ink-faint">No messages yet — say hello.</p>
                  ) : (
                    thread.map((m) => {
                      const mine = m.senderId === myId;
                      return (
                        <div key={m.id} className={clsx("flex flex-col", mine ? "items-end" : "items-start")}>
                          <div
                            className={clsx(
                              "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                              mine ? "bg-brand-strong text-paper-raised" : "bg-paper-sunk text-ink"
                            )}
                          >
                            {m.body}
                          </div>
                          <span className="mt-0.5 text-[0.65rem] text-ink-faint">{timeLabel(m.createdAt)}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-rule p-3">
                  {sendError && <p className="mb-2 text-xs text-danger">{sendError}</p>}
                  <div className="flex gap-2">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Write a message…"
                      className="flex-grow rounded-lg border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-brand-strong"
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={sending || !draft.trim()}
                      aria-label="Send"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-strong text-paper-raised hover:bg-brand disabled:opacity-60"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
