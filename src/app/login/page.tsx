"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Container from "@/components/ui/Container";

const CALLBACK_ERRORS: Record<string, string> = {
  backend_not_connected: "Backend isn't connected yet — this is a preview build.",
  confirmation_failed: "That verification link is invalid or has expired — try registering again, or resend the email.",
  account_deactivated: "Your account has been deactivated. Contact support if you think this is a mistake.",
};

// Supabase's own signInWithPassword() error for an unconfirmed account
// literally reads "Email not confirmed" — replaced here with wording that
// matches the rest of the app's "verify" language (not "confirm") and tells
// the person what to actually do about it, rather than surfacing Supabase's
// raw internal message verbatim.
const EMAIL_NOT_VERIFIED_MESSAGE = "Verify your email to activate and log in to your account. A verification link has been sent to your email.";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Seeded from the ?error= redirect param (set by /auth/callback on a failed
  // confirmation), not re-derived after mount — handleSubmit owns `error`
  // from here on, same as any other form-validation state.
  const [error, setError] = useState<string | null>(() => {
    const code = params.get("error");
    return code ? (CALLBACK_ERRORS[code] ?? "Something went wrong — please try again.") : null;
  });
  // Tracks whether the *current* error is the unverified-email case, so the
  // "Resend the link" action only shows up for that specific error — not for
  // a wrong password or a deactivated account.
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setShowResend(false);
    const supabase = createClient();
    if (!supabase) {
      setError("Backend isn't connected yet — this is a preview build. Once Supabase is set up, this form will log you in for real.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      const isUnverified = error.message.toLowerCase().includes("not confirmed") || (error as { code?: string }).code === "email_not_confirmed";
      setError(isUnverified ? EMAIL_NOT_VERIFIED_MESSAGE : error.message);
      setShowResend(isUnverified);
      return;
    }

    // Deactivated accounts (admin "Block" — profiles.is_active) are also
    // caught on every subsequent request by proxy.ts, but checking right
    // here avoids a confusing flash of the dashboard before being bounced
    // back to /login. Same query also reads role, so a seller (or admin)
    // always lands on their own dashboard on login, not the buyer default —
    // profiles.role is set correctly from signup metadata as of migration
    // 023, so this is reliable for every account going forward.
    if (data.user) {
      const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", data.user.id).single();
      if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        setLoading(false);
        setError(CALLBACK_ERRORS.account_deactivated);
        return;
      }
      setLoading(false);
      router.push(profile?.role === "seller" ? "/dashboard/seller" : profile?.role === "admin" ? "/dashboard/admin" : "/dashboard/buyer");
      return;
    }

    setLoading(false);
    router.push("/dashboard/buyer");
  }

  // Mirrors the same resend call used on the register page's "Check your
  // email" screen — the login page just surfaces it once we already know
  // (from the "Email not confirmed" error above) that this account is stuck
  // waiting on that link.
  async function handleResend() {
    if (!email) {
      setNotice(null);
      setError("Enter your email above, then click resend.");
      return;
    }
    setResending(true);
    setNotice(null);
    const supabase = createClient();
    if (!supabase) {
      setResending(false);
      return;
    }
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNotice("Sent again — check your inbox.");
  }

  const fieldCls = "rounded-md border border-rule-strong bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand-strong focus:outline-none";

  return (
    <div className="w-full max-w-md rounded-xl border border-rule bg-paper-raised p-7 sm:p-8">
      <h1 className="mb-1 text-2xl">Log in</h1>
      <p className="mb-7 text-sm text-ink-soft">Welcome back to Durqo.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-soft" htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={fieldCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-soft" htmlFor="password">Password</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={fieldCls} />
        </div>
        {error && (
          <p className="text-sm text-danger">
            {error}
            {showResend && (
              <>
                {" "}
                <button type="button" onClick={handleResend} disabled={resending} className="font-semibold text-brand-hover disabled:opacity-60">
                  {resending ? "Resending…" : "Resend the link"}
                </button>
              </>
            )}
          </p>
        )}
        {notice && <p className="text-sm text-brand-hover">{notice}</p>}
        <button disabled={loading} className="rounded-md bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60">
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-ink-faint">
        <ShieldCheck size={12} className="text-brand" /> Your session is secured end to end
      </p>

      <p className="mt-4 text-center text-sm text-ink-soft">
        No account yet?{" "}
        <Link href="/register" className="font-semibold text-brand-hover">Register</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-paper-sunk py-16">
      <Container className="flex justify-center">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </Container>
    </main>
  );
}
