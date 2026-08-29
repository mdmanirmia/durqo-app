import DashboardShell from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/dashboard-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { fmtUSD } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  awaiting_payment: "Awaiting payment",
  in_escrow: "In escrow",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<string, string> = {
  requested: "bg-paper-raised text-ink-faint",
  awaiting_payment: "bg-amber-100 text-amber-800",
  in_escrow: "bg-blue-100 text-blue-800",
  completed: "bg-brand-soft text-brand-strong",
  cancelled: "bg-red-100 text-red-700",
};

export default async function AdminOrders() {
  await requireAdmin();
  const admin = createAdminClient();

  let rows: {
    id: string;
    listingTitle: string;
    buyerName: string;
    sellerName: string;
    amount: number;
    status: string;
    createdAt: string;
  }[] = [];

  if (admin) {
    const { data: orders } = await admin
      .from("orders")
      .select("id, listing_id, buyer_id, seller_id, amount, status, created_at")
      .order("created_at", { ascending: false });

    const listingIds = [...new Set((orders ?? []).map((o) => o.listing_id))];
    const peopleIds = [...new Set((orders ?? []).flatMap((o) => [o.buyer_id, o.seller_id]))];
    const [{ data: listings }, { data: profiles }] = await Promise.all([
      listingIds.length ? admin.from("listings").select("id, title").in("id", listingIds) : Promise.resolve({ data: [] }),
      peopleIds.length ? admin.from("profiles").select("id, full_name").in("id", peopleIds) : Promise.resolve({ data: [] }),
    ]);
    const listingById = new Map((listings ?? []).map((l) => [l.id, l.title as string]));
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name as string | null]));

    rows = (orders ?? []).map((o) => ({
      id: o.id,
      listingTitle: listingById.get(o.listing_id) ?? "Listing",
      buyerName: nameById.get(o.buyer_id) ?? "—",
      sellerName: nameById.get(o.seller_id) ?? "—",
      amount: Number(o.amount),
      status: o.status,
      createdAt: (o.created_at as string).slice(0, 10),
    }));
  }

  return (
    <DashboardShell title="Admin Dashboard" nav={ADMIN_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl">All Orders</h2>
        {!admin && <span className="text-sm text-red-600">Admin data source unavailable.</span>}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-faint">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-rule">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
                <th className="px-4 py-3 font-medium">Listing</th>
                <th className="px-4 py-3 font-medium">Buyer</th>
                <th className="px-4 py-3 font-medium">Seller</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-b border-rule last:border-b-0">
                  <td className="px-4 py-3 font-medium text-ink">{o.listingTitle}</td>
                  <td className="px-4 py-3 text-ink-soft">{o.buyerName}</td>
                  <td className="px-4 py-3 text-ink-soft">{o.sellerName}</td>
                  <td className="mono px-4 py-3">{fmtUSD(o.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[o.status] ?? "bg-paper-raised text-ink-faint"}`}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="mono px-4 py-3 text-ink-faint">{o.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
