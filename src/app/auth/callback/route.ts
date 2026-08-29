import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Where the email "Confirm your signup" link (and, later, password-reset
// links) point. Supabase redirects here with either a PKCE `code` or a
// legacy `token_hash` + `type` pair — we exchange whichever is present for a
// real session, then send the now-signed-in user on to their dashboard.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard/buyer";

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=backend_not_connected`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "email" | "recovery" | "invite",
    });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
