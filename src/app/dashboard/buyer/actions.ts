"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// 2026-09-12 dashboard audit fix: this page's form previously had no
// onSubmit at all — every field was decorative (defaultValue="", a plain
// type="button" Save with no handler). A signed-in buyer/seller filling it
// out and clicking Save got no error and no effect, which reads as broken
// rather than merely incomplete. Wired up for real here: `profiles.full_name`
// and `profiles.location` are plain self-service columns already covered by
// the existing profiles_update_own RLS policy (schema.sql), while email and
// password go through Supabase Auth's own updateUser — using the caller's
// own session client (not the service-role admin client), so this can only
// ever change the signed-in user's own account.
export async function updateAccount(input: {
  fullName: string;
  location: string;
  email: string;
  password: string;
}) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Backend isn't connected yet.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be logged in.");

  const fullName = input.fullName.trim();
  const location = input.location.trim();
  const email = input.email.trim();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName || null, location: location || null })
    .eq("id", user.id);
  if (profileError) throw new Error(profileError.message);

  // Supabase sends a confirmation link to the new address and doesn't flip
  // over until it's clicked — never silently changes what the user signs in
  // with. Skipped entirely if the field wasn't actually touched.
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

  revalidatePath("/dashboard/buyer/account");

  return { ok: true, emailChangeRequested };
}
