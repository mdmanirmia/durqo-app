"use client";

import { createClient } from "@/lib/supabase/client";

// Unread-count + read-tracking for Deal Messages (asset_transfer_messages),
// mirroring messages.client.ts's getUnreadMessageCount()/markThreadRead()
// for the general Messages inbox — added 2026-09-12 alongside migration 040
// (which added the `read_at` column and its recipient-side update policy).
// There's no dedicated "conversations" grouping here the way messages.client.ts
// has: a Transfer Room already is the thread, one per order, so this only
// ever needs a total across every room the current user is a party to.

// Powers the live "Asset Transfers" nav badge in DashboardShell.tsx.
export async function getUnreadTransferMessagesCount(): Promise<number> {
  const supabase = createClient();
  if (!supabase) return 0;
  const { data: userData } = await supabase.auth.getUser();
  const myId = userData.user?.id;
  if (!myId) return 0;

  const { data: rooms } = await supabase
    .from("asset_transfer_rooms")
    .select("id")
    .or(`buyer_id.eq.${myId},seller_id.eq.${myId}`);
  const roomIds = (rooms ?? []).map((r) => r.id as string);
  if (roomIds.length === 0) return 0;

  const { count, error } = await supabase
    .from("asset_transfer_messages")
    .select("id", { count: "exact", head: true })
    .in("room_id", roomIds)
    .neq("sender_id", myId)
    .is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}

// Called from TransferRoomView once a room is open (and again whenever a
// new live message arrives while it's open) — the room IS the thread, so
// "viewing the room" is exactly "read every message in it". Best-effort,
// same posture as markThreadRead(): a RLS/policy failure here should never
// surface as a broken page, just an unread badge that doesn't clear.
export async function markTransferMessagesRead(roomId: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  const myId = userData.user?.id;
  if (!myId) return;

  try {
    await supabase
      .from("asset_transfer_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("room_id", roomId)
      .neq("sender_id", myId)
      .is("read_at", null);
  } catch {
    // ignore — see comment above
  }
}
