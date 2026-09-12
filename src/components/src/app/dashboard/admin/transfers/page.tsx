import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/dashboard-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminTransfersTable, { type AdminTransferRow } from "./AdminTransfersTable";

const STAGE_FILTERS = [
  { value: "", label: "All" },
  { value: "admin_review", label: "Needs Review" },
  { value: "seller_transferring", label: "Transferring" },
  { value: "awaiting_buyer_receipt", label: "Awaiting Receipt" },
  { value: "inspection_active", label: "Inspecting" },
  { value: "payout_eligible", label: "Approved" },
] as const;

export default async function AdminTransfers({ searchParams }: { searchParams: Promise<{ stage?: string }> }) {
  await requireAdmin();
  const { stage } = await searchParams;
  const admin = createAdminClient();

  let rows: AdminTransferRow[] = [];
  let needsReviewCount = 0;

  if (admin) {
    const [{ data: allRooms }, roomsQuery] = await Promise.all([
      admin.from("asset_transfer_rooms").select("id, stage").eq("stage", "admin_review"),
      (stage ? admin.from("asset_transfer_rooms").select("*").eq("stage", stage) : admin.from("asset_transfer_rooms").select("*")).order(
        "updated_at",
        { ascending: false }
      ),
    ]);
    needsReviewCount = (allRooms ?? []).length;
    const rooms = roomsQuery.data ?? [];

    const orderIds = [...new Set(rooms.map((r) => r.order_id as string))];
    const peopleIds = [...new Set(rooms.flatMap((r) => [r.buyer_id, r.seller_id]))];
    const roomIds = rooms.map((r) => r.id as string);

    const [{ data: orders }, { data: profiles }, { data: issues }, { data: items }] = await Promise.all([
      orderIds.length ? admin.from("orders").select("id, listing_id, amount").in("id", orderIds) : Promise.resolve({ data: [] }),
      peopleIds.length ? admin.from("profiles").select("id, full_name").in("id", peopleIds) : Promise.resolve({ data: [] }),
      roomIds.length ? admin.from("asset_transfer_issues").select("room_id, status").in("room_id", roomIds) : Promise.resolve({ data: [] }),
      roomIds.length ? admin.from("asset_transfer_items").select("room_id, status").in("room_id", roomIds) : Promise.resolve({ data: [] }),
    ]);

    const listingIds = [...new Set((orders ?? []).map((o) => o.listing_id as string))];
    const { data: listings } = listingIds.length ? await admin.from("listings").select("id, title").in("id", listingIds) : { data: [] };
    const listingById = new Map((listings ?? []).map((l) => [l.id, l.title as string]));
    const orderById = new Map((orders ?? []).map((o) => [o.id, o]));
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name as string | null]));

    const openIssueCountByRoom = new Map<string, number>();
    for (const i of issues ?? []) {
      if (i.status === "resolved") continue;
      openIssueCountByRoom.set(i.room_id as string, (openIssueCountByRoom.get(i.room_id as string) ?? 0) + 1);
    }
    const itemCountsByRoom = new Map<string, { total: number; accepted: number }>();
    for (const it of items ?? []) {
      const counts = itemCountsByRoom.get(it.room_id as string) ?? { total: 0, accepted: 0 };
      counts.total += 1;
      if (it.status === "accepted") counts.accepted += 1;
      itemCountsByRoom.set(it.room_id as string, counts);
    }

    rows = rooms.map((r) => {
      const order = orderById.get(r.order_id as string);
      const counts = itemCountsByRoom.get(r.id as string) ?? { total: 0, accepted: 0 };
      return {
        roomId: r.id as string,
        orderId: r.order_id as string,
        listingTitle: order ? listingById.get(order.listing_id as string) ?? "Listing" : "Listing",
        buyerName: nameById.get(r.buyer_id as string) || "—",
        sellerName: nameById.get(r.seller_id as string) || "—",
        amount: order ? Number(order.amount) : 0,
        stage: r.stage as string,
        openIssueCount: openIssueCountByRoom.get(r.id as string) ?? 0,
        itemTotal: counts.total,
        itemAccepted: counts.accepted,
        updatedAt: (r.updated_at as string).slice(0, 10),
      };
    });
  }

  return (
    <DashboardShell title="Admin Dashboard" nav={ADMIN_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl">Asset Transfers</h2>
        {!admin && <span className="text-sm text-danger">Admin data source unavailable.</span>}
      </div>
      {needsReviewCount > 0 && (
        <p className="mb-4 text-sm text-danger">
          {needsReviewCount} transfer{needsReviewCount === 1 ? "" : "s"} waiting for admin review.
        </p>
      )}
      <div className="mb-5 flex flex-wrap gap-2">
        {STAGE_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/dashboard/admin/transfers?stage=${f.value}` : "/dashboard/admin/transfers"}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
              (stage ?? "") === f.value ? "border-brand-strong bg-brand-soft text-brand-strong" : "border-rule-strong text-ink-soft hover:border-brand-strong"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>
      <AdminTransfersTable rows={rows} />
    </DashboardShell>
  );
}
