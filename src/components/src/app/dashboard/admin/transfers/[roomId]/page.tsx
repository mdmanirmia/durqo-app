import { notFound } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/dashboard-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminTransferDetail, { type AdminTransferDetailData } from "./AdminTransferDetail";

// Admin-only detail view of a single Transfer Room — everything is read via
// the service-role admin client (bypasses RLS, same as every other admin
// page in this codebase), gated only by requireAdmin(). No auth.uid()-based
// participant check applies here since an admin is neither the buyer nor
// the seller.
export default async function AdminTransferDetailPage({ params }: { params: Promise<{ roomId: string }> }) {
  await requireAdmin();
  const { roomId } = await params;

  const admin = createAdminClient();
  if (!admin) notFound();

  const { data: room } = await admin.from("asset_transfer_rooms").select("*").eq("id", roomId).maybeSingle();
  if (!room) notFound();

  const [{ data: order }, { data: buyerProfile }, { data: sellerProfile }, { data: snapshot }, { data: itemRows }, { data: issueRows }, { data: amendmentRows }, { data: messageRows }, { data: eventRows }, { data: support }] =
    await Promise.all([
      admin.from("orders").select("listing_id, amount, status").eq("id", room.order_id).maybeSingle(),
      admin.from("profiles").select("full_name").eq("id", room.buyer_id).maybeSingle(),
      admin.from("profiles").select("full_name").eq("id", room.seller_id).maybeSingle(),
      admin.from("order_asset_snapshots").select("snapshot_json").eq("order_id", room.order_id).maybeSingle(),
      admin.from("asset_transfer_items").select("*").eq("room_id", roomId),
      admin.from("asset_transfer_issues").select("*").eq("room_id", roomId).order("created_at", { ascending: false }),
      admin.from("asset_transfer_amendments").select("*").eq("room_id", roomId).order("created_at", { ascending: false }),
      admin.from("asset_transfer_messages").select("*").eq("room_id", roomId).order("created_at", { ascending: true }),
      admin.from("asset_transfer_events").select("*").eq("room_id", roomId).order("created_at", { ascending: false }),
      admin.from("post_sale_support_tracking").select("*").eq("order_id", room.order_id).maybeSingle(),
    ]);

  const { data: listing } = order ? await admin.from("listings").select("title").eq("id", order.listing_id).maybeSingle() : { data: null };

  const buyerName = buyerProfile?.full_name || "Buyer";
  const sellerName = sellerProfile?.full_name || "Seller";

  type SnapshotElement = { id: string; position: number; name: string; buyer_receives: string | null; transfer_method: string | null; note: string | null };
  const snapshotElements = ((snapshot?.snapshot_json as SnapshotElement[] | null) ?? []).reduce(
    (acc, elem) => acc.set(elem.id, elem),
    new Map<string, SnapshotElement>()
  );

  const nameForParticipant = (id: string | null) => (id === room.buyer_id ? buyerName : id === room.seller_id ? sellerName : id ? "Admin" : "System");

  const items = (itemRows ?? [])
    .map((row) => {
      const elem = snapshotElements.get(row.snapshot_asset_id);
      return {
        itemId: row.id as string,
        position: elem?.position ?? 0,
        name: row.name as string,
        buyerReceives: elem?.buyer_receives ?? null,
        transferMethod: elem?.transfer_method ?? null,
        note: elem?.note ?? null,
        status: row.status as string,
        sellerReference: row.seller_reference as string | null,
      };
    })
    .sort((a, b) => a.position - b.position);

  const data: AdminTransferDetailData = {
    roomId: room.id,
    orderId: room.order_id,
    stage: room.stage,
    listingTitle: listing?.title ?? "Listing",
    buyerName,
    sellerName,
    amount: order ? Number(order.amount) : 0,
    orderStatus: order?.status ?? "—",
    unlockedAt: room.unlocked_at,
    inspectionDeadlineAt: room.inspection_deadline_at,
    payoutEligibleAt: room.payout_eligible_at,
    items,
    issues: (issueRows ?? []).map((i) => ({
      id: i.id as string,
      itemId: i.item_id as string | null,
      itemName: items.find((it) => it.itemId === i.item_id)?.name ?? null,
      reporterName: nameForParticipant(i.reporter_id as string),
      category: i.category as string,
      explanation: i.explanation as string,
      status: i.status as string,
      resolution: i.resolution as string | null,
      resolutionType: i.resolution_type as string | null,
      resolvedAt: i.resolved_at as string | null,
      createdAt: i.created_at as string,
    })),
    amendments: (amendmentRows ?? []).map((a) => ({
      id: a.id as string,
      itemId: a.item_id as string | null,
      itemName: items.find((it) => it.itemId === a.item_id)?.name ?? null,
      field: a.field as string,
      originalValue: a.original_value as string | null,
      proposedValue: a.proposed_value as string,
      proposedByName: nameForParticipant(a.proposed_by as string),
      status: a.status as string,
      createdAt: a.created_at as string,
    })),
    messages: (messageRows ?? []).map((m) => ({
      id: m.id as string,
      senderName: nameForParticipant(m.sender_id as string),
      body: m.body as string,
      createdAt: m.created_at as string,
    })),
    events: (eventRows ?? []).map((e) => ({
      id: e.id as string,
      actorName: nameForParticipant(e.actor_id as string | null),
      eventType: e.event_type as string,
      reason: e.reason as string | null,
      createdAt: e.created_at as string,
    })),
    support: support
      ? { terms: support.agreed_terms as string | null, status: support.status as string, startDate: support.start_date as string | null }
      : null,
  };

  return (
    <DashboardShell title="Admin Dashboard" nav={ADMIN_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <AdminTransferDetail data={data} />
    </DashboardShell>
  );
}
