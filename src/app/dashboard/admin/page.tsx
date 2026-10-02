import Link from "next/link";
import { Users, Tag, Clock, Wallet, ListChecks, ReceiptText } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/dashboard-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { fmtUSD } from "@/lib/format";
import { statusLabel, statusDotClass } from "@/components/ui/Badge";

const LISTING_STATUSES = ["draft", "pending_review", "published", "sold", "archived"] as const;
const ORDER_STATUSES = ["requested", "awaiting_payment", "in_escrow", "in_durqo", "completed", "cancelled"] as const;

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
    <DashboardShell title="Admin Dashboard" icon="shieldCheck" nav={ADMIN_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      {!admin && (
        <p className="mb-6 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft px-5 py-4 text-sm text-danger">
          Admin data source is unavailable - the service role key isn&rsquo;t configured for this deployment.
        </p>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="group rounded-2xl border border-rule bg-paper-raised p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-rule-strong hover:shadow-[var(--shadow-lift)]">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-hover">
              <Users size={18} />
            </div>
            <div className="min-w-0">
              <div className="mono text-2xl font-semibold">{userCount}</div>
              <div className="text-sm text-ink-faint">Total users</div>
            </div>
          </div>
        </div>
        <div className="group rounded-2xl border border-rule bg-paper-raised p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-rule-strong hover:shadow-[var(--shadow-lift)]">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-hover">
              <Tag size={18} />
            </div>
            <div className="min-w-0">
              <div className="mono text-2xl font-semibold">{listingCounts["published"] ?? 0}</div>
              <div className="text-sm text-ink-faint">Published listings</div>
            </div>
          </div>
        </div>
        <div className="group rounded-2xl border border-rule bg-paper-raised p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-rule-strong hover:shadow-[var(--shadow-lift)]">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-soft text-[#92730F]">
              <Clock size={18} />
            </div>
            <div className="min-w-0">
              <Link href="/dashboard/admin/listings?status=pending_review" className="mono block text-2xl font-semibold text-brand-strong hover:text-brand">
                {pendingCount}
              </Link>
              <div className="text-sm text-ink-faint">Pending review</div>
            </div>
          </div>
        </div>
        <div className="group rounded-2xl border border-rule bg-paper-raised p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-rule-strong hover:shadow-[var(--shadow-lift)]">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-strong text-white">
              <Wallet size={18} />
            </div>
            <div className="min-w-0">
              <div className="mono text-2xl font-semibold">{fmtUSD(gmv)}</div>
              <div className="text-sm text-ink-faint">Completed GMV</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-rule bg-paper-raised p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-hover">
              <ListChecks size={15} />
            </div>
            <h2 className="text-lg">Listings by status</h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-rule text-sm">
            {LISTING_STATUSES.map((s) => (
              <div key={s} className="flex items-center justify-between border-b border-rule bg-paper px-4 py-2.5 last:border-b-0">
                <span className="flex items-center gap-2 text-ink-soft">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotClass(s)}`} />
                  {statusLabel(s)}
                </span>
                <span className="mono font-semibold">{listingCounts[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-rule bg-paper-raised p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold-soft text-[#92730F]">
              <ReceiptText size={15} />
            </div>
            <h2 className="text-lg">Orders by status</h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-rule text-sm">
            {ORDER_STATUSES.map((s) => (
              <div key={s} className="flex items-center justify-between border-b border-rule bg-paper px-4 py-2.5 last:border-b-0">
                <span className="flex items-center gap-2 text-ink-soft">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotClass(s)}`} />
                  {statusLabel(s)}
                </span>
                <span className="mono font-semibold">{orderCounts[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
