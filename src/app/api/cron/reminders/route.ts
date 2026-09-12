import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { getUserEmails } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Sep 10, 2026 request: "Seller jodi 3 hours er majhe kono message and
// comments reply nah kore tahole seller er kache email notification jabe" —
// if a seller doesn't reply to a question or a message within 3 hours, email
// them a reminder. Runs once a day (Vercel Cron's free Hobby-plan ceiling —
// see vercel.json; the user explicitly chose this over a paid/external
// scheduler), so in practice a comment/message that crosses the 3-hour mark
// gets its reminder at the next daily run, not exactly 3 hours later — the
// user was told this and picked the free option anyway.
//
// Same CRON_SECRET auth pattern as /api/cron/sync (see that route's comment)
// — reuses the same env var, already set for that route, so nothing new
// needs configuring in Vercel for this one.
//
// Each stale item is reminded AT MOST ONCE — see migration 026, which adds a
// one-way `reminder_sent_at` column to both `comments` and `messages`. This
// route only ever sets it, never clears it, both so a seller isn't renotified
// every single day about the same unanswered item, and so the sweep stays
// safe to re-run if Vercel's "best effort" cron delivery fires it twice.
//
// Message reminders only cover threads tied to a listing (`listing_id` not
// null) — a "General" conversation (see getConversations() in
// messages.client.ts) has no listing and therefore no fixed "seller" party,
// so there's no one to hold to a reply-time SLA there.
//
// Asset Transfer System v2 (Phase 4, Sep 12 2026): this route also sweeps
// expired Transfer Room inspection windows (sweep_expired_inspections(),
// 037_asset_transfer_system_rpcs.sql) — bundled into this existing daily
// cron rather than registered as its own Vercel Cron entry, since Hobby
// plan already has this route running once a day and adding a third
// scheduled function risks the plan's cron-count ceiling for no real
// benefit (a 7-day inspection window doesn't need finer-than-daily
// checking). Same pattern this route already uses for bundling two
// unrelated sweeps (comments + messages) into one scheduled function.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Backend isn't connected yet." }, { status: 500 });
  }

  const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

  const [comments, messages, transferMessages, transferInspections] = await Promise.all([
    remindStaleComments(admin, cutoff),
    remindStaleMessages(admin, cutoff),
    remindStaleTransferMessages(admin, cutoff),
    sweepExpiredTransferInspections(admin),
  ]);

  return NextResponse.json({ comments, messages, transferMessages, transferInspections });
}

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

async function remindStaleComments(admin: AdminClient, cutoff: string) {
  const { data: rows, error } = await admin
    .from("comments")
    .select("id, listing_id, author_id, parent_id, created_at, reminder_sent_at");
  if (error || !rows) return { checked: 0, reminded: 0, error: error?.message };

  // Every listing any of these comments belongs to — needed up front (not
  // just for the overdue candidates) because "answered" now has to mean
  // "the *seller* replied", not just "some reply exists": postComment() lets
  // the original asker post a flat follow-up too (Sep 10, 2026), and that
  // alone must not silently clear a question off this reminder sweep.
  const listingIds = [...new Set(rows.map((r) => r.listing_id as string))];
  const { data: listings } = await admin.from("listings").select("id, title, seller_id").in("id", listingIds);
  const listingById = new Map((listings ?? []).map((l) => [l.id, l]));

  const repliedBySellerParentIds = new Set(
    rows
      .filter((r) => r.parent_id && listingById.get(r.listing_id as string)?.seller_id === r.author_id)
      .map((r) => r.parent_id as string)
  );
  const overdue = rows.filter(
    (r) => !r.parent_id && !r.reminder_sent_at && !repliedBySellerParentIds.has(r.id) && r.created_at < cutoff
  );
  if (overdue.length === 0) return { checked: rows.length, reminded: 0 };

  const sellerEmails = await getUserEmails(admin, [...new Set((listings ?? []).map((l) => l.seller_id as string))]);

  let reminded = 0;
  for (const c of overdue) {
    const listing = listingById.get(c.listing_id as string);
    const sellerEmail = listing ? sellerEmails[listing.seller_id as string] : undefined;
    if (listing && sellerEmail) {
      try {
        await sendEmail(
          sellerEmail,
          `Reminder: a question on "${listing.title}" is still unanswered`,
          `<p>A buyer's question on your listing <strong>${listing.title}</strong> has been waiting more than 3 hours for a reply.</p>
           <p><a href="https://www.durqo.com/dashboard/seller/questions">Reply on Durqo</a></p>`
        );
        reminded++;
      } catch (err) {
        console.warn("[cron/reminders] comment reminder email failed:", err);
      }
    }
    // Set unconditionally (even if no seller/email was resolvable) so this
    // row is never retried indefinitely — see the route-level comment.
    await admin.from("comments").update({ reminder_sent_at: new Date().toISOString() }).eq("id", c.id);
  }
  return { checked: rows.length, reminded };
}

