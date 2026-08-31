import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Keeps the Supabase auth session cookie fresh on every request so logged-in
// users stay logged in across page navigations and server components can
// read a valid session. Standard @supabase/ssr middleware pattern.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Touching getUser() is what actually triggers a token refresh when needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Admin "deactivate user" enforcement (profiles.is_active — see migration
  // 008 and setUserActive() in dashboard/admin/actions.ts). Checked here,
  // on every request for a signed-in user, rather than only at the login
  // form, so an account deactivated mid-session is signed out on its very
  // next navigation rather than staying valid until the JWT expires.
  if (user && !request.nextUrl.pathname.startsWith("/login")) {
    const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", user.id).single();
    if (profile && profile.is_active === false) {
      await supabase.auth.signOut();
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "account_deactivated");
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
