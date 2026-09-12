"use server";

import { revalidatePath } from "next/cache";
import { requireEditAccess } from "@/lib/actions/listing-edit";

// Deliberately its own Server Action, separate from updateListingFull()'s
// big "Save Changes" — confirming the structured asset list is a distinct,
// meaningful action (Asset Transfer System v2 report, Section 2.7: a
// listing can't be bought until this has happened), not something that
// should quietly ride along with an unrelated field edit. The seller/admin
// edits and saves asset rows through updateListingFull() like any other
// field; they confirm the result with this, on its own, when they're ready.
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
