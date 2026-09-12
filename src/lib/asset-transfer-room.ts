import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

// Off by default. Flip ASSET_TRANSFER_ROOMS_ENABLED=true in the deploy
// environment once migrations 034-037 have actually been run in Supabase —
// see claude/asset-transfer-system-v2-phase-0-1-implementation-addendum.md
// for the full deployment-ordering note. Deploying this webhook code with
// the flag left off (or unset) is exactly as safe as before this change:
// maybeCreateTransferRoomsOnPayment() below becomes a no-op.
export function assetTransferRoomsEnabled(): boolean {
  return process.env.ASSET_TRANSFER_ROOMS_ENABLED === "true";
}

// Best-effort, feature-flagged Transfer Room creation — called from all
// three payment webhooks (Stripe, SSLCommerz IPN, Escrow.com) right after
// an order flips to `in_escrow`, the real "payment confirmed" signal all
// three already share (see 037_asset_transfer_system_rpcs.sql's header
// comment on create_transfer_room_on_payment). The RPC itself is
// idempotent (a retried webhook calling this twice for the same order just
// gets the existing room back), so this needs no extra guard against
// double-firing on a webhook retry.
//
// Deliberately never allowed to fail or slow down the webhook response:
// Stripe/SSLCommerz/Escrow.com all retry a non-2xx response, and the
// order/listing state the caller already wrote is real and must not be
// undone or re-attempted just because this optional follow-on step had a
// problem. In particular, an order whose listing never confirmed a
// structured asset list makes create_transfer_room_on_payment() raise —
// expected and harmless to just log for any order that predates the
// Phase 2 checkout gate (which blocks new purchases of an unconfirmed
// listing, so this case should only ever show up for older orders).
export async function maybeCreateTransferRoomsOnPayment(admin: AdminClient, orderIds: string[]) {
  if (!assetTransferRoomsEnabled() || orderIds.length === 0) return;

  for (const orderId of orderIds) {
    try {
      const { error } = await admin.rpc("create_transfer_room_on_payment", { p_order_id: orderId });
      if (error) {
        console.warn(`[asset-transfer] create_transfer_room_on_payment(${orderId}) failed:`, error.message);
      }
    } catch (err) {
      console.warn(`[asset-transfer] create_transfer_room_on_payment(${orderId}) threw:`, err);
    }
  }
}
