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
