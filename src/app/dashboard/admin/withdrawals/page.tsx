import DashboardShell from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/dashboard-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { listAllAuthUsers } from "@/lib/notifications";
import AdminWithdrawalsTable, { type AdminWithdrawalRow } from "./AdminWithdrawalsTable";

export default async function AdminWithdrawals({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const admin = createAdminClient();

  let rows: AdminWithdrawalRow[] = [];
  if (admin) {
    let query = admin.from("withdrawal_requests").select("*").order("requested_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const { data: requests } = await query;

    const sellerIds = [...new Set((requests ?? []).map((r) => r.seller_id as string))];
    const requestIds = (requests ?? []).map((r) => r.id as string);

    const [{ data: profiles }, usersList, { data: ledgerRows }] = await Promise.all([
      sellerIds.length ? admin.from("profiles").select("id, full_name").in("id", sellerIds) : Promise.resolve({ data: [] }),
      // 2026-09-12 fix: unpaginated listUsers() defaults to a single
      // ~50-user page, silently dropping the email for any seller outside
      // it. listAllAuthUsers() (src/lib/notifications.ts) pages through
      // the full auth user list instead.
      listAllAuthUsers(admin),
      // Which orders (whole or partially) each request actually claimed —
      // withdrawal_request_orders (033_withdrawal_order_splitting.sql), not
      // orders.withdrawal_id, since a large order split across several
      // requests can no longer be found by that single scalar FK.
      requestIds.length ? admin.from("withdrawal_request_orders").select("withdrawal_id, order_id").in("withdrawal_id", requestIds) : Promise.resolve({ data: [] }),
    ]);
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name as string | null]));
    const emailById = new Map(usersList.map((u) => [u.id, u.email ?? null]));

    const claimedOrderIds = [...new Set((ledgerRows ?? []).map((l) => l.order_id as string))];
    const { data: claimedOrders } = claimedOrderIds.length
      ? await admin.from("orders").select("id, payment_channel").in("id", claimedOrderIds)
      : { data: [] };
    const channelByOrderId = new Map((claimedOrders ?? []).map((o) => [o.id as string, o.payment_channel as string | null]));

    // How many claimed orders (or order-slices, for a partially-claimed
    // order) per request went through Escrow.com vs. some other channel —
    // surfaced so admin can see the double-payment risk (Escrow.com pays
    // the seller directly; Durqo has no automated reconciliation against
    // that) before approving. See 028_withdrawals.sql.
    const escrowComCountByRequest = new Map<string, number>();
    for (const l of ledgerRows ?? []) {
      if (channelByOrderId.get(l.order_id as string) === "escrow_com") {
        escrowComCountByRequest.set(l.withdrawal_id as string, (escrowComCountByRequest.get(l.withdrawal_id as string) ?? 0) + 1);
      }
    }

    rows = (requests ?? []).map((r) => ({
      id: r.id,
      sellerName: nameById.get(r.seller_id) || "—",
      sellerEmail: emailById.get(r.seller_id) ?? null,
      grossAmount: Number(r.gross_amount),
      successFeeAmount: Number(r.success_fee_amount),
      netAmount: Number(r.net_amount),
      orderCount: r.order_count,
      escrowComOrderCount: escrowComCountByRequest.get(r.id) ?? 0,
      payoutMethod: r.payout_method,
      payoutDetails: r.payout_details,
      status: r.status,
      adminNote: r.admin_note,
      requestedAt: (r.requested_at as string).slice(0, 10),
    }));
  }

  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <DashboardShell title="Admin Dashboard" nav={ADMIN_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl">Withdrawals{status ? ` — ${status}` : ""}</h2>
        {!admin && <span className="text-sm text-danger">Admin data source unavailable.</span>}
      </div>
      {!status && pendingCount > 0 && (
        <p className="mb-4 text-sm text-ink-soft">{pendingCount} request{pendingCount === 1 ? "" : "s"} waiting for review.</p>
      )}
      <AdminWithdrawalsTable rows={rows} />
    </DashboardShell>
  );
}
