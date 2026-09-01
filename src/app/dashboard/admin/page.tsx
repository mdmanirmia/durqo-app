import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/dashboard-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { fmtUSD } from "@/lib/format";

const LISTING_STATUSES = ["draft", "pending_review", "published", "sold", "archived"] as const;
const ORDER_STATUSES = ["requested", "awaiting_payment", "in_escrow", "completed", "cancelled"] as const;

export default async function AdminOverview() {
  await requireAdmin();
  const admin = createAdminClient();

  let listingCounts: Record<string, number> = {};
  let orderCounts: Record<string, number> = {};
  let userCount = 0;
  let gmv = 0;
  let pendingCount = 0;

  if (admin) {
    const [{ data: listings }, { data: orders }, { count: profileCount }] = await Promise.all([
      admin.from("listings").select("status"),
      admin.from("orders").select("status, amount"),
      admin.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    listingCounts = (listings ?? []).reduce<Record<string, number>>((acc, l) => {
      acc[l.status] = (acc[l.status] ?? 0) + 1;
      return acc;
    }, {});
    pendingCount = listingCounts["pending_review"] ?? 0;

    orderCounts = (orders ?? []).reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});
    gmv = (orders ?? []).filter((o) => o.status === "completed").reduce((sum, o) => sum + Number(o.amount), 0);

    userCount = profileCount ?? 0;
  }

  return (
    <DashboardShell title="Admin Dashboard" nav={ADMIN_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      {!admin && (
        <p className="mb-6 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft px-5 py-4 text-sm text-danger">
          Admin data source is unavailable — the service role key isn&rsquo;t configured for this deployment.
        </p>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-rule bg-paper-raised p-5">
          <div className="mono text-2xl font-semibold">{userCount}</div>
          <div className="text-sm text-ink-faint">Total users</div>
        </div>
        <div className="rounded-xl border border-rule bg-paper-raised p-5">
          <div className="mono text-2xl font-semibold">{listingCounts["published"] ?? 0}</div>
          <div className="text-sm text-ink-faint">Published listings</div>
        </div>
        <div className="rounded-xl border border-rule bg-paper-raised p-5">
          <Link href="/dashboard/admin/listings?status=pending_review" className="mono block text-2xl font-semibold text-brand-strong hover:text-brand">
            {pendingCount}
          </Link>
          <div className="text-sm text-ink-faint">Pending review</div>
        </div>
        <div className="rounded-xl border border-rule bg-paper-raised p-5">
          <div className="mono text-2xl font-semibold">{fmtUSD(gmv)}</div>
          <div className="text-sm text-ink-faint">Completed GMV</div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg">Listings by status</h2>
          <div className="overflow-hidden rounded-xl border border-rule text-sm">
            {LISTING_STATUSES.map((s) => (
              <div key={s} className="flex items-center justify-between border-b border-rule px-4 py-2.5 last:border-b-0">
                <span className="text-ink-soft capitalize">{s.replace("_", " ")}</span>
                <span className="mono font-semibold">{listingCounts[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-lg">Orders by status</h2>
          <div className="overflow-hidden rounded-xl border border-rule text-sm">
            {ORDER_STATUSES.map((s) => (
              <div key={s} className="flex items-center justify-between border-b border-rule px-4 py-2.5 last:border-b-0">
                <span className="text-ink-soft capitalize">{s.replace("_", " ")}</span>
                <span className="mono font-semibold">{orderCounts[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
