"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, ADMIN_EMAIL } from "@/lib/email";
import { getUserEmails } from "@/lib/notifications";
import { COUNTRY_MAP } from "@/lib/countries";

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
//
// 2026-09-23 Account Details follow-up: split the single "full name" field
// into first_name/last_name (migration 056, new self-service columns) and
// added a private `address` field. full_name is still kept in sync on every
// save since it's what listing cards, dashboards, admin tables and emails
// read across the app. `country` was added 2026-09-30 as the structured
// replacement for the old free-text `location` column, which was dropped
// from this form the same day. As of migration 056, a BEFORE UPDATE trigger
// on profiles also
// blocks this same session from touching admin-only columns (role,
// payout_verified, is_verified, is_active, verification_status) no matter
// what a client sends, closing a gap where profiles_update_own's RLS policy
// only ever restricted which row could be touched, not which columns.
export async function updateAccount(input: {
  firstName: string;
  lastName: string;
  country: string;
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
  // Only ever a code from the fixed <select> in AccountForm.tsx, but
  // validated against the known list anyway rather than trusted blindly —
  // this still goes through the caller's own session client, so nothing
  // stops a handcrafted request from sending an arbitrary string otherwise.
  const country = input.country.trim().toUpperCase();
  if (country && !COUNTRY_MAP[country]) {
    throw new Error("That country isn't recognized. Please pick one from the list.");
  }
  const address = input.address.trim();
  const email = input.email.trim();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      first_name: firstName || null,
      last_name: lastName || null,
      full_name: fullName || null,
      country: country || null,
      address: address || null,
    })
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
    throw new Error("This order can no longer be cancelled - payment has already been made.");
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
      const { data: listing } = await admin.from("listings").select("title, slug").eq("id", order.listing_id).maybeSingle();
      const title = listing?.title ?? "your listing";
      const listingSlug = listing?.slug ?? (order.listing_id as string);
      const emails = await getUserEmails(admin, [order.seller_id as string]);
      const sellerEmail = emails[order.seller_id as string];
      if (sellerEmail) {
        const hdrs = await headers();
        const host = hdrs.get("host");
        const origin = host ? `${host.includes("localhost") ? "http" : "https"}://${host}` : "https://www.durqo.com";
        await sendEmail(
          sellerEmail,
          `An order for "${title}" was cancelled`,
          `<p>The buyer cancelled their order for "${title}" before paying - no action needed on your end.</p>
           <p><a href="${origin}/listing/${listingSlug}">View your listing</a></p>`
        );
      }
    }
  } catch (err) {
    console.error("[buyer] cancelOrder seller notification failed:", err);
  }

  return { ok: true };
}

// Nov 4, 2026 ("keu verification data submit korle admin er kache email
// aschena... support@durqo.com"): buyer verification documents are submitted
// through the submit_buyer_verification RPC straight from the browser, which
// never emailed anyone. Called right after that RPC succeeds; it re-checks
// with the service-role client that this signed-in buyer really has a
// just-submitted verification for the order before emailing the admin inbox.
export async function notifyAdminBuyerVerificationSubmitted(orderId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { ok: false };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false };

    const admin = createAdminClient();
    if (!admin) return { ok: false };
    const { data: row } = await admin
      .from("order_verifications")
      .select("buyer_id, status, submitted_at, document_paths, order_id")
      .eq("order_id", orderId)
      .maybeSingle();
    const fresh = row?.submitted_at && Date.now() - new Date(row.submitted_at as string).getTime() < 15 * 60 * 1000;
    if (!row || row.buyer_id !== user.id || row.status !== "submitted" || !fresh) return { ok: false };

    const [{ data: profile }, { data: order }] = await Promise.all([
      admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      admin.from("orders").select("listing_id").eq("id", orderId).maybeSingle(),
    ]);
    const { data: listing } = order?.listing_id
      ? await admin.from("listings").select("title").eq("id", order.listing_id).maybeSingle()
      : { data: null };

    const esc = (v: string) => v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
    const name = esc(((profile?.full_name as string | null) ?? "").trim() || "A buyer");
    const title = esc((listing?.title as string | undefined) ?? "an order");
    const docs = Array.isArray(row.document_paths) ? row.document_paths.length : 0;
    const hdrs = await headers();
    const host = hdrs.get("host");
    const origin = host ? `${host.includes("localhost") ? "http" : "https"}://${host}` : "https://www.durqo.com";

    await sendEmail(
      ADMIN_EMAIL,
      `New buyer verification submitted - ${name}`,
      `<p>${name} (${esc(user.email ?? "no email on file")}) submitted ${docs} verification document${docs === 1 ? "" : "s"} for their order on "${title}".</p>
       <p><a href="${origin}/dashboard/admin/orders">Review it in the admin dashboard</a>.</p>`
    );
    return { ok: true };
  } catch (err) {
    console.error("[buyer] notifyAdminBuyerVerificationSubmitted failed:", err);
    return { ok: false };
  }
}
