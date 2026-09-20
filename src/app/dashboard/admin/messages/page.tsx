import DashboardShell from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/dashboard-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { listAllAuthUsers } from "@/lib/notifications";
import AdminMessagesPanel, { type AdminConversation } from "./AdminMessagesPanel";

// Read-only oversight view over every buyer<->seller message on the
// platform, per the site owner's request: "admin dashboard theke buyer and
// seller ki ki message e kotha bolse oita o dekhar bebostha koro" (from the
// admin dashboard, also arrange to see what buyers and sellers are talking
// about in messages).
//
// The buyer/seller Messages panel (MessagesPanel.tsx) queries `messages`
// with the anon/user-scoped client, which RLS restricts to rows where the
// signed-in user is the sender or recipient (messages_select_involved,
// schema.sql) — that's exactly what keeps a buyer from reading a stranger's
// inbox, but it also means admin can't see anyone else's conversations
// through that same path. This page instead reads with the service-role
// admin client (same pattern as every other admin list page — users,
// listings, orders), which bypasses RLS entirely, so no new policy is
// needed.
//
// There's no `conversations` table (same MVP shape as the buyer/seller
// inbox) — every message row is fetched once and grouped here into
// conversations keyed by (listing, the two participants), same grouping
// logic as getConversations() in messages.client.ts but done for every
// participant pair on the platform at once rather than just "me and the
// other person".
export default async function AdminMessages() {
  await requireAdmin();
  const admin = createAdminClient();

  let conversations: AdminConversation[] = [];
  if (admin) {
    const [{ data: rowsResult }, authUsers, { data: profiles }] = await Promise.all([
      admin
        .from("messages")
        .select("id, listing_id, sender_id, recipient_id, body, created_at, read_at")
        .order("created_at", { ascending: true }),
      listAllAuthUsers(admin),
      admin.from("profiles").select("id, full_name"),
    ]);
    const rows = rowsResult ?? [];

    const emailById = new Map(authUsers.map((u) => [u.id, u.email ?? "—"]));
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? "Durqo user"]));

    const listingIds = [...new Set(rows.map((r) => r.listing_id).filter((id): id is string => Boolean(id)))];
    const { data: listings } =
      listingIds.length > 0
        ? await admin.from("listings").select("id, title, seller_id").in("id", listingIds)
        : { data: [] as { id: string; title: string; seller_id: string }[] };
    const listingById = new Map((listings ?? []).map((l) => [l.id, l]));

    // Group into conversations keyed by (listing, unordered participant
    // pair) — sorting the pair keeps "A messaged B" and "B messaged A" rows
    // in the same conversation regardless of who happened to send first.
    const groups = new Map<string, { listingId: string; participantIds: [string, string]; rows: typeof rows }>();
    for (const r of rows) {
      const listingId = r.listing_id ?? "";
      const [a, b] = [r.sender_id, r.recipient_id].sort();
      const key = `${listingId}:${a}:${b}`;
      const existing = groups.get(key);
      if (existing) existing.rows.push(r);
      else groups.set(key, { listingId, participantIds: [a, b], rows: [r] });
    }

    conversations = [...groups.values()]
      .map((g) => {
        const listing = g.listingId ? listingById.get(g.listingId) : undefined;
        const [aId, bId] = g.participantIds;
        const last = g.rows[g.rows.length - 1];
        return {
          key: `${g.listingId}:${aId}:${bId}`,
          listingId: g.listingId,
          listingTitle: listing?.title ?? "General",
          participantAId: aId,
          participantAName: nameById.get(aId) ?? "Durqo user",
          participantAEmail: emailById.get(aId) ?? "—",
          participantARole: listing ? (listing.seller_id === aId ? ("seller" as const) : ("buyer" as const)) : null,
          participantBId: bId,
          participantBName: nameById.get(bId) ?? "Durqo user",
          participantBEmail: emailById.get(bId) ?? "—",
          participantBRole: listing ? (listing.seller_id === bId ? ("seller" as const) : ("buyer" as const)) : null,
          messages: g.rows.map((r) => ({
            id: r.id,
            senderId: r.sender_id,
            body: r.body,
            createdAt: r.created_at,
            readAt: r.read_at,
          })),
          messageCount: g.rows.length,
          lastMessage: last.body,
          lastMessageAt: last.created_at,
        };
      })
      .sort((x, y) => (x.lastMessageAt < y.lastMessageAt ? 1 : -1));
  }

  return (
    <DashboardShell title="Admin Dashboard" nav={ADMIN_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl">Messages</h2>
        {!admin && <span className="text-sm text-danger">Admin data source unavailable.</span>}
      </div>
      <AdminMessagesPanel conversations={conversations} />
    </DashboardShell>
  );
}
