import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/dashboard-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminListingsTable, { type AdminListingRow } from "./AdminListingsTable";

// 2026-09-13 dashboard audit follow-up ("admin listing status filter UI" —
// deferred from the earlier pass): this page always supported filtering via
// ?status=... (the AdminOverview stat cards already link here with one),
// but there was no way to actually choose a filter from this page itself
// short of hand-editing the URL. Plain server-rendered links rather than a
// client-side <select> — status filtering is just a different page render,
// so no client JS is needed for it.
const STATUS_FILTERS: { value: string | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "In Review" },
  { value: "published", label: "Live" },
  { value: "sold", label: "Sold" },
  { value: "archived", label: "Archived" },
];

export default async function AdminListings({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const admin = createAdminClient();

  let rows: AdminListingRow[] = [];
  if (admin) {
    let query = admin
      .from("listings")
      .select("id, title, category_id, status, price, seller_id, created_at, ga_access_confirmed, ga_verified, loom_video_url")
      .order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const { data: listings } = await query;

    const sellerIds = [...new Set((listings ?? []).map((l) => l.seller_id))];
    const { data: sellers } = sellerIds.length
      ? await admin.from("profiles").select("id, full_name").in("id", sellerIds)
      : { data: [] };
    const sellerById = new Map((sellers ?? []).map((s) => [s.id, s.full_name as string | null]));

    rows = (listings ?? []).map((l) => ({
      id: l.id,
      title: l.title,
      categoryId: l.category_id,
      status: l.status,
      price: Number(l.price),
      sellerName: sellerById.get(l.seller_id) ?? "—",
      createdAt: (l.created_at as string).slice(0, 10),
      gaAccessConfirmed: !!l.ga_access_confirmed,
      gaVerified: !!l.ga_verified,
      loomVideoUrl: (l.loom_video_url as string | null) ?? undefined,
    }));
  }

  return (
    <DashboardShell title="Admin Dashboard" nav={ADMIN_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl">All Listings</h2>
        {!admin && <span className="text-sm text-danger">Admin data source unavailable.</span>}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = (status ?? null) === f.value;
          return (
            <Link
              key={f.label}
              href={f.value ? `/dashboard/admin/listings?status=${f.value}` : "/dashboard/admin/listings"}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                active ? "bg-brand-strong text-white" : "border border-rule-strong text-ink-soft hover:border-brand-strong hover:text-brand-strong"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>
      <AdminListingsTable rows={rows} />
    </DashboardShell>
  );
}
