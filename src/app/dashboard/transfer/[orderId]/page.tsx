import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TransferRoomView, { type TransferRoomData } from "./TransferRoomView";

// Order-scoped Transfer Room — Phase 3 of the Asset Transfer System v2
// (see claude/asset-transfer-system-v2-phase-0-1-implementation-addendum.md
// for Phases 0-2). Mirrors the receipt page's ownership pattern exactly:
// auth check + redirect, then a plain RLS-scoped `.maybeSingle()` fetch on
// `orders` — `orders_select_involved` already restricts `select` to the
// buyer or seller on the order, so a non-participant gets null here and
// this 404s rather than leaking another party's order. Every other table
// below is read the same RLS-scoped way (never the admin/service-role
// client — that's Phase 4's job), matching migration 036's SELECT-only
// client policies.
//
// A room may not exist yet for a real, already-paid order: the three
// payment webhooks are not wired to create_transfer_room_on_payment yet
// (that's still an open item — see the addendum). TransferRoomView renders
// a clear "not set up yet" state for that case rather than erroring.
export default async function TransferRoomPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const supabase = await createClient();
  if (!supabase) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) notFound();

  const viewerSide: "buyer" | "seller" = order.buyer_id === user.id ? "buyer" : "seller";

  const [{ data: listing }, { data: buyerProfile }, { data: sellerProfile }, { data: room }] = await Promise.all([
    supabase.from("listings").select("title").eq("id", order.listing_id).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", order.buyer_id).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", order.seller_id).maybeSingle(),
    supabase.from("asset_transfer_rooms").select("*").eq("order_id", orderId).maybeSingle(),
  ]);

  const buyerName = buyerProfile?.full_name || "Buyer";
  const sellerName = sellerProfile?.full_name || "Seller";

  const data: TransferRoomData = {
    orderId: order.id,
    viewerSide,
    listingTitle: listing?.title ?? "Listing",
    buyerName,
    sellerName,
    amount: Number(order.amount),
    orderStatus: order.status,
    orderDate: (order.created_at as string).slice(0, 10),
    room: null,
  };

  if (!room) {
    return <TransferRoomView data={data} />;
  }

  const [{ data: snapshot }, { data: itemRows }, { data: messageRows }, { data: issueRows }, { data: amendmentRows }, { data: eventRows }, { data: support }] =
    await Promise.all([
      supabase.from("order_asset_snapshots").select("snapshot_json, post_sale_support_text").eq("order_id", orderId).maybeSingle(),
      supabase.from("asset_transfer_items").select("*").eq("room_id", room.id),
      supabase.from("asset_transfer_messages").select("*").eq("room_id", room.id).order("created_at", { ascending: true }),
      supabase.from("asset_transfer_issues").select("*").eq("room_id", room.id).order("created_at", { ascending: false }),
      supabase.from("asset_transfer_amendments").select("*").eq("room_id", room.id).order("created_at", { ascending: false }),
      supabase.from("asset_transfer_events").select("*").eq("room_id", room.id).order("created_at", { ascending: false }),
      supabase.from("post_sale_support_tracking").select("*").eq("order_id", orderId).maybeSingle(),
    ]);

  type SnapshotElement = {
    id: string;
    position: number;
    name: string;
    buyer_receives: string | null;
    transfer_method: string | null;
    note: string | null;
  };
  const snapshotElements = ((snapshot?.snapshot_json as SnapshotElement[] | null) ?? []).reduce(
    (acc, elem) => acc.set(elem.id, elem),
    new Map<string, SnapshotElement>()
  );

  const nameForParticipant = (id: string | null) => (id === order.buyer_id ? buyerName : id === order.seller_id ? sellerName : "Durqo");

  const items = (itemRows ?? [])
    .map((row) => {
      const elem = snapshotElements.get(row.snapshot_asset_id);
      return {
        itemId: row.id as string,
        snapshotAssetId: row.snapshot_asset_id as string,
        position: elem?.position ?? 0,
        name: row.name as string,
        buyerReceives: elem?.buyer_receives ?? null,
        transferMethod: elem?.transfer_method ?? null,
        note: elem?.note ?? null,
        status: row.status as "not_started" | "in_progress" | "submitted" | "received" | "accepted",
        sellerReference: row.seller_reference as string | null,
        submittedAt: row.submitted_at as string | null,
        receivedAt: row.received_at as string | null,
        acceptedAt: row.accepted_at as string | null,
      };
    })
    .sort((a, b) => a.position - b.position);

  data.room = {
    id: room.id,
    stage: room.stage,
    unlockedAt: room.unlocked_at,
    inspectionStartedAt: room.inspection_started_at,
    inspectionDeadlineAt: room.inspection_deadline_at,
    payoutEligibleAt: room.payout_eligible_at,
    items,
    messages: (messageRows ?? []).map((m) => ({
      id: m.id as string,
      senderId: m.sender_id as string,
      senderName: nameForParticipant(m.sender_id),
      body: m.body as string,
      createdAt: m.created_at as string,
    })),
    issues: (issueRows ?? []).map((i) => ({
      id: i.id as string,
      itemId: i.item_id as string | null,
      itemName: items.find((it) => it.itemId === i.item_id)?.name ?? null,
      reporterName: nameForParticipant(i.reporter_id),
      category: i.category as string,
      explanation: i.explanation as string,
      status: i.status as string,
      sellerResponse: i.seller_response as string | null,
      resolution: i.resolution as string | null,
      resolutionType: i.resolution_type as string | null,
      createdAt: i.created_at as string,
    })),
    amendments: (amendmentRows ?? []).map((a) => ({
      id: a.id as string,
      itemId: a.item_id as string | null,
      itemName: items.find((it) => it.itemId === a.item_id)?.name ?? null,
      field: a.field as string,
      originalValue: a.original_value as string | null,
      proposedValue: a.proposed_value as string,
      proposedByName: nameForParticipant(a.proposed_by),
      proposedBySelf: a.proposed_by === user.id,
      status: a.status as "pending" | "accepted" | "rejected",
      createdAt: a.created_at as string,
    })),
    events: (eventRows ?? []).map((e) => ({
      id: e.id as string,
      actorName: e.actor_id ? nameForParticipant(e.actor_id) : "System",
      eventType: e.event_type as string,
      reason: e.reason as string | null,
      createdAt: e.created_at as string,
    })),
    support: support
      ? {
          terms: support.agreed_terms as string | null,
          status: support.status as string,
          startDate: support.start_date as string | null,
        }
      : null,
  };

  return <TransferRoomView data={data} />;
}