// Rewritten 2026-09-12 (site owner report: buyer and seller can both send
// unlimited messages, but this sweep only ever reminded a seller who hadn't
// replied — a buyer sitting on an unread reply from the seller, or a seller
// whose own message the buyer never opened, got no reminder at all). Now
// driven entirely by `read_at` (migration 040) rather than a "seller hasn't
// replied" heuristic: whichever party the last message in a thread was sent
// TO is who might not have seen it, regardless of whether that's the buyer
// or the seller for this particular listing.
async function remindStaleMessages(admin: AdminClient, cutoff: string) {
  const { data: rows, error } = await admin
    .from("messages")
    .select("id, listing_id, sender_id, recipient_id, created_at, read_at, reminder_sent_at")
    .not("listing_id", "is", null)
    .order("created_at", { ascending: true });
  if (error || !rows) return { checked: 0, reminded: 0, error: error?.message };

  const threads = new Map<string, (typeof rows)[number][]>();
  for (const r of rows) {
    const key = `${r.listing_id}:${[r.sender_id, r.recipient_id].sort().join(",")}`;
    const list = threads.get(key);
    if (list) list.push(r);
    else threads.set(key, [r]);
  }

  const listingIds = [...new Set(rows.map((r) => r.listing_id as string))];
  const { data: listings } = await admin.from("listings").select("id, title, seller_id").in("id", listingIds);
  const listingById = new Map((listings ?? []).map((l) => [l.id, l]));
  const recipientEmails = await getUserEmails(admin, [...new Set(rows.map((r) => r.recipient_id as string))]);

  let reminded = 0;
  for (const thread of threads.values()) {
    const last = thread[thread.length - 1];
    if (last.reminder_sent_at || last.read_at || last.created_at >= cutoff) continue;

    const listing = listingById.get(last.listing_id as string);
    if (!listing) continue;
    const recipientId = last.recipient_id as string;
    const recipientEmail = recipientEmails[recipientId];
    const isSeller = recipientId === listing.seller_id;
    const dashboardPath = isSeller ? "/dashboard/seller/messages" : "/dashboard/buyer/messages";

    if (recipientEmail) {
      try {
        await sendEmail(
          recipientEmail,
          `Reminder: you have an unread message about "${listing.title}"`,
          `<p>You have a message about "${listing.title}" that's been waiting more than 3 hours to be read.</p>
           <p><a href="https://www.durqo.com${dashboardPath}">Read it on Durqo</a></p>`
        );
        reminded++;
      } catch (err) {
        console.warn("[cron/reminders] message reminder email failed:", err);
      }
    }
    await admin.from("messages").update({ reminder_sent_at: new Date().toISOString() }).eq("id", last.id);
  }
  return { checked: rows.length, reminded };
}

