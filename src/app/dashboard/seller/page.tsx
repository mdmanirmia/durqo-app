"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, BarChart3, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SELLER_NAV } from "@/lib/dashboard-nav";
import { CATEGORY_MAP } from "@/lib/categories";
import { fmtUSD } from "@/lib/format";
import { getMyListings, type SellerListingRow } from "@/lib/data/seller-listings.client";
import { getAvailableBalance } from "@/lib/data/earnings.client";
import { getGaConnectionStatuses, type GaConnectionStatus } from "@/lib/data/ga-connection.client";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

// Module-level (not defined inside SellerOverview's render body) so its
// identity never changes across renders — a function component created
// fresh on every render trips react-hooks/static-components. Shared between
// the desktop table cell and the mobile card layout below so the GA
// status/connect/sync logic isn't duplicated between the two.
function GaStatusCell({
  hasSeoData,
  ga,
  listingId,
  onSync,
}: {
  hasSeoData: boolean | undefined;
  ga: GaConnectionStatus | undefined;
  listingId: string;
  onSync: (listingId: string) => void;
}) {
  if (!hasSeoData) {
    return <span className="text-xs text-ink-faint">—</span>;
  }
  if (!ga || ga.status === "disconnected") {
    return (
      <a
        href={`/api/google-analytics/connect?listingId=${listingId}`}
        className="flex w-fit items-center gap-1.5 rounded-md border border-rule-strong px-2.5 py-1 text-xs font-semibold text-ink-soft hover:border-brand-strong hover:text-brand-strong"
      >
        <BarChart3 size={13} /> Connect
      </a>
    );
  }
  if (ga.status === "pending_property_selection") {
    return (
      <Link
        href={`/dashboard/seller/listings/ga-connect?listingId=${listingId}`}
        className="text-xs font-semibold text-brand-strong hover:underline"
      >
        Choose property &rarr;
      </Link>
    );
  }
  if (ga.status === "error") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-danger" title={ga.errorMessage}>
        <AlertCircle size={13} /> Sync error
        <button type="button" onClick={() => onSync(listingId)} className="ml-1 text-ink-faint hover:text-ink">
          <RefreshCw size={12} />
        </button>
      </div>
    );
  }
  if (ga.status === "syncing") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-ink-faint">
        <RefreshCw size={12} className="animate-spin" /> Syncing…
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-hover">
        <CheckCircle2 size={11} /> Connected
      </span>
      <button type="button" onClick={() => onSync(listingId)} aria-label="Sync now" className="text-ink-faint hover:text-ink">
        <RefreshCw size={12} />
      </button>
    </div>
  );
}

