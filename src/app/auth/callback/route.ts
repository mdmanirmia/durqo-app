import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  if (explicitNext) {
    return NextResponse.redirect(`${origin}${explicitNext}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let dashboard = "/dashboard/buyer";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role === "seller") dashboard = "/dashboard/seller";
    else if (profile?.role === "admin") dashboard = "/dashboard/admin";
  }
  return NextResponse.redirect(`${origin}${dashboard}`);
}
