"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// 2026-09-23: seller-side "Account Details" page (mirrors the buyer's own
// dashboard/buyer/actions.ts updateAccount()). first_name/last_name are new
// self-service columns (migration 056) kept in sync into the existing
// full_name field on every save, since full_name is still what listing
// cards, dashboards, admin tables and emails read across the app.
// `address` is a new private mailing-address field, separate from the
// existing public `location` column shown on this seller's listings.
// Uses the caller's own session client throughout (never the service-role
// admin client), so this can only ever change the signed-in seller's own
// row -- and as of migration 056, a BEFORE UPDATE trigger on profiles also
// blocks that same session from touching admin-only columns (role,
// payout_verified, is_verified, is_active, verification_status) no matter
// what a client sends.
export async function updateAccount(input: {
  firstName: string;
  lastName: string;
  location: string;
  address: string;
  email: string;
  password: string;
}) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Backend isn't connected yet.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be logged in.");

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const location = input.location.trim();
  const address = input.address.trim();
  const email = input.email.trim();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      first_name: firstName || null,
      last_name: lastName || null,
      full_name: fullName || null,
      location: location || null,
      address: address || null,
    })
    .eq("id", user.id);
  if (profileError) throw new Error(profileError.message);

  // Supabase sends a confirmation link to the new address and doesn't flip
  // over until it's clicked -- never silently changes what the seller signs
  // in with. Skipped entirely if the field wasn't actually touched.
  let emailChangeRequested = false;
  if (email && email !== user.email) {
    const { error: emailError } = await supabase.auth.updateUser({ email });
    if (emailError) throw new Error(emailError.message);
    emailChangeRequested = true;
  }

  if (input.password) {
    if (input.password.length < 8) {
      throw new Error("New password must be at least 8 characters.");
    }
    const { error: passwordError } = await supabase.auth.updateUser({ password: input.password });
    if (passwordError) throw new Error(passwordError.message);
  }

  revalidatePath("/dashboard/seller/account");

  return { ok: true, emailChangeRequested };
}
