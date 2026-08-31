"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

const LISTING_STATUSES = ["draft", "pending_review", "published", "sold", "archived"] as const;
type ListingStatus = (typeof LISTING_STATUSES)[number];

const USER_ROLES = ["buyer", "seller", "admin"] as const;
type UserRole = (typeof USER_ROLES)[number];

const ORDER_STATUSES = ["requested", "awaiting_payment", "in_escrow", "completed", "cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

const ORDER_PAYMENT_CHANNELS = ["stripe", "durqo_platform", "bangladesh_gateway", "escrow"] as const;
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

  const { error } = await admin.from("listings").update({ status }).eq("id", listingId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/listings");
  revalidatePath("/dashboard/admin");
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

  // Best-effort: let the seller know the outcome.
  const { data: usersList } = await admin.auth.admin.listUsers();
  const sellerEmail = usersList?.users.find((u) => u.id === userId)?.email;
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
