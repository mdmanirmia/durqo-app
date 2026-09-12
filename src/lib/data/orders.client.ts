"use client";

import { createClient } from "@/lib/supabase/client";

export type OrderStatus = "requested" | "awaiting_payment" | "in_escrow" | "in_durqo" | "completed" | "cancelled";

export interface OrderRow {
  id: string;
  listingId: string;
  listingTitle: string;
  counterpartyName: string;
  amount: number;
  status: OrderStatus;
  date: string;
  // Payment breakdown (Sep 2026) — how much of `amount` was actually
  // charged online vs. left for buyer/seller to settle directly
  // (src/lib/payment-terms.ts), plus, when paid via SSLCommerz, the exact
  // BDT amount and USD->BDT rate applied at checkout (src/lib/currency.ts).
  // All optional/undefined for older orders placed before these columns
  // existed.
  paymentChannel: string | null;
  onlineChargeUsd: number | undefined;
  remainderUsd: number | undefined;
  sslcommerzBdtAmount: number | undefined;
  sslcommerzRate: number | undefined;
  // Asset Transfer System v2 (Phase 3) — whether a Transfer Room row
  // already exists for this order, so the orders list can show a
  // "Transfer Room" link only where there's actually something to open.
  // Most real orders won't have one yet: the payment webhooks aren't wired
  // to create_transfer_room_on_payment as of this pass.
  hasTransferRoom: boolean;
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
  const orderIds = rows.map((r) => r.id);
  const [{ data: listings }, { data: profiles }, { data: rooms }] = await Promise.all([
    supabase.from("listings").select("id, title").in("id", listingIds),
    supabase.from("profiles").select("id, full_name").in("id", counterpartyIds),
    supabase.from("asset_transfer_rooms").select("order_id").in("order_id", orderIds),
  ]);
  const listingById = new Map((listings ?? []).map((l) => [l.id, l]));
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const orderIdsWithRoom = new Set((rooms ?? []).map((r) => r.order_id as string));

  return rows.map((r) => ({
    id: r.id,
    listingId: r.listing_id,
    listingTitle: listingById.get(r.listing_id)?.title ?? "Listing",
    counterpartyName: profileById.get(r[counterpartyColumn])?.full_name ?? "—",
    amount: Number(r.amount),
    status: r.status as OrderStatus,
    date: (r.created_at as string).slice(0, 10),
    paymentChannel: (r.payment_channel as string | null) ?? null,
    onlineChargeUsd: r.online_charge_usd === null || r.online_charge_usd === undefined ? undefined : Number(r.online_charge_usd),
    remainderUsd: r.remainder_usd === null || r.remainder_usd === undefined ? undefined : Number(r.remainder_usd),
    sslcommerzBdtAmount: r.sslcommerz_bdt_amount === null || r.sslcommerz_bdt_amount === undefined ? undefined : Number(r.sslcommerz_bdt_amount),
    sslcommerzRate: r.sslcommerz_rate === null || r.sslcommerz_rate === undefined ? undefined : Number(r.sslcommerz_rate),
    hasTransferRoom: orderIdsWithRoom.has(r.id),
  }));
}

export function getBuyerOrders(): Promise<OrderRow[]> {
  return fetchOrders("buyer");
}

export function getSellerOrders(): Promise<OrderRow[]> {
  return fetchOrders("seller");
}

// Powers the live "Orders" nav badge in DashboardShell.tsx (2026-09-12 fix
// — that badge used to be a hardcoded "2"/"1" for every buyer/seller
// regardless of their actual orders). Counts only OPEN orders — same
// "not completed, not cancelled" definition getBuyerOrderCounts() already
// uses for the buyer overview page's own "Open orders" stat — rather than
// every order ever placed, so a finished order doesn't keep the sidebar
// badge lit forever the same way a stale unread Transfer Room message
// used to (see transfer-messages.client.ts's getUnreadTransferMessagesCount
// fix from the same report).
const OPEN_ORDER_STATUSES: OrderStatus[] = ["requested", "awaiting_payment", "in_escrow", "in_durqo"];

async function fetchOpenOrdersCount(side: "buyer" | "seller"): Promise<number> {
  const supabase = createClient();
  if (!supabase) return 0;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return 0;
  const myIdColumn = side === "buyer" ? "buyer_id" : "seller_id";
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq(myIdColumn, userData.user.id)
    .in("status", OPEN_ORDER_STATUSES);
  if (error || count === null) return 0;
  return count;
}

export function getBuyerOpenOrdersCount(): Promise<number> {
  return fetchOpenOrdersCount("buyer");
}

export function getSellerOpenOrdersCount(): Promise<number> {
  return fetchOpenOrdersCount("seller");
}
