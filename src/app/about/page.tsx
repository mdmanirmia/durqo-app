import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowDown,
  Layers,
  FileCheck2,
  GitCompare,
  ListChecks,
  HelpCircle,
  Route,
  Eye,
  ShieldCheck,
  SlidersHorizontal,
  CheckCircle2,
  User,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

// Sep 2026 About-page redesign — replaces the previous version, which made
// several claims this codebase can't actually back up today (a named team
// with "backgrounds in escrow and payments", "every payment runs through
// escrow", financial figures "checked against source data"). See
// src/components/Footer.tsx's own Sep 6 2026 comment: Stripe Checkout runs
// on test-mode keys only in production, and there's no independent
// third-party escrow provider integrated anywhere in this codebase — order
// status "in_escrow" (src/app/api/webhooks/stripe/route.ts) is Durqo's own
// internal hold-state label, not a live third-party escrow claim. This page
// sticks to what the app actually does: listings go through a manual
// publish review ("reviewed"/"published"), and a seller's identity badge
// reflects profiles.is_verified specifically — the same "verified" ==
// identity-only convention this file's layout.tsx neighbor already
// documents. It also deliberately duplicates nothing from /buy (no category
// grid, no listing cards), /sell (no pricing table, no seller form steps)
// or the homepage's own How It Works section (id="how-it-works") — this
// page's 4-step summary just links there instead of repeating it.
export const metadata: Metadata = {
  title: "About Durqo | Digital Business Marketplace",
  description:
    "Learn about Durqo, a marketplace connecting buyers and sellers of websites, SaaS products, apps and other digital businesses.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "About Durqo | Digital Business Marketplace",
    description:
      "Learn about Durqo, a marketplace connecting buyers and sellers of websites, SaaS products, apps and other digital businesses.",
    url: "https://www.durqo.com/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Durqo | Digital Business Marketplace",
    description:
      "Learn about Durqo, a marketplace connecting buyers and sellers of websites, SaaS products, apps and other digital businesses.",
  },
  alternates: { canonical: "https://www.durqo.com/about" },
};

// Page-scoped presentational helpers, matching the homepage's and /sell's
// own convention (see src/app/page.tsx's DashEyebrow) of keeping small
// layout helpers local to the page that uses them rather than introducing
// shared-component churn for a single page.
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
      className={`mono mb-4 flex items-center gap-2.5 text-left text-xs font-semibold uppercase tracking-wider ${
        onDark ? "text-white/70" : "text-ink-soft"
      } ${center ? "justify-center" : ""}`}
    >
      <span className="h-px w-6 bg-brand" aria-hidden="true" />
      {children}
    </p>
  );
}

