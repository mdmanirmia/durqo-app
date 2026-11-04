import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, ADMIN_EMAIL } from "@/lib/email";

// Nov 3, 2026 ("aj 5 jon buyer/seller account korlo and verify o korlo but
// ami kono notification pelam nah"): one admin email per account, sent as
// soon as its email address is verified, for buyers AND sellers. Called from
// three places (see migration 062):
//   1. /api/hooks/user-verified, hit by a database trigger the moment
//      Supabase marks the email verified (works whichever browser or app
//      opened the link),
//   2. /auth/callback, when the link happens to land in the same browser,
//   3. the daily /api/cron/reminders sweep, as a safety net.
// The `admin_signup_notifications` primary key makes it idempotent: whoever
// claims the row first sends the email, everyone else is a no-op.
//
// Only the user id is trusted from the caller; everything else is re-read
// with the service-role client, and nothing is sent unless the account's
// email really is verified. That is what lets the hook route stay public.
export async function notifyAdminUserVerified(userId: string): Promise<"sent" | "skipped"> {
  const admin = createAdminClient();
  if (!admin || !/^[0-9a-f-]{36}$/i.test(userId)) return "skipped";

  const { data: authData } = await admin.auth.admin.getUserById(userId);
  const user = authData?.user;
  if (!user?.email || !user.email_confirmed_at) return "skipped";

  // Claim the notification. A duplicate key means someone already sent it.
  const { error: claimError } = await admin
    .from("admin_signup_notifications")
    .insert({ user_id: userId });
  if (claimError) return "skipped";

  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name, country")
    .eq("id", userId)
    .maybeSingle();

  const role = profile?.role === "seller" ? "seller" : profile?.role === "admin" ? "admin" : "buyer";
  const name = (profile?.full_name ?? "").trim() || `A ${role}`;
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const verifiedAt = new Date(user.email_confirmed_at).toUTCString();

  const { sent } = await sendEmail(
    ADMIN_EMAIL,
    `New ${role} account - ${name}`,
    `<p><strong>${esc(name)}</strong> (${esc(user.email)}) verified their email and is now an active <strong>${role}</strong> account on Durqo.</p>
     <p>Role: ${role}<br/>Country: ${esc(profile?.country ?? "Not set")}<br/>Verified: ${verifiedAt}</p>
     <p><a href="https://www.durqo.com/dashboard/admin/users">Open Users in the admin dashboard</a></p>`
  );

  // If the email could not go out, release the claim so the next caller
  // (e.g. the daily sweep) can try again.
  if (!sent) {
    await admin.from("admin_signup_notifications").delete().eq("user_id", userId);
    return "skipped";
  }
  return "sent";
}

// Daily safety net: anyone verified in the last 7 days who still has no
// notification row (e.g. the trigger's request never reached the site).
export async function sweepUnnotifiedVerifiedUsers(): Promise<number> {
  const admin = createAdminClient();
  if (!admin) return 0;
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const recent = (data?.users ?? []).filter(
    (u) => u.email_confirmed_at && new Date(u.email_confirmed_at).getTime() >= since
  );
  if (recent.length === 0) return 0;

  const { data: done } = await admin
    .from("admin_signup_notifications")
    .select("user_id")
    .in("user_id", recent.map((u) => u.id));
  const doneIds = new Set((done ?? []).map((r) => r.user_id as string));

  let sent = 0;
  for (const u of recent) {
    if (doneIds.has(u.id)) continue;
    if ((await notifyAdminUserVerified(u.id)) === "sent") sent++;
  }
  return sent;
}
