"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Shared by BOTH the admin edit form (dashboard/admin/listings/[id]/edit)
// and the seller edit form (dashboard/seller/listings/[id]/edit) — one
// persistence path for "edit an existing listing's full field set" so the
// two experiences can never silently drift apart. Every export re-checks
// the caller on its own (render-time gating isn't a security boundary —
// see requireAdmin() in src/lib/auth/admin.ts for the same reasoning), and
// always goes through the service-role client: a seller editing their own
// listing is normal RLS-legal (see listings_update_own etc. in schema.sql),
// but an admin editing someone else's isn't, and image uploads need the
// service-role client regardless (storage policies only allow the
// uploader's own id in the path — see listing_proofs_owner_insert).
const STORAGE_BUCKET = "listing-proofs";

async function requireEditAccess(listingId: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Backend isn't connected yet.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be logged in.");

  const admin = createAdminClient();
  if (!admin) throw new Error("Admin client unavailable.");

  const [{ data: profile }, { data: listing }] = await Promise.all([
    admin.from("profiles").select("role").eq("id", user.id).single(),
    admin.from("listings").select("id, seller_id").eq("id", listingId).single(),
  ]);
  if (!listing) throw new Error("Listing not found.");

  const isAdmin = profile?.role === "admin";
  if (!isAdmin && listing.seller_id !== user.id) {
    throw new Error("You don't have permission to edit this listing.");
  }

  return { admin, userId: user.id, isAdmin, sellerId: listing.seller_id as string };
}

export type ListingFullEditFields = {
  title: string;
  categoryId: string;
  businessUrl: string | null;
  location: string | null;
  price: number;
  discountedPrice: number | null;
  overview: string;
  saleIncludesAssets: string;
  saleIncludesSupport: string;
  quickStatColumns: Record<string, unknown>;
  niches: string[];
  loomVideoUrl: string | null;
  monetizationTypeIds: string[];
  monthlyExpenses: { label: string; amount: number }[];
  // Full replace of the 12-month proof-of-income series — every month key
  // present in the form is sent, even ones the seller left blank, so a
  // cleared field actually clears the stored row instead of leaving a
  // stale value behind.
  monthlyIncome: { month: string; income: number | null }[];
  gaAccessConfirmed: boolean | null;
  // Undefined = this category has no SEO section, skip listing_seo_data
  // entirely. Present = upsert every key below (null clears a field the
  // seller had filled in before and just erased).
  seo?: Record<string, number | null>;
  socialStats: { platform: string; followers: number }[];
  // YouTube Channels category only (Design & Development New.pdf, Sep 4
  // 2026). Undefined = category has neither section, skip both tables
  // entirely — same "undefined vs. present" convention as `seo` above.
  copyrightNotes?: string;
  topVideos?: { title: string; videoUrl: string; views: number | null; likes: number | null; duration: string; publishedOn: string | null }[];
};

