import { notFound } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { ADMIN_NAV } from "@/lib/dashboard-nav";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import ListingEditForm from "@/components/listings/ListingEditForm";

// Admin-side listing edit — shares the same full field set (and the same
// save path, see src/lib/actions/listing-edit.ts) as the seller's own edit
// form, so an admin correction never has fewer fields available than what
// the seller who submitted this listing could edit themselves.
export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const admin = createAdminClient();
  if (!admin) {
    return (
      <DashboardShell title="Admin Dashboard" nav={ADMIN_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
        <p className="text-sm text-danger">Admin data source unavailable.</p>
      </DashboardShell>
    );
  }

  const { data: listing } = await admin.from("listings").select("*").eq("id", id).single();
  if (!listing) notFound();

  const [{ data: seo }, { data: monthlyStats }, { data: images }, { data: socialStats }, { data: copyrightNotes }, { data: topVideos }, { data: channelOverview }, { data: listingAssets }, { data: faqs }] = await Promise.all([
    admin.from("listing_seo_data").select("*").eq("listing_id", id).maybeSingle(),
    admin.from("listing_monthly_stats").select("*").eq("listing_id", id),
    admin.from("listing_images").select("*").eq("listing_id", id),
    admin.from("listing_social_stats").select("*").eq("listing_id", id),
    // YouTube Channels category only (Design & Development New.pdf, Sep 4
    // 2026) — missing rows just mean neither section is pre-filled.
    admin.from("listing_copyright_notes").select("*").eq("listing_id", id).maybeSingle(),
    admin.from("listing_top_videos").select("*").eq("listing_id", id),
    admin.from("listing_youtube_channel_overview").select("*").eq("listing_id", id).maybeSingle(),
    // Asset Transfer System v2's structured asset list (migration 036).
    admin.from("listing_assets").select("*").eq("listing_id", id).order("position", { ascending: true }),
    // Seller-authored Questions & Answers (2026-09-13) — shown on the
    // published listing above the live comment feed.
    admin.from("listing_faqs").select("*").eq("listing_id", id).order("sort_order", { ascending: true }),
  ]);

  return (
    <DashboardShell title="Admin Dashboard" nav={ADMIN_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <ListingEditForm
        mode="admin"
        listing={listing}
        seo={seo ?? null}
        monthlyStats={monthlyStats ?? []}
        images={images ?? []}
        socialStats={socialStats ?? []}
        copyrightNotes={copyrightNotes ?? null}
        topVideos={topVideos ?? []}
        channelOverview={channelOverview ?? null}
        listingAssets={listingAssets ?? []}
        faqs={faqs ?? []}
      />
    </DashboardShell>
  );
}
