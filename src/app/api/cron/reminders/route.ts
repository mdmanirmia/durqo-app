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

  const [comments, messages, transferInspections] = await Promise.all([
    remindStaleComments(admin, cutoff),
    remindStaleMessages(admin, cutoff),
    sweepExpiredTransferInspections(admin),
  ]);

  return NextResponse.json({ comments, messages, transferInspections });
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

async function remindStaleMessages(admin: AdminClient, cutoff: string) {
  const { data: rows, error } = await admin
    .from("messages")
    .select("id, listing_id, sender_id, recipient_id, created_at, reminder_sent_at")
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
  const sellerEmails = await getUserEmails(admin, [...new Set((listings ?? []).map((l) => l.seller_id as string))]);

  let reminded = 0;
  for (const thread of threads.values()) {
    const last = thread[thread.length - 1];
    if (last.reminder_sent_at || last.created_at >= cutoff) continue;

    const listing = listingById.get(last.listing_id as string);
    if (!listing) continue;
    const sellerId = listing.seller_id as string;
    // Skip unless the seller is the one who received (and hasn't yet
    // answered) the last message in the thread.
    if (last.sender_id === sellerId || last.recipient_id !== sellerId) continue;

    const sellerEmail = sellerEmails[sellerId];
    if (sellerEmail) {
      try {
        await sendEmail(
          sellerEmail,
          `Reminder: a message about "${listing.title}" is still unanswered`,
          `<p>You have a message about your listing <strong>${listing.title}</strong> that's been waiting more than 3 hours for a reply.</p>
           <p><a href="https://www.durqo.com/dashboard/seller/messages">Reply on Durqo</a></p>`
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