export default function SellerOverview() {
  const [myListings, setMyListings] = useState<SellerListingRow[] | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [gaStatuses, setGaStatuses] = useState<Record<string, GaConnectionStatus>>({});
  const [gaNotice, setGaNotice] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyListings().then((data) => {
      if (!cancelled) setMyListings(data);
    });
    // Matches the seller Earnings page's "Available to withdraw" exactly
    // (net of Success Fee, excluding orders already claimed by a
    // withdrawal request) — this card used to sum every completed order's
    // raw amount regardless of withdrawal_id, so it kept showing the full
    // balance even after a withdrawal was approved/paid out.
    getAvailableBalance().then((b) => {
      if (!cancelled) setBalance(b.netAmount);
    });
    getGaConnectionStatuses().then((data) => {
      if (!cancelled) setGaStatuses(data);
    });

    // The Google Analytics connect/callback API routes redirect back here
    // with ?ga_error=... or ?ga_connected=1 — surfaced as a one-time banner
    // rather than useSearchParams, so this page doesn't need a Suspense
    // boundary just for this. Deferred a tick (Promise.resolve().then)
    // rather than calling setState synchronously in the effect body, per
    // the react-hooks/set-state-in-effect rule.
    Promise.resolve().then(() => {
      if (cancelled) return;
      const params = new URLSearchParams(window.location.search);
      const error = params.get("ga_error");
      const connected = params.get("ga_connected");
      if (error) setGaNotice({ kind: "error", text: error });
      else if (connected) setGaNotice({ kind: "success", text: "Google Analytics connected — stats are syncing." });
      if (error || connected) window.history.replaceState({}, "", window.location.pathname);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSync(listingId: string) {
    setGaStatuses((prev) => ({ ...prev, [listingId]: { ...prev[listingId], status: "syncing" } }));
    const res = await fetch("/api/google-analytics/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setGaNotice({ kind: "error", text: body.error ?? "Sync failed." });
    }
    const fresh = await getGaConnectionStatuses();
    setGaStatuses(fresh);
  }

  const publishedCount = (myListings ?? []).filter((l) => l.status === "published").length;

  return (
    <DashboardShell title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-6 sm:gap-8">
          <div>
            <div className="mono text-2xl font-semibold text-brand-strong">{balance === null ? "…" : fmtUSD(balance)}</div>
            <div className="text-sm text-ink-faint">Available balance</div>
          </div>
          <div>
            <div className="mono text-2xl font-semibold">{myListings === null ? "…" : publishedCount}</div>
            <div className="text-sm text-ink-faint">Published listings</div>
          </div>
        </div>
        <Button href="/dashboard/seller/listings/new" className="w-full justify-center sm:w-auto">
          <Plus size={15} /> Add New Business
        </Button>
      </div>

      {gaNotice && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm ${
            gaNotice.kind === "error" ? "border-danger/30 bg-danger-soft text-danger" : "border-brand/30 bg-brand-soft text-brand-hover"
          }`}
        >
          {gaNotice.kind === "error" ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
          {gaNotice.text}
        </div>
      )}

      <h2 className="mb-4 text-xl">My Listings</h2>
      {myListings === null ? (
        <p className="text-sm text-ink-faint">Loading&hellip;</p>
      ) : myListings.length === 0 ? (
        <p className="text-sm text-ink-faint">You haven&rsquo;t listed a business yet.</p>
      ) : (
        <>
          {/* Desktop: unchanged table, horizontal-scroll fallback only. */}
          <div className="hidden overflow-x-auto rounded-xl border border-rule md:block">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-rule bg-paper-raised text-left text-ink-faint">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Google Analytics</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {myListings.map((l) => {
                  const hasSeoData = CATEGORY_MAP[l.categoryId]?.hasSeoData;
                  const ga = gaStatuses[l.id];
                  return (
                    <tr key={l.id} className="border-b border-rule last:border-b-0">
                      <td className="px-4 py-3 font-medium text-ink">{l.title}</td>
                      <td className="px-4 py-3 text-ink-soft">{CATEGORY_MAP[l.categoryId]?.name ?? l.categoryId}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="mono px-4 py-3">{fmtUSD(l.price)}</td>
                      <td className="px-4 py-3">
                        <GaStatusCell hasSeoData={hasSeoData} ga={ga} listingId={l.id} onSync={handleSync} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link href={`/dashboard/seller/listings/${l.id}/edit`} className="text-sm font-semibold text-ink-soft hover:text-brand-strong">Edit</Link>
                          <Link href={`/listing/${l.id}`} className="text-sm font-semibold text-brand-strong">View</Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: same data as a stacked card list instead of a
              horizontally-scrolling table (site owner, Sep 11 2026: seller
              dashboard tables were overflowing off-screen on phones). */}
          <div className="grid gap-3 md:hidden">
            {myListings.map((l) => {
              const hasSeoData = CATEGORY_MAP[l.categoryId]?.hasSeoData;
              const ga = gaStatuses[l.id];
              return (
                <div key={l.id} className="min-w-0 rounded-xl border border-rule bg-paper-raised p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-ink">{l.title}</div>
                      <div className="text-xs text-ink-faint">{CATEGORY_MAP[l.categoryId]?.name ?? l.categoryId}</div>
                    </div>
                    <StatusBadge className="shrink-0" status={l.status} />
                  </div>
                  <div className="mb-3 flex flex-col gap-2 text-sm">
                    <div>
                      <div className="text-xs text-ink-faint">Price</div>
                      <div className="mono">{fmtUSD(l.price)}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-ink-faint">Google Analytics</div>
                      <GaStatusCell hasSeoData={hasSeoData} ga={ga} listingId={l.id} onSync={handleSync} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 border-t border-rule pt-3">
                    <Link href={`/dashboard/seller/listings/${l.id}/edit`} className="text-sm font-semibold text-ink-soft hover:text-brand-strong">Edit</Link>
                    <Link href={`/listing/${l.id}`} className="text-sm font-semibold text-brand-strong">View</Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
