"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Thin Server Action wrappers around the SECURITY DEFINER RPCs from
// migration 037 (supabase/migrations/037_asset_transfer_system_rpcs.sql).
// Every function here just forwards to `supabase.rpc(...)` using the
// signed-in user's own session — auth.uid() inside each RPC is what
// actually authorizes the call (buyer-only / seller-only / participant),
// exactly like the existing withdrawal Server Actions do for
// create_withdrawal_request(). No service-role client is used anywhere in
// this file: everything here is a protected transition a buyer or seller
// takes on their own transfer, never an admin action (those come later,
// in Phase 4, through the existing admin service-role pattern instead).
async function requireSupabase() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Backend isn't connected yet.");
  return supabase;
}

function revalidateRoom(orderId: string) {
  revalidatePath(`/dashboard/transfer/${orderId}`);
  revalidatePath("/dashboard/seller/orders");
  revalidatePath("/dashboard/buyer/orders");
}

export async function markItemInProgress(orderId: string, itemId: string) {
  const supabase = await requireSupabase();
  const { error } = await supabase.rpc("transfer_item_mark_in_progress", { p_item_id: itemId });
  if (error) throw new Error(error.message);
  revalidateRoom(orderId);
}

export async function submitItem(orderId: string, itemId: string, sellerReference: string | null) {
  const supabase = await requireSupabase();
  const { error } = await supabase.rpc("transfer_item_submit", { p_item_id: itemId, p_seller_reference: sellerReference });
  if (error) throw new Error(error.message);
  revalidateRoom(orderId);
}

export async function markItemReceived(orderId: string, itemId: string) {
  const supabase = await requireSupabase();
  const { error } = await supabase.rpc("transfer_item_mark_received", { p_item_id: itemId });
  if (error) throw new Error(error.message);
  revalidateRoom(orderId);
}

export async function approveTransfer(orderId: string, roomId: string) {
  const supabase = await requireSupabase();
  const { error } = await supabase.rpc("transfer_approve", { p_room_id: roomId });
  if (error) throw new Error(error.message);
  revalidateRoom(orderId);
}

export async function reportIssue(orderId: string, roomId: string, itemId: string | null, category: string, explanation: string) {
  const supabase = await requireSupabase();
  const { error } = await supabase.rpc("transfer_report_issue", {
    p_room_id: roomId,
    p_item_id: itemId,
    p_category: category,
    p_explanation: explanation,
  });
  if (error) throw new Error(error.message);
  revalidateRoom(orderId);
}

export async function proposeAmendment(orderId: string, roomId: string, itemId: string | null, field: string, proposedValue: string) {
  const supabase = await requireSupabase();
  const { error } = await supabase.rpc("transfer_amendment_propose", {
    p_room_id: roomId,
    p_item_id: itemId,
    p_field: field,
    p_proposed_value: proposedValue,
  });
  if (error) throw new Error(error.message);
  revalidateRoom(orderId);
}

export async function decideAmendment(orderId: string, amendmentId: string, accept: boolean) {
  const supabase = await requireSupabase();
  const { error } = await supabase.rpc("transfer_amendment_decide", { p_amendment_id: amendmentId, p_accept: accept });
  if (error) throw new Error(error.message);
  revalidateRoom(orderId);
}

export async function sendTransferMessage(orderId: string, roomId: string, body: string) {
  const supabase = await requireSupabase();
  const { error } = await supabase.rpc("transfer_send_message", { p_room_id: roomId, p_body: body });
  if (error) throw new Error(error.message);
  revalidateRoom(orderId);
}
