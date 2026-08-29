"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const asSeller = params.get("as") === "seller";

  const [step, setStep] = useState<"form" | "sent">("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      setError("Backend isn't connected yet — this is a preview build. Once Supabase is set up, this form will create a real account.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: asSeller ? "seller" : "buyer" },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }

    // If email confirmation is off in the Supabase project, signUp already
    // returns a live session — skip straight to the dashboard. Otherwise a
    // confirmation link was emailed; clicking it lands on /auth/callback,
    // which finishes sign-in and redirects to the dashboard.
    if (data.session) {
      router.push("/dashboard/buyer");
      return;
    }
    setStep("sent");
  }

  async function handleResend() {
    setError(null);
    setNotice(null);
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) { setError(error.message); return; }
    setNotice("Sent again — check your inbox.");
  }

  if (step === "sent") {
    return (
      <>
        <h1 className="mb-1 text-3xl">Check your email</h1>
        <p className="mb-8 text-sm text-ink-soft">
          We sent a confirmation link to <span className="font-semibold text-ink">{email}</span>. Click it to activate your account — you&rsquo;ll be
          signed in automatically.
        </p>
        {notice && <p className="mb-4 text-sm text-brand-strong">{notice}</p>}
        <p className="text-center text-sm text-ink-soft">
          Didn&rsquo;t get it?{" "}
          <button type="button" onClick={handleResend} className="font-semibold text-brand-strong">Resend the link</button>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-1 text-3xl">Create your account</h1>
      <p className="mb-8 text-sm text-ink-soft">{asSeller ? "Register to list your business on Durqo." : "Join Durqo to browse and buy verified listings."}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-soft" htmlFor="name">Full name</label>
          <input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-lg border border-rule-strong bg-paper-raised px-3 py-2.5" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-soft" htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-rule-strong bg-paper-raised px-3 py-2.5" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-soft" htmlFor="password">Password</label>
          <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg border border-rule-strong bg-paper-raised px-3 py-2.5" />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button disabled={loading} className="rounded-lg bg-brand-strong py-2.5 text-sm font-semibold text-paper-raised hover:bg-brand disabled:opacity-60">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-strong">Log in</Link>
      </p>
    </>
  );
}

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16 sm:px-7">
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
