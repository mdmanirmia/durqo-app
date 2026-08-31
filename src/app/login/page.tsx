"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Container from "@/components/ui/Container";

const CALLBACK_ERRORS: Record<string, string> = {
  backend_not_connected: "Backend isn't connected yet — this is a preview build.",
  confirmation_failed: "That confirmation link is invalid or has expired — try registering again, or resend the email.",
  account_deactivated: "Your account has been deactivated. Contact support if you think this is a mistake.",
};

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
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      setError("Backend isn't connected yet — this is a preview build. Once Supabase is set up, this form will log you in for real.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setLoading(false); setError(error.message); return; }

    // Deactivated accounts (admin "Block" — profiles.is_active) are also
    // caught on every subsequent request by proxy.ts, but checking right
    // here avoids a confusing flash of the dashboard before being bounced
    // back to /login.
    if (data.user) {
      const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", data.user.id).single();
      if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        setLoading(false);
        setError(CALLBACK_ERRORS.account_deactivated);
        return;
      }
    }

    setLoading(false);
    router.push("/dashboard/buyer");
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
        {error && <p className="text-sm text-danger">{error}</p>}
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
