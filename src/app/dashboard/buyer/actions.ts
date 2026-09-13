"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { getUserEmails } from "@/lib/notifications";

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

// 2026-09-13 dashboard audit follow-up ("buyer order cancellation for
// pending orders" — deferred from the earlier pass): a buyer previously had
// no way to back out of an order before paying — the Orders page only ever
// showed status, receipt and (once paid) the Transfer Room, with no action
// for "requested"/"awaiting_payment". Deliberately scoped to those two
// statuses only: once money has actually moved (in_escrow/in_durqo/
// completed) this must go through an admin/dispute path instead, never a
// plain self-serve cancel — re-checked against the DB's own current status
// here (not whatever the client last rendered) so a buyer can't race a
// payment webhook by clicking Cancel the instant after paying.
const CANCELLABLE_STATUSES = ["requested", "awaiting_payment"];

export async function cancelOrder(orderId: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Backend isn't connected yet.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be logged in.");

  const { data: order } = await supabase
    .from("orders")
    .select("id, buyer_id, seller_id, listing_id, status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.buyer_id !== user.id) throw new Error("Order not found.");
  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    throw new Error("This order can no longer be cancelled — payment has already been made.");
  }

  const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/buyer/orders");
  revalidatePath("/dashboard/buyer");
  revalidatePath("/dashboard/seller/orders");
  revalidatePath("/dashboard/seller");

  // Best-effort: let the seller know, same as every other order-affecting
  // event in this app (admin decisions, transfer disputes) already does.
  try {
    const admin = createAdminClient();
    if (admin) {
      const { data: listing } = await admin.from("listings").select("title").eq("id", order.listing_id).maybeSingle();
      const title = listing?.title ?? "your listing";
      const emails = await getUserEmails(admin, [order.seller_id as string]);
      const sellerEmail = emails[order.seller_id as string];
      if (sellerEmail) {
        const hdrs = await headers();
        const host = hdrs.get("host");
        const origin = host ? `${host.includes("localhost") ? "http" : "https"}://${host}` : "https://www.durqo.com";
        await sendEmail(
          sellerEmail,
          `An order for "${title}" was cancelled`,
          `<p>The buyer cancelled their order for "${title}" before paying — no action needed on your end.</p>
           <p><a href="${origin}/listing/${order.listing_id}">View your listing</a></p>`
        );
      }
    }
  } catch (err) {
    console.error("[buyer] cancelOrder seller notification failed:", err);
  }

  return { ok: true };
}
