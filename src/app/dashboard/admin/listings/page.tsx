import DashboardShell from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/dashboard-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminListingsTable, { type AdminListingRow } from "./AdminListingsTable";

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
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl">All Listings{status ? ` — ${status.replace("_", " ")}` : ""}</h2>
        {!admin && <span className="text-sm text-danger">Admin data source unavailable.</span>}
      </div>
      <AdminListingsTable rows={rows} />
    </DashboardShell>
  );
}
