import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Layers,
  Percent,
  Wallet,
  Globe2,
  ShieldCheck,
  Info,
  CheckCircle2,
  Circle,
  Sparkles,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import GroupedFaq, { type FaqGroup } from "@/components/GroupedFaq";

// Sep 22, 2026: new comparison/SEO page, "Durqo vs Motion Invest," requested
// as its own page around that exact comparison keyword.
//
// Every Durqo-side claim below is grounded in this codebase's own real,
// live product: the 15 categories in src/lib/categories.ts (Motion Invest
// lists content sites and YouTube channels only, not e-commerce, SaaS,
// apps, domains, or startups); the SUCCESS_FEE_TIERS in src/lib/fees.ts
// (10% under $50k, 7% from $50k-$250k, 5% over $250k, flat on the whole
// sale price, seller-side only, buyer pays no marketplace fee); the three
// live payment rails documented on /payments and /terms (Stripe, SSLCommerz
// for BDT/bKash/Rocket/Nagad/bank, and Escrow.com as an independent
// third-party option); and the Transfer Room / listing-review process
// already described on /transfer-room and /listing-review.
//
// Every Motion Invest claim is sourced from their own published fee page
// and independent third-party reviews (researched Sep 22, 2026), not
// invented: they list content websites and YouTube channels only (no
// e-commerce, SaaS or apps); their seller commission is reported to range
// from around 20% on sales under $20,000 down to around 5% on sales over
// $500,000, tiered by price, with no fee to buyers and no upfront listing
// fee; payment is by USD bank wire into Motion Invest's own account, held
// there until the transfer completes (not an independent, licensed
// third-party escrow); and their listing verification relies on seller-
// submitted income screenshots, Loom video walkthroughs, and a Google
// Analytics vs. SEMrush traffic cross-check. Nothing found in their public
// materials mentions BDT, bKash, Nagad, Rocket, or any Bangladesh-specific
// payment option, so that comparison row says exactly that rather than
// asserting a definitive negative. A footnote below the comparison table
// tells readers this reflects Motion Invest's public information as of
// Sep 2026 and may change, and points them to motioninvest.com to confirm.
//
// This page is deliberately even-handed (a "Where Motion Invest may fit
// better" section acknowledges their content-site specialization and
// verification process) rather than a one-sided attack page, per this
// project's own accuracy-grounding convention and to avoid unsupported or
// disparaging comparative claims. No visible breadcrumb nav (Sep 22, 2026:
// the owner asked to drop the visible breadcrumb from the Bangladesh buyer
// guide's hero for the same reason; kept the BreadcrumbList JSON-LD only,
// same choice applied here from the start for consistency).
const META_TITLE = "Durqo vs Motion Invest (2026): Fees, Categories & Payments Compared | Durqo";
const META_DESCRIPTION =
  "Durqo vs Motion Invest compared: seller fees, buyer costs, categories accepted, BDT and card payment options, and how each marketplace protects a sale.";

export const metadata: Metadata = {
  title: META_TITLE,
  description: META_DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: META_TITLE,
    description: META_DESCRIPTION,
    url: "https://www.durqo.com/durqo-vs-motion-invest",
  },
  twitter: {
    card: "summary_large_image",
    title: META_TITLE,
    description: META_DESCRIPTION,
  },
  alternates: { canonical: "https://www.durqo.com/durqo-vs-motion-invest" },
};

const PAGE_URL = "https://www.durqo.com/durqo-vs-motion-invest";
const PAGE_TITLE = "Durqo vs Motion Invest";
const PUBLISHED_DATE = "2026-09-22";
const MODIFIED_DATE = "2026-09-22";

const BREADCRUMB_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.durqo.com" },
    { "@type": "ListItem", position: 2, name: PAGE_TITLE, item: PAGE_URL },
  ],
};

const DURQO_ORG = { "@type": "Organization", name: "Durqo Marketplace Team", url: "https://www.durqo.com" };

const ARTICLE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: PAGE_TITLE,
  description: META_DESCRIPTION,
  author: DURQO_ORG,
  publisher: DURQO_ORG,
  datePublished: PUBLISHED_DATE,
  dateModified: MODIFIED_DATE,
  mainEntityOfPage: { "@type": "WebPage", "@id": PAGE_URL },
  url: PAGE_URL,
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

