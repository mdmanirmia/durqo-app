import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeSuccessFee } from "@/lib/fees";
import ReceiptView, { type ReceiptData } from "./ReceiptView";

// Downloadable receipt/invoice for a single order — reachable from both the
// buyer and seller orders tables. Ownership (not admin) authorizes reading
// the row: orders_select_involved (schema.sql) already restricts `select`
// to the buyer or seller on the order, so the .maybeSingle() below returns
// nothing for anyone else and this 404s rather than leaking another
// party's order. Rendered as a plain server-fetched, client-printed page
// (window.print() in ReceiptView) rather than a PDF-generation dependency,
// matching this codebase's otherwise-dependency-light style.
export default async function ReceiptPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const supabase = await createClient();
  if (!supabase) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) notFound();

  const viewerSide: "buyer" | "seller" = order.buyer_id === user.id ? "buyer" : "seller";

  const [{ data: listing }, { data: buyerProfile }, { data: sellerProfile }] = await Promise.all([
    supabase.from("listings").select("title").eq("id", order.listing_id).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", order.buyer_id).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", order.seller_id).maybeSingle(),
  ]);

  // The Success Fee is only ever actually charged when this order is
  // claimed by a withdrawal request (create_withdrawal_request() RPC,
  // 028_withdrawals.sql) — shown here to the seller as an estimate so the
  // receipt is informative before that happens, not as a record of money
  // already deducted.
  const estimatedFee = computeSuccessFee(Number(order.amount));

  const data: ReceiptData = {
    orderId: order.id,
    date: (order.created_at as string).slice(0, 10),
    listingTitle: listing?.title ?? "Listing",
    buyerName: buyerProfile?.full_name || "—",
    sellerName: sellerProfile?.full_name || "—",
    amount: Number(order.amount),
    status: order.status,
    paymentChannel: order.payment_channel ?? null,
    onlineChargeUsd: order.online_charge_usd === null || order.online_charge_usd === undefined ? undefined : Number(order.online_charge_usd),
    remainderUsd: order.remainder_usd === null || order.remainder_usd === undefined ? undefined : Number(order.remainder_usd),
    sslcommerzBdtAmount:
      order.sslcommerz_bdt_amount === null || order.sslcommerz_bdt_amount === undefined ? undefined : Number(order.sslcommerz_bdt_amount),
    sslcommerzRate: order.sslcommerz_rate === null || order.sslcommerz_rate === undefined ? undefined : Number(order.sslcommerz_rate),
    escrowTransactionId: order.escrow_transaction_id ?? null,
    viewerSide,
    estimatedFeeRate: estimatedFee.rate,
    estimatedFeeAmount: estimatedFee.feeCents / 100,
    estimatedNetAmount: estimatedFee.netCents / 100,
    alreadyClaimedByWithdrawal: !!order.withdrawal_id,
  };

  return <ReceiptView data={data} />;
}
