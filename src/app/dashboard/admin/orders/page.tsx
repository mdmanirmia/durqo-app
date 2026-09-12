import DashboardShell from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/dashboard-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminOrdersTable, { type AdminOrderRow } from "./AdminOrdersTable";

export default async function AdminOrders() {
  await requireAdmin();
  const admin = createAdminClient();

  let rows: AdminOrderRow[] = [];

  if (admin) {
    const { data: orders } = await admin
      .from("orders")
      .select(
        "id, listing_id, buyer_id, seller_id, amount, status, payment_channel, created_at, online_charge_usd, remainder_usd, sslcommerz_bdt_amount, sslcommerz_rate"
      )
      .order("created_at", { ascending: false });

    const listingIds = [...new Set((orders ?? []).map((o) => o.listing_id))];
    const peopleIds = [...new Set((orders ?? []).flatMap((o) => [o.buyer_id, o.seller_id]))];
    const [{ data: listings }, { data: profiles }] = await Promise.all([
      listingIds.length ? admin.from("listings").select("id, title").in("id", listingIds) : Promise.resolve({ data: [] }),
      peopleIds.length ? admin.from("profiles").select("id, full_name").in("id", peopleIds) : Promise.resolve({ data: [] }),
    ]);
    const listingById = new Map((listings ?? []).map((l) => [l.id, l.title as string]));
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name as string | null]));

    // Asset Transfer System v2 — which of these orders already have a
    // Transfer Room, so the table can show "Start Asset Transfer" only
    // where there's actually nothing yet (see AdminOrderRow.hasTransferRoom).
    const orderIds = (orders ?? []).map((o) => o.id);
    const { data: rooms } = orderIds.length
      ? await admin.from("asset_transfer_rooms").select("order_id").in("order_id", orderIds)
      : { data: [] as { order_id: string }[] };
    const orderIdsWithRoom = new Set((rooms ?? []).map((r) => r.order_id));

    rows = (orders ?? []).map((o) => ({
      id: o.id,
      listingTitle: listingById.get(o.listing_id) ?? "Listing",
      buyerName: nameById.get(o.buyer_id) ?? "—",
      sellerName: nameById.get(o.seller_id) ?? "—",
      amount: Number(o.amount),
      status: o.status,
      paymentChannel: o.payment_channel ?? "stripe",
      createdAt: (o.created_at as string).slice(0, 10),
      onlineChargeUsd: o.online_charge_usd === null || o.online_charge_usd === undefined ? undefined : Number(o.online_charge_usd),
      remainderUsd: o.remainder_usd === null || o.remainder_usd === undefined ? undefined : Number(o.remainder_usd),
      sslcommerzBdtAmount:
        o.sslcommerz_bdt_amount === null || o.sslcommerz_bdt_amount === undefined ? undefined : Number(o.sslcommerz_bdt_amount),
      sslcommerzRate: o.sslcommerz_rate === null || o.sslcommerz_rate === undefined ? undefined : Number(o.sslcommerz_rate),
      hasTransferRoom: orderIdsWithRoom.has(o.id),
    }));
  }

  return (
    <DashboardShell title="Admin Dashboard" nav={ADMIN_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl">All Orders</h2>
        {!admin && <span className="text-sm text-red-600">Admin data source unavailable.</span>}
      </div>
      <AdminOrdersTable rows={rows} />
    </DashboardShell>
  );
}
