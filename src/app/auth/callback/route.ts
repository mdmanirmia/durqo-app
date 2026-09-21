import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-redirect";
import { notifyAdminSellerVerified } from "@/app/register/actions";

// Where the email "Confirm your signup" link (and, later, password-reset
// links) point. Supabase redirects here with either a PKCE `code` or a
// legacy `token_hash` + `type` pair — we exchange whichever is present for a
// real session, then send the now-signed-in user on to their dashboard.
//
// The destination is role-aware: once the exchange succeeds we look up the
// caller's own profiles.role (seller/admin/buyer, fixed to be set correctly
// at signup by migration 023) and route to the matching dashboard, rather
// than defaulting to buyer. An explicit `next` param, if the link carries
// one, still wins — this route only falls back to the role lookup when
// nothing more specific was requested.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const explicitNext = searchParams.get("next");

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=backend_not_connected`);
  }

  let confirmed = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    confirmed = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "email" | "recovery" | "invite",
    });
    confirmed = !error;
  }

  if (!confirmed) {
    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
  }

  // Fetched up front (rather than only in the no-`next` branch below, as
  // this used to) because the seller admin-notification below needs it
  // regardless of where the visitor ends up going next.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user
    ? (await supabase.from("profiles").select("role, full_name").eq("id", user.id).single()).data
    : null;

  // Sep 21 2026 ("ei sob user der kono email notification o admin pabena
  // registration er somoi" — see register/actions.ts's notifyAdminSellerVerified
  // comment for the full story): this is the one route a signup
  // confirmation link ever lands on, and a confirmation code/token is
  // single-use, so this fires exactly once per account, right when its
  // email is proven real. Best-effort — a notification failure here must
  // never block the confirmed user from reaching their dashboard.
  if (user?.email && profile?.role === "seller") {
    try {
      await notifyAdminSellerVerified(profile.full_name ?? "", user.email);
    } catch (err) {
      console.error("[auth/callback] notifyAdminSellerVerified failed:", err);
    }
  }

  // 2026-09-19: explicitNext came straight off the URL (originally set by
  // LoginForm.tsx/RegisterForm.tsx from their own `?next=`), so it's
  // re-validated here before ever reaching NextResponse.redirect() — this
  // route is the one place an unchecked value would actually cause an
  // open redirect.
  const safeNext = safeNextPath(explicitNext);
  if (safeNext) {
    return NextResponse.redirect(`${origin}${safeNext}`);
  }

  let dashboard = "/dashboard/buyer";
  if (profile?.role === "seller") dashboard = "/dashboard/seller";
  else if (profile?.role === "admin") dashboard = "/dashboard/admin";
  return NextResponse.redirect(`${origin}${dashboard}`);
}
