import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

const THROTTLE_MINUTES = 30;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Nov 7, 2026 ("ei buyer seller k message korlo but seller toh message
// paini"): email the recipient of a new buyer/seller message right away
// (called by /api/hooks/new-message from the DB trigger in migration 063).
// Only the message id is trusted from the caller; everything is re-read
// with the service-role client. Each message is emailed at most once
// (`notified_at` claim), only while fresh, and a conversation produces at
// most one email per 30 minutes so a burst of messages doesn't flood the
// inbox. The daily reminder cron is unchanged and still covers anything
// left unread.
export async function notifyNewMessage(messageId: string): Promise<"sent" | "skipped"> {
  const admin = createAdminClient();
  if (!admin || !/^[0-9a-f-]{36}$/i.test(messageId)) return "skipped";

  const { data: msg } = await admin
    .from("messages")
    .select("id, listing_id, sender_id, recipient_id, body, created_at, read_at, notified_at")
    .eq("id", messageId)
    .maybeSingle();
  if (!msg || msg.notified_at || msg.read_at || !msg.listing_id) return "skipped";
  if (Date.now() - new Date(msg.created_at as string).getTime() > 15 * 60 * 1000) return "skipped";

  // Throttle: an email already went out for this conversation recently.
  const since = new Date(Date.now() - THROTTLE_MINUTES * 60 * 1000).toISOString();
  const { data: recent } = await admin
    .from("messages")
    .select("id")
    .eq("listing_id", msg.listing_id)
    .eq("sender_id", msg.sender_id)
    .eq("recipient_id", msg.recipient_id)
    .gte("notified_at", since)
    .limit(1);
  if (recent && recent.length > 0) return "skipped";

  // Claim it (atomic: only one caller can flip notified_at from null).
  const { data: claimed } = await admin
    .from("messages")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", messageId)
    .is("notified_at", null)
    .select("id");
  if (!claimed || claimed.length === 0) return "skipped";

  const [{ data: listing }, { data: sender }, { data: recipientAuth }] = await Promise.all([
    admin.from("listings").select("title, seller_id").eq("id", msg.listing_id).maybeSingle(),
    admin.from("profiles").select("full_name").eq("id", msg.sender_id).maybeSingle(),
    admin.auth.admin.getUserById(msg.recipient_id as string),
  ]);
  const to = recipientAuth?.user?.email;
  if (!to || !listing) return "skipped";

  const isSeller = msg.recipient_id === listing.seller_id;
  const path = isSeller ? "/dashboard/seller/messages" : "/dashboard/buyer/messages";
  const from = ((sender?.full_name as string | null) ?? "").trim() || (isSeller ? "A buyer" : "The seller");
  const title = (listing.title as string) ?? "your listing";
  const body = String(msg.body ?? "");
  const preview = body.length > 280 ? `${body.slice(0, 280)}…` : body;

  const { sent } = await sendEmail(
    to,
    `New message from ${from} about "${title}"`,
    `<p><strong>${esc(from)}</strong> sent you a message about <strong>${esc(title)}</strong> on Durqo:</p>
     <blockquote style="margin:12px 0;padding:10px 14px;border-left:3px solid #10B981;background:#F4F6FA;color:#0B1324">${esc(preview).replace(/\n/g, "<br/>")}</blockquote>
     <p><a href="https://www.durqo.com${path}" style="display:inline-block;padding:10px 18px;background:#10B981;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Reply on Durqo</a></p>
     <p style="color:#6B7280;font-size:12px">For your safety, keep all conversations and payments on Durqo.</p>`
  );
  if (!sent) {
    await admin.from("messages").update({ notified_at: null }).eq("id", messageId);
    return "skipped";
  }
  return "sent";
}
