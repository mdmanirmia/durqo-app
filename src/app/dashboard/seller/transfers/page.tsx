import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SELLER_NAV } from "@/lib/dashboard-nav";
import { createClient } from "@/lib/supabase/server";
import TransferRoomsTable, { type TransferRoomRow } from "@/components/dashboard/TransferRoomsTable";

// Seller's own "Asset Transfers" list — mirrors
// src/app/dashboard/buyer/transfers/page.tsx exactly, just scoped to
// `seller_id` instead of `buyer_id` and showing the buyer's name as the
// counterparty. See that file's header comment for the RLS-scoping note
// (same reasoning applies here).
export default async function SellerTransfersPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rooms } = await supabase
    .from("asset_transfer_rooms")
    .select("*")
    .eq("seller_id", user.id)
    .order("updated_at", { ascending: false });

  const roomList = rooms ?? [];
  const orderIds = [...new Set(roomList.map((r) => r.order_id as string))];
  const buyerIds = [...new Set(roomList.map((r) => r.buyer_id as string))];
  const roomIds = roomList.map((r) => r.id as string);

  const [{ data: orders }, { data: profiles }, { data: issues }] = await Promise.all([
    orderIds.length ? supabase.from("orders").select("id, listing_id, amount").in("id", orderIds) : Promise.resolve({ data: [] }),
    buyerIds.length ? supabase.from("profiles").select("id, full_name").in("id", buyerIds) : Promise.resolve({ data: [] }),
    roomIds.length ? supabase.from("asset_transfer_issues").select("room_id, status").in("room_id", roomIds) : Promise.resolve({ data: [] }),
  ]);

  const listingIds = [...new Set((orders ?? []).map((o) => o.listing_id as string))];
  const { data: listings } = listingIds.length ? await supabase.from("listings").select("id, title").in("id", listingIds) : { data: [] };
  const listingById = new Map((listings ?? []).map((l) => [l.id, l.title as string]));
  const orderById = new Map((orders ?? []).map((o) => [o.id, o]));
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name as string | null]));

  const openIssueCountByRoom = new Map<string, number>();
  for (const i of issues ?? []) {
    if (i.status === "resolved") continue;
    openIssueCountByRoom.set(i.room_id as string, (openIssueCountByRoom.get(i.room_id as string) ?? 0) + 1);
  }

  const rows: TransferRoomRow[] = roomList.map((r) => {
    const order = orderById.get(r.order_id as string);
    return {
      roomId: r.id as string,
      orderId: r.order_id as string,
      listingTitle: order ? listingById.get(order.listing_id as string) ?? "Listing" : "Listing",
      counterpartyName: nameById.get(r.buyer_id as string) || "Buyer",
      amount: order ? Number(order.amount) : 0,
      stage: r.stage as string,
      openIssueCount: openIssueCountByRoom.get(r.id as string) ?? 0,
      updatedAt: (r.updated_at as string).slice(0, 10),
    };
  });

  return (
    <DashboardShell title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <h2 className="mb-4 text-xl text-ink">Asset Transfers</h2>
      <TransferRoomsTable rows={rows} viewerSide="seller" />
    </DashboardShell>
  );
}
