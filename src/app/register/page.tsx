"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Container from "@/components/ui/Container";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [role, setRole] = useState<"buyer" | "seller">(params.get("as") === "seller" ? "seller" : "buyer");
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
        data: { full_name: fullName, role },
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
      router.push(role === "seller" ? "/dashboard/seller" : "/dashboard/buyer");
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

  const fieldCls = "rounded-md border border-rule-strong bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand-strong focus:outline-none";

  if (step === "sent") {
    return (
      <div className="w-full max-w-md rounded-xl border border-rule bg-paper-raised p-7 sm:p-8">
        <h1 className="mb-1 text-2xl">Check your email</h1>
        <p className="mb-8 text-sm text-ink-soft">
          We sent a confirmation link to <span className="font-semibold text-ink">{email}</span>. Click it to activate your account — you&rsquo;ll be
          signed in automatically.
        </p>
        {notice && <p className="mb-4 text-sm text-brand-hover">{notice}</p>}
        <p className="text-center text-sm text-ink-soft">
          Didn&rsquo;t get it?{" "}
          <button type="button" onClick={handleResend} className="font-semibold text-brand-hover">Resend the link</button>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-rule bg-paper-raised p-7 sm:p-8">
      <h1 className="mb-1 text-2xl">Create your account</h1>
      <p className="mb-6 text-sm text-ink-soft">Join Durqo to buy and sell verified digital businesses.</p>

      <div className="mb-6">
        <p className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">I want to</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole("buyer")}
            className={`rounded-md border px-3 py-2.5 text-sm font-semibold transition ${
              role === "buyer" ? "border-brand-strong bg-brand-soft text-brand-strong" : "border-rule-strong text-ink-soft hover:border-brand-strong"
            }`}
          >
            Buy a business
          </button>
          <button
            type="button"
            onClick={() => setRole("seller")}
            className={`rounded-md border px-3 py-2.5 text-sm font-semibold transition ${
              role === "seller" ? "border-brand-strong bg-brand-soft text-brand-strong" : "border-rule-strong text-ink-soft hover:border-brand-strong"
            }`}
          >
            Sell a business
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-faint">You can browse and buy listings either way — this just sets your default dashboard.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-soft" htmlFor="name">Full name</label>
          <input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={fieldCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-soft" htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={fieldCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-soft" htmlFor="password">Password</label>
          <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={fieldCls} />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button disabled={loading} className="rounded-md bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-ink-faint">
        <ShieldCheck size={12} className="text-brand" /> Identity verification happens after signup
      </p>

      <p className="mt-4 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-hover">Log in</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-paper-sunk py-16">
      <Container className="flex justify-center">
        <Suspense fallback={null}>
          <RegisterForm />
        </Suspense>
      </Container>
    </main>
  );
}
