"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowLeft, Eye, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

export interface AdminMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface AdminConversation {
  key: string;
  listingId: string; // "" — a general conversation not tied to a listing
  listingTitle: string;
  participantAId: string;
  participantAName: string;
  participantAEmail: string;
  participantARole: "buyer" | "seller" | null;
  participantBId: string;
  participantBName: string;
  participantBEmail: string;
  participantBRole: "buyer" | "seller" | null;
  messages: AdminMessage[];
  messageCount: number;
  lastMessage: string;
  lastMessageAt: string;
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function roleBadge(role: "buyer" | "seller" | null) {
  if (!role) return null;
  return (
    <Badge tone={role === "seller" ? "brand" : "neutral"} className="ml-1.5 align-middle">
      {role === "seller" ? "Seller" : "Buyer"}
    </Badge>
  );
}

export default function AdminMessagesPanel({ conversations }: { conversations: AdminConversation[] }) {
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(conversations[0]?.key ?? null);
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      [c.participantAName, c.participantAEmail, c.participantBName, c.participantBEmail, c.listingTitle]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [conversations, query]);

  const selected = filtered.find((c) => c.key === selectedKey) ?? filtered[0] ?? null;

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={Eye}
        title="No messages yet"
        body="Conversations between buyers and sellers will show up here once someone starts messaging through a listing."
      />
    );
  }

  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 text-xs text-ink-faint">
        <Eye size={13} /> Viewing as admin — read-only. Nothing here can be sent or replied to on a user&rsquo;s behalf.
      </p>

      <div className="grid h-[70vh] overflow-hidden rounded-xl border border-rule sm:h-[560px] sm:grid-cols-[300px_1fr] sm:grid-rows-[minmax(0,1fr)]">
        {/* Conversation list */}
        <div
          className={clsx(
            "min-h-0 flex-col overflow-y-auto border-b border-rule bg-paper-raised sm:flex sm:border-b-0 sm:border-r",
            mobileShowThread ? "hidden" : "flex"
          )}
        >
          <div className="sticky top-0 border-b border-rule bg-paper-raised p-2">
            <div className="flex items-center gap-1.5 rounded-md border border-rule-strong bg-paper px-2.5 py-1.5">
              <Search size={14} className="shrink-0 text-ink-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email, listing…"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-ink-faint">No conversations match &ldquo;{query}&rdquo;.</p>
          ) : (
            filtered.map((c) => {
              const active = selected?.key === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    setSelectedKey(c.key);
                    setMobileShowThread(true);
                  }}
                  className={clsx(
                    "flex flex-col gap-0.5 border-b border-rule px-4 py-3 text-left last:border-b-0",
                    active ? "bg-brand-soft" : "hover:bg-paper-sunk"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-ink">
                      {c.participantAName} <span className="font-normal text-ink-faint">&harr;</span> {c.participantBName}
                    </span>
                    <span className="shrink-0 text-[0.65rem] text-ink-faint">{timeLabel(c.lastMessageAt)}</span>
                  </div>
                  <span className="truncate text-xs text-ink-faint">{c.listingTitle}</span>
                  <span className="line-clamp-1 text-xs text-ink-soft">{c.lastMessage}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Thread */}
        <div className={clsx("min-h-0 flex-col sm:flex", mobileShowThread ? "flex" : "hidden")}>
          {!selected ? (
            <div className="flex flex-grow items-center justify-center p-6 text-sm text-ink-faint">Select a conversation</div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-rule bg-paper-raised px-3 py-3 sm:px-4">
                <button
                  type="button"
                  onClick={() => setMobileShowThread(false)}
                  aria-label="Back to conversations"
                  className="-ml-1 shrink-0 rounded-md p-1 text-ink-soft hover:bg-paper-sunk sm:hidden"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {selected.participantAName}
                    {roleBadge(selected.participantARole)}
                    <span className="mx-1.5 font-normal text-ink-faint">&harr;</span>
                    {selected.participantBName}
                    {roleBadge(selected.participantBRole)}
                  </p>
                  <p className="truncate text-xs text-ink-faint">
                    {selected.listingTitle} &middot; {selected.messageCount} message{selected.messageCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="flex min-h-0 flex-grow flex-col gap-2 overflow-y-auto p-4">
                {selected.messages.map((m) => {
                  const fromA = m.senderId === selected.participantAId;
                  const senderName = fromA ? selected.participantAName : selected.participantBName;
                  return (
                    <div key={m.id} className={clsx("flex flex-col", fromA ? "items-start" : "items-end")}>
                      <span className="mb-0.5 text-[0.65rem] font-medium text-ink-faint">{senderName}</span>
                      <div
                        className={clsx(
                          "max-w-[80%] rounded-xl px-3 py-2 text-sm",
                          fromA ? "bg-paper-sunk text-ink" : "bg-brand-strong text-paper-raised"
                        )}
                      >
                        {m.body}
                      </div>
                      <span className="mt-0.5 text-[0.65rem] text-ink-faint">{timeLabel(m.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
