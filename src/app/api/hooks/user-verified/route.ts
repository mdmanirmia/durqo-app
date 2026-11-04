import { NextResponse } from "next/server";
import { notifyAdminUserVerified } from "@/lib/admin-signup-notify";

export const dynamic = "force-dynamic";

// Called by the `on_auth_user_email_verified` database trigger (migration
// 062) through pg_net as soon as an account's email is verified. The body is
// only a hint: notifyAdminUserVerified() re-reads the account with the
// service-role client, sends nothing unless the email really is verified,
// and sends at most once per account, so calling this route by hand can't
// produce spam or reveal anything. The response is the same either way.
export async function POST(request: Request) {
  let userId = "";
  try {
    const body = (await request.json()) as { user_id?: unknown };
    if (typeof body.user_id === "string") userId = body.user_id;
  } catch {
    // ignore malformed bodies
  }
  if (userId) {
    try {
      await notifyAdminUserVerified(userId);
    } catch (err) {
      console.error("[hooks/user-verified] failed:", err);
    }
  }
  return NextResponse.json({ ok: true });
}
