import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Ban,
  Calculator,
  CheckCircle2,
  Coins,
  FileText,
  MessageSquare,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  TrendingUp,
} from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { getPublishedListings } from "@/lib/data/listings.server";
import { SUCCESS_FEE_TIERS, fmtRate } from "@/lib/fees";
import { createClient } from "@/lib/supabase/server";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import SellFaq from "./SellFaq";
import type { CSSProperties } from "react";
import CountUp from "@/components/CountUp";
import MouseGlow from "@/components/home/MouseGlow";
import { CATEGORY_ACCENTS } from "@/lib/category-accents";

// Oct 24, 2026 ("ei page ta aro motion type and dynamic koro ... sundor
// and premium"): same motion system as the homepage (globals.css dq-*
// classes + [data-reveal]), all of it off for prefers-reduced-motion.
// Content is unchanged; only presentation and motion.
function enterDelay(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties;
}
function revealDelay(ms: number): CSSProperties {
  return { "--reveal-delay": `${ms}ms` } as CSSProperties;
}

// Sep 6, 2026 redesign to match the approved homepage's visual system —
// see claude/homepage-redesign-addendum.md for the full brief and the
// accuracy/consistency decisions made here (tiered fee wording, the
// Terms-page fee-table conflict this surfaced, etc). Global Header/Footer
// are rendered by RootLayout and are not touched by this file.

export const metadata: Metadata = {
  title: "Sell Your Digital Business | Durqo",
  description: "List your website, SaaS product, app, e-commerce store or other digital business for sale on Durqo.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "Sell Your Digital Business | Durqo",
    description: "List your website, SaaS product, app, e-commerce store or other digital business for sale on Durqo.",
    url: "https://www.durqo.com/sell",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sell Your Digital Business | Durqo",
    description: "List your website, SaaS product, app, e-commerce store or other digital business for sale on Durqo.",
  },
  alternates: { canonical: "https://www.durqo.com/sell" },
};

// Page-scoped presentational helpers, matching the homepage's own convention
// (see src/app/page.tsx's DashEyebrow) of keeping small layout helpers local
// to the page that uses them rather than introducing shared-component churn.
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

