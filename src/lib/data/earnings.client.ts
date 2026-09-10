"use client";

import { createClient } from "@/lib/supabase/client";
import { computeSuccessFee } from "@/lib/fees";

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

// Mirrors the per-order tiered lookup the create_withdrawal_request() RPC
// applies server-side (028_withdrawals.sql) — this copy is display-only, so
// a seller sees the exact net amount they're about to request *before*
// submitting. The RPC is the source of truth for what's actually claimed
// and charged; if the two ever disagree, the RPC wins.
export async function getAvailableBalance(): Promise<AvailableBalance> {
  const empty: AvailableBalance = { grossAmount: 0, successFeeAmount: 0, netAmount: 0, orderCount: 0, escrowComOrderCount: 0 };
  const supabase = createClient();
  if (!supabase) return empty;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return empty;

  const { data: orders } = await supabase
    .from("orders")
    .select("amount, payment_channel")
    .eq("seller_id", userData.user.id)
    .eq("status", "completed")
    .is("withdrawal_id", null);
  if (!orders || orders.length === 0) return empty;

  let gross = 0;
  let fee = 0;
  let escrowComCount = 0;
  for (const o of orders) {
    const amount = Number(o.amount);
    gross += amount;
    fee += computeSuccessFee(amount).feeCents / 100;
    if (o.payment_channel === "escrow_com") escrowComCount += 1;
  }

  return {
    grossAmount: gross,
    successFeeAmount: fee,
    netAmount: gross - fee,
    orderCount: orders.length,
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
