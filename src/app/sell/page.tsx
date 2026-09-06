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
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import SellFaq from "./SellFaq";

// Sep 6, 2026 redesign to match the approved homepage's visual system —
// see claude/homepage-redesign-addendum.md for the full brief and the
// accuracy/consistency decisions made here (tiered fee wording, the
// Terms-page fee-table conflict this surfaced, etc). Global Header/Footer
// are rendered by RootLayout and are not touched by this file.

export const metadata: Metadata = {
  title: "Sell Your Digital Business | Durqo",
  description:
    "Get a free valuation and list your website, SaaS product, app, e-commerce brand, domain or other digital business for sale on Durqo.",
  openGraph: {
    title: "Sell Your Digital Business | Durqo",
    description:
      "Create a reviewed listing, connect with interested buyers and pay a tiered success fee only when your business sells.",
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

const PROCESS_STEPS = [
  { n: "01", title: "Value your business", body: "Get a free valuation range based on the information you provide." },
  { n: "02", title: "Build your listing", body: "Share the key details and submit your business for review." },
  { n: "03", title: "Review buyer interest", body: "Receive messages and consider offers from interested buyers." },
  { n: "04", title: "Complete the transfer", body: "Agree on the terms and complete the business transfer." },
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
      "Once your listing is published, its business details — category, financial summary and asking price — along with your seller profile are visible to anyone browsing Durqo. Messages with buyers stay private until you choose to share more.",
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

  return (
    <main>
      {/* HERO — 52/48 desktop split via fr units (not percent), same
          overflow-safe technique as the homepage's Confidence section, so
          the 48-64px column gap never pushes the two columns past 100%. */}
      <section className="relative overflow-hidden border-b border-rule bg-brand-strong py-16 sm:py-20 lg:py-24">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
          aria-hidden
        />
        <Container className="relative">
          <Inner>
            <div className="grid items-center gap-10 lg:grid-cols-[0.52fr_0.48fr] lg:gap-x-14">
              <div>
                <DashEyebrow onDark>Sell on Durqo</DashEyebrow>
                <h1 className="max-w-[17ch] text-4xl leading-[1.1] text-white sm:text-5xl">
                  Your business <span className="text-brand">has value.</span>
                  <br />
                  Let the market see it.
                </h1>
                <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-white/70">
                  Get a free valuation, create a reviewed listing and connect with serious buyers — without paying
                  anything upfront.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button href="/contact?subject=valuation" size="lg">
                    Get a free valuation
                    <ArrowRight size={16} />
                  </Button>
                  <Button href="/register?as=seller" variant="on-dark" size="lg">
                    List your business
                  </Button>
                </div>

                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 border-t border-white/10 pt-6">
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
              <div className="relative">
                <div className="rounded-2xl border border-rule bg-paper-raised p-5 shadow-[0_28px_56px_-30px_rgba(11,19,36,0.4)] sm:p-6">
                  <span className="eyebrow mb-4">Illustrative valuation example</span>
                  <div className="mono mt-1 flex flex-col gap-2.5 text-sm">
                    <div className="flex items-center justify-between border-b border-rule pb-2.5">
                      <span className="text-ink-faint">Monthly revenue</span>
                      <span className="font-semibold text-ink">$8,500</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-rule pb-2.5">
                      <span className="text-ink-faint">Monthly profit</span>
                      <span className="font-semibold text-ink">$3,200</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-rule pb-2.5">
                      <span className="text-ink-faint">Business type</span>
                      <span className="font-semibold text-ink">SaaS</span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-brand-soft p-4">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-brand-strong/70">
                      Estimated valuation range
                    </p>
                    <p className="mono mt-1 text-2xl font-bold text-brand-strong">$96,000 – $192,000</p>
                    <svg viewBox="0 0 200 40" className="mt-3 h-8 w-full text-brand" fill="none" aria-hidden>
                      <polyline
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
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* SELLER-BENEFIT STRIP */}
      <section className="border-b border-rule bg-paper-sunk py-6">
        <Container>
          <Inner>
            <div className="grid grid-cols-2 divide-y divide-rule sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              {BENEFIT_STRIP.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center justify-center gap-2.5 px-4 py-3 text-center sm:py-0">
                  <Icon size={16} className="shrink-0 text-brand" />
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
            <div className="mb-10 max-w-[60ch]">
              <DashEyebrow>A better way to sell</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Built to help you sell with clarity.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Present your business professionally, reach the right buyers and control the process from start to
                finish.
              </p>
            </div>
            <div className="grid gap-8 divide-y divide-rule sm:grid-cols-3 sm:gap-6 sm:divide-x sm:divide-y-0">
              {VALUE_PROPS.map(({ icon: Icon, title, body }, i) => (
                <div key={title} data-reveal className={`flex flex-col gap-2 ${i > 0 ? "pt-6 sm:pt-0 sm:pl-6" : ""}`}>
                  <Icon size={22} className="text-brand" />
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
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 text-center">
              <DashEyebrow center>The selling process</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">From valuation to a completed sale.</h2>
            </div>
            <div className="relative grid gap-8 sm:grid-cols-4">
              <div className="pointer-events-none absolute left-[6%] right-[6%] top-6 hidden h-px bg-rule sm:block" aria-hidden />
              {PROCESS_STEPS.map(({ n, title, body }) => (
                <div key={n} data-reveal className="relative flex flex-col items-start">
                  <span className="mono relative z-10 mb-4 grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand-strong ring-8 ring-paper-sunk">
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
            <DashEyebrow>What you can sell</DashEyebrow>
            <h2 className="text-2xl sm:text-3xl">Sell any type of digital business.</h2>
            <p className="mb-8 mt-2 max-w-[60ch] text-[0.95rem] leading-relaxed text-ink-soft">
              Explore all the digital business categories you can list and sell on Durqo.
            </p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {CATEGORIES.map((category) => {
                const Icon = CATEGORY_ICONS[category.id];
                const count = categoryCounts.get(category.id) ?? 0;
                return (
                  <Link
                    key={category.id}
                    href={`/buy?category=${category.id}`}
                    className="flex h-full min-h-[7rem] flex-col items-center justify-center gap-2.5 rounded-xl border border-rule bg-paper-raised px-4 py-6 text-center transition hover:border-brand hover:bg-brand-soft/40 focus-visible:border-brand focus-visible:bg-brand-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-lg bg-paper-sunk text-brand-strong transition group-hover:bg-brand">
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
      <section className="border-b border-rule bg-brand-strong py-14 text-center sm:py-16">
        <Container>
          <Inner>
            <DashEyebrow onDark center>
              Simple pricing
            </DashEyebrow>
            <h2 className="text-2xl text-white sm:text-3xl">Lower fees for larger transactions.</h2>
            <p className="mx-auto mt-3 max-w-[52ch] text-[0.95rem] leading-relaxed text-white/65">
              List with no upfront charge. Durqo collects a success fee only after your business is sold.
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

      {/* SELLER READINESS */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="grid gap-8 lg:grid-cols-[0.56fr_0.44fr] lg:gap-x-14">
              <div>
                <DashEyebrow>Seller readiness</DashEyebrow>
                <h2 className="text-2xl sm:text-3xl">Is your business ready to list?</h2>
                <div className="mt-6 flex flex-col gap-3">
                  {READINESS_CHECKLIST.map((item) => (
                    <span key={item} className="flex items-center gap-2.5 text-sm text-ink">
                      <CheckCircle2 size={17} className="shrink-0 text-brand" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-center gap-2 rounded-xl bg-brand-soft p-6">
                <MessageSquare size={20} className="text-brand-strong" />
                <h4 className="text-base font-semibold text-ink">Not sure yet?</h4>
                <p className="text-sm leading-relaxed text-ink-soft">
                  Request a free valuation and we&rsquo;ll help you understand the next step.
                </p>
                <Button href="/contact" className="mt-2 min-h-11 self-start">
                  Talk to Durqo
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
            <DashEyebrow center>Frequently asked questions</DashEyebrow>
            <h2 className="mb-8 text-center text-2xl sm:text-3xl">Your questions, answered.</h2>
            <SellFaq items={SELL_FAQS} />
          </Inner>
        </Container>
      </section>

      {/* FINAL CTA — compact, ivory/emerald-tinted, no fixed height. */}
      <section className="py-10 sm:py-12">
        <Container>
          <Inner>
            <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-brand-soft p-8 sm:p-10">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-paper-raised text-brand-strong">
                  <TrendingUp size={20} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-ink sm:text-2xl">
                    Ready to see what your business could be worth?
                  </h2>
                  <p className="mt-1 max-w-[46ch] text-sm text-ink-soft">Start with a free, no-obligation valuation.</p>
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
