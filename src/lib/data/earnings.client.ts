"use client";

import { createClient } from "@/lib/supabase/client";

export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";

export interface WithdrawalRow {
  id: string;
  grossAmount: number;
  successFeeAmount: number;
  netAmount: number;
  orderCount: number;
  payoutMethod: string;
  payoutDetails: string;
  status: WithdrawalStatus;
  adminNote: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  paidAt: string | null;
}

export interface AvailableBalance {
  grossAmount: number;
  successFeeAmount: number;
  netAmount: number;
  orderCount: number;
  escrowComOrderCount: number;
}

// Reads each of the seller's completed orders' REMAINING balance — its
// own total minus whatever earlier, non-rejected withdrawal requests
// already claimed from it — via the order_remaining_balances view
// (033_withdrawal_order_splitting.sql, RLS security_invoker). Before this
// migration, an order was either 100% claimed or 100% unclaimed
// (`.is("withdrawal_id", null)`); now a large order can be partially
// claimed across more than one bKash/Rocket/Nagad request, so "available"
// means "has a positive remaining_net", not "was never claimed at all".
// The view computes the tiered Success Fee server-side (same formula as
// src/lib/fees.ts), so this is the source of truth, not a display-only
// estimate — if create_withdrawal_request() (the RPC actually doing the
// claiming) ever disagrees, that's a bug in one of the two, not an
// expected discrepancy.
export async function getAvailableBalance(): Promise<AvailableBalance> {
  const empty: AvailableBalance = { grossAmount: 0, successFeeAmount: 0, netAmount: 0, orderCount: 0, escrowComOrderCount: 0 };
  const supabase = createClient();
  if (!supabase) return empty;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return empty;

  const { data: rows } = await supabase
    .from("order_remaining_balances")
    .select("remaining_gross, remaining_fee, remaining_net, payment_channel")
    .eq("seller_id", userData.user.id)
    .gt("remaining_net", 0);
  if (!rows || rows.length === 0) return empty;

  let gross = 0;
  let fee = 0;
  let net = 0;
  let escrowComCount = 0;
  for (const row of rows) {
    gross += Number(row.remaining_gross);
    fee += Number(row.remaining_fee);
    net += Number(row.remaining_net);
    if (row.payment_channel === "escrow_com") escrowComCount += 1;
  }

  return {
    grossAmount: gross,
    successFeeAmount: fee,
    netAmount: net,
    orderCount: rows.length,
    escrowComOrderCount: escrowComCount,
  };
}

export async function getMyWithdrawals(): Promise<WithdrawalRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .eq("seller_id", userData.user.id)
    .order("requested_at", { ascending: false });
  if (error || !data) return [];

  return data.map((w) => ({
    id: w.id,
    grossAmount: Number(w.gross_amount),
    successFeeAmount: Number(w.success_fee_amount),
    netAmount: Number(w.net_amount),
    orderCount: w.order_count,
    payoutMethod: w.payout_method,
    payoutDetails: w.payout_details,
    status: w.status as WithdrawalStatus,
    adminNote: w.admin_note,
    requestedAt: (w.requested_at as string).slice(0, 10),
    reviewedAt: w.reviewed_at ? (w.reviewed_at as string).slice(0, 10) : null,
    paidAt: w.paid_at ? (w.paid_at as string).slice(0, 10) : null,
  }));
}
