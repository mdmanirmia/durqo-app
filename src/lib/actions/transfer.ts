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
            `You confirmed receipt - "${title}"`,
            `<p>You've confirmed receipt of the assets for "${title}". Thanks for using Durqo!</p>${cta}`
          );
        }
        if (sellerEmail) {
          await sendEmail(
            sellerEmail,
            `Transfer approved - "${title}" is ready for payout`,
            `<p>The buyer has confirmed receipt of the assets for "${title}". Your payout is now eligible - head to your Earnings page to request a withdrawal.</p>
             <p><a href="${origin}/dashboard/seller/earnings">Go to Earnings</a></p>`
          );
        }
        await sendEmail(
          ADMIN_EMAIL,
          `Transfer approved - "${title}"`,
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

  // Nov 21, 2026 ("keu report korle admin er kache email notification jabe
  // with in details"): best-effort, detailed email to the admin inbox. The
  // report itself already succeeded above; a failure here never surfaces.
  try {
    await emailAdminAboutIssue(orderId, roomId, itemId, category, explanation);
  } catch (err) {
    console.error("[transfer] reportIssue admin email failed:", err);
  }
}

const ISSUE_CATEGORY_LABEL: Record<string, string> = {
  not_received: "Never received this asset",
  not_working: "Doesn't work as described",
  incomplete: "Incomplete transfer",
  misrepresented: "Misrepresented on the listing",
  credentials_invalid: "Login/credentials don't work",
  other: "Other",
};

async function emailAdminAboutIssue(orderId: string, roomId: string, itemId: string | null, category: string, explanation: string) {
  const admin = createAdminClient();
  if (!admin) return;
  const esc = (v: string) => v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const fmtTime = (iso: string | null | undefined) =>
    iso ? `${new Date(iso).toUTCString().replace(" GMT", "")} UTC` : "Not yet";

  const [{ data: room }, { data: order }, { data: item }, { data: items }] = await Promise.all([
    admin.from("asset_transfer_rooms").select("buyer_id, seller_id, unlocked_at, inspection_started_at, inspection_deadline_at").eq("id", roomId).maybeSingle(),
    admin.from("orders").select("listing_id, amount, created_at").eq("id", orderId).maybeSingle(),
    itemId ? admin.from("asset_transfer_items").select("name").eq("id", itemId).maybeSingle() : Promise.resolve({ data: null }),
    admin.from("asset_transfer_items").select("name, status").eq("room_id", roomId),
  ]);
  if (!room) return;

  const [{ data: listing }, { data: people }, emails] = await Promise.all([
    order?.listing_id ? admin.from("listings").select("title, slug").eq("id", order.listing_id).maybeSingle() : Promise.resolve({ data: null }),
    admin.from("profiles").select("id, full_name").in("id", [room.buyer_id as string, room.seller_id as string]),
    getUserEmails(admin, [room.buyer_id as string, room.seller_id as string]),
  ]);
  const nameOf = (id: string) => ((people ?? []).find((p) => p.id === id)?.full_name as string | undefined)?.trim() || "Unknown";
  const buyerName = nameOf(room.buyer_id as string);
  const sellerName = nameOf(room.seller_id as string);
  const title = (listing?.title as string | undefined) ?? "a listing";

  // Which situation the report was filed in (mirrors transfer_report_issue).
  const when = room.inspection_started_at
    ? "During the buyer's inspection window"
    : "Seller had not started the transfer within 24 hours of payment";

  const hdrs = await headers();
  const host = hdrs.get("host");
  const origin = host ? `${host.includes("localhost") ? "http" : "https"}://${host}` : "https://www.durqo.com";
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#6B7280;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:6px 0;color:#0B1324">${v}</td></tr>`;
  const assetList = (items ?? []).length
    ? (items ?? []).map((i) => `${esc(String(i.name))} <span style="color:#6B7280">(${esc(String(i.status).replace(/_/g, " "))})</span>`).join("<br/>")
    : "None listed";

  await sendEmail(
    ADMIN_EMAIL,
    `Issue reported - "${title}" (${buyerName} vs ${sellerName})`,
    `<p><strong>${esc(buyerName)}</strong> (buyer) reported an issue on the asset transfer for <strong>${esc(title)}</strong>. The transfer is now in <strong>Admin Review</strong> and the payment stays held until you resolve it.</p>
     <table style="border-collapse:collapse;font-size:14px;margin:12px 0">
       ${row("Category", esc(ISSUE_CATEGORY_LABEL[category] ?? category))}
       ${row("Asset", item?.name ? esc(String(item.name)) : "General issue with this order")}
       ${row("When", esc(when))}
       ${row("Buyer", `${esc(buyerName)} &lt;${esc(emails[room.buyer_id as string] ?? "no email")}&gt;`)}
       ${row("Seller", `${esc(sellerName)} &lt;${esc(emails[room.seller_id as string] ?? "no email")}&gt;`)}
       ${row("Order", `${esc(orderId)}${order?.amount != null ? ` · $${Number(order.amount).toLocaleString("en-US")}` : ""}`)}
       ${row("Payment confirmed", esc(fmtTime(room.unlocked_at as string | null)))}
       ${row("Inspection", room.inspection_started_at ? esc(`${fmtTime(room.inspection_started_at as string)} → deadline ${fmtTime(room.inspection_deadline_at as string | null)}`) : "Not started")}
       ${row("Assets in this transfer", assetList)}
     </table>
     <p style="margin:12px 0 4px;color:#6B7280">Buyer's explanation:</p>
     <blockquote style="margin:0 0 16px;padding:10px 14px;border-left:3px solid #EF4444;background:#FEF2F2;color:#0B1324">${esc(explanation).replace(/\n/g, "<br/>")}</blockquote>
     <p><a href="${origin}/dashboard/admin/transfers/${roomId}" style="display:inline-block;padding:10px 18px;background:#0B1324;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Review in admin dashboard</a></p>`
  );
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
