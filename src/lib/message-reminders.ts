import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { getUserEmails } from "@/lib/notifications";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

// Nov 7, 2026 ("1 hour er majhe message er reply na korle email e
// notification asbe. ekhon 3 hours set kora ache. eitake 1 hour e niye
// aso"): if the last message in a buyer/seller conversation has gone
// unanswered for an hour, email whoever it was sent to (buyer or seller)
// once. Previously 3 hours, unread-only, and checked only once a day by the
// Vercel cron, so in practice a reminder could take up to ~24 hours. Now run
// every 10 minutes by a Supabase pg_cron job (migration 063) through
// /api/hooks/message-reminders, plus the daily cron as a backstop.
//
// Rules:
// - "Unanswered" = the newest message in the thread (listing + the two
//   people) was sent to this recipient at least 1 hour ago; the recipient
//   reading it without replying still counts as unanswered.
// - One reminder per unanswered message (`reminder_sent_at`), so the
//   10-minute job can never send the same reminder twice.
// - Only messages from the last 3 days, so switching this on doesn't email
//   people about old, long-settled conversations.
const REPLY_WINDOW_MS = 60 * 60 * 1000;
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

export async function remindUnrepliedMessages(admin: AdminClient) {
  const now = Date.now();
  const cutoff = new Date(now - REPLY_WINDOW_MS).toISOString();
  const oldest = new Date(now - MAX_AGE_MS).toISOString();

  const { data: rows, error } = await admin
    .from("messages")
    .select("id, listing_id, sender_id, recipient_id, body, created_at, reminder_sent_at")
    .not("listing_id", "is", null)
    .gte("created_at", oldest)
    .order("created_at", { ascending: true });
  if (error || !rows) return { checked: 0, reminded: 0, error: error?.message };

  // Newest message per conversation (in the 3-day window).
  const last = new Map<string, (typeof rows)[number]>();
  for (const r of rows) last.set(`${r.listing_id}:${[r.sender_id, r.recipient_id].sort().join(",")}`, r);
  const due = [...last.values()].filter((m) => !m.reminder_sent_at && (m.created_at as string) <= cutoff);
  if (due.length === 0) return { checked: rows.length, reminded: 0 };

  const listingIds = [...new Set(due.map((m) => m.listing_id as string))];
  const senderIds = [...new Set(due.map((m) => m.sender_id as string))];
  const [{ data: listings }, { data: senders }, emails] = await Promise.all([
    admin.from("listings").select("id, title, seller_id").in("id", listingIds),
    admin.from("profiles").select("id, full_name").in("id", senderIds),
    getUserEmails(admin, [...new Set(due.map((m) => m.recipient_id as string))]),
  ]);
  const listingById = new Map((listings ?? []).map((l) => [l.id as string, l]));
  const nameById = new Map((senders ?? []).map((p) => [p.id as string, ((p.full_name as string | null) ?? "").trim()]));
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  let reminded = 0;
  for (const m of due) {
    // Claim first so overlapping runs can't double-send.
    const { data: claimed } = await admin
      .from("messages")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", m.id)
      .is("reminder_sent_at", null)
      .select("id");
    if (!claimed || claimed.length === 0) continue;

    const listing = listingById.get(m.listing_id as string);
    const to = emails[m.recipient_id as string];
    if (!listing || !to) continue;

    const isSeller = m.recipient_id === listing.seller_id;
    const path = isSeller ? "/dashboard/seller/messages" : "/dashboard/buyer/messages";
    const from = nameById.get(m.sender_id as string) || (isSeller ? "A buyer" : "The seller");
    const title = (listing.title as string) ?? "a listing";
    const body = String(m.body ?? "");
    const preview = body.length > 280 ? `${body.slice(0, 280)}…` : body;

    try {
      const { sent } = await sendEmail(
        to,
        `${from} is waiting for your reply about "${title}"`,
        `<p><strong>${esc(from)}</strong> sent you a message about <strong>${esc(title)}</strong> on Durqo over an hour ago and is waiting for your reply:</p>
         <blockquote style="margin:12px 0;padding:10px 14px;border-left:3px solid #10B981;background:#F4F6FA;color:#0B1324">${esc(preview).replace(/\n/g, "<br/>")}</blockquote>
         <p><a href="https://www.durqo.com${path}" style="display:inline-block;padding:10px 18px;background:#10B981;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Reply on Durqo</a></p>
         <p style="color:#6B7280;font-size:12px">For your safety, keep all conversations and payments on Durqo.</p>`
      );
      if (sent) reminded++;
      else await admin.from("messages").update({ reminder_sent_at: null }).eq("id", m.id);
    } catch (err) {
      console.warn("[message-reminders] email failed:", err);
      await admin.from("messages").update({ reminder_sent_at: null }).eq("id", m.id);
    }
  }
  return { checked: rows.length, reminded };
}
