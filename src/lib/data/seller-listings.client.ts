"use client";

import { createClient } from "@/lib/supabase/client";

export interface SellerListingRow {
  id: string;
  title: string;
  categoryId: string;
  status: string;
  price: number;
  views: number;
}

export async function getMyListings(): Promise<SellerListingRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from("listings")
    .select("id, title, category_id, status, price, views")
    .eq("seller_id", userData.user.id)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  return data.map((l) => ({
    id: l.id,
    title: l.title,
    categoryId: l.category_id,
    status: l.status,
    price: Number(l.price),
    views: l.views,
  }));
}

// Powers the live "My Listings" nav badge in DashboardShell.tsx (2026-09-12
// fix — that badge used to be a hardcoded "3" for every seller regardless
// of how many listings they actually had). `head: true` avoids pulling back
// any rows, matching the count-only pattern already used by
// getUnreadMessageCount()/getWishlistCount().
export async function getMyListingsCount(): Promise<number> {
  const supabase = createClient();
  if (!supabase) return 0;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return 0;
  const { count, error } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", userData.user.id);
  if (error || count === null) return 0;
  return count;
}
