import { notFound } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/dashboard-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import EditListingForm from "./EditListingForm";

// Admin-side listing edit. Covers the fields most likely to need a
// correction (title, category, price, location, overview, sale-includes
// text, and the category's quick-stat columns) — deliberately does not
// touch the deeper seller-submitted proof data (12-month income calendar,
// GA/GSC/SEMrush/Ahrefs numbers, social stats, image galleries), which
// stays reviewed via the existing Approve/Reject flow rather than
// silently admin-editable. See updateListing() in ../../actions.ts.
export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const admin = createAdminClient();
  if (!admin) {
    return (
      <DashboardShell title="Admin Dashboard" nav={ADMIN_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
        <p className="text-sm text-red-600">Admin data source unavailable.</p>
      </DashboardShell>
    );
  }

  const { data: listing } = await admin.from("listings").select("*").eq("id", id).single();
  if (!listing) notFound();

  return (
    <DashboardShell title="Admin Dashboard" nav={ADMIN_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <EditListingForm listing={listing} />
    </DashboardShell>
  );
}
