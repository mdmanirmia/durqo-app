"use client";

import { createClient } from "@/lib/supabase/client";
import { CATEGORY_MAP } from "@/lib/categories";
import type { Listing } from "@/lib/types";
import { mapListing } from "./map-listing";

// Wishlist is per-signed-in-user (RLS on public.wishlists restricts rows to
// auth.uid() = user_id), so every function here needs a logged-in session —
// callers should treat a null/false return as "not logged in or nothing
// saved" rather than distinguishing the two, since that's how the buyer
// experience should degrade anyway (prompt login on the heart click).

export async function isWishlisted(listingId: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;
  const { data, error } = await supabase
    .from("wishlists")
    .select("listing_id")
    .eq("user_id", userData.user.id)
    .eq("listing_id", listingId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

// Returns the new state (true = now wishlisted) or null if the user isn't
// logged in (caller should redirect to /login in that case).
export async function toggleWishlist(listingId: string): Promise<boolean | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const userId = userData.user.id;

  const already = await isWishlisted(listingId);
  if (already) {
    const { error } = await supabase.from("wishlists").delete().eq("user_id", userId).eq("listing_id", listingId);
    if (error) throw new Error(error.message);
    return false;
  } else {
    const { error } = await supabase.from("wishlists").insert({ user_id: userId, listing_id: listingId });
    if (error) throw new Error(error.message);
    return true;
  }
}

export async function getWishlistedListings(): Promise<Listing[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data: wishRows, error: wishError } = await supabase
    .from("wishlists")
    .select("listing_id")
    .eq("user_id", userData.user.id);
  if (wishError || !wishRows || wishRows.length === 0) return [];

  const ids = wishRows.map((r) => r.listing_id);
  const { data: rows, error } = await supabase.from("listings").select("*").in("id", ids);
  if (error || !rows) return [];

  const sellerIds = [...new Set(rows.map((r) => r.seller_id))];
  const [{ data: sellers }, { data: monthlyStats }, { data: socialStats }] = await Promise.all([
    supabase.from("profiles").select("*").in("id", sellerIds),
    supabase.from("listing_monthly_stats").select("*").in("listing_id", ids),
    supabase.from("listing_social_stats").select("*").in("listing_id", ids),
  ]);
  const sellerById = new Map((sellers ?? []).map((s) => [s.id, s]));

  return rows.map((row) =>
    mapListing(row, CATEGORY_MAP[row.category_id]?.quickStats ?? [], {
      seller: sellerById.get(row.seller_id),
      monthlyStats: (monthlyStats ?? []).filter((m) => m.listing_id === row.id),
      socialStats: (socialStats ?? []).filter((s) => s.listing_id === row.id),
    })
  );
}