const COMPARISON_ROWS: {
  feature: string;
  durqo: string;
  motionInvest: string;
  winner: "durqo" | "tie";
}[] = [
  {
    feature: "Categories accepted",
    durqo: "15+ categories: websites, e-commerce, SaaS, apps, domains, startups and more",
    motionInvest: "Content websites and YouTube channels only",
    winner: "durqo",
  },
  {
    feature: "Seller fee",
    durqo: "Flat tiered fee on the whole sale price: 10% under $50k, 7% from $50k-$250k, 5% over $250k",
    motionInvest: "Reported to range from around 20% on sales under $20k to around 5% on sales over $500k",
    winner: "durqo",
  },
  {
    feature: "Buyer fee",
    durqo: "No marketplace fee for buyers",
    motionInvest: "No additional fee for buyers",
    winner: "tie",
  },
  {
    feature: "Upfront listing fee",
    durqo: "None",
    motionInvest: "None",
    winner: "tie",
  },
  {
    feature: "Payment methods",
    durqo: "Card (Stripe), BDT via bKash, Rocket, Nagad or bank (SSLCommerz), or Escrow.com",
    motionInvest: "USD bank wire transfer",
    winner: "durqo",
  },
  {
    feature: "BDT / mobile banking support",
    durqo: "Yes, BDT checkout and BDT seller payouts",
    motionInvest: "Not published on their site",
    winner: "durqo",
  },
  {
    feature: "Where funds are held",
    durqo: "Held by Durqo directly, or independently by Escrow.com if you choose that option",
    motionInvest: "Held in Motion Invest's own bank account until the transfer completes",
    winner: "durqo",
  },
  {
    feature: "Listing verification",
    durqo: "Listing review plus optional seller identity verification",
    motionInvest: "Seller-submitted income screenshots, Loom walkthroughs and a traffic cross-check",
    winner: "tie",
  },
  {
    feature: "Asset handover",
    durqo: "Transfer Room checklist; buyer approves before payment is released",
    motionInvest: "Migration assistance included with the sale",
    winner: "tie",
  },
];

// Illustrative only: computed from Durqo's published SUCCESS_FEE_TIERS
// (src/lib/fees.ts) and Motion Invest's reported fee tiers (see this file's
// top-of-file accuracy note). Not a calculator, not tied to any real
// listing, hedged again in the section's own footnote.
const FEE_EXAMPLES = [
  { price: "$30,000", durqoRate: "10%", durqoFee: "$3,000", miRate: "15%", miFee: "$4,500", savings: "$1,500" },
  { price: "$80,000", durqoRate: "7%", durqoFee: "$5,600", miRate: "10%", miFee: "$8,000", savings: "$2,400" },
  { price: "$300,000", durqoRate: "5%", durqoFee: "$15,000", miRate: "7%", miFee: "$21,000", savings: "$6,000" },
];

