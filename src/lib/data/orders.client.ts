"use client";

import { createClient } from "@/lib/supabase/client";

export type OrderStatus = "requested" | "awaiting_payment" | "in_escrow" | "completed" | "cancelled";

export interface OrderRow {
  id: string;
  listingId: string;
  listingTitle: string;
  counterpartyName: string;
  amount: number;
  status: OrderStatus;
  date: string;
}

// Shared by both dashboards — `side` picks which foreign key identifies "me"
// (buyer_id for the buyer dashboard, seller_id for the seller dashboard) and
// which profile to show as the counterparty.
async function fetchOrders(side: "buyer" | "seller"): Promise<OrderRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const myIdColumn = side === "buyer" ? "buyer_id" : "seller_id";
  const counterpartyColumn = side === "buyer" ? "seller_id" : "buyer_id";

  const { data: rows, error } = await supabase
    .from("orders")
    .select("*")
    .eq(myIdColumn, userData.user.id)
    .order("created_at", { ascending: false });
  if (error || !rows || rows.length === 0) return [];

  const listingIds = [...new Set(rows.map((r) => r.listing_id))];
  const counterpartyIds = [...new Set(rows.map((r) => r[counterpartyColumn]))];
  const [{ data: listings }, { data: profiles }] = await Promise.all([
    supabase.from("listings").select("id, title").in("id", listingIds),
    supabase.from("profiles").select("id, full_name").in("id", counterpartyIds),
  ]);
  const listingById = new Map((listings ?? []).map((l) => [l.id, l]));
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((r) => ({
    id: r.id,
    listingId: r.listing_id,
    listingTitle: listingById.get(r.listing_id)?.title ?? "Listing",
    counterpartyName: profileById.get(r[counterpartyColumn])?.full_name ?? "—",
    amount: Number(r.amount),
    status: r.status as OrderStatus,
    date: (r.created_at as string).slice(0, 10),
  }));
}

export function getBuyerOrders(): Promise<OrderRow[]> {
  return fetchOrders("buyer");
}

export function getSellerOrders(): Promise<OrderRow[]> {
  return fetchOrders("seller");
}
