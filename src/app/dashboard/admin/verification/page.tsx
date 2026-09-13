import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/dashboard-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { listAllAuthUsers } from "@/lib/notifications";
import AdminVerificationTable, { type AdminVerificationRow } from "./AdminVerificationTable";

// 2026-09-13 dashboard audit follow-up — same "filter UI was missing, only
// the query param existed" fix as the Listings page.
const STATUS_FILTERS: { value: string | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

const STORAGE_BUCKET = "seller-verification";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour — plenty for one review pass

export default async function AdminVerification({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const admin = createAdminClient();

  let rows: AdminVerificationRow[] = [];
  if (admin) {
    let query = admin
      .from("profiles")
      .select(
        "id, full_name, verification_status, verification_method, verification_document_paths, verification_submitted_at, verification_rejection_reason"
      )
      .not("verification_status", "eq", "unverified")
      .order("verification_submitted_at", { ascending: false, nullsFirst: false });
    if (status) query = query.eq("verification_status", status);
    const { data: profiles } = await query;

    // 2026-09-12 fix: unpaginated listUsers() defaults to a single ~50-user
    // page — past that many signups this silently showed no email for
    // anyone outside it. listAllAuthUsers() pages through the full list.
    const usersList = await listAllAuthUsers(admin);
    const emailById = new Map(usersList.map((u) => [u.id, u.email ?? null]));

    rows = await Promise.all(
      (profiles ?? []).map(async (p) => {
        const paths = (p.verification_document_paths as string[] | null) ?? [];
        const documentUrls: string[] = [];
        for (const path of paths) {
          const { data: signed } = await admin.storage.from(STORAGE_BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
          if (signed?.signedUrl) documentUrls.push(signed.signedUrl);
        }
        return {
          id: p.id,
          sellerName: p.full_name || "—",
          sellerEmail: emailById.get(p.id) ?? null,
          method: p.verification_method,
          status: p.verification_status,
          documentUrls,
          submittedAt: p.verification_submitted_at ? (p.verification_submitted_at as string).slice(0, 10) : null,
          rejectionReason: (p.verification_rejection_reason as string | null) ?? null,
        };
      })
    );
  }

  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <DashboardShell title="Admin Dashboard" nav={ADMIN_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl">Seller Verification</h2>
        {!admin && <span className="text-sm text-danger">Admin data source unavailable.</span>}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = (status ?? null) === f.value;
          return (
            <Link
              key={f.label}
              href={f.value ? `/dashboard/admin/verification?status=${f.value}` : "/dashboard/admin/verification"}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                active ? "bg-brand-strong text-white" : "border border-rule-strong text-ink-soft hover:border-brand-strong hover:text-brand-strong"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>
      {!status && pendingCount > 0 && (
        <p className="mb-4 text-sm text-ink-soft">{pendingCount} submission{pendingCount === 1 ? "" : "s"} waiting for review.</p>
      )}
      <AdminVerificationTable rows={rows} />
    </DashboardShell>
  );
}
