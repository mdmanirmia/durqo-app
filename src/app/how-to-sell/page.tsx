import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  UserPlus,
  BadgeCheck,
  FileText,
  ClipboardCheck,
  MessageSquare,
  Handshake,
  Wallet,
  CheckCircle2,
  Ban,
  Tag,
} from "lucide-react";
import { SUCCESS_FEE_TIERS, fmtRate } from "@/lib/fees";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

// Sep 11, 2026: a step-by-step operational guide, distinct from /sell's own
// marketing/valuation-focused landing page (which stays untouched by this
// file). Where /sell pitches "why sell on Durqo" with a valuation CTA, this
// page answers "exactly what happens if I do" in more procedural detail —
// account, optional ID verification, the listing form, manual review,
// buyer messaging, the sale itself, and getting paid — then links back to
// /sell and /dashboard/seller/listings/new for the actual listing flow.
//
// Success fee tiers are imported from the single authoritative
// src/lib/fees.ts module (same as /sell and /terms) rather than
// hardcoded, so this page can never drift from the real 10%/7%/5% schedule.
// The payout section matches the real, live withdrawal system exactly:
// Bank Transfer/bKash/Rocket/Nagad/PayPal/Wise methods, the per-method
// ৳50,000/day + ৳300,000/month caps on bKash/Rocket/Nagad specifically
// (src/app/dashboard/seller/earnings/page.tsx, migrations 029-032), and the
// manual admin approve/reject/paid flow (dashboard/admin/actions.ts) —
// never described as instant or automatic.
export const metadata: Metadata = {
  title: "How to Sell a Business | Durqo",
  description: "A step-by-step guide to listing, selling and getting paid for your digital business on Durqo — from your first listing to your withdrawal.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "How to Sell a Business | Durqo",
    description: "A step-by-step guide to listing, selling and getting paid for your digital business on Durqo.",
    url: "https://www.durqo.com/how-to-sell",
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Sell a Business | Durqo",
    description: "A step-by-step guide to listing, selling and getting paid for your digital business on Durqo.",
  },
  alternates: { canonical: "https://www.durqo.com/how-to-sell" },
};

function DashEyebrow({
  children,
  onDark = false,
  center = false,
}: {
  children: React.ReactNode;
  onDark?: boolean;
  center?: boolean;
}) {
  return (
    <p
      className={`mono mb-4 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider ${
        onDark ? "text-white/70" : "text-ink-soft"
      } ${center ? "justify-center" : ""}`}
    >
      <span className="h-px w-6 bg-brand" aria-hidden />
      {children}
    </p>
  );
}

