"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { getUserEmails } from "@/lib/notifications";
import { transferRoomEmailCta, buyerTransferGuidanceHtml, sellerTransferGuidanceHtml } from "@/lib/asset-transfer-room";

// Shared by every best-effort notification block below — resolves the
// request's own host so links always point at whatever origin the admin is
// actually using (production, preview, or localhost), same pattern already
// used by listing-edit.ts and the payment webhooks.
async function resolveOrigin(): Promise<string> {
  const hdrs = await headers();
  const host = hdrs.get("host");
  return host ? `${host.includes("localhost") ? "http" : "https"}://${host}` : "https://www.durqo.com";
}

const LISTING_STATUSES = ["draft", "pending_review", "published", "sold", "archived"] as const;
type ListingStatus = (typeof LISTING_STATUSES)[number];

const USER_ROLES = ["buyer", "seller", "admin"] as const;
type UserRole = (typeof USER_ROLES)[number];

const ORDER_STATUSES = ["requested", "awaiting_payment", "in_escrow", "in_durqo", "completed", "cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

const ORDER_PAYMENT_CHANNELS = ["stripe", "durqo_platform", "bangladesh_gateway", "escrow", "escrow_com"] as const;
type OrderPaymentChannel = (typeof ORDER_PAYMENT_CHANNELS)[number];

// Every action re-verifies the caller is an admin on its own — the page
// that renders the button that calls this isn't a security boundary, per
// Next.js's Server Actions guidance. Only a listing/user id and the single
// intended change are ever trusted from the client; everything else
// (permission, the row's other fields) is re-derived server-side.

export async function setListingStatus(listingId: string, status: ListingStatus) {
  await requireAdmin();
  if (!LISTING_STATUSES.includes(status)) throw new Error("Invalid status");

  const admin = createAdminClient();
  if (!admin) throw new Error("Admin client unavailable");

  // Fetched before the update purely to know what the seller's pending
  // listing just turned into (see the notification block below) — not used
  // to gate the update itself.
  const { data: beforeRow } = await admin.from("listings").select("status, title, seller_id").eq("id", listingId).maybeSingle();

  const { error } = await admin.from("listings").update({ status }).eq("id", listingId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/listings");
  revalidatePath("/dashboard/admin");
  // Publish/unpublish/mark-sold/archive all change what the public listing
  // page and the homepage/marketplace should show for this listing — unlike
  // updateListing() and setListingGaVerified() above, this action was only
  // ever revalidating the admin views, so a status flip (e.g. Unpublish)
  // kept showing the old state on /listing/[id] until something else
  // happened to revalidate it.
  revalidatePath(`/listing/${listingId}`);
  revalidatePath("/");
  revalidatePath("/buy");

  // 2026-09-12 audit fix: this is the primary admin moderation workflow
  // (Approve/Reject on AdminListingsTable, driven by this same function)
  // and, unlike every other admin decision in this file (verification,
  // withdrawals, listing edits, transfer disputes), it never told the
  // seller anything — they had no way to know their pending listing was
  // approved or rejected short of checking the dashboard by hand. Scoped
  // tightly to the actual pending_review resolution (its two outcomes are
  // "published" for Approve and "archived" for Reject) rather than every
  // possible status change this function can make (Unpublish/Mark Sold/
  // Restore/Delete are admin housekeeping, not a decision the seller is
  // sitting there waiting to hear about).
  if (beforeRow?.status === "pending_review" && (status === "published" || status === "archived") && beforeRow.seller_id) {
    try {
      const emails = await getUserEmails(admin, [beforeRow.seller_id as string]);
      const sellerEmail = emails[beforeRow.seller_id as string];
      if (sellerEmail) {
        const title = (beforeRow.title as string) || "your listing";
        const origin = await resolveOrigin();
        if (status === "published") {
          await sendEmail(
            sellerEmail,
            `Your listing "${title}" is now live on Durqo`,
            `<p>Good news — your listing "${title}" was approved and is now live on the marketplace.</p>
             <p><a href="${origin}/listing/${listingId}">View your listing</a></p>`
          );
        } else {
          await sendEmail(
            sellerEmail,
            `Your listing "${title}" wasn't approved`,
            `<p>Your listing "${title}" wasn't approved for the marketplace this time.</p>
             <p>Please review it in your seller dashboard, make any needed changes, and submit a new listing when it's ready.</p>`
          );
        }
      }
    } catch (err) {
      console.error("[admin] setListingStatus seller notification failed:", err);
    }
  }
}

export async function setUserRole(userId: string, role: UserRole) {
  const admin = await requireAdmin();
  if (!USER_ROLES.includes(role)) throw new Error("Invalid role");
  if (userId === admin.id && role !== "admin") {
    throw new Error("You can't demote your own account.");
  }

  const supabaseAdmin = createAdminClient();
  if (!supabaseAdmin) throw new Error("Admin client unavailable");

  const { error } = await supabaseAdmin.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin");
}

// "Delete" a user, product-decision-wise, means deactivate rather than
// remove: profiles.is_active (migration 008) gates login in src/proxy.ts
// and the client-side login check — a blocked account's listings, orders
// and history all stay exactly as they were, and this can be reversed at
// any time. Never actually deletes the auth.users row.
export async function setUserActive(userId: string, active: boolean) {
  const admin = await requireAdmin();
  if (userId === admin.id && !active) {
    throw new Error("You can't deactivate your own account.");
  }

  const supabaseAdmin = createAdminClient();
  if (!supabaseAdmin) throw new Error("Admin client unavailable");

  const { error } = await supabaseAdmin.from("profiles").update({ is_active: active }).eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin");
}

// "Add user" from the admin dashboard invites by email — Supabase sends its
// own auth invite/magic-link email (a separate mechanism from the Resend
// integration used elsewhere in this app), so no password ever passes
// through this code. handle_new_user() (schema.sql) auto-creates the
// profiles row from auth.users on insert, seeded with full_name from the
// user metadata below; the update afterward covers the role (and re-sets
// full_name defensively in case the trigger runs with different data).
export async function inviteUser(email: string, fullName: string, role: UserRole) {
  await requireAdmin();
  if (!USER_ROLES.includes(role)) throw new Error("Invalid role");

  const supabaseAdmin = createAdminClient();
  if (!supabaseAdmin) throw new Error("Admin client unavailable");

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName || undefined },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Invite sent, but no user record was returned.");

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ role, ...(fullName ? { full_name: fullName } : {}) })
    .eq("id", data.user.id);
  if (profileError) throw new Error(profileError.message);

  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin");
}

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  await requireAdmin();
  if (!ORDER_STATUSES.includes(status)) throw new Error("Invalid status");

  const supabaseAdmin = createAdminClient();
  if (!supabaseAdmin) throw new Error("Admin client unavailable");

  const { error } = await supabaseAdmin.from("orders").update({ status }).eq("id", orderId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/orders");
  revalidatePath("/dashboard/admin");
}

