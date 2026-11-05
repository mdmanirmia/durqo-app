import Link from "next/link";
import { Users, Tag, Clock, Wallet, ListChecks, ReceiptText, ShoppingBag, Store, Globe2 } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/dashboard-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { fmtUSD } from "@/lib/format";
import { countryFlagEmoji, countryName } from "@/lib/countries";
import { statusLabel, statusDotClass } from "@/components/ui/Badge";

const LISTING_STATUSES = ["draft", "pending_review", "published", "sold", "archived"] as const;
const ORDER_STATUSES = ["requested", "awaiting_payment", "in_escrow", "in_durqo", "completed", "cancelled"] as const;

export default async function AdminOverview() {
  await requireAdmin();
  const admin = createAdminClient();

  let listingCounts: Record<string, number> = {};
  let orderCounts: Record<string, number> = {};
  let userCount = 0;
  // Nov 5, 2026 ("alada box e buyers and sellers dekhao and akta graph or
  // akta table o korba kon country theke koto jon ache. ei gulo auto
  // dynamic hobe"): computed from profiles on every load of this page.
  let buyerCount = 0;
  let sellerCount = 0;
  let byCountry: { code: string | null; buyers: number; sellers: number; total: number }[] = [];
  let gmv = 0;
  let pendingCount = 0;

  if (admin) {
    const [{ data: listings }, { data: orders }, { count: profileCount }, { data: people }] = await Promise.all([
      admin.from("listings").select("status"),
      admin.from("orders").select("status, amount"),
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("profiles").select("role, country").range(0, 49999),
    ]);

    const countries = new Map<string, { code: string | null; buyers: number; sellers: number; total: number }>();
    for (const p of people ?? []) {
      const role = p.role as string;
      if (role === "buyer") buyerCount++;
      if (role === "seller") sellerCount++;
      const raw = ((p.country as string | null) ?? "").trim().toUpperCase();
      const key = raw || "__none";
      const row = countries.get(key) ?? { code: raw || null, buyers: 0, sellers: 0, total: 0 };
      if (role === "buyer") row.buyers++;
      if (role === "seller") row.sellers++;
      row.total++;
      countries.set(key, row);
    }
    // Most users first; "Not set" always last.
    byCountry = [...countries.values()].sort((a, b) => (a.code === null ? 1 : b.code === null ? -1 : b.total - a.total));

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

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
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
              <ShoppingBag size={18} />
            </div>
            <div className="min-w-0">
              <div className="mono text-2xl font-semibold">{buyerCount}</div>
              <div className="text-sm text-ink-faint">Buyers</div>
            </div>
          </div>
        </div>
        <div className="group rounded-2xl border border-rule bg-paper-raised p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-rule-strong hover:shadow-[var(--shadow-lift)]">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-soft text-[#92730F]">
              <Store size={18} />
            </div>
            <div className="min-w-0">
              <div className="mono text-2xl font-semibold">{sellerCount}</div>
              <div className="text-sm text-ink-faint">Sellers</div>
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
      {/* Users by country: table + share bar (buyers green, sellers gold). */}
      <div className="mt-6 rounded-2xl border border-rule bg-paper-raised p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-hover">
              <Globe2 size={15} />
            </div>
            <h2 className="text-lg">Users by country</h2>
          </div>
          <div className="flex items-center gap-4 text-xs text-ink-faint">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-brand" />Buyers</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-gold" />Sellers</span>
          </div>
        </div>
        {byCountry.length === 0 ? (
          <p className="text-sm text-ink-faint">No users yet.</p>
        ) : (
          <>
          {/* Phones: one compact row per country instead of a wide table. */}
          <ul className="divide-y divide-rule overflow-hidden rounded-xl border border-rule sm:hidden">
            {byCountry.map((c) => {
              const max = byCountry.reduce((m, r) => Math.max(m, r.total), 1);
              const pct = userCount ? Math.round((c.total / userCount) * 100) : 0;
              return (
                <li key={c.code ?? "none"} className="px-3.5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="text-base leading-none">{countryFlagEmoji(c.code) || "🌐"}</span>
                      <span className="truncate text-sm font-medium text-ink">{c.code ? (countryName(c.code) ?? c.code) : "Not set"}</span>
                    </span>
                    <span className="mono shrink-0 text-sm font-semibold">
                      {c.total} <span className="text-xs font-normal text-ink-faint">({pct}%)</span>
                    </span>
                  </div>
                  <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-paper-sunk">
                    <div className="flex h-full" style={{ width: `${(c.total / max) * 100}%` }}>
                      <span className="h-full bg-brand" style={{ width: `${c.total ? (c.buyers / c.total) * 100 : 0}%` }} />
                      <span className="h-full bg-gold" style={{ width: `${c.total ? (c.sellers / c.total) * 100 : 0}%` }} />
                      <span className="h-full flex-1 bg-ink-faint/40" />
                    </div>
                  </div>
                  <div className="mono mt-1.5 flex gap-3 text-xs text-ink-faint">
                    <span>{c.buyers} buyers</span>
                    <span>{c.sellers} sellers</span>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="hidden overflow-x-auto rounded-xl border border-rule sm:block">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-4 py-2.5 font-medium">Country</th>
                  <th className="px-4 py-2.5 text-right font-medium">Buyers</th>
                  <th className="px-4 py-2.5 text-right font-medium">Sellers</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  <th className="w-[38%] px-4 py-2.5 font-medium">Share of all users</th>
                </tr>
              </thead>
              <tbody>
                {byCountry.map((c) => {
                  const max = byCountry.reduce((m, r) => Math.max(m, r.total), 1);
                  const pct = userCount ? Math.round((c.total / userCount) * 100) : 0;
                  return (
                    <tr key={c.code ?? "none"} className="border-t border-rule">
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-2">
                          <span className="text-base leading-none">{countryFlagEmoji(c.code) || "🌐"}</span>
                          <span className="text-ink">{c.code ? (countryName(c.code) ?? c.code) : "Not set"}</span>
                        </span>
                      </td>
                      <td className="mono px-4 py-2.5 text-right">{c.buyers}</td>
                      <td className="mono px-4 py-2.5 text-right">{c.sellers}</td>
                      <td className="mono px-4 py-2.5 text-right font-semibold">{c.total}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-paper-sunk">
                            <div className="flex h-full" style={{ width: `${(c.total / max) * 100}%` }}>
                              <span className="h-full bg-brand" style={{ width: `${c.total ? (c.buyers / c.total) * 100 : 0}%` }} />
                              <span className="h-full bg-gold" style={{ width: `${c.total ? (c.sellers / c.total) * 100 : 0}%` }} />
                              <span className="h-full flex-1 bg-ink-faint/40" />
                            </div>
                          </div>
                          <span className="mono w-10 text-right text-xs text-ink-faint">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