// Keeps this page's content column at ~1200px inside the shared Container
// (which caps at 1280px) — same technique /sell uses.
function Inner({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1200px] ${className}`}>{children}</div>;
}

const PROBLEM_APPROACH = [
  {
    problemIcon: Layers,
    problemLabel: "Scattered information",
    problemText: "Important business details may be spread across messages, documents and different tools.",
    approachIcon: FileCheck2,
    approachLabel: "Structured listings",
    approachText: "Durqo presents essential business information in a consistent format that is easier to review.",
  },
  {
    problemIcon: GitCompare,
    problemLabel: "Difficult comparison",
    problemText: "Opportunities can be hard to evaluate when sellers present information in different ways.",
    approachIcon: ListChecks,
    approachLabel: "Clearer evaluation",
    approachText: "A shared listing structure helps buyers compare relevant information more efficiently.",
  },
  {
    problemIcon: HelpCircle,
    problemLabel: "Unclear next steps",
    problemText: "Buyers and sellers may not always know how to move from initial interest toward a potential transfer.",
    approachIcon: Route,
    approachLabel: "A guided journey",
    approachText: "Defined marketplace stages provide a clearer path from discovery and communication toward an agreed transaction.",
  },
] as const;

const JOURNEY = [
  { n: "01", title: "Discover", body: "Explore publicly available opportunities that match your interests." },
  { n: "02", title: "Evaluate", body: "Review the available business information and ask relevant questions." },
  { n: "03", title: "Connect", body: "Buyers and sellers communicate to discuss the opportunity and potential terms." },
  { n: "04", title: "Transfer", body: "When both sides agree to proceed, they follow the applicable payment and asset-transfer process." },
] as const;

const PRINCIPLES = [
  {
    icon: Eye,
    title: "Clarity",
    body: "Present essential information and transaction stages in a way that is easier for both sides to understand.",
  },
  {
    icon: ShieldCheck,
    title: "Credibility",
    body: "Apply consistent publication requirements and communicate what has — and has not — been verified.",
  },
  {
    icon: SlidersHorizontal,
    title: "Control",
    body: "Give buyers and sellers the information and communication tools they need to make their own informed decisions.",
  },
] as const;

// "Structured" rather than "verified" here deliberately: the public /buy
// query gates on listing status only (published/sold — see
// src/lib/data/listings.server.ts's STATUS_LISTS), and the "Verified" badge
// shown on cards (src/lib/data/map-listing.ts) is itself derived from that
// same status, not a second, independent check. So every public listing is
// "structured" (it passed the publish review) but "verified" would overstate
// that as a distinct assurance layer that doesn't exist today.
const BUYER_BENEFITS = [
  "Explore structured public listings",
  "Compare essential business information",
  "Communicate directly with sellers",
];

const SELLER_BENEFITS = [
  "Create a structured business listing",
  "Present essential information clearly",
  "Manage interest from potential buyers",
];

export default function AboutPage() {
  return (
    <main>
      {/* 1. COMPACT ABOUT HERO — ~55/45 desktop split via fr units (not
          percent), same overflow-safe technique the homepage/sell heroes
          use, so the column gap never pushes past 100% width. Vertically
          centered within a 480-520px band; not full-screen. */}
      <section className="relative overflow-hidden border-b border-rule bg-brand-strong">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
          aria-hidden="true"
        />
        <Container className="relative flex min-h-[480px] items-center py-14 sm:py-16 lg:min-h-[520px] lg:py-0">
          <Inner className="w-full">
            <div className="grid items-center gap-10 lg:grid-cols-[0.55fr_0.45fr] lg:gap-x-16">
              <div>
                <DashEyebrow onDark>About Durqo</DashEyebrow>
                <h1 className="max-w-[20ch] text-4xl leading-[1.1] text-white sm:text-5xl">
                  A clearer way to buy and sell digital businesses.
                </h1>
                <p className="mt-5 max-w-[52ch] text-left text-lg leading-relaxed text-white/70">
                  Durqo is a focused marketplace designed to bring greater clarity, structure and confidence to
                  digital-business transactions.
                </p>

                <div className="mt-8 flex flex-col gap-3 min-[431px]:flex-row">
                  <Button href="/buy" size="lg" className="min-h-12 w-full min-[431px]:w-auto">
                    Explore marketplace
                    <ArrowRight size={16} aria-hidden="true" />
                  </Button>
                  <Button href="/sell" variant="on-dark" size="lg" className="min-h-12 w-full min-[431px]:w-auto">
                    Sell a business
                  </Button>
                </div>
              </div>

              {/* Abstract platform-purpose visual — HTML/CSS/SVG and
                  existing icons only. Shows only the Seller -> Durqo
                  marketplace -> Buyer relationship (a small node on each
                  side, a central Durqo mark, restrained connector lines) —
                  deliberately NOT the four journey stages, which belong only
                  in the "From opportunity to ownership" section below and
                  would otherwise read as a duplicated, competing summary of
                  the same process right in the hero. No real listings,
                  prices, revenue figures or category cards; purely
                  conceptual and secondary to the H1. */}
              <div className="relative mx-auto w-full max-w-[380px]" aria-hidden="true">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col items-center gap-2">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/5 text-white/70">
                        <User size={18} />
                      </span>
                      <span className="text-xs font-medium text-white/70">Seller</span>
                    </div>

                    <svg viewBox="0 0 100 20" className="h-4 flex-1 text-white/25" fill="none">
                      <path d="M0 10 H100" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1 6" strokeLinecap="round" />
                    </svg>

                    <div className="flex flex-col items-center gap-2">
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-brand/40 bg-brand/10 text-brand">
                        <span className="mono text-lg font-bold">D</span>
                      </span>
                      <span className="text-xs font-semibold text-white">Durqo</span>
                    </div>

                    <svg viewBox="0 0 100 20" className="h-4 flex-1 text-white/25" fill="none">
                      <path d="M0 10 H100" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1 6" strokeLinecap="round" />
                    </svg>

                    <div className="flex flex-col items-center gap-2">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/5 text-white/70">
                        <User size={18} />
                      </span>
                      <span className="text-xs font-medium text-white/70">Buyer</span>
                    </div>
                  </div>

                  <p className="mt-6 text-center text-xs leading-relaxed text-white/50">
                    A single focused marketplace connecting sellers and buyers of digital businesses.
                  </p>
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* 2. WHY DURQO EXISTS — calm editorial two-column split (~60/40). */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="grid gap-10 lg:grid-cols-[0.6fr_0.4fr] lg:gap-x-16">
              <div data-reveal>
                <DashEyebrow>Why Durqo exists</DashEyebrow>
                <h2 className="text-2xl sm:text-3xl">Digital acquisitions should be easier to understand.</h2>
                <div className="mt-4 flex flex-col gap-4 text-left text-[0.95rem] leading-relaxed text-ink-soft">
                  <p className="text-left">
                    Buying or selling a digital business can involve scattered information, unclear expectations and
                    multiple disconnected conversations. This can make opportunities difficult to compare and the
                    next step difficult to understand.
                  </p>
                  <p className="text-left">
                    Durqo was created to bring listings, essential business information, buyer&ndash;seller
                    communication and transaction stages into one focused marketplace.
                  </p>
                </div>
              </div>

              <div data-reveal className="rounded-xl border border-rule bg-paper-raised p-6 sm:p-7">
                <p className="mono text-left text-xs font-semibold uppercase tracking-wider text-ink-faint">Our mission</p>
                <p className="mt-2.5 text-left text-lg font-medium leading-snug text-ink">
                  Make the journey from discovery to transfer clearer, more organized and easier to navigate.
                </p>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* 3. COMMON PROBLEMS -> DURQO'S APPROACH */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[62ch]">
              <DashEyebrow>The challenge</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Bringing structure to a fragmented process.</h2>
              <p className="mt-3 text-left text-[0.95rem] leading-relaxed text-ink-soft">
                Durqo is designed around common difficulties buyers and sellers face when navigating digital-business
                transactions.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              {PROBLEM_APPROACH.map((pair) => {
                const ProblemIcon = pair.problemIcon;
                const ApproachIcon = pair.approachIcon;
                return (
                  <div
                    key={pair.problemLabel}
                    data-reveal
                    className="grid overflow-hidden rounded-xl border border-rule md:grid-cols-[1fr_auto_1fr]"
                  >
                    <div className="bg-paper-raised p-6 md:p-7">
                      <ProblemIcon size={20} className="text-ink-faint" aria-hidden="true" />
                      <h3 className="mt-3 text-base font-semibold text-ink">{pair.problemLabel}</h3>
                      <p className="mt-1.5 text-left text-sm leading-relaxed text-ink-soft">{pair.problemText}</p>
                    </div>

                    <div className="flex items-center justify-center bg-paper-sunk px-4 py-3 md:bg-transparent md:py-0">
                      <ArrowDown size={16} className="text-ink-faint md:hidden" aria-hidden="true" />
                      <ArrowRight size={16} className="hidden text-ink-faint md:block" aria-hidden="true" />
                    </div>

                    <div className="bg-brand-soft/50 p-6 md:p-7">
                      <ApproachIcon size={20} className="text-brand-strong" aria-hidden="true" />
                      <h3 className="mt-3 text-base font-semibold text-ink">{pair.approachLabel}</h3>
                      <p className="mt-1.5 text-left text-sm leading-relaxed text-ink-soft">{pair.approachText}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Inner>
        </Container>
      </section>

      {/* 4. CONCISE FOUR-STEP JOURNEY — deliberately brief; the complete
          process lives at the real How It Works section (homepage
          id="how-it-works", the same route the header's own nav links to),
          not repeated here. No large circular icons: a plain numeral marks
          each step, with a thin top border reading as a restrained,
          secondary connector across the row (or, stacked on mobile, above
          each step in turn) rather than a decorative circle chain. */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[62ch]">
              <DashEyebrow>A simple journey</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">From opportunity to ownership.</h2>
              <p className="mt-3 text-left text-[0.95rem] leading-relaxed text-ink-soft">
                A structured overview of how buyers and sellers can move through the marketplace.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-x-6 md:gap-y-8 lg:grid-cols-4 lg:gap-6">
              {JOURNEY.map((step) => (
                <div key={step.n} data-reveal className="border-t border-rule pt-5">
                  <span className="mono text-xl font-bold text-brand">{step.n}</span>
                  <h3 className="mt-2 text-base font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1.5 text-left text-sm leading-relaxed text-ink-soft">{step.body}</p>
                </div>
              ))}
            </div>

            <Link
              href="/#how-it-works"
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-hover hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              See how Durqo works
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </Inner>
        </Container>
      </section>

      {/* 5. PRINCIPLES BEHIND THE PLATFORM — three equal-height blocks
          separated by thin dividers, same divide-x/divide-y technique
          /sell's value-proposition row uses; no circular icon backgrounds,
          no heavy shadows. */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[62ch]">
              <DashEyebrow>Our approach</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Principles behind the platform.</h2>
              <p className="mt-3 text-left text-[0.95rem] leading-relaxed text-ink-soft">
                Durqo is being built around three ideas that support a more understandable marketplace experience.
              </p>
            </div>

            <div className="grid gap-8 divide-y divide-rule lg:grid-cols-3 lg:gap-8 lg:divide-x lg:divide-y-0">
              {PRINCIPLES.map(({ icon: Icon, title, body }, i) => (
                <div key={title} data-reveal className={`flex flex-col gap-2 ${i > 0 ? "pt-6 lg:pt-0 lg:pl-8" : ""}`}>
                  <Icon size={22} className="text-brand" aria-hidden="true" />
                  <h3 className="mt-1 text-lg font-semibold text-ink">{title}</h3>
                  <p className="text-left text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* 6. FOR BUYERS AND FOR SELLERS — one balanced two-column section,
          not a repeat of /buy's or /sell's full content. */}
      <section className="py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="grid gap-10 md:grid-cols-2 md:divide-x md:divide-rule">
              <div data-reveal className="md:pr-10">
                <DashEyebrow>For buyers</DashEyebrow>
                <h2 className="text-2xl sm:text-3xl">Explore opportunities with greater clarity.</h2>
                <p className="mt-3 text-left text-[0.95rem] leading-relaxed text-ink-soft">
                  Discover digital businesses, review the available information and connect with sellers when an
                  opportunity interests you.
                </p>
                <div className="mt-5 flex flex-col gap-2.5">
                  {BUYER_BENEFITS.map((item) => (
                    <span key={item} className="flex items-center gap-2.5 text-sm text-ink">
                      <CheckCircle2 size={16} className="shrink-0 text-brand" aria-hidden="true" />
                      {item}
                    </span>
                  ))}
                </div>
                <Button href="/buy" className="mt-6 min-h-12 w-full md:w-auto">
                  Browse listings
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
              </div>

              <div data-reveal className="border-t border-rule pt-10 md:border-t-0 md:pl-10 md:pt-0">
                <DashEyebrow>For sellers</DashEyebrow>
                <h2 className="text-2xl sm:text-3xl">Present your business with more structure.</h2>
                <p className="mt-3 text-left text-[0.95rem] leading-relaxed text-ink-soft">
                  Create a detailed listing, share relevant business information and connect with people exploring
                  acquisition opportunities.
                </p>
                <div className="mt-5 flex flex-col gap-2.5">
                  {SELLER_BENEFITS.map((item) => (
                    <span key={item} className="flex items-center gap-2.5 text-sm text-ink">
                      <CheckCircle2 size={16} className="shrink-0 text-brand" aria-hidden="true" />
                      {item}
                    </span>
                  ))}
                </div>
                <Button href="/sell" className="mt-6 min-h-12 w-full md:w-auto">
                  Start selling
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* 7. FINAL CTA — compact deep-navy band, not another full hero. */}
      <section className="py-10 sm:py-12">
        <Container>
          <Inner>
            <div className="flex flex-col gap-6 rounded-2xl bg-brand-strong p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
              <div>
                <p className="mono mb-2 text-left text-xs font-semibold uppercase tracking-wider text-white/60">Get started</p>
                <h2 className="text-2xl text-white sm:text-3xl">Ready to explore Durqo?</h2>
                <p className="mt-2 max-w-[46ch] text-left text-[0.95rem] leading-relaxed text-white/65">
                  Find your next opportunity or present your digital business to potential buyers.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-[431px]:flex-row sm:shrink-0">
                <Button href="/buy" size="lg" className="min-h-12 w-full min-[431px]:w-auto">
                  Browse marketplace
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
                <Button href="/sell" variant="on-dark" size="lg" className="min-h-12 w-full min-[431px]:w-auto">
                  Sell a business
                </Button>
              </div>
            </div>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