// Which rail an order was actually paid through — a manual admin-set label
// (migration 009), same "label only" spirit as setOrderStatus() above:
// nothing here talks to Stripe or any gateway, it just records how the
// money actually moved so admin can tell Stripe orders apart from ones
// settled directly on the Durqo platform or via a Bangladesh gateway.
export async function setOrderPaymentChannel(orderId: string, channel: OrderPaymentChannel) {
  await requireAdmin();
  if (!ORDER_PAYMENT_CHANNELS.includes(channel)) throw new Error("Invalid payment channel");

  const supabaseAdmin = createAdminClient();
  if (!supabaseAdmin) throw new Error("Admin client unavailable");

  const { error } = await supabaseAdmin.from("orders").update({ payment_channel: channel }).eq("id", orderId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/orders");
  revalidatePath("/dashboard/admin");
}

// Manual "start the Asset Transfer Room now" button — for the one case the
// three payment webhooks deliberately do NOT auto-create a room: a
// SSLCommerz order with a remainder still owed (remainder_usd > 0, i.e. the
// buyer only paid the online-deposit-capped portion). Per the site owner's
// instruction (2026-09-12), those get held back until the site owner has
// manually collected and verified the rest of the money directly with the
// buyer — only then should the Transfer Room open. This action is that
// trigger: it just calls the same idempotent RPC the webhooks call, so
// clicking it twice (or clicking it for an order that already has a room)
// is harmless. Not restricted to remainder orders specifically — any paid
// order without a room yet (in_escrow or in_durqo) can be started this way,
// which also gives admin a manual recovery path if a webhook's automatic
// call ever failed silently.
export async function startAssetTransfer(orderId: string) {
  await requireAdmin();

  const supabaseAdmin = createAdminClient();
  if (!supabaseAdmin) throw new Error("Admin client unavailable");

  const { error } = await supabaseAdmin.rpc("create_transfer_room_on_payment", { p_order_id: orderId });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/orders");
  revalidatePath("/dashboard/admin");
  revalidatePath(`/dashboard/transfer/${orderId}`);
  revalidatePath("/dashboard/buyer/orders");
  revalidatePath("/dashboard/seller/orders");

  // Best-effort: let both parties know the Transfer Room is open now that
  // admin has manually started it (the one case the payment webhooks
  // deliberately hold back — see the module comment above).
  try {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("listing_id, buyer_id, seller_id")
      .eq("id", orderId)
      .maybeSingle();
    if (order) {
      const { data: listing } = await supabaseAdmin.from("listings").select("title").eq("id", order.listing_id).maybeSingle();
      const title = listing?.title ?? "your order";
      const emails = await getUserEmails(supabaseAdmin, [order.buyer_id as string, order.seller_id as string]);
      const origin = await resolveOrigin();
      const cta = transferRoomEmailCta(origin, orderId);
      const buyerEmail = emails[order.buyer_id as string];
      const sellerEmail = emails[order.seller_id as string];

      if (buyerEmail) {
        await sendEmail(
          buyerEmail,
          `Your Transfer Room is open — "${title}"`,
          `<p>Your Transfer Room for "${title}" is now open.</p>${buyerTransferGuidanceHtml()}${cta}`
        );
      }
      if (sellerEmail) {
        await sendEmail(
          sellerEmail,
          `Your Transfer Room is open — "${title}"`,
          `<p>Your Transfer Room for "${title}" is now open.</p>${sellerTransferGuidanceHtml()}${cta}`
        );
      }
    }
  } catch (err) {
    console.error("[admin] startAssetTransfer notification emails failed:", err);
  }
}

// Core-field edit for a listing — title, category, price and the other
// fields most likely to need an admin correction, plus the category's
// quick-stat columns (already pre-mapped to real column names by the
// caller via QUICK_STAT_COLUMNS, same helper the seller "new listing" form
// uses). Deep proof-data (the 12-month income calendar, GA/GSC/SEMrush/
// Ahrefs numbers, social stats, image galleries) isn't editable from this
// form — those stay seller-submitted and admin-reviewed via
// approve/reject, not silently rewritten by an admin.
export async function updateListing(
  listingId: string,
  fields: {
    title: string;
    categoryId: string;
    businessUrl: string | null;
    location: string | null;
    price: number;
    discountedPrice: number | null;
    overview: string;
    saleIncludesAssets: string;
    saleIncludesSupport: string;
    quickStatColumns: Record<string, unknown>;
  }
) {
  await requireAdmin();
  if (!fields.title.trim()) throw new Error("Title is required.");
  if (!Number.isFinite(fields.price) || fields.price < 0) throw new Error("Invalid price.");

  const supabaseAdmin = createAdminClient();
  if (!supabaseAdmin) throw new Error("Admin client unavailable");

  const { error } = await supabaseAdmin
    .from("listings")
    .update({
      title: fields.title,
      category_id: fields.categoryId,
      business_url: fields.businessUrl,
      location: fields.location,
      price: fields.price,
      discounted_price: fields.discountedPrice,
      overview: fields.overview,
      sale_includes_assets: fields.saleIncludesAssets,
      sale_includes_support: fields.saleIncludesSupport,
      ...fields.quickStatColumns,
    })
    .eq("id", listingId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/listings");
  revalidatePath(`/listing/${listingId}`);
  revalidatePath("/dashboard/admin");

  // Best-effort: let the seller know an admin changed their listing.
  try {
    const { data: listingRow } = await supabaseAdmin.from("listings").select("seller_id").eq("id", listingId).maybeSingle();
    if (listingRow?.seller_id) {
      const emails = await getUserEmails(supabaseAdmin, [listingRow.seller_id as string]);
      const sellerEmail = emails[listingRow.seller_id as string];
      if (sellerEmail) {
        const origin = await resolveOrigin();
        await sendEmail(
          sellerEmail,
          `Your listing "${fields.title}" was updated by Durqo`,
          `<p>An admin made changes to your listing "${fields.title}". Please review it to make sure everything looks right.</p>
           <p><a href="${origin}/listing/${listingId}">View your listing</a></p>`
        );
      }
    }
  } catch (err) {
    console.error("[admin] updateListing seller notification failed:", err);
  }
}

// Listing-level Google Analytics verification (Motion Invest / Flippa style
// — an admin manually logs into the seller's GA4 property using the
// support@durqo.com Viewer access the seller confirmed granting on the
// listing form, cross-checks it against the numbers the seller typed in,
// then flips this flag. This is the ONLY place ga_verified is ever allowed
// to become true — the seller's own listing-creation flow can only set
// ga_access_confirmed (their self-declared "I granted access" checkbox),
// never ga_verified itself.
export async function setListingGaVerified(listingId: string, verified: boolean) {
  await requireAdmin();

  const admin = createAdminClient();
  if (!admin) throw new Error("Admin client unavailable");

  const { error } = await admin.from("listings").update({ ga_verified: verified }).eq("id", listingId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/listings");
  revalidatePath(`/listing/${listingId}`);
  revalidatePath("/dashboard/admin");
}

const VERIFICATION_DECISIONS = ["verified", "rejected"] as const;
type VerificationDecision = (typeof VERIFICATION_DECISIONS)[number];

// The ONLY place profiles.verification_status is ever allowed to become
// "verified" or "rejected" — the seller's own submitVerification() action
// (dashboard/seller/verification/actions.ts) can only ever write "pending".
// Sets is_verified alongside it so the badge that already renders
// everywhere off that column (ListingCard, listing detail, /buy's
// "verified only" filter) picks it up immediately.
export async function setVerificationStatus(userId: string, decision: VerificationDecision) {
  await requireAdmin();
  if (!VERIFICATION_DECISIONS.includes(decision)) throw new Error("Invalid decision");

  const admin = createAdminClient();
  if (!admin) throw new Error("Admin client unavailable");

  const { data: profile } = await admin.from("profiles").select("full_name").eq("id", userId).single();

  const { error } = await admin
    .from("profiles")
    .update({
      verification_status: decision,
      is_verified: decision === "verified",
      verification_reviewed_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/verification");
  revalidatePath("/dashboard/admin");

  // Best-effort: let the seller know the outcome. Looks up this one user
  // directly by id (getUserById) rather than scanning a listUsers() page —
  // 2026-09-12 fix: the previous plain listUsers() call only returns its
  // default first ~50 users, so this silently found no email (and sent no
  // notification at all) for any seller outside that page.
  const { data: userLookup } = await admin.auth.admin.getUserById(userId);
  const sellerEmail = userLookup?.user?.email;
  const sellerName = profile?.full_name || "there";
  if (sellerEmail) {
    const subject = decision === "verified" ? "You're verified on Durqo" : "Your verification wasn't approved";
    const html =
      decision === "verified"
        ? `<p>Hi ${sellerName},</p><p>Your identity has been verified. The verified badge is now live on your listings.</p><p>— Durqo</p>`
        : `<p>Hi ${sellerName},</p><p>We weren't able to verify your documents this time. Please make sure the photo is clear and legible, then resubmit from your seller dashboard.</p><p>— Durqo</p>`;
    await sendEmail(sellerEmail, subject, html);
  }
}

const WITHDRAWAL_DECISIONS = ["approved", "rejected", "paid"] as const;
type WithdrawalDecision = (typeof WITHDRAWAL_DECISIONS)[number];

// The ONLY place a withdrawal_requests row can move out of "pending" — the
// seller's own requestWithdrawal() action (dashboard/seller/earnings/
// actions.ts) can only ever create one in "pending" via the
// create_withdrawal_request() RPC (028_withdrawals.sql). Same manual
// review shape as setVerificationStatus() above: "approved" means admin
// has agreed to pay it out (money hasn't necessarily moved yet — this app
// has no automated payout rail), "paid" is the admin confirming they've
// actually sent it, and "rejected" releases the claimed orders back to the
// seller's available balance so that money isn't stuck unwithdrawable
// forever — automatically, with no extra write needed here: every
// remaining-balance calculation (order_remaining_balances view,
// create_withdrawal_request() itself) already excludes any claim tied to
// a `rejected` withdrawal_requests row (033_withdrawal_order_splitting.sql).
// Before that migration this branch also ran
// `update orders set withdrawal_id = null where withdrawal_id = requestId`
// to release whole orders back to null — no longer possible or needed,
// since a rejected request may have only partially claimed some of its
// orders, and the ledger-exclusion above covers both whole and partial
// claims identically.
export async function setWithdrawalStatus(requestId: string, decision: WithdrawalDecision, adminNote?: string) {
  await requireAdmin();
  if (!WITHDRAWAL_DECISIONS.includes(decision)) throw new Error("Invalid decision");

  const admin = createAdminClient();
  if (!admin) throw new Error("Admin client unavailable");

  const { data: request } = await admin.from("withdrawal_requests").select("*").eq("id", requestId).single();
  if (!request) throw new Error("Withdrawal request not found");

  if (decision === "paid" && request.status !== "approved") {
    throw new Error("Only an approved request can be marked paid.");
  }
  if ((decision === "approved" || decision === "rejected") && request.status !== "pending") {
    throw new Error("This request has already been reviewed.");
  }

  const update: Record<string, unknown> = { status: decision };
  if (adminNote !== undefined) update.admin_note = adminNote.trim() || null;
  if (decision === "approved" || decision === "rejected") update.reviewed_at = new Date().toISOString();
  if (decision === "paid") update.paid_at = new Date().toISOString();

  const { error } = await admin.from("withdrawal_requests").update(update).eq("id", requestId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/withdrawals");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/seller/earnings");

  // Best-effort: let the seller know the outcome. Same getUserById fix as
  // setVerificationStatus() above — a plain listUsers() call only sees its
  // first ~50-user page.
  const { data: sellerProfile } = await admin.from("profiles").select("full_name").eq("id", request.seller_id).single();
  const { data: userLookup } = await admin.auth.admin.getUserById(request.seller_id);
  const sellerEmail = userLookup?.user?.email;
  const sellerName = sellerProfile?.full_name || "there";
  const netAmountLabel = `$${Math.round(Number(request.net_amount)).toLocaleString("en-US")}`;

  if (sellerEmail) {
    const subject =
      decision === "approved"
        ? "Your withdrawal request was approved"
        : decision === "paid"
        ? "Your withdrawal has been paid"
        : "Your withdrawal request wasn't approved";
    const html =
      decision === "approved"
        ? `<p>Hi ${sellerName},</p><p>Your withdrawal request for ${netAmountLabel} has been approved and is being processed to your ${request.payout_method.replace("_", " ")} details on file.</p><p>— Durqo</p>`
        : decision === "paid"
        ? `<p>Hi ${sellerName},</p><p>Your withdrawal of ${netAmountLabel} has been paid out. Thanks for selling on Durqo!</p><p>— Durqo</p>`
        : `<p>Hi ${sellerName},</p><p>We weren't able to approve your withdrawal request for ${netAmountLabel}.${
            adminNote?.trim() ? ` Note from our team: ${adminNote.trim()}` : ""
          } The related orders are available in your balance again, so you can submit a new request from your seller dashboard.</p><p>— Durqo</p>`;
    await sendEmail(sellerEmail, subject, html);
  }
}

// ============================================================
// Asset Transfer System v2 — Phase 4: admin dispute resolution.
//
// A room reaches `admin_review` exactly two ways: a buyer's
// transfer_report_issue() call (037_asset_transfer_system_rpcs.sql), which
// creates a row in asset_transfer_issues, or sweep_expired_inspections()
// simply timing out an inspection window with no buyer decision at all —
// the latter has no issue row to point at. resolveTransferDispute() below
// covers both: `issueId` is passed when resolving an actual reported issue
// (it gets its own resolution/resolution_type/resolved_by/resolved_at
// written), and omitted for a bare "move this room forward" call on an
// expired-with-no-issue room. Either way the room's stage transition is
// identical for a given resolutionType — this mirrors the same set of
// outcomes asset_transfer_issues.resolution_type already enumerates
// (036_asset_transfer_system_tables.sql).
//
// Like every other admin action in this file, this writes directly via the
// service-role client rather than through a SECURITY DEFINER RPC — there's
// no buyer/seller auth.uid() to check here, admin authorization is
// requireAdmin() alone, exactly the same shape as setWithdrawalStatus()
// and setVerificationStatus() above.
//
// 2026-09-12 update: "approved_despite_report" now DOES touch
// `orders.status` — see the block below it in the function body. This is
// the admin-side half of the same payout-release wiring added to the
// buyer's own transfer_approve() RPC (migration 039): reaching
// payout_eligible, by either path, is what makes a non-Escrow.com order's
// funds withdrawable. Every other resolution type here still leaves
// orders.status alone (they don't reach payout_eligible, so there's
// nothing to release).
//
// Deliberately NOT done here (kept out of scope for this pass):
//   - Actually moving money (refunds, Stripe/SSLCommerz/Escrow.com
//     reversals) — same as every other status field in this codebase,
//     this only records the outcome; whoever resolves the dispute still
//     has to go process the actual refund/payout on the relevant
//     platform.
//   - Admin overriding a pending amendment — transfer_amendment_decide()
//     stays buyer-only; admin's amendment view here is read-only.
const TRANSFER_RESOLUTION_TYPES = [
  "returned_to_seller",
  "approved_despite_report",
  "refund_authorized",
  "settlement_recorded",
  "order_cancelled",
] as const;
type TransferResolutionType = (typeof TRANSFER_RESOLUTION_TYPES)[number];

const RESOLUTION_STAGE: Record<TransferResolutionType, string> = {
  // The seller redoes the flagged asset (or, for a general/no-issue
  // dispute, the room just goes back to normal transferring) — this is the
  // only outcome that keeps the deal alive rather than closing it out.
  returned_to_seller: "seller_transferring",
  // Admin sides with the seller on the buyer's report: finishes the
  // transfer as if the buyer had approved it themselves.
  approved_despite_report: "payout_eligible",
  refund_authorized: "resolved_refund",
  settlement_recorded: "resolved_settlement",
  order_cancelled: "cancelled",
};

export async function resolveTransferDispute(
  roomId: string,
  resolutionType: TransferResolutionType,
  resolutionText: string,
  issueId?: string | null
) {
  const admin = await requireAdmin();
  if (!TRANSFER_RESOLUTION_TYPES.includes(resolutionType)) throw new Error("Invalid resolution type.");
  if (!resolutionText.trim()) throw new Error("A resolution note is required.");

  const supabaseAdmin = createAdminClient();
  if (!supabaseAdmin) throw new Error("Admin client unavailable");

  const { data: room } = await supabaseAdmin.from("asset_transfer_rooms").select("*").eq("id", roomId).single();
  if (!room) throw new Error("Transfer room not found.");
  if (room.stage !== "admin_review") {
    throw new Error(`This transfer isn't under admin review (stage=${room.stage}).`);
  }

  let issue: { id: string; item_id: string | null } | null = null;
  if (issueId) {
    const { data: issueRow } = await supabaseAdmin.from("asset_transfer_issues").select("*").eq("id", issueId).single();
    if (!issueRow) throw new Error("Issue not found.");
    if (issueRow.room_id !== roomId) throw new Error("That issue does not belong to this transfer.");
    if (issueRow.status === "resolved") throw new Error("This issue was already resolved.");
    issue = issueRow;

    const { error: issueError } = await supabaseAdmin
      .from("asset_transfer_issues")
      .update({
        status: "resolved",
        resolution: resolutionText.trim(),
        resolution_type: resolutionType,
        resolved_by: admin.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", issueId);
    if (issueError) throw new Error(issueError.message);
  }

  const now = new Date().toISOString();

  if (resolutionType === "approved_despite_report") {
    // Same bulk effect as the buyer's own transfer_approve() RPC — every
    // item currently Received becomes Accepted, in one write.
    const { error } = await supabaseAdmin
      .from("asset_transfer_items")
      .update({ status: "accepted", accepted_at: now, updated_at: now })
      .eq("room_id", roomId)
      .eq("status", "received");
    if (error) throw new Error(error.message);

    // Same payout-release rule as transfer_approve() (migration 039): an
    // admin overriding a buyer's report and finishing the transfer anyway
    // is the same real-world event as the buyer approving it themselves,
    // so it releases funds the same way — for every payment channel except
    // Escrow.com, where the licensed provider's own release on their own
    // platform is the only payout event (035_exclude_escrow_com_from_
    // payout_ledger.sql already keeps escrow_com orders out of the
    // withdrawal ledger; this is the write-side half of that same rule).
    // The `.in("status", ...)` guard means this never overwrites an order
    // some other event already moved past "paid" (e.g. one an admin
    // already cancelled or completed by hand on the Orders page).
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, payment_channel")
      .eq("id", room.order_id)
      .maybeSingle();
    if (order && order.payment_channel !== "escrow_com") {
      const { error: orderError } = await supabaseAdmin
        .from("orders")
        .update({ status: "completed" })
        .eq("id", order.id)
        .in("status", ["in_durqo", "in_escrow"]);
      if (orderError) throw new Error(orderError.message);
    }
  } else if (resolutionType === "returned_to_seller" && issue?.item_id) {
    // Only the specific flagged item gets sent back for a redo — every
    // other item's progress is untouched. A general (no specific item)
    // issue, or a no-issue expired-inspection resolution, leaves all items
    // as they are and just reopens the room for the seller to act in.
    const { error } = await supabaseAdmin
      .from("asset_transfer_items")
      .update({ status: "not_started", submitted_at: null, received_at: null, accepted_at: null, seller_reference: null, updated_at: now })
      .eq("id", issue.item_id);
    if (error) throw new Error(error.message);
  }

  const roomUpdate: Record<string, unknown> = { stage: RESOLUTION_STAGE[resolutionType], updated_at: now };
  if (resolutionType === "approved_despite_report") roomUpdate.payout_eligible_at = now;
  const { error: roomError } = await supabaseAdmin.from("asset_transfer_rooms").update(roomUpdate).eq("id", roomId);
  if (roomError) throw new Error(roomError.message);

  const { error: eventError } = await supabaseAdmin.from("asset_transfer_events").insert({
    room_id: roomId,
    actor_id: admin.id,
    event_type: `admin_resolved_${resolutionType}`,
    reason: resolutionText.trim(),
    metadata: issueId ? { issue_id: issueId } : {},
  });
  if (eventError) throw new Error(eventError.message);

  // Best-effort: notify buyer + seller of the dispute resolution — closes
  // the gap the module comment above used to flag as deliberately left out.
  try {
    const { data: order } = await supabaseAdmin.from("orders").select("listing_id").eq("id", room.order_id).maybeSingle();
    const { data: listing } = order
      ? await supabaseAdmin.from("listings").select("title").eq("id", order.listing_id).maybeSingle()
      : { data: null };
    const title = listing?.title ?? "your transfer";
    const emails = await getUserEmails(supabaseAdmin, [room.buyer_id as string, room.seller_id as string]);
    const buyerEmail = emails[room.buyer_id as string];
    const sellerEmail = emails[room.seller_id as string];
    const origin = await resolveOrigin();
    const roomUrl = `${origin}/dashboard/transfer/${room.order_id}`;

    const RESOLUTION_COPY: Record<TransferResolutionType, string> = {
      returned_to_seller: `The reported issue on "${title}" has been reviewed. The seller has been asked to redo the affected item.`,
      approved_despite_report: `After review, the transfer for "${title}" has been approved and finalized despite the reported issue.`,
      refund_authorized: `After review, a refund has been authorized for "${title}".`,
      settlement_recorded: `After review, a settlement has been recorded for "${title}".`,
      order_cancelled: `After review, the order for "${title}" has been cancelled.`,
    };
    const bodyLine = RESOLUTION_COPY[resolutionType];
    const html = `<p>${bodyLine}</p><p>${resolutionText.trim()}</p><p><a href="${roomUrl}">View the Transfer Room</a></p>`;

    if (buyerEmail) await sendEmail(buyerEmail, `Update on your Durqo transfer — "${title}"`, html);
    if (sellerEmail) await sendEmail(sellerEmail, `Update on your Durqo transfer — "${title}"`, html);
  } catch (err) {
    console.error("[admin] resolveTransferDispute notification emails failed:", err);
  }

  revalidatePath("/dashboard/admin/transfers");
  revalidatePath(`/dashboard/admin/transfers/${roomId}`);
  revalidatePath(`/dashboard/transfer/${room.order_id}`);
  revalidatePath("/dashboard/seller/orders");
  revalidatePath("/dashboard/buyer/orders");
  // Only actually changes anything for approved_despite_report (the one
  // resolution that can flip an order to completed above), but revalidating
  // unconditionally is harmless and keeps this from silently going stale if
  // another resolution type ever gains its own orders.status effect.
  revalidatePath("/dashboard/seller/earnings");
}