// Core listing row + every related "profile" table (quick stats live as
// flat columns on `listings` itself, everything else is 1:1 or 1:many).
export async function updateListingFull(listingId: string, fields: ListingFullEditFields) {
  const { admin } = await requireEditAccess(listingId);

  if (!fields.title.trim()) throw new Error("Title is required.");
  if (!Number.isFinite(fields.price) || fields.price < 0) throw new Error("Invalid price.");

  const { error: listingError } = await admin
    .from("listings")
    .update({
      title: fields.title,
      category_id: fields.categoryId,
      business_url: fields.businessUrl,
      location: fields.location,
      price: fields.price,
      discounted_price: fields.discountedPrice,
      overview: fields.overview,
      sale_includes_assets: fields.saleIncludesAssets,
      sale_includes_support: fields.saleIncludesSupport,
      monthly_expenses: fields.monthlyExpenses,
      monetization_type_ids: fields.monetizationTypeIds,
      niches: fields.niches,
      loom_video_url: fields.loomVideoUrl,
      ...(fields.gaAccessConfirmed !== null ? { ga_access_confirmed: fields.gaAccessConfirmed } : {}),
      ...fields.quickStatColumns,
    })
    .eq("id", listingId);
  if (listingError) throw new Error(listingError.message);

  // Monthly income: full replace, since the form always sends all 12 slots
  // (blank ones included) rather than only the ones that changed.
  const { error: deleteMonthlyError } = await admin.from("listing_monthly_stats").delete().eq("listing_id", listingId);
  if (deleteMonthlyError) throw new Error(deleteMonthlyError.message);
  const monthlyRows = fields.monthlyIncome
    .filter((r) => r.income !== null)
    .map((r) => ({ listing_id: listingId, month: r.month, income: r.income }));
  if (monthlyRows.length) {
    const { error } = await admin.from("listing_monthly_stats").insert(monthlyRows);
    if (error) throw new Error(`Saving monthly income failed: ${error.message}`);
  }

  if (fields.seo) {
    const { error } = await admin
      .from("listing_seo_data")
      .upsert({ listing_id: listingId, ...fields.seo }, { onConflict: "listing_id" });
    if (error) throw new Error(`Saving SEO data failed: ${error.message}`);
  }

  // Social stats: full replace, same reasoning as monthly income above.
  const { error: deleteSocialError } = await admin.from("listing_social_stats").delete().eq("listing_id", listingId);
  if (deleteSocialError) throw new Error(deleteSocialError.message);
  const socialRows = fields.socialStats
    .filter((r) => r.platform)
    .map((r) => ({ listing_id: listingId, platform: r.platform, followers: r.followers }));
  if (socialRows.length) {
    const { error } = await admin.from("listing_social_stats").insert(socialRows);
    if (error) throw new Error(`Saving social stats failed: ${error.message}`);
  }

  // Copyright Notes: upsert, same 1:1 pattern as listing_seo_data.
  // `updated_on` is stamped with today's date on every save, matching
  // the "This data was updated on <date>" line on the public listing —
  // sellers never type this date themselves.
  if (fields.copyrightNotes !== undefined) {
    const { error } = await admin
      .from("listing_copyright_notes")
      .upsert(
        { listing_id: listingId, notes: fields.copyrightNotes, updated_on: new Date().toISOString().slice(0, 10) },
        { onConflict: "listing_id" }
      );
    if (error) throw new Error(`Saving Copyright Notes failed: ${error.message}`);
  }

  // Top Performing Videos: full replace, same delete-then-insert reasoning
  // as monthly income / social stats above (the form always sends every
  // row it has, blanks included).
  if (fields.topVideos !== undefined) {
    const { error: deleteVideosError } = await admin.from("listing_top_videos").delete().eq("listing_id", listingId);
    if (deleteVideosError) throw new Error(deleteVideosError.message);
    const videoRows = fields.topVideos
      .filter((v) => v.title)
      .map((v, i) => ({
        listing_id: listingId,
        rank: i + 1,
        title: v.title,
        video_url: v.videoUrl || null,
        views: v.views,
        likes: v.likes,
        duration: v.duration || null,
        published_on: v.publishedOn,
      }));
    if (videoRows.length) {
      const { error } = await admin.from("listing_top_videos").insert(videoRows);
      if (error) throw new Error(`Saving Top Performing Videos failed: ${error.message}`);
    }
  }

  revalidatePath(`/listing/${listingId}`);
  revalidatePath("/dashboard/admin/listings");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/seller");
  revalidatePath("/");
  revalidatePath("/buy");
}

// One gallery's worth of newly-added files, uploaded straight to Storage
// with the service-role client (bypasses the owner-path-only storage
// policies — see the module comment above) then recorded in listing_images.
export async function addListingImages(listingId: string, kind: string, formData: FormData) {
  const { admin, sellerId } = await requireEditAccess(listingId);

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  for (const file of files) {
    const path = `${sellerId}/${listingId}/${kind}/${Date.now()}-${file.name}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await admin.storage.from(STORAGE_BUCKET).upload(path, bytes, {
      contentType: file.type || undefined,
    });
    if (upErr) throw new Error(`${kind} image upload failed: ${upErr.message}`);
    const { data: pub } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    const { error: imgErr } = await admin.from("listing_images").insert({ listing_id: listingId, url: pub.publicUrl, kind });
    if (imgErr) throw new Error(`Saving ${kind} image record failed: ${imgErr.message}`);
  }

  revalidatePath(`/listing/${listingId}`);
}

export async function deleteListingImage(listingId: string, imageId: string) {
  const { admin } = await requireEditAccess(listingId);

  const { error } = await admin.from("listing_images").delete().eq("id", imageId).eq("listing_id", listingId);
  if (error) throw new Error(error.message);

  revalidatePath(`/listing/${listingId}`);
}
