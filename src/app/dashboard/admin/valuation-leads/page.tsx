import DashboardShell from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/dashboard-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATEGORY_MAP } from "@/lib/categories";
import AdminValuationLeadsTable, { type AdminValuationLeadRow } from "./AdminValuationLeadsTable";

// Sep 27, 2026 Free Valuation lead-gen build — every /valuation submission
// (src/app/valuation/actions.ts) lands in valuation_leads; this is where
// the Durqo team triages them as sales leads. Same status-filter-via-
// searchParams pattern as /dashboard/admin/withdrawals.
export default async function AdminValuationLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const admin = createAdminClient();

  let rows: AdminValuationLeadRow[] = [];
  if (admin) {
    let query = admin.from("valuation_leads").select("*").order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const { data: leads } = await query;

    rows = (leads ?? []).map((l) => ({
      id: l.id,
      name: l.name,
      email: l.email,
      phone: l.phone ?? null,
      categoryId: l.category_id,
      categoryName: CATEGORY_MAP[l.category_id]?.name ?? l.category_id,
      monthlyRevenue: Number(l.monthly_revenue),
      monthlyProfit: Number(l.monthly_profit),
      businessAgeYears: Number(l.business_age_years),
      estimatedLow: Number(l.estimated_low),
      estimatedHigh: Number(l.estimated_high),
      status: l.status,
      adminNote: l.admin_note ?? null,
      createdAt: (l.created_at as string).slice(0, 10),
    }));
  }

  const newCount = rows.filter((r) => r.status === "new").length;

  return (
    <DashboardShell title="Admin Dashboard" nav={ADMIN_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl">Valuation Leads{status ? ` - ${status}` : ""}</h2>
        {!admin && <span className="text-sm text-danger">Admin data source unavailable.</span>}
      </div>
      {!status && newCount > 0 && (
        <p className="mb-4 text-sm text-ink-soft">{newCount} new lead{newCount === 1 ? "" : "s"} waiting for follow-up.</p>
      )}
      <AdminValuationLeadsTable rows={rows} />
    </DashboardShell>
  );
}
