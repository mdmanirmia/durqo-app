"use client";

import { createClient } from "@/lib/supabase/client";
import { CATEGORY_MAP } from "@/lib/categories";
import type { Listing } from "@/lib/types";
import { mapListing } from "./map-listing";
import { emitCountsChanged } from "@/lib/count-events";

export async function isInCart(listingId: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;
  const { data, error } = await supabase
    .from("cart_items")
    .select("listing_id")
    .eq("user_id", userData.user.id)
    .eq("listing_id", listingId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

// Returns the new state (true = now in cart) or null if not logged in.
export async function toggleCart(listingId: string): Promise<boolean | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const userId = userData.user.id;

  const already = await isInCart(listingId);
  if (already) {
    const { error } = await supabase.from("cart_items").delete().eq("user_id", userId).eq("listing_id", listingId);
    if (error) throw new Error(error.message);
    emitCountsChanged();
    return false;
  } else {
    const { error } = await supabase.from("cart_items").insert({ user_id: userId, listing_id: listingId });
    if (error) throw new Error(error.message);
    emitCountsChanged();
    return true;
  }
}

export async function removeFromCart(listingId: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const { error } = await supabase.from("cart_items").delete().eq("user_id", userData.user.id).eq("listing_id", listingId);
  if (error) throw new Error(error.message);
  emitCountsChanged();
}

// Badge count for the Header's cart icon.
export async function getCartCount(): Promise<number> {
  const supabase = createClient();
  if (!supabase) return 0;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return 0;
  const { count, error } = await supabase
    .from("cart_items")
    .select("listing_id", { count: "exact", head: true })
    .eq("user_id", userData.user.id);
  if (error || count === null) return 0;
  return count;
}

export async function getCartListings(): Promise<Listing[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data: cartRows, error: cartError } = await supabase
    .from("cart_items")
    .select("listing_id")
    .eq("user_id", userData.user.id);
  if (cartError || !cartRows || cartRows.length === 0) return [];

  const ids = cartRows.map((r) => r.listing_id);
  const { data: rows, error } = await supabase.from("listings").select("*").in("id", ids);
  if (error || !rows) return [];

  const sellerIds = [...new Set(rows.map((r) => r.seller_id))];
  const { data: sellers } = await supabase.from("profiles").select("*").in("id", sellerIds);
  const sellerById = new Map((sellers ?? []).map((s) => [s.id, s]));

  return rows.map((row) => mapListing(row, CATEGORY_MAP[row.category_id]?.quickStats ?? [], { seller: sellerById.get(row.seller_id) }));
}

// Creates one `orders` row per cart item (status "requested") and empties
// the cart — matches the existing cart page copy ("we'll connect you with
// each seller to open escrow, no payment is collected here").
export async function requestPurchase(listings: Listing[]): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("Backend isn't connected yet.");
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("You need to be logged in to request a purchase.");
  const buyerId = userData.user.id;

  const rows = listings.map((l) => ({
    listing_id: l.id,
    buyer_id: buyerId,
    seller_id: l.seller.id,
    amount: l.discountedPrice ?? l.price,
    status: "requested" as const,
  }));
  const { error: insertError } = await supabase.from("orders").insert(rows);
  if (insertError) throw new Error(insertError.message);

  const { error: clearError } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", buyerId)
    .in("listing_id", listings.map((l) => l.id));
  if (clearError) throw new Error(clearError.message);
  emitCountsChanged();
}

// Counts for the buyer dashboard's stat tiles. "Open" is anything not yet
// completed or cancelled (requested / awaiting_payment / in_escrow).
export async function getBuyerOrderCounts(): Promise<{ open: number; completed: number }> {
  const supabase = createClient();
  if (!supabase) return { open: 0, completed: 0 };
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { open: 0, completed: 0 };

  const { data, error } = await supabase.from("orders").select("status").eq("buyer_id", userData.user.id);
  if (error || !data) return { open: 0, completed: 0 };

  const completed = data.filter((o) => o.status === "completed").length;
  const open = data.filter((o) => o.status !== "completed" && o.status !== "cancelled").length;
  return { open, completed };
}
