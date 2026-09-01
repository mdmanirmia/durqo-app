import DashboardShell from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/dashboard-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminUsersTable, { type AdminUserRow } from "./AdminUsersTable";

export default async function AdminUsers() {
  const me = await requireAdmin();
  const admin = createAdminClient();

  let rows: AdminUserRow[] = [];
  if (admin) {
    const [{ data: profiles }, { data: authUsers }] = await Promise.all([
      admin.from("profiles").select("id, full_name, role, is_verified, is_active, total_purchases, total_sales, created_at"),
      admin.auth.admin.listUsers({ perPage: 200 }),
    ]);

    const emailById = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? "—"]));

    rows = (profiles ?? [])
      .map((p) => ({
        id: p.id,
        email: emailById.get(p.id) ?? "—",
        fullName: p.full_name ?? "—",
        role: p.role,
        isVerified: p.is_verified,
        isActive: p.is_active ?? true,
        totalPurchases: p.total_purchases,
        totalSales: p.total_sales,
        createdAt: (p.created_at as string).slice(0, 10),
      }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  return (
    <DashboardShell title="Admin Dashboard" nav={ADMIN_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl">All Users</h2>
        {!admin && <span className="text-sm text-danger">Admin data source unavailable.</span>}
      </div>
      <AdminUsersTable rows={rows} selfId={me.id} />
    </DashboardShell>
  );
}
