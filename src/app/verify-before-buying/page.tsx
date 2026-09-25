import type { Metadata } from "next";
import {
  ArrowRight,
  FileCheck,
  TrendingUp,
  Search,
  Radar,
  Link2,
  ShieldCheck,
  MailCheck,
  Store,
  Image as ImageIcon,
  CheckCircle2,
  Info,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

// Sep 17, 2026: new standalone explainer page, "How to Verify Revenue and
// Traffic Before Buying a Website" — built the same way as /listing-review,
// /transfer-room, /whats-included and /seller-payouts: matches the existing
// guide-page visual system exactly (DashEyebrow/Inner helpers, section
// rhythm, page-scoped duplication per this project's own "no shared-
// component churn" convention). Written from the buyer's side of the same
// material /listing-review already covers from the seller/admin side —
// cross-linked to it rather than repeating its review-process content.
//
// Every claim below is traced to real, live listing-page code, not
// invented copy:
// - Proof of Income: 12 months of income figures plus images (bank
//   statements, payment processor dashboards) — IncomeHistoryPanel, only
//   rendered when at least one month has a real income value
//   (src/app/listing/[slug]/page.tsx: "incomeSeries.some((s) => s.income)").
// - Google Analytics Data: two distinct cases on the exact same page,
//   confirmed by that file's own comment above the block ("A seller who has
//   connected their real GA4 account live gets that live, auto-updating
//   panel... the self-declared manual numbers and verification screenshots
//   are hidden in that case so the page never shows two different sets of
//   numbers for the same thing"): (1) GoogleAnalyticsLivePanel.tsx — a
//   live, auto-updating panel with a 7-day/30-day/90-day/12-month/custom
//   date-range picker, fetching real numbers via
//   /api/google-analytics/report once a seller has connected their actual
//   GA4 property by OAuth; (2) manual self-reported numbers (Total Users,
//   New Users, Total Page Views, Avg. Engagement Time) plus proof
//   screenshots via ProofGalleryButton, for a seller who hasn't connected
//   live GA — shown with a "Reviewed by Durqo" tag only once
//   listing.gaVerified is true, per that section's own conditional.
// - Google Search Console, SEMrush and Ahrefs sections: each is its own
//   independently-gated card (hasGscData / hasSemrushData / hasAhrefsData)
//   with its own stat grid and its own ProofGalleryButton screenshots — the
//   exact field labels (Total Clicks, Total Impressions, Indexed Pages,
//   Non-Indexed Pages, Average CTR; Authority Score, Total Traffic, Total
//   Keywords, Top 10 Keywords, Total Backlinks; DR Rating, UR Rating,
//   Referring Domains, Total Keywords, Total Backlinks) come straight from
//   those sections' own StatGrid items.
// - Two distinct badges shown on a listing itself: "Verified" (the listing
//   itself cleared review and is live — listing.isVerified) and "Google
//   Analytics Verified" (a separate signal, listing.gaVerified, shown as
//   its own badge right below the title) — both read directly from the
//   listing header block. "Reviewed by Durqo" on the GA card is the same
//   gaVerified flag, just placed differently.
// - Seller card: identity verification ("Verified <method>" vs "Identity
//   not yet verified"), email verification ("Email verified" vs "Email not
//   yet verified"), active listings count, completed-sales count plus
//   lifetime $ (only shown once lifetimeSalesAmount > 0), and "Member
//   since" — all read verbatim from the Seller card block on the same
//   listing page, sourced from claude/seller-stats-panel-addendum.md's
//   documented build (computed live from orders/profiles, not a
//   marketing claim).
// - The listing-review gate itself (every listing manually checked before
//   it's visible to a buyer at all) is /listing-review's own subject —
//   linked rather than restated in full here.
export const metadata: Metadata = {
  title: "How to Verify Revenue and Traffic Before Buying a Website | Durqo",
  description:
    "Where to find real proof of income, live and manual Google Analytics data, Search Console/SEMrush/Ahrefs figures, and the seller's own verification status on a Durqo listing.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "How to Verify Revenue and Traffic Before Buying a Website",
    description:
      "Where to find real proof of income, real traffic data, and the seller's own verification status on a Durqo listing.",
    url: "https://www.durqo.com/verify-before-buying",
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Verify Revenue and Traffic Before Buying a Website",
    description:
      "Where to find real proof of income, real traffic data, and the seller's own verification status on a Durqo listing.",
  },
  alternates: { canonical: "https://www.durqo.com/verify-before-buying" },
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

const KEY_FACTS = [
  { icon: ShieldCheck, label: "Every listing already passed a manual review before you ever see it" },
  { icon: FileCheck, label: "Proof of Income is shown as real images, not just a typed-in number" },
  { icon: TrendingUp, label: "Traffic data comes with screenshots, or a live, auto-updating GA connection" },
  { icon: MailCheck, label: "The seller's own verification status is shown separately, right on the listing" },
];

const DATA_SECTIONS = [
  {
    icon: TrendingUp,
    title: "Google Analytics Data",
    body: "Total Users, New Users, Total Page Views and Avg. Engagement Time - either a live, auto-updating panel the seller connected by OAuth, or self-reported numbers with proof screenshots.",
  },
  {
    icon: Search,
    title: "Google Search Console Data",
    body: "Total Clicks, Total Impressions, Indexed and Non-Indexed Pages, and Average CTR, over the last 12 months, with proof screenshots.",
  },
  {
    icon: Radar,
    title: "SEMrush Data",
    body: "Authority Score, Total Traffic, Total Keywords, Top 10 Keywords and Total Backlinks, with proof screenshots.",
  },
  {
    icon: Link2,
    title: "Ahrefs Data",
    body: "DR Rating, UR Rating, Referring Domains, Total Keywords and Total Backlinks, with proof screenshots.",
  },
] as const;

export default function VerifyBeforeBuyingPage() {
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-rule bg-brand-strong py-16 sm:py-20 lg:py-24">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
          aria-hidden
        />
        <Container className="relative">
          <Inner>
            <div className="mx-auto max-w-[66ch] text-center">
              <DashEyebrow onDark center>
                Before you buy
              </DashEyebrow>
              <h1 className="text-4xl leading-[1.1] text-white sm:text-5xl">
                Don&rsquo;t just trust the numbers. <span className="text-brand">Check them.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-[56ch] text-lg leading-relaxed text-white/70">
                Every listing has already been through Durqo&rsquo;s own review - but the evidence behind the
                revenue and traffic claims is right there on the listing for you to look at yourself.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button href="/buy" size="lg">
                  Browse listings
                  <ArrowRight size={16} />
                </Button>
                <Button href="/listing-review" variant="on-dark" size="lg">
                  How listings are reviewed
                </Button>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* KEY FACTS STRIP */}
      <section className="border-b border-rule bg-paper-sunk py-10 sm:py-12">
        <Container>
          <Inner>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {KEY_FACTS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3.5 rounded-xl border border-rule bg-paper-raised p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-strong">
                    <Icon size={19} />
                  </span>
                  <span className="text-sm font-medium leading-snug text-ink">{label}</span>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* PROOF OF INCOME */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="flex items-start gap-5 rounded-xl border border-rule bg-paper-raised p-6 sm:p-8">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                <FileCheck size={19} />
              </span>
              <div>
                <DashEyebrow>Start here</DashEyebrow>
                <h2 className="text-2xl sm:text-3xl">Proof of Income, month by month.</h2>
                <p className="mt-3 max-w-[70ch] text-[0.95rem] leading-relaxed text-ink-soft">
                  Look for the 12-month income history on the listing itself - real figures for each month, plus
                  images the seller uploaded as evidence: bank statements, payment processor dashboards and similar.
                  It only appears once at least one month has a real number behind it, so an empty section is a
                  signal on its own.
                </p>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* TRAFFIC & SEO DATA */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[64ch]">
              <DashEyebrow>Traffic &amp; SEO data</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Four sources, each with its own screenshots.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                For categories where traffic data applies, up to four sections can appear - each one only shows
                up when the seller actually submitted numbers for it.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {DATA_SECTIONS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-xl border border-rule bg-paper-raised p-6">
                  <span className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <Icon size={19} />
                  </span>
                  <h4 className="text-base font-semibold text-ink">{title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-rule bg-paper p-5">
              <ImageIcon size={18} className="mt-0.5 shrink-0 text-ink-faint" />
              <p className="text-sm leading-relaxed text-ink-soft">
                Every one of these cards has a proof-screenshot button - open it to see the actual dashboard the
                numbers were taken from, not just the typed-in totals.
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      {/* LIVE VS MANUAL GA */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-8 max-w-[64ch]">
              <DashEyebrow>Two ways Analytics can show up</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">A live connection, or a reviewed screenshot.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                A listing never shows both at once for the same thing - whichever a seller has, that&rsquo;s
                what you&rsquo;ll see.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-rule bg-paper-raised p-6 sm:p-8">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                  <TrendingUp size={19} />
                </span>
                <h4 className="text-base font-semibold text-ink">A live, connected panel</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  Some sellers connect their actual Google Analytics property. You get a real, auto-updating panel
                  with its own 7-day / 30-day / 90-day / 12-month / custom date range picker - pull whatever
                  window you want, live.
                </p>
              </div>
              <div className="rounded-xl border border-rule bg-paper-raised p-6 sm:p-8">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                  <ShieldCheck size={19} />
                </span>
                <h4 className="text-base font-semibold text-ink">Self-reported, with a review tag</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  Otherwise you&rsquo;ll see the seller&rsquo;s own numbers plus screenshots. If a &ldquo;Reviewed by
                  Durqo&rdquo; tag appears on that card - or a &ldquo;Google Analytics Verified&rdquo; badge up
                  by the title - an admin actually logged into the real property and checked it against what was
                  submitted.
                </p>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* TWO BADGES SPOTLIGHT */}
      <section className="border-b border-rule bg-brand-soft py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mx-auto max-w-[820px] rounded-2xl border border-rule bg-paper-raised p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-10">
              <div className="mx-auto max-w-[600px] text-center">
                <DashEyebrow center>Two different badges</DashEyebrow>
                <h2 className="text-2xl font-semibold text-ink sm:text-3xl">They don&rsquo;t mean the same thing.</h2>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-rule bg-paper-sunk p-6">
                  <CheckCircle2 size={20} className="mb-2 text-brand-strong" />
                  <h4 className="text-base font-semibold text-ink">&ldquo;Verified&rdquo;</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    The listing itself cleared Durqo&rsquo;s review and is live on the marketplace.{" "}
                    <a href="/listing-review" className="font-semibold text-brand-strong hover:underline">
                      See what that review covers →
                    </a>
                  </p>
                </div>
                <div className="rounded-xl border border-rule bg-paper-sunk p-6">
                  <TrendingUp size={20} className="mb-2 text-brand-strong" />
                  <h4 className="text-base font-semibold text-ink">&ldquo;Google Analytics Verified&rdquo;</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    A separate, specific signal - an admin actually signed into the seller&rsquo;s real GA
                    property and confirmed the submitted numbers hold up.
                  </p>
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* SELLER CARD */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[64ch]">
              <DashEyebrow>Check who you&rsquo;re buying from</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">The seller card, right on the listing.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                A business can be legitimate and its seller still unverified, or vice versa - that&rsquo;s why
                these are shown as separate lines, not folded into one badge.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-rule bg-paper-raised p-5">
                <ShieldCheck size={18} className="mb-2 text-brand-strong" />
                <p className="text-sm font-semibold text-ink">Identity verification</p>
                <p className="mt-1 text-xs text-ink-faint">&ldquo;Verified passport/national ID/driving licence&rdquo;, or not yet verified.</p>
              </div>
              <div className="rounded-xl border border-rule bg-paper-raised p-5">
                <MailCheck size={18} className="mb-2 text-brand-strong" />
                <p className="text-sm font-semibold text-ink">Email verification</p>
                <p className="mt-1 text-xs text-ink-faint">Whether the seller&rsquo;s own email address has been confirmed.</p>
              </div>
              <div className="rounded-xl border border-rule bg-paper-raised p-5">
                <Store size={18} className="mb-2 text-brand-strong" />
                <p className="text-sm font-semibold text-ink">Active listings</p>
                <p className="mt-1 text-xs text-ink-faint">How many other businesses this seller currently has live.</p>
              </div>
              <div className="rounded-xl border border-rule bg-paper-raised p-5">
                <TrendingUp size={18} className="mb-2 text-brand-strong" />
                <p className="text-sm font-semibold text-ink">Completed sales</p>
                <p className="mt-1 text-xs text-ink-faint">A real count, plus lifetime dollar total once they&rsquo;ve made a sale - and how long they&rsquo;ve been a member.</p>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* WHAT AN EMPTY SECTION MEANS */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="flex items-start gap-3 rounded-xl border border-rule bg-paper-raised p-5">
              <Info size={18} className="mt-0.5 shrink-0 text-ink-faint" />
              <p className="text-sm leading-relaxed text-ink-soft">
                Every section above only renders when the seller actually submitted something for it - there&rsquo;s
                no placeholder or blank card standing in for missing data. If a Search Console or Ahrefs section is
                simply absent from a listing, that data was never submitted, not hidden.
              </p>
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
                  <FileCheck size={20} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-ink sm:text-2xl">Ready to look at some real listings?</h2>
                  <p className="mt-1 max-w-[46ch] text-sm text-ink-soft">
                    See the Proof of Income and traffic data for yourself on any published business.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/buy" size="lg">
                  Browse listings
                  <ArrowRight size={16} />
                </Button>
                <Button href="/how-to-buy" variant="secondary" size="lg">
                  How to buy
                </Button>
              </div>
            </div>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