function Inner({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1200px] ${className}`}>{children}</div>;
}

const STEPS = [
  {
    n: "01",
    icon: UserPlus,
    title: "Create your seller account",
    body: "Sign up with your email and confirm your account. It's free to join and free to list — there's no upfront charge.",
  },
  {
    n: "02",
    icon: BadgeCheck,
    title: "Verify your identity (optional)",
    body: "Upload an ID document from your seller dashboard. Once Durqo's team reviews and approves it, your profile shows a Verified badge that buyers trust.",
  },
  {
    n: "03",
    icon: FileText,
    title: "Build your listing",
    body: "Add your business details, financials and story. Quick Statistics are generated from the information you provide, and you can connect Google Analytics for a GA Verified badge that adds extra credibility.",
  },
  {
    n: "04",
    icon: ClipboardCheck,
    title: "Submit for review",
    body: "Durqo's team manually reviews every submission for accuracy and completeness before it goes live. We'll email you as soon as a decision is made.",
  },
  {
    n: "05",
    icon: MessageSquare,
    title: "Talk with interested buyers",
    body: "Once published, your listing is visible to every buyer on Durqo. Respond to questions and offers directly from your dashboard inbox.",
  },
  {
    n: "06",
    icon: Handshake,
    title: "Close the sale",
    body: "When a buyer commits to purchase, their payment is collected and held until you've transferred the agreed assets and the deal is confirmed complete.",
  },
  {
    n: "07",
    icon: Wallet,
    title: "Request your payout",
    body: "Once a sale completes, request a withdrawal from your Earnings page. Durqo's success fee is deducted, and our team reviews and processes the payout.",
  },
] as const;

const PRICING_TIERS = SUCCESS_FEE_TIERS.map((t) => ({ label: t.label, percent: fmtRate(t.rate) }));

const PRICING_FOOTNOTES = [
  { icon: Tag, label: "$0 upfront listing fee" },
  { icon: Ban, label: "No monthly subscription" },
  { icon: CheckCircle2, label: "Charged only when sold" },
];

const PAYOUT_METHODS = ["Bank Transfer", "bKash", "Rocket", "Nagad", "PayPal", "Wise"];

export default function HowToSellPage() {
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-rule bg-brand-strong py-16 sm:py-20 lg:py-24">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
          aria-hidden
        />
        <Container className="relative">
          <Inner>
            <div className="mx-auto max-w-[62ch] text-center">
              <DashEyebrow onDark center>
                How to sell
              </DashEyebrow>
              <h1 className="text-4xl leading-[1.1] text-white sm:text-5xl">
                From listing to <span className="text-brand">payout</span>, step by step.
              </h1>
              <p className="mx-auto mt-5 max-w-[52ch] text-lg leading-relaxed text-white/70">
                Here&rsquo;s exactly what happens when you sell a digital business on Durqo — how listings are
                reviewed, how a sale closes, and how you get paid.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button href="/sell" size="lg">
                  Get a free valuation
                  <ArrowRight size={16} />
                </Button>
                <Button href="/seller-faq" variant="on-dark" size="lg">
                  Read the Seller FAQ
                </Button>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* STEPS */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[60ch]">
              <DashEyebrow>The selling process</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Seven steps, start to finish.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Nothing is charged until your business actually sells — and every listing goes through a real,
                manual review before it publishes. Curious what your business might be worth first? Get a{" "}
                <Link href="/sell" className="font-semibold text-brand-strong hover:underline">
                  free valuation
                </Link>{" "}
                before you list.
              </p>
            </div>
            <div className="flex flex-col gap-8">
              {STEPS.map(({ n, icon: Icon, title, body }, i) => (
                <div key={n} data-reveal className="flex gap-5 sm:gap-6">
                  <div className="flex flex-col items-center">
                    <span className="mono grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand-strong">
                      {n}
                    </span>
                    {i < STEPS.length - 1 && <span className="mt-2 w-px flex-1 bg-rule" aria-hidden />}
                  </div>
                  <div className="pb-2">
                    <div className="mb-1.5 flex items-center gap-2">
                      <Icon size={16} className="text-brand" />
                      <h4 className="text-base font-semibold text-ink">{title}</h4>
                    </div>
                    <p className="max-w-[62ch] text-sm leading-relaxed text-ink-soft">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* TIERED PRICING */}
      <section className="border-b border-rule bg-brand-strong py-14 text-center sm:py-16">
        <Container>
          <Inner>
            <DashEyebrow onDark center>
              What it costs
            </DashEyebrow>
            <h2 className="text-2xl text-white sm:text-3xl">One success fee, only when you sell.</h2>
            <p className="mx-auto mt-3 max-w-[52ch] text-[0.95rem] leading-relaxed text-white/65">
              Lower fees for larger sales — the applicable rate applies to your entire final sale price.
            </p>

            <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-xl border border-white/10">
              <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {PRICING_TIERS.map(({ label, percent }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 px-6 py-8">
                    <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-white/50">
                      {label}
                    </p>
                    <p className="mono text-4xl font-bold text-brand sm:text-5xl">{percent}</p>
                    <p className="text-xs text-white/60">Success fee</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {PRICING_FOOTNOTES.map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-2 text-sm text-white/75">
                  <Icon size={15} className="text-brand" />
                  {label}
                </span>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* GETTING PAID */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="grid gap-8 lg:grid-cols-[0.5fr_0.5fr] lg:gap-x-14">
              <div>
                <DashEyebrow>Getting paid</DashEyebrow>
                <h2 className="text-2xl sm:text-3xl">Withdraw your earnings, your way.</h2>
                <p className="mt-3 max-w-[54ch] text-sm leading-relaxed text-ink-soft">
                  Once a sale is complete, request a withdrawal from your seller dashboard. Our team reviews and
                  processes every request — bKash, Rocket and Nagad withdrawals are each capped at ৳50,000 per day
                  and ৳300,000 per month, based on that day&rsquo;s exchange rate.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {PAYOUT_METHODS.map((m) => (
                    <span
                      key={m}
                      className="rounded-full border border-rule-strong bg-paper-raised px-3 py-1.5 text-xs font-semibold text-ink-soft"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-center gap-2 rounded-xl bg-brand-soft p-6">
                <Wallet size={20} className="text-brand-strong" />
                <h4 className="text-base font-semibold text-ink">Want the full breakdown?</h4>
                <p className="text-sm leading-relaxed text-ink-soft">
                  See exactly how buyer payments are held, how fees are calculated, and how each payout method
                  works.
                </p>
                <Button href="/payments" className="mt-2 min-h-11 self-start">
                  Payment &amp; Withdrawal guide
                </Button>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="py-10 sm:py-12">
        <Container>
          <Inner>
            <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-brand-soft p-8 sm:p-10">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-paper-raised text-brand-strong">
                  <FileText size={20} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-ink sm:text-2xl">Ready to list your business?</h2>
                  <p className="mt-1 max-w-[46ch] text-sm text-ink-soft">
                    Start with a free valuation, then build your listing in minutes.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/contact?subject=valuation" size="lg">
                  Get a free valuation
                  <ArrowRight size={16} />
                </Button>
                <Button href="/register?as=seller" variant="secondary" size="lg">
                  Create a seller account
                </Button>
              </div>
            </div>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
