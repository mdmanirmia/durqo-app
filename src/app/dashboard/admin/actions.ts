"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

const LISTING_STATUSES = ["draft", "pending_review", "published", "sold", "archived"] as const;
type ListingStatus = (typeof LISTING_STATUSES)[number];

const USER_ROLES = ["buyer", "seller", "admin"] as const;
type UserRole = (typeof USER_ROLES)[number];

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
