"use server";

import { revalidatePath } from "next/cache";
import { requireEditAccess } from "@/lib/actions/listing-edit";

// Confirming a listing's structured asset list requires the service-role
// client (assets_confirmed_at isn't seller-writable under RLS — same
// reasoning as everything else routed through requireEditAccess's admin
// client), which is the only reason this stays its own function rather
// than being inlined at each call site.
//
// No longer a separate user-facing step (2026-09-12, per the site owner's
// explicit request: seller confirms simply by saving a non-empty list, no
// extra click). It's called automatically from two places now: right after
// updateListingFull() replaces a listing's asset rows on an edit/save (see
// listing-edit.ts, which does this inline against its own already-open
// admin client rather than calling this function again), and right after a
// brand-new listing's initial assets are inserted on the "new listing" page
// (dashboard/seller/listings/new/page.tsx), which is this function's actual
// remaining caller.
export async function confirmListingAssets(listingId: string) {
  const { admin } = await requireEditAccess(listingId);

  const { count, error: countError } = await admin
    .from("listing_assets")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId);
  if (countError) throw new Error(countError.message);
  if (!count) throw new Error("Add at least one asset to the list before confirming it.");

  const { error } = await admin
    .from("listings")
    .update({ assets_confirmed_at: new Date().toISOString() })
    .eq("id", listingId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/seller/listings/${listingId}/edit`);
  revalidatePath(`/dashboard/admin/listings/${listingId}/edit`);
  revalidatePath(`/listing/${listingId}`);
}
