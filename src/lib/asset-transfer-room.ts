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
// Pay Later — a 4th checkout option (api/pay-later/init) that creates a
// real order + Transfer Room with no payment gateway at all. Live for every
// signed-in buyer as of 2026-09-12 per the site owner's explicit decision,
// made after being told what it means: any listing can be marked "sold"
// with nothing actually paid. Defaults to ON (unlike
// ASSET_TRANSFER_ROOMS_ENABLED above) so it needs no Vercel change to work
// right after this deploy — set PAY_LATER_ENABLED=false in Vercel's
// Environment Variables to turn it off again without a new deploy.
export function payLaterEnabled(): boolean {
  return process.env.PAY_LATER_ENABLED !== "false";
}

// Returns the subset of orderIds a Transfer Room actually exists for once
// this call returns — either just-created here, or already existing from an
// earlier (possibly retried) call, since the RPC is idempotent. Callers use
// this to decide whether it's safe to link straight to
// /dashboard/transfer/{orderId} in a notification email or a post-purchase
// redirect: a room that failed to create (the listing-not-confirmed case
// documented above, or any other RPC error) must not be linked as if it
// were ready.
export async function maybeCreateTransferRoomsOnPayment(admin: AdminClient, orderIds: string[]): Promise<string[]> {
  if (!assetTransferRoomsEnabled() || orderIds.length === 0) return [];

  const roomReadyOrderIds: string[] = [];
  for (const orderId of orderIds) {
    try {
      const { error } = await admin.rpc("create_transfer_room_on_payment", { p_order_id: orderId });
      if (error) {
        console.warn(`[asset-transfer] create_transfer_room_on_payment(${orderId}) failed:`, error.message);
      } else {
        roomReadyOrderIds.push(orderId);
      }
    } catch (err) {
      console.warn(`[asset-transfer] create_transfer_room_on_payment(${orderId}) threw:`, err);
    }
  }
  return roomReadyOrderIds;
}

// Small shared helper for the "go to your Transfer Room" line every payment
// webhook's seller (and, for Escrow.com, buyer) email appends once a room
// is confirmed ready — one wording, reused everywhere, instead of four
// slightly different copies of the same sentence.
export function transferRoomEmailCta(origin: string, orderId: string): string {
  return `<p><a href="${origin}/dashboard/transfer/${orderId}" style="display:inline-block;margin-top:8px;padding:10px 16px;background:#166534;color:#ffffff;border-radius:6px;text-decoration:none;font-weight:600;">Open the Transfer Room</a></p>`;
}

// 2026-09-12: the site owner's follow-up request was that purchase/sale
// emails actually explain HOW to do the asset transfer step by step, not
// just drop a bare link. These two blocks are appended (immediately before
// transferRoomEmailCta() above) to every buyer/seller email once a Transfer
// Room is confirmed ready — one copy of the steps, reused across all four
// payment rails (Stripe, SSLCommerz, Escrow.com, Pay Later) plus
// startAssetTransfer() in the admin dashboard, instead of drifting slightly
// different wording in each.
export function buyerTransferGuidanceHtml(): string {
  return `<p><strong>How to receive your assets:</strong></p>
    <ol style="margin:4px 0 0;padding-left:20px;">
      <li>Open your Transfer Room using the button below.</li>
      <li>The seller will hand over each item listed under "Assets included" for this business (domain, hosting, social accounts, source code, etc.).</li>
      <li>Check off each item as you receive it, then mark it "Received" in the room.</li>
      <li>Once everything checks out, click "Approve" — this releases your payment to the seller and completes the purchase.</li>
    </ol>`;
}

export function sellerTransferGuidanceHtml(): string {
  return `<p><strong>How to transfer the assets:</strong></p>
    <ol style="margin:4px 0 0;padding-left:20px;">
      <li>Open your Transfer Room using the button below.</li>
      <li>Go through each item in your "Assets included" list and hand it over using the method you specified (transfer the domain, share login access, etc.).</li>
      <li>Mark each item "Submitted" once you've sent it.</li>
      <li>Once the buyer confirms receipt of everything, your payout becomes eligible — request a withdrawal from your Earnings page.</li>
    </ol>`;
}

// Links a listing's title in a notification email straight to its public
// page — closes the "link of the sold business" gap that was previously
// missing from admin's purchase-notification emails (they only got the
// listing's plain title text), and is a harmless, useful addition wherever
// else a listing title appears in an item list.
export function listingLinkHtml(origin: string, listingId: string, title: string): string {
  return `<a href="${origin}/listing/${listingId}">${title}</a>`;
}