// New 2026-09-12, alongside migration 042's reminder_sent_at column on
// asset_transfer_messages — same bidirectional, read_at-driven shape as
// remindStaleMessages() above, but for Deal Messages inside a Transfer Room.
// A room only ever has two participants (buyer_id/seller_id), so the
// recipient of any message is simply whichever of the two isn't the sender —
// there's no separate recipient_id column to read here.
async function remindStaleTransferMessages(admin: AdminClient, cutoff: string) {
  const { data: rows, error } = await admin
    .from("asset_transfer_messages")
    .select("id, room_id, sender_id, created_at, read_at, reminder_sent_at")
    .order("created_at", { ascending: true });
  if (error || !rows) return { checked: 0, reminded: 0, error: error?.message };

  const roomIds = [...new Set(rows.map((r) => r.room_id as string))];
  const { data: rooms } = await admin.from("asset_transfer_rooms").select("id, order_id, buyer_id, seller_id").in("id", roomIds);
  const roomById = new Map((rooms ?? []).map((r) => [r.id, r]));

  const byRoom = new Map<string, (typeof rows)[number][]>();
  for (const r of rows) {
    const list = byRoom.get(r.room_id as string);
    if (list) list.push(r);
    else byRoom.set(r.room_id as string, [r]);
  }

  const recipientIds = new Set<string>();
  for (const [roomId, msgs] of byRoom) {
    const room = roomById.get(roomId);
    const last = msgs[msgs.length - 1];
    if (!room || last.reminder_sent_at || last.read_at || last.created_at >= cutoff) continue;
    recipientIds.add((room.buyer_id === last.sender_id ? room.seller_id : room.buyer_id) as string);
  }
  const emails = await getUserEmails(admin, [...recipientIds]);

  let reminded = 0;
  let checked = 0;
  for (const [roomId, msgs] of byRoom) {
    const room = roomById.get(roomId);
    const last = msgs[msgs.length - 1];
    checked += msgs.length;
    if (!room || last.reminder_sent_at || last.read_at || last.created_at >= cutoff) continue;

    const recipientId = (room.buyer_id === last.sender_id ? room.seller_id : room.buyer_id) as string;
    const recipientEmail = emails[recipientId];
    if (recipientEmail) {
      try {
        await sendEmail(
          recipientEmail,
          "Reminder: you have an unread Deal Message",
          `<p>You have an unread message in your Transfer Room that's been waiting more than 3 hours.</p>
           <p><a href="https://www.durqo.com/dashboard/transfer/${room.order_id}">Open the Transfer Room</a></p>`
        );
        reminded++;
      } catch (err) {
        console.warn("[cron/reminders] transfer message reminder email failed:", err);
      }
    }
    // Mark every unread message from that same sender in this room as
    // reminded — not just the last one — so a run of several unread
    // messages doesn't keep re-qualifying on tomorrow's sweep just because
    // only the newest of them triggered today's reminder.
    const unreadIds = msgs.filter((m) => !m.read_at && m.sender_id === last.sender_id).map((m) => m.id);
    if (unreadIds.length) {
      await admin.from("asset_transfer_messages").update({ reminder_sent_at: new Date().toISOString() }).in("id", unreadIds);
    }
  }
  return { checked, reminded };
}

// Moves any Transfer Room whose 7-day inspection window has lapsed with no
// buyer decision straight to admin_review — sweep_expired_inspections()
// itself is idempotent (only matches rooms still in inspection_active) and
// never sets payout_eligible, so a swept room always needs an admin's
// eyes (see /dashboard/admin/transfers) before anything is released.
// service_role is the only grantee on this function (037), which is what
// `admin` (createAdminClient()) authenticates as.
async function sweepExpiredTransferInspections(admin: AdminClient) {
  const { data, error } = await admin.rpc("sweep_expired_inspections");
  if (error) return { swept: 0, error: error.message };
  return { swept: typeof data === "number" ? data : 0 };
}