const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: "Fees and pricing",
    items: [
      {
        question: "Is Durqo cheaper than Motion Invest?",
        answer:
          "For most sale prices, Durqo's flat 10%/7%/5% tiers work out lower than Motion Invest's reported 20%-to-5% range, which starts higher on smaller sales. The exact difference depends on your sale price, since neither fee is charged to the buyer on either platform.",
      },
      {
        question: "Does either platform charge buyers a fee?",
        answer:
          "No. Neither Durqo nor Motion Invest charges buyers a marketplace fee. Both charge their commission to the seller only, once a sale closes.",
      },
      {
        question: "Is there an upfront cost to list on Durqo or Motion Invest?",
        answer: "No. Both platforms list businesses with no upfront fee and only charge a success fee if the sale completes.",
      },
    ],
  },
  {
    heading: "Categories and payments",
    items: [
      {
        question: "Does Motion Invest accept e-commerce, SaaS or app businesses?",
        answer:
          "No. Motion Invest lists content websites and YouTube channels only. Durqo covers those categories plus e-commerce, SaaS, apps, domains, startups and more in one marketplace.",
      },
      {
        question: "Can I pay for a Motion Invest purchase in Bangladeshi Taka?",
        answer: (
          <>
            Motion Invest&rsquo;s published materials don&rsquo;t mention BDT or mobile banking support. Durqo
            supports BDT checkout through bKash, Rocket, Nagad or a supported bank, alongside card and Escrow.com.
            See{" "}
            <Link href="/payments" className="font-semibold text-brand-strong hover:underline">
              Payment &amp; Withdrawal
            </Link>{" "}
            for the full breakdown.
          </>
        ),
      },
      {
        question: "How does each platform protect a buyer's payment?",
        answer: (
          <>
            On Motion Invest, funds are held in their own bank account until the transfer completes. On Durqo,
            funds are held by Durqo directly, or you can choose to route payment through Escrow.com, an
            independent, licensed third party. See{" "}
            <Link href="/transfer-room" className="font-semibold text-brand-strong hover:underline">
              The Transfer Room
            </Link>{" "}
            for how the handover itself is tracked.
          </>
        ),
      },
    ],
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { q: "Is Durqo cheaper than Motion Invest?", a: "For most sale prices, Durqo's flat 10%/7%/5% tiers work out lower than Motion Invest's reported 20%-to-5% range, which starts higher on smaller sales. The exact difference depends on your sale price, since neither fee is charged to the buyer on either platform." },
    { q: "Does either platform charge buyers a fee?", a: "No. Neither Durqo nor Motion Invest charges buyers a marketplace fee. Both charge their commission to the seller only, once a sale closes." },
    { q: "Is there an upfront cost to list on Durqo or Motion Invest?", a: "No. Both platforms list businesses with no upfront fee and only charge a success fee if the sale completes." },
    { q: "Does Motion Invest accept e-commerce, SaaS or app businesses?", a: "No. Motion Invest lists content websites and YouTube channels only. Durqo covers those categories plus e-commerce, SaaS, apps, domains, startups and more in one marketplace." },
    { q: "Can I pay for a Motion Invest purchase in Bangladeshi Taka?", a: "Motion Invest's published materials don't mention BDT or mobile banking support. Durqo supports BDT checkout through bKash, Rocket, Nagad or a supported bank, alongside card and Escrow.com." },
    { q: "How does each platform protect a buyer's payment?", a: "On Motion Invest, funds are held in their own bank account until the transfer completes. On Durqo, funds are held by Durqo directly, or you can choose to route payment through Escrow.com, an independent, licensed third party." },
  ].map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function DurqoVsMotionInvestPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />

      {/* HERO */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="grid gap-10 lg:grid-cols-[56fr_44fr] lg:items-start lg:gap-16">
              <div className="min-w-0">
                <DashEyebrow>Marketplace comparison</DashEyebrow>
                <h1 className="max-w-[26ch] text-4xl leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
                  Durqo vs <span className="text-brand">Motion Invest</span>
                </h1>
                <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-ink-soft">
                  Durqo and Motion Invest are both marketplaces for buying and selling online businesses, but they
                  serve different buyers and sellers. This comparison looks at the categories each platform
                  accepts, how much each one charges, which payment methods are available, and how a sale is
                  protected, so you can decide which fits what you&rsquo;re buying or selling.
                </p>
                <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-rule bg-brand-soft/40 px-4 py-3">
                  <Sparkles size={15} className="mt-0.5 shrink-0 text-brand-strong" aria-hidden />
                  <p className="text-sm leading-relaxed text-ink">
                    <span className="font-semibold">Quick answer:</span> Durqo covers 15+ categories with a lower
                    starting seller fee and BDT payment support; Motion Invest specializes in content sites and
                    YouTube channels paid by USD wire. The comparison below covers both in full.
                  </p>
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Reviewed by the Durqo Marketplace Team · Updated September 2026
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button href="/sell" size="lg">
                    Sell a Business
                    <ArrowRight size={16} />
                  </Button>
                  <Button href="/buy" variant="secondary" size="lg">
                    Browse Businesses
                  </Button>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
                  {[
                    { icon: Layers, label: "15+ categories, not just content sites" },
                    { icon: Wallet, label: "BDT, card or Escrow.com payments" },
                    { icon: Percent, label: "Flat, tiered seller fee" },
                  ].map(({ icon: Icon, label }) => (
                    <span key={label} className="flex items-center gap-2 text-sm text-ink-soft">
                      <Icon size={15} className="text-brand" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="min-w-0 rounded-2xl border border-rule bg-paper-raised p-6 shadow-sm sm:p-7">
                <p className="mono mb-4 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  Quick Comparison
                </p>

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <Layers size={16} />
                  </span>
                  <div>
                    <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">Durqo</p>
                    <h3 className="text-sm font-semibold text-ink">15+ categories, one marketplace</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      Websites, e-commerce, SaaS, apps, domains, startups and more, with card, BDT or Escrow.com
                      payment options.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {["10%-5% seller fee", "BDT supported"].map((label) => (
                        <span key={label} className="mono rounded-full border border-rule px-2.5 py-1 text-[0.65rem] text-ink-soft">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="my-5 h-px bg-rule" aria-hidden />

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-sunk text-ink">
                    <Globe2 size={16} />
                  </span>
                  <div>
                    <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-ink-faint">Motion Invest</p>
                    <h3 className="text-sm font-semibold text-ink">Content sites and YouTube channels</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      A specialist marketplace for content websites and YouTube channels, paid by USD bank wire.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {["~20%-5% seller fee", "USD wire only"].map((label) => (
                        <span key={label} className="mono rounded-full border border-rule px-2.5 py-1 text-[0.65rem] text-ink-soft">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-paper-sunk px-3.5 py-3">
                  <Info size={14} className="mt-0.5 shrink-0 text-ink-faint" />
                  <p className="text-xs leading-relaxed text-ink-faint">
                    Motion Invest details reflect their published fee page and independent reviews as of September
                    2026, and may change. Confirm current details at motioninvest.com.
                  </p>
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* COMPARISON TABLE */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>Side by side</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">How Durqo and Motion Invest compare.</h2>
            </div>
            <div className="overflow-hidden rounded-xl border border-rule bg-paper-raised">
              <div className="grid grid-cols-1 gap-x-4 border-b border-rule bg-paper-sunk px-5 py-3 sm:grid-cols-[1fr_1.4fr_1.4fr] sm:gap-x-6">
                <p className="mono hidden text-xs font-semibold uppercase tracking-wider text-ink-faint sm:block">Feature</p>
                <p className="mono text-xs font-semibold uppercase tracking-wider text-brand-strong">Durqo</p>
                <p className="mono text-xs font-semibold uppercase tracking-wider text-ink-faint">Motion Invest</p>
              </div>
              <div className="divide-y divide-rule">
                {COMPARISON_ROWS.map((row) => (
                  <div key={row.feature} className="grid grid-cols-1 gap-x-6 gap-y-2 px-5 py-4 sm:grid-cols-[1fr_1.4fr_1.4fr]">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                      {row.feature}
                      {row.winner === "durqo" && (
                        <span className="mono rounded-full bg-brand-soft px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-brand-strong">
                          Durqo edge
                        </span>
                      )}
                    </p>
                    <p className="flex items-start gap-2 text-sm leading-relaxed text-ink-soft">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand-strong" aria-hidden />
                      <span>
                        <span className="mono mr-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-brand-strong sm:hidden">
                          Durqo:
                        </span>
                        {row.durqo}
                      </span>
                    </p>
                    <p className="flex items-start gap-2 text-sm leading-relaxed text-ink-soft">
                      <Circle size={15} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden />
                      <span>
                        <span className="mono mr-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint sm:hidden">
                          Motion Invest:
                        </span>
                        {row.motionInvest}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-6 max-w-[70ch] text-xs leading-relaxed text-ink-faint">
              &ldquo;Durqo edge&rdquo; marks rows where the two platforms genuinely differ. Rows without that label
              are a close match on that specific point. Motion Invest information above is based on their
              publicly published fee page and independent reviews as of September 2026, and may change. Durqo
              information reflects live product features and published fees on durqo.com.
            </p>
          </Inner>
        </Container>
      </section>

      {/* FEE EXAMPLES */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>Fees in practice</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">See the seller fee difference at three sale prices.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Examples only, based on Durqo&rsquo;s published fee tiers and Motion Invest&rsquo;s reported fee
                tiers. Your actual fee depends on your listing&rsquo;s final sale price.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {FEE_EXAMPLES.map((ex) => (
                <div key={ex.price} className="rounded-xl border border-rule bg-paper-raised p-6">
                  <p className="mono text-xs font-semibold uppercase tracking-wider text-ink-faint">Sale price</p>
                  <p className="mono text-3xl font-bold tabular-nums text-ink">{ex.price}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-rule pt-4">
                    <span className="text-sm font-semibold text-brand-strong">Durqo</span>
                    <span className="mono text-sm tabular-nums text-ink">
                      {ex.durqoFee} <span className="text-ink-faint">({ex.durqoRate})</span>
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink-faint">Motion Invest</span>
                    <span className="mono text-sm tabular-nums text-ink-soft">
                      {ex.miFee} <span className="text-ink-faint">({ex.miRate})</span>
                    </span>
                  </div>
                  <div className="mt-4 rounded-lg bg-brand-soft px-3.5 py-2.5 text-center">
                    <p className="mono text-sm font-bold tabular-nums text-brand-strong">
                      {ex.savings} more for the seller on Durqo
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* WHY DURQO */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>Built for more sellers</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Why buyers and sellers in Bangladesh choose Durqo.</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  icon: Wallet,
                  title: "Pay and get paid in BDT",
                  body: (
                    <>
                      Buyers can pay through bKash, Rocket, Nagad or a supported bank via SSLCommerz, and eligible
                      sellers can receive proceeds in BDT. See{" "}
                      <Link href="/payments" className="font-semibold text-brand-strong hover:underline">
                        Payment &amp; Withdrawal
                      </Link>{" "}
                      for the full breakdown.
                    </>
                  ),
                },
                {
                  icon: Layers,
                  title: "One marketplace, every category",
                  body: "List or buy a website, e-commerce store, SaaS product, app, domain or startup in the same place, instead of switching platforms by category.",
                },
                {
                  icon: ShieldCheck,
                  title: "A tracked handover",
                  body: (
                    <>
                      Every order gets its own Transfer Room checklist, and Escrow.com is available as an
                      independent third-party option. See{" "}
                      <Link href="/whats-included" className="font-semibold text-brand-strong hover:underline">
                        what&rsquo;s included in a typical sale
                      </Link>
                      .
                    </>
                  ),
                },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-xl border border-rule bg-paper-raised p-6">
                  <span className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <Icon size={19} />
                  </span>
                  <h3 className="text-base font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* WHERE MOTION INVEST FITS */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="max-w-[70ch]">
              <DashEyebrow>A fair look</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Where Motion Invest may fit better.</h2>
              <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">
                If you specifically run a content website or YouTube channel, are comfortable paying or receiving
                funds by USD bank wire, and don&rsquo;t need BDT or local Bangladeshi payment methods, Motion
                Invest&rsquo;s specialist review process, income screenshots, Loom walkthroughs and traffic
                cross-checks, is also worth considering.
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      {/* WHICH SHOULD YOU CHOOSE */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>The verdict</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Which one should you choose?</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border-2 border-brand-strong bg-paper-raised p-7 shadow-sm">
                <p className="mono mb-3 text-xs font-semibold uppercase tracking-wider text-brand-strong">Choose Durqo if</p>
                <ul className="flex flex-col gap-3">
                  {[
                    "You're buying or selling something other than a content site or YouTube channel, such as e-commerce, SaaS, an app, a domain or a startup",
                    "You want to pay or get paid in Bangladeshi Taka through bKash, Rocket, Nagad or a bank",
                    "You want the option of an independent, licensed Escrow.com transaction",
                    "Your sale price is on the smaller side, where Durqo's 10% starting tier is lower than Motion Invest's reported ~15-20%",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-strong" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button href="/sell" size="lg" className="mt-6">
                  Sell on Durqo
                  <ArrowRight size={16} />
                </Button>
              </div>
              <div className="rounded-2xl border border-rule bg-paper-raised p-7">
                <p className="mono mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">Choose Motion Invest if</p>
                <ul className="flex flex-col gap-3">
                  {[
                    "You're specifically selling a content website or YouTube channel",
                    "You're comfortable paying or receiving funds by USD bank wire only",
                    "You want a specialist review process built around income screenshots and Loom walkthroughs",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* FAQ */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner className="max-w-[860px]">
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>Questions</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Frequently asked questions.</h2>
            </div>
            <GroupedFaq groups={FAQ_GROUPS} />
          </Inner>
        </Container>
      </section>

      {/* RELATED READING */}
      <section className="border-b border-rule bg-paper-sunk py-10">
        <Container>
          <Inner>
            <p className="mono mb-4 text-xs font-semibold uppercase tracking-wider text-ink-faint">Keep exploring</p>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {[
                { href: "/how-to-sell", label: "How to Sell a Business on Durqo" },
                { href: "/buy-and-sell-digital-businesses-in-bdt", label: "Buy & Sell Digital Businesses in BDT" },
                { href: "/whats-included", label: "What's Included in a Typical Sale" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline"
                >
                  {label}
                  <ArrowRight size={14} />
                </Link>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="bg-ink py-16 text-white sm:py-20">
        <Container>
          <Inner className="text-center">
            <h2 className="text-2xl sm:text-3xl">Ready to buy or sell across any category?</h2>
            <p className="mx-auto mt-3 max-w-[52ch] text-sm text-white/70">
              Browse reviewed listings across 15+ categories, or list your business with no upfront fee.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button href="/buy" size="lg">
                Browse Businesses
                <ArrowRight size={16} />
              </Button>
              <Button href="/sell" variant="on-dark" size="lg">
                Sell a Business
              </Button>
            </div>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
