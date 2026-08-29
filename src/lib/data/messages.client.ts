"use client";

import { createClient } from "@/lib/supabase/client";

export interface MessageRow {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface ConversationSummary {
  otherUserId: string;
  otherUserName: string;
  listingId: string; // "" means a general conversation not tied to a listing
  listingTitle: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ThreadTarget {
  otherUserId: string;
  otherUserName: string;
  listingId: string;
  listingTitle: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// One row per message the current user sent or received, grouped by
// (listing, other person) into a conversation list — there's no dedicated
// "conversations" table, so this does the grouping client-side rather than
// needing a Postgres view/RPC just for an MVP inbox.
export async function getConversations(): Promise<ConversationSummary[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const myId = userData.user.id;

  const { data: rows, error } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${myId},recipient_id.eq.${myId}`)
    .order("created_at", { ascending: true });
  if (error || !rows || rows.length === 0) return [];

  const groups = new Map<string, { otherUserId: string; listingId: string; rows: typeof rows }>();
  for (const r of rows) {
    const otherUserId = r.sender_id === myId ? r.recipient_id : r.sender_id;
    const listingId = r.listing_id ?? "";
    const key = `${listingId}:${otherUserId}`;
    const existing = groups.get(key);
    if (existing) existing.rows.push(r);
    else groups.set(key, { otherUserId, listingId, rows: [r] });
  }

  const otherUserIds = [...new Set([...groups.values()].map((g) => g.otherUserId))];
  const listingIds = [...new Set([...groups.values()].map((g) => g.listingId).filter(Boolean))];
  const [{ data: profiles }, listingsResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", otherUserIds),
    listingIds.length > 0
      ? supabase.from("listings").select("id, title").in("id", listingIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const listingById = new Map((listingsResult.data ?? []).map((l) => [l.id, l]));

  const summaries: ConversationSummary[] = [...groups.values()].map((g) => {
    const last = g.rows[g.rows.length - 1];
    const unreadCount = g.rows.filter((r) => r.recipient_id === myId && !r.read_at).length;
    return {
      otherUserId: g.otherUserId,
      otherUserName: profileById.get(g.otherUserId)?.full_name ?? "Durqo user",
      listingId: g.listingId,
      listingTitle: g.listingId ? (listingById.get(g.listingId)?.title ?? "Listing") : "General",
      lastMessage: last.body,
      lastMessageAt: last.created_at,
      unreadCount,
    };
  });

  summaries.sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
  return summaries;
}

export async function getThread(otherUserId: string, listingId: string): Promise<MessageRow[]> {
  const supabase = createClient();
  if (!supabase || !UUID_RE.test(otherUserId)) return [];
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const myId = userData.user.id;

  let query = supabase
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${myId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${myId})`)
    .order("created_at", { ascending: true });
  query = listingId && UUID_RE.test(listingId) ? query.eq("listing_id", listingId) : query.is("listing_id", null);

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    senderId: r.sender_id,
    recipientId: r.recipient_id,
    body: r.body,
    createdAt: r.created_at,
    readAt: r.read_at,
  }));
}

export async function sendMessage({
  recipientId,
  listingId,
  body,
}: {
  recipientId: string;
  listingId: string;
  body: string;
}): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("Backend isn't connected yet.");
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("You need to be logged in to send a message.");

  const { error } = await supabase.from("messages").insert({
    sender_id: userData.user.id,
    recipient_id: recipientId,
    listing_id: listingId && UUID_RE.test(listingId) ? listingId : null,
    body,
  });
  if (error) throw new Error(error.message);
}

// Best-effort — if migration 004 (adds the recipient update policy) hasn't
// been run yet, RLS blocks this silently and unread counts just won't clear.
// That's a soft degrade, not a broken feature, so errors are swallowed.
export async function markThreadRead(otherUserId: string, listingId: string): Promise<void> {
  const supabase = createClient();
  if (!supabase || !UUID_RE.test(otherUserId)) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const myId = userData.user.id;

  let query = supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_id", otherUserId)
    .eq("recipient_id", myId)
    .is("read_at", null);
  query = listingId && UUID_RE.test(listingId) ? query.eq("listing_id", listingId) : query.is("listing_id", null);

  try {
    await query;
  } catch {
    // ignore — see comment above
  }
}

// Looks up display info for a conversation that has no messages yet (e.g.
// a buyer just clicked "Chat with Seller" for the first time), so the
// thread view has a name/title to show before the first message is sent.
export async function getNewConversationInfo(otherUserId: string, listingId: string): Promise<ThreadTarget | null> {
  const supabase = createClient();
  if (!supabase || !UUID_RE.test(otherUserId)) return null;

  const [{ data: profile }, listingResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("id", otherUserId).maybeSingle(),
    listingId && UUID_RE.test(listingId)
      ? supabase.from("listings").select("id, title").eq("id", listingId).maybeSingle()
      : Promise.resolve({ data: null as { id: string; title: string } | null }),
  ]);
  if (!profile) return null;

  return {
    otherUserId,
    otherUserName: profile.full_name ?? "Durqo user",
    listingId: listingId && UUID_RE.test(listingId) ? listingId : "",
    listingTitle: listingResult.data?.title ?? "General",
  };
}
