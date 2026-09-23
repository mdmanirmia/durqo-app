"use client";

// Split out of register/page.tsx (Sep 8, 2026 technical-SEO pass, Section
// 15): page.tsx needs to be a Server Component to export a server-rendered
// noindex robots tag. Same form, same logic — only the file changed.
import { useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/safe-redirect";
import Container from "@/components/ui/Container";
import { notifySellerAccountCreated } from "./actions";
import { trackSignUp } from "@/lib/analytics";
import TurnstileWidget, { captchaRequired, type TurnstileHandle } from "@/components/TurnstileWidget";

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

  // 2026-09-23 bot-signup cleanup (see TurnstileWidget.tsx) — no-op when
  // NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't configured.
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);

  // 2026-09-19 (listing-page login gate): carries a visitor back to
  // whatever they were trying to view (e.g. a gated listing) once they've
  // registered, instead of dropping them on their role dashboard. Threaded
  // into emailRedirectTo so it survives the email round-trip too (picked
  // back up by /auth/callback's own `next` param).
  const next = safeNextPath(params.get("next"));
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (captchaRequired && !captchaToken) {
      setError("Please complete the verification check below.");
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setError("Backend isn't connected yet. This is a preview build; once Supabase is set up, this form will create a real account.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`,
        captchaToken: captchaToken ?? undefined,
      },
    });
    turnstileRef.current?.reset();
    setCaptchaToken(null);
    setLoading(false);
    if (error) { setError(error.message); return; }

    trackSignUp(role);

    // Admin + welcome notification for a brand-new seller account — separate
    // from Supabase's own confirmation-link email (see register/actions.ts).
    // Buyer signups don't get this; only sellers, per how it was scoped.
    if (role === "seller") {
      notifySellerAccountCreated(fullName, email);
    }

    // If email confirmation is off in the Supabase project, signUp already
    // returns a live session — skip straight to the dashboard. Otherwise a
    // confirmation link was emailed; clicking it lands on /auth/callback,
    // which finishes sign-in and redirects to the dashboard.
    if (data.session) {
      router.push(next || (role === "seller" ? "/dashboard/seller" : "/dashboard/buyer"));
      return;
    }
    setStep("sent");
  }

  async function handleResend() {
    setError(null);
    setNotice(null);
    const supabase = createClient();
    if (!supabase) return;
    // Sep 21, 2026 fix ("admin notification not received" bug): this call
    // used to omit emailRedirectTo entirely, so a *resent* confirmation link
    // fell back to Supabase's project-wide Site URL instead of our own
    // /auth/callback — meaning /auth/callback/route.ts (which fires the
    // admin "new seller verified" email, among other things) never ran for
    // anyone who had to click "Resend the link" to get in. Must match the
    // original signUp() call's emailRedirectTo above exactly.
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`,
      },
    });
    if (error) { setError(error.message); return; }
    setNotice("Sent again, check your inbox.");
  }

  const fieldCls = "rounded-md border border-rule-strong bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand-strong focus:outline-none";

  if (step === "sent") {
    return (
      <div className="w-full max-w-md rounded-xl border border-rule bg-paper-raised p-7 sm:p-8">
        <h1 className="mb-1 text-2xl">Check your email</h1>
        <p className="mb-8 text-sm text-ink-soft">
          We sent a verification link to <span className="font-semibold text-ink">{email}</span>. Click it to activate your account and you&rsquo;ll be
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
        <p className="mt-2 text-xs text-ink-faint">You can browse and buy listings either way. This just sets your default dashboard.</p>
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
        <TurnstileWidget ref={turnstileRef} onToken={setCaptchaToken} />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          disabled={loading || (captchaRequired && !captchaToken)}
          className="rounded-md bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-ink-faint">
        <ShieldCheck size={12} className="text-brand" /> Identity verification happens after signup
      </p>

      <p className="mt-4 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href={loginHref} className="font-semibold text-brand-hover">Log in</Link>
      </p>
    </div>
  );
}

export default function RegisterFormPage() {
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