// Keeps every section's content column at ~1200px even inside the shared
// Container (which caps at 1280px) — same technique as the homepage's
// Confidence section.
function Inner({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1200px] ${className}`}>{children}</div>;
}

const BENEFIT_STRIP = [
  { icon: Calculator, label: "Free valuation" },
  { icon: ShieldCheck, label: "Reviewed listing" },
  { icon: MessageSquare, label: "Direct buyer messages" },
  { icon: Coins, label: "Pay only when sold" },
];

const VALUE_PROPS = [
  {
    icon: BarChart3,
    title: "Understand your value",
    body: "Get a clear, data-informed valuation range so you can set the right expectations from the start.",
  },
  {
    icon: FileText,
    title: "Present a stronger listing",
    body: "Create a reviewed listing that highlights your key metrics and story.",
  },
  {
    icon: SlidersHorizontal,
    title: "Stay in control",
    body: "Choose what to share and decide which offers you want to pursue.",
  },
];

// Sep 13, 2026: Step 4 now names the real Transfer Room + payout-approval
// flow (live for every payment channel) instead of the vague "agree on the
// terms and complete the transfer" placeholder, matching /how-to-sell,
// /payments and /terms.
const PROCESS_STEPS = [
  { n: "01", title: "Value your business", body: "Get a free valuation range based on the information you provide." },
  { n: "02", title: "Build your listing", body: "Share the key details and submit your business for review." },
  { n: "03", title: "Review buyer interest", body: "Receive messages and consider offers from interested buyers." },
  { n: "04", title: "Complete the transfer", body: "Once a buyer pays, hand over each asset in your shared Transfer Room and get approved for payout." },
];

// Sep 6, 2026: sourced from the single shared src/lib/fees.ts module rather
// than a separate hardcoded array — this is the same schedule /terms's fee
// table and worked example now use, closing out the conflict two earlier
// audits flagged (see fees.ts's own comment for the history).
const PRICING_TIERS = SUCCESS_FEE_TIERS.map((t) => ({ label: t.label, percent: fmtRate(t.rate) }));

const PRICING_FOOTNOTES = [
  { icon: Tag, label: "$0 upfront listing fee" },
  { icon: Ban, label: "No monthly subscription" },
  { icon: CheckCircle2, label: "Charged only when sold" },
];

const READINESS_CHECKLIST = [
  "Clear ownership",
  "Revenue or audience evidence",
  "Transferable digital assets",
  "Documented operating history",
];

// Order matches the brief; index 0 ("How is my valuation calculated?")
// opens by default, per SellFaq's single-open-by-default behavior.
const SELL_FAQS = [
  {
    question: "How is my valuation calculated?",
    answer:
      "We generate an illustrative valuation range based on the monthly revenue, profit and business type you share with us, compared against similar businesses on Durqo. It's a starting reference, not a guarantee of your final sale price.",
  },
  {
    question: "What information is shown publicly?",
    answer:
      "Once your listing is published, its business details (category, financial summary and asking price) along with your seller profile are visible to anyone browsing Durqo. Messages with buyers stay private until you choose to share more.",
  },
  {
    question: "When do I pay the success fee?",
    answer: "Only when your business sale is completed. There's no charge for creating or maintaining a listing.",
  },
  {
    question: "How long does the review take?",
    answer:
      "Our team manually reviews every submission for accuracy and completeness before it goes live. We don't have a fixed turnaround time, but we'll email you as soon as a decision is made.",
  },
  {
    question: "How does the tiered success fee work?",
    answer:
      "Durqo charges a success fee based on the final sale price. Sales below $50,000 are charged 10%, sales from $50,000 through $250,000 are charged 7%, and sales above $250,000 are charged 5%. The applicable percentage is applied to the full sale price.",
  },
];

export default async function SellPage() {
  // Real per-category listing counts (Sep 6, 2026 "What You Can Sell"
  // rework) — same computation the homepage's own category grid already
  // uses (getPublishedListings() + a categoryId -> count map), so this
  // section's counts are never hardcoded/estimated and self-update as
  // listings publish. Falls back to bundled mock data automatically when
  // Supabase isn't reachable, same as every other page using this helper.
  const listings = await getPublishedListings();
  const categoryCounts = new Map<string, number>();
  for (const l of listings) {
    categoryCounts.set(l.categoryId, (categoryCounts.get(l.categoryId) ?? 0) + 1);
  }

  // Sep 8 2026 ("list your business e click korle jodi keu log in kora
  // thake tahole business list korar page e niye jabe, log in na kora
  // thakle login/register korar page e" — the hero CTA should route a
  // signed-in visitor straight to the listing form instead of always
  // sending everyone to registration): checked server-side so the link is
  // correct on first paint, no client flash. requireSession() (mounted on
  // the dashboard/seller layout) is still the real gate — an unauthenticated
  // visitor who somehow lands on that route gets bounced to /login there —
  // this just picks the right destination up front.
  const supabase = await createClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const listBusinessHref = user ? "/dashboard/seller/listings/new" : "/register?as=seller";

  return (
    <main>
      {/* HERO — 52/48 desktop split via fr units (not percent), same
          overflow-safe technique as the homepage's Confidence section, so
          the 48-64px column gap never pushes the two columns past 100%. */}
      <section className="relative overflow-hidden border-b border-rule bg-brand-strong bg-[radial-gradient(60%_80%_at_0%_0%,rgba(16,185,129,0.16),transparent_60%),radial-gradient(50%_70%_at_100%_100%,rgba(59,130,246,0.12),transparent_60%),linear-gradient(180deg,#0B1324,#0F1B33)] py-16 sm:py-20 lg:py-24">
        <MouseGlow />
        <div
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_70%_70%_at_30%_30%,#000_25%,transparent_75%)]"
          aria-hidden
        />
        <div
          className="dq-glow pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand/20 blur-3xl"
          aria-hidden
        />
        <div
          className="dq-glow pointer-events-none absolute -bottom-24 right-[10%] h-72 w-72 rounded-full bg-[#3B82F6]/15 blur-3xl"
          style={{ animationDelay: "3s" }}
          aria-hidden
        />
        <Container className="relative">
          <Inner>
            <div className="grid items-center gap-10 lg:grid-cols-[0.52fr_0.48fr] lg:gap-x-14">
              <div>
                <div className="dq-enter" style={enterDelay(0)}>
                  <DashEyebrow onDark>Sell on Durqo</DashEyebrow>
                </div>
                <h1 className="dq-enter max-w-[17ch] text-4xl leading-[1.1] text-white sm:text-5xl" style={enterDelay(90)}>
                  Your business{" "}
                  <span className="bg-gradient-to-r from-[#34D399] via-brand to-[#2DD4BF] bg-clip-text text-transparent">has value.</span>
                  <br />
                  Let the market see it.
                </h1>
                <p className="dq-enter mt-5 max-w-[52ch] text-lg leading-relaxed text-white/70" style={enterDelay(180)}>
                  Get a free valuation, create a reviewed listing and connect with serious buyers, all without paying
                  anything upfront.
                </p>

                <div className="dq-enter mt-8 flex flex-wrap gap-3" style={enterDelay(270)}>
                  <Button href="/valuation" size="lg" className="dq-shine w-full sm:w-auto">
                    Get a free valuation
                    <ArrowRight size={16} />
                  </Button>
                  <Button href={listBusinessHref} variant="on-dark" size="lg" className="w-full sm:w-auto">
                    List your business
                  </Button>
                </div>

                <div className="dq-enter mt-8 flex flex-wrap gap-x-6 gap-y-2.5 border-t border-white/10 pt-6" style={enterDelay(360)}>
                  {["Free to list", "Reviewed before publishing", "Tiered fee only when sold"].map((label) => (
                    <span key={label} className="flex items-center gap-1.5 text-xs font-medium text-white/70">
                      <CheckCircle2 size={14} className="text-brand" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Illustrative valuation preview — clearly labeled static
                  example content (per the brief), never a computed,
                  visitor-specific number and never randomized on load. */}
              <div className="dq-enter relative" style={enterDelay(220)}>
                <div className="dq-spin-slow pointer-events-none absolute -right-8 -top-8 hidden h-36 w-36 rounded-full border border-dashed border-brand/30 sm:block" aria-hidden />
                <div className="dq-float relative">
                <div className="dq-border relative rounded-2xl border border-white/10 bg-paper-raised p-5 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.6)] sm:p-6">
                  <span className="eyebrow mb-4">Illustrative valuation example</span>
                  <div className="mono mt-1 flex flex-col gap-2.5 text-sm">
                    <div className="dq-enter flex items-center justify-between border-b border-rule pb-2.5" style={enterDelay(450)}>
                      <span className="text-ink-faint">Monthly revenue</span>
                      <span className="font-semibold text-ink">$8,500</span>
                    </div>
                    <div className="dq-enter flex items-center justify-between border-b border-rule pb-2.5" style={enterDelay(540)}>
                      <span className="text-ink-faint">Monthly profit</span>
                      <span className="font-semibold text-ink">$3,200</span>
                    </div>
                    <div className="dq-enter flex items-center justify-between border-b border-rule pb-2.5" style={enterDelay(630)}>
                      <span className="text-ink-faint">Business type</span>
                      <span className="font-semibold text-ink">SaaS</span>
                    </div>
                  </div>

                  <div className="dq-pop mt-4 rounded-xl bg-brand-soft p-4" style={{ animationDelay: "760ms" }}>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-brand-strong/70">
                      Estimated valuation range
                    </p>
                    <p className="mono mt-1 text-2xl font-bold text-brand-strong">$96,000 – $192,000</p>
                    <svg viewBox="0 0 200 40" data-reveal className="dq-draw mt-3 h-8 w-full text-brand" fill="none" aria-hidden>
                      <polyline
                        pathLength={1}
                        points="0,32 30,26 60,28 90,18 120,20 150,8 180,10 200,2"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <p className="mt-3 text-[0.68rem] leading-relaxed text-ink-faint">
                    This is an illustrative example, not a live valuation.
                  </p>
                  <Link href="/valuation" className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand-strong hover:underline">
                    Try it with your own numbers
                    <ArrowRight size={13} />
                  </Link>
                </div>
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* SELLER-BENEFIT STRIP */}
      <section className="border-b border-rule bg-paper-raised py-6">
        <Container>
          <Inner>
            <div className="grid grid-cols-2 divide-y divide-rule sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              {BENEFIT_STRIP.map(({ icon: Icon, label }, i) => (
                <div key={label} data-reveal style={revealDelay(i * 90)} className="flex items-center justify-center gap-2.5 px-4 py-3 text-center sm:py-0">
                  <span className="dq-icon-pop grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                    <Icon size={15} />
                  </span>
                  <span className="text-sm font-medium text-ink">{label}</span>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* VALUE PROPOSITION */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div data-reveal className="mb-10 max-w-[60ch]">
              <DashEyebrow>A better way to sell</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Built to help you sell with clarity.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Present your business professionally, reach the right buyers and control the process from start to
                finish.
              </p>
            </div>
            <div className="grid gap-8 divide-y divide-rule sm:grid-cols-3 sm:gap-6 sm:divide-x sm:divide-y-0">
              {VALUE_PROPS.map(({ icon: Icon, title, body }, i) => (
                <div key={title} data-reveal style={revealDelay(i * 120)} className={`group flex flex-col gap-2 ${i > 0 ? "pt-6 sm:pt-0 sm:pl-6" : ""}`}>
                  <span className="dq-icon-pop grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-white">
                    <Icon size={20} />
                  </span>
                  <h4 className="mt-1 text-base font-semibold text-ink">{title}</h4>
                  <p className="text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* SELLING PROCESS — same connected-timeline technique as the
          homepage's How It Works, extended to 4 steps. */}
      <section className="relative overflow-hidden border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(17,24,39,0.08)_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_60%_70%_at_50%_50%,#000_20%,transparent_70%)]"
          aria-hidden
        />
        <Container className="relative">
          <Inner>
            <div data-reveal className="mb-10 text-center">
              <DashEyebrow center>The selling process</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">From valuation to a completed sale.</h2>
            </div>
            <div className="relative grid gap-8 sm:grid-cols-4">
              <div className="pointer-events-none absolute left-[6%] right-[6%] top-6 hidden h-px bg-rule sm:block" aria-hidden />
              <div data-reveal className="dq-line pointer-events-none absolute left-[6%] right-[6%] top-6 hidden h-0.5 -translate-y-px rounded-full bg-gradient-to-r from-brand via-brand to-brand/30 sm:block" aria-hidden />
              {PROCESS_STEPS.map(({ n, title, body }, i) => (
                <div key={n} data-reveal style={revealDelay(i * 160)} className="group relative flex flex-col items-start">
                  <span className="dq-icon-pop mono relative z-10 mb-4 grid h-12 w-12 place-items-center rounded-full bg-brand text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(16,185,129,0.8)] ring-8 ring-paper-sunk transition group-hover:scale-110">
                    {n}
                  </span>
                  <h4 className="text-base font-semibold text-ink">{title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* WHAT YOU CAN SELL — Sep 6, 2026 rework: every active main category
          from the shared CATEGORIES source (src/lib/categories.ts), not a
          hardcoded shortlist — so a newly-added category appears here with
          zero changes to this file. Each tile is its own bordered/rounded
          surface (rather than one shared divide-x strip) so a 16-category
          grid reads as a clean multi-row layout instead of one unified bar;
          listing counts are computed live from real published listings,
          never hardcoded, and hidden entirely for a category with none. */}
      <section className="border-b border-rule py-20">
        <Container>
          <div className="mx-auto max-w-[1240px]">
            <div data-reveal>
            <DashEyebrow>What you can sell</DashEyebrow>
            <h2 className="text-2xl sm:text-3xl">Sell any type of digital business.</h2>
            </div>
            <p data-reveal className="mb-8 mt-2 max-w-[60ch] text-[0.95rem] leading-relaxed text-ink-soft">
              Explore all the digital business categories you can list and sell on Durqo.
            </p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {CATEGORIES.map((category, i) => {
                const Icon = CATEGORY_ICONS[category.id];
                const accent = CATEGORY_ACCENTS[category.id] ?? "#10B981";
                const count = categoryCounts.get(category.id) ?? 0;
                return (
                  <Link
                    key={category.id}
                    href={`/buy/${category.id}`}
                    data-reveal
                    style={revealDelay((i % 4) * 70)}
                    className="group flex h-full min-h-[7rem] flex-col items-center justify-center gap-2.5 rounded-2xl border border-rule bg-paper px-4 py-6 text-center transition hover:-translate-y-1 hover:border-brand hover:bg-paper-raised hover:shadow-[0_18px_36px_-24px_rgba(11,19,36,0.35)] focus-visible:border-brand focus-visible:bg-paper-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                  >
                    <span
                      className="grid h-11 w-11 place-items-center rounded-xl transition group-hover:scale-110"
                      style={{ color: accent, backgroundColor: `color-mix(in srgb, ${accent} 12%, #fff)` }}
                    >
                      <Icon size={19} />
                    </span>
                    <span className="text-sm font-semibold text-ink">{category.name}</span>
                    {count > 0 && (
                      <span className="mono text-xs text-brand-hover">
                        {count} active listing{count === 1 ? "" : "s"}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* TIERED PRICING */}
      <section className="relative overflow-hidden border-b border-rule bg-brand-strong bg-[radial-gradient(60%_90%_at_50%_0%,rgba(16,185,129,0.18),transparent_60%),linear-gradient(180deg,#0B1324,#0F1A30)] py-14 text-center sm:py-16">
        <MouseGlow />
        <Container className="relative">
          <Inner>
            <DashEyebrow onDark center>
              Simple pricing
            </DashEyebrow>
            <h2 className="text-2xl text-white sm:text-3xl">Lower fees for larger transactions.</h2>
            <p className="mx-auto mt-3 max-w-[52ch] text-[0.95rem] leading-relaxed text-white/65">
              List with no upfront charge. Durqo collects a success fee only after your business is sold.
            </p>

            <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
                {PRICING_TIERS.map(({ label, percent }, i) => (
                  <div
                    key={label}
                    data-reveal
                    style={revealDelay(i * 140)}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-8 transition hover:-translate-y-1 hover:border-brand/50 hover:bg-white/[0.07]"
                  >
                    <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-white/50">
                      {label}
                    </p>
                    <p className="mono text-4xl font-bold text-brand sm:text-5xl">
                      <CountUp value={percent} />
                    </p>
                    <p className="text-xs text-white/60">Success fee</p>
                  </div>
                ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {PRICING_FOOTNOTES.map(({ icon: Icon, label }, i) => (
                <span key={label} data-reveal style={revealDelay(300 + i * 100)} className="flex items-center gap-2 text-sm text-white/75">
                  <Icon size={15} className="text-brand" />
                  {label}
                </span>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* SELLER READINESS */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="grid gap-8 lg:grid-cols-[0.56fr_0.44fr] lg:gap-x-14">
              <div>
                <DashEyebrow>Seller readiness</DashEyebrow>
                <h2 className="text-2xl sm:text-3xl">Is your business ready to list?</h2>
                <div className="mt-6 flex flex-col gap-3">
                  {READINESS_CHECKLIST.map((item, i) => (
                    <span
                      key={item}
                      data-reveal
                      style={revealDelay(i * 80)}
                      className="flex items-center gap-2.5 rounded-xl border border-rule bg-paper-raised px-3.5 py-2.5 text-sm text-ink transition hover:border-brand/50"
                    >
                      <CheckCircle2 size={17} className="dq-icon-pop shrink-0 text-brand" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div data-reveal style={revealDelay(150)} className="relative flex flex-col justify-center gap-2 overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-soft to-paper-raised p-6">
                <span className="dq-glow pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/20 blur-3xl" aria-hidden />
                <MessageSquare size={20} className="text-brand-strong" />
                <h4 className="text-base font-semibold text-ink">Not sure yet?</h4>
                <p className="text-sm leading-relaxed text-ink-soft">
                  Request a free valuation and we&rsquo;ll help you understand the next step.
                </p>
                <Button href="/valuation" className="mt-2 min-h-11 self-start">
                  Get a free valuation
                </Button>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* FAQ */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[760px]">
            <div data-reveal>
            <DashEyebrow center>Frequently asked questions</DashEyebrow>
            <h2 className="mb-8 text-center text-2xl sm:text-3xl">Your questions, answered.</h2>
            </div>
            <div data-reveal style={revealDelay(120)}>
              <SellFaq items={SELL_FAQS} />
            </div>
          </Inner>
        </Container>
      </section>

      {/* FINAL CTA — compact, ivory/emerald-tinted, no fixed height. */}
      <section className="py-10 sm:py-12">
        <Container>
          <Inner>
            <div data-reveal className="relative flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-soft via-brand-soft to-paper-raised p-8 sm:p-10">
              <span className="dq-glow pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-brand/20 blur-3xl" aria-hidden />
              <div className="relative flex items-start gap-4">
                <span className="relative mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-[0_8px_18px_-8px_rgba(16,185,129,0.8)]">
                  <TrendingUp size={20} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-ink sm:text-2xl">
                    Ready to see what your business could be worth?
                  </h2>
                  <p className="mt-1 max-w-[46ch] text-sm text-ink-soft">Start with a free, no-obligation valuation.</p>
                </div>
              </div>
              <div className="relative flex w-full flex-wrap gap-3 sm:w-auto">
                <Button href="/valuation" size="lg" className="dq-shine w-full sm:w-auto">
                  Get a free valuation
                  <ArrowRight size={16} />
                </Button>
                <Button href="/register?as=seller" variant="secondary" size="lg" className="w-full sm:w-auto">
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
