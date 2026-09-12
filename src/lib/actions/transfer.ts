"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, ADMIN_EMAIL } from "@/lib/email";
import { getUserEmails } from "@/lib/notifications";
import { transferRoomEmailCta } from "@/lib/asset-transfer-room";

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
  // approveTransfer() (below) can flip the order to 'completed' as of
  // migration 039 — the seller's available-balance figure on this page is
  // keyed off exactly that, so it needs to reflect the change right away
  // rather than waiting for its own next unrelated revalidation. Harmless
  // to call for the other actions in this file too, which never touch
  // orders.status.
  revalidatePath("/dashboard/seller/earnings");
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

  // Best-effort confirmation emails to buyer, seller, and admin — the
  // buyer's own action already succeeded via the RPC above, so a failure
  // here (a lookup throwing, or sendEmail's own internal no-op/failure)
  // must never surface as an error on what is otherwise a completed
  // approval. Uses the admin/service-role client purely for the
  // notification side-channel (resolving emails, reading the room/order for
  // context) — never to re-run or second-guess the RPC's own authorization.
  try {
    const admin = createAdminClient();
    if (admin) {
      const { data: room } = await admin
        .from("asset_transfer_rooms")
        .select("buyer_id, seller_id, stage")
        .eq("id", roomId)
        .single();
      if (room) {
        const { data: order } = await admin.from("orders").select("listing_id").eq("id", orderId).maybeSingle();
        const { data: listing } = order
          ? await admin.from("listings").select("title").eq("id", order.listing_id).maybeSingle()
          : { data: null };
        const title = listing?.title ?? "your listing";

        const emails = await getUserEmails(admin, [room.buyer_id as string, room.seller_id as string]);
        const buyerEmail = emails[room.buyer_id as string];
        const sellerEmail = emails[room.seller_id as string];

        const hdrs = await headers();
        const host = hdrs.get("host");
        const origin = host ? `${host.includes("localhost") ? "http" : "https"}://${host}` : "https://www.durqo.com";
        const cta = transferRoomEmailCta(origin, orderId);

        if (buyerEmail) {
          await sendEmail(
            buyerEmail,
            `You confirmed receipt — "${title}"`,
            `<p>You've confirmed receipt of the assets for "${title}". Thanks for using Durqo!</p>${cta}`
          );
        }
        if (sellerEmail) {
          await sendEmail(
            sellerEmail,
            `Transfer approved — "${title}" is ready for payout`,
            `<p>The buyer has confirmed receipt of the assets for "${title}". Your payout is now eligible — head to your Earnings page to request a withdrawal.</p>
             <p><a href="${origin}/dashboard/seller/earnings">Go to Earnings</a></p>`
          );
        }
        await sendEmail(
          ADMIN_EMAIL,
          `Transfer approved — "${title}"`,
          `<p>The buyer approved the asset transfer for "${title}" (order ${orderId}).</p>
           <p><a href="${origin}/dashboard/admin/transfers">Review in admin dashboard</a></p>`
        );
      }
    }
  } catch (err) {
    console.error("[transfer] approveTransfer notification emails failed:", err);
  }
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
