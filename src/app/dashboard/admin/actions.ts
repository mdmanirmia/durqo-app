"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

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
