import { notFound, redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SELLER_NAV } from "@/lib/dashboard-nav";
import { createClient } from "@/lib/supabase/server";
import ListingEditForm from "@/components/listings/ListingEditForm";

// Sellers can edit a listing at any time after submission — not just while
// it's still pending review. This isn't gated to any particular status
// (draft / pending_review / published / sold / archived): the seller
// dashboard's "My Listings" table links here for every one of their
// listings. Ownership (not admin) is what authorizes reading the row here;
// listings_select_published's RLS policy already lets a seller select
// their own row regardless of status. The actual save goes through
// updateListingFull() (src/lib/actions/listing-edit.ts), which re-checks
// ownership itself rather than trusting this page's check alone.
export default async function SellerEditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  if (!supabase) {
    return (
      <DashboardShell title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
        <p className="text-sm text-danger">Backend isn&rsquo;t connected yet.</p>
      </DashboardShell>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listing } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  if (!listing) notFound();
  if (listing.seller_id !== user.id) notFound();

  const [{ data: seo }, { data: monthlyStats }, { data: images }, { data: socialStats }, { data: copyrightNotes }, { data: topVideos }, { data: channelOverview }] = await Promise.all([
    supabase.from("listing_seo_data").select("*").eq("listing_id", id).maybeSingle(),
    supabase.from("listing_monthly_stats").select("*").eq("listing_id", id),
    supabase.from("listing_images").select("*").eq("listing_id", id),
    supabase.from("listing_social_stats").select("*").eq("listing_id", id),
    // YouTube Channels category only (Design & Development New.pdf, Sep 4
    // 2026) — missing rows just mean neither section is pre-filled.
    supabase.from("listing_copyright_notes").select("*").eq("listing_id", id).maybeSingle(),
    supabase.from("listing_top_videos").select("*").eq("listing_id", id),
    supabase.from("listing_youtube_channel_overview").select("*").eq("listing_id", id).maybeSingle(),
  ]);

  return (
    <DashboardShell title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <ListingEditForm
        mode="seller"
        listing={listing}
        seo={seo ?? null}
        monthlyStats={monthlyStats ?? []}
        images={images ?? []}
        socialStats={socialStats ?? []}
        copyrightNotes={copyrightNotes ?? null}
        topVideos={topVideos ?? []}
        channelOverview={channelOverview ?? null}
      />
    </DashboardShell>
  );
}
