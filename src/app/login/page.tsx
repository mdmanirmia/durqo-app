"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CALLBACK_ERRORS: Record<string, string> = {
  backend_not_connected: "Backend isn't connected yet — this is a preview build.",
  confirmation_failed: "That confirmation link is invalid or has expired — try registering again, or resend the email.",
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push("/dashboard/buyer");
  }

  return (
    <>
      <h1 className="mb-1 text-3xl">Log in</h1>
      <p className="mb-8 text-sm text-ink-soft">Welcome back to Durqo.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-soft" htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-rule-strong bg-paper-raised px-3 py-2.5" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-soft" htmlFor="password">Password</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg border border-rule-strong bg-paper-raised px-3 py-2.5" />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button disabled={loading} className="rounded-lg bg-brand-strong py-2.5 text-sm font-semibold text-paper-raised hover:bg-brand disabled:opacity-60">
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        No account yet?{" "}
        <Link href="/register" className="font-semibold text-brand-strong">Register</Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16 sm:px-7">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
