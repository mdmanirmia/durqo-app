import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  BarChart3,
  Layers,
  ShieldCheck,
  Info,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import GroupedFaq, { type FaqGroup } from "@/components/GroupedFaq";

// Sep 22, 2026: new keyword-targeted guide page, "How Much Is a Website
// Worth in Bangladesh?" This is an educational valuation guide, not a
// pricing tool or an appraisal service Durqo offers: Durqo doesn't run a
// valuation calculator or set a seller's asking price for them (sellers
// set their own price when they list, same as every other page on this
// site describes), so this page explains the general profit-multiple
// approach buyers and sellers commonly use industry-wide (the same
// approach described in public marketplace and business-broker content,
// e.g. Flippa, Empire Flippers, FE International's own published guides),
// clearly hedged as a general rule of thumb rather than a Durqo-specific
// formula or guarantee. The illustrative multiple ranges and the worked
// example are explicitly labeled illustrative only, the same hedging
// pattern already used for FEE_EXAMPLES on /durqo-vs-motion-invest.
//
// Every Durqo-specific claim is grounded in real, live product: the
// Websites category's own Quick Statistics vocabulary (monthly income,
// monthly views, business age, authority score, articles posted, indexed
// pages) from src/lib/categories.ts, and the listing-review/verification
// process described on /listing-review and /verify-before-buying (Google
// Analytics, Search Console, SEMrush, Ahrefs data, and the GA Verified /
// Verified Seller badges). No specific valuation number, multiple or sale
// price attributed to any real business is invented anywhere on this page.
// No visible breadcrumb nav, matching this page's sibling BD guides.
const META_TITLE = "How Much Is a Website Worth in Bangladesh? Valuation Guide | Durqo";
const META_DESCRIPTION =
  "A plain-language guide to how website valuations work: the profit-multiple approach buyers and sellers use, the factors that move a multiple up or down, and how listing evidence supports your price.";

export const metadata: Metadata = {
  title: META_TITLE,
  description: META_DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: META_TITLE,
    description: META_DESCRIPTION,
    url: "https://www.durqo.com/how-much-is-a-website-worth-in-bangladesh",
  },
  twitter: { card: "summary_large_image", title: META_TITLE, description: META_DESCRIPTION },
  alternates: { canonical: "https://www.durqo.com/how-much-is-a-website-worth-in-bangladesh" },
};

const PAGE_URL = "https://www.durqo.com/how-much-is-a-website-worth-in-bangladesh";
const PAGE_TITLE = "How Much Is a Website Worth in Bangladesh?";
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

function DashEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mono mb-4 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
      <span className="h-px w-6 bg-brand" aria-hidden />
      {children}
    </p>
  );
}

function Inner({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1200px] ${className}`}>{children}</div>;
}

const VALUE_FACTORS = [
  {
    icon: TrendingUp,
    title: "Income stability and trend",
    body: "A steady or growing 12-month income history is generally worth more than the same average with a declining trend or one large, unrepeatable spike.",
    effect: "Higher, more consistent income supports a higher multiple.",
  },
  {
    icon: Layers,
    title: "Traffic and income diversification",
    body: "Traffic from several sources (organic search, direct, social, email) and income from more than one stream is generally considered less risky than depending entirely on one channel.",
    effect: "Diversified sources reduce buyer risk.",
  },
  {
    icon: BarChart3,
    title: "Domain age, authority and indexed pages",
    body: "An older domain with an established authority score and a healthy number of indexed pages is generally viewed as a more durable SEO asset than a newer, thinner site.",
    effect: "Stronger SEO fundamentals support a higher multiple.",
  },
  {
    icon: ShieldCheck,
    title: "How well the numbers are verified",
    body: "A listing backed by Google Analytics, Search Console, SEMrush or Ahrefs data, and clear revenue evidence, gives a buyer more confidence than self-reported figures alone.",
    effect: "Verified evidence supports the price a buyer is willing to pay.",
  },
  {
    icon: AlertTriangle,
    title: "Owner dependency and operating effort",
    body: "A business that runs with documented processes and light day-to-day involvement is generally easier for a new owner to take over than one that depends heavily on the current owner's personal skills or relationships.",
    effect: "Lower owner dependency supports a higher multiple.",
  },
];

const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: "Valuation basics",
    items: [
      {
        question: "Does Durqo tell me exactly what my website is worth?",
        answer: "No. Durqo doesn't run a valuation calculator or set your asking price. You decide your own price when you list, informed by your income history, the factors on this page, and what comparable listings in your category are asking on Durqo.",
      },
      {
        question: "What's the simplest way to estimate a starting price?",
        answer: "A common industry approach is to multiply your average monthly net profit by a multiple, then adjust that multiple up or down based on the factors on this page (income stability, traffic diversification, SEO strength, verification, and owner dependency). This is a general rule of thumb, not a guaranteed sale price.",
      },
      {
        question: "Is revenue or profit the better number to value?",
        answer: "Most valuation approaches for content and affiliate websites use net profit (revenue minus real operating costs), not gross revenue, since profit reflects what a buyer actually takes home.",
      },
    ],
  },
  {
    heading: "Improving your price",
    items: [
      {
        question: "How can I support a higher valuation before I list?",
        answer: (
          <>
            Connect Google Analytics and Search Console where possible, submit clear revenue evidence, and describe
            your traffic sources and operating routine in detail. See{" "}
            <Link href="/verify-before-buying" className="font-semibold text-brand-strong hover:underline">
              how buyers verify a listing&rsquo;s numbers
            </Link>{" "}
            to see exactly what they&rsquo;re looking for.
          </>
        ),
      },
      {
        question: "Does Durqo's listing review affect my valuation?",
        answer: (
          <>
            Listing review checks your submission for accuracy and completeness before it goes live, which supports
            buyer confidence, but it isn&rsquo;t an independent appraisal or a guarantee of your asking price. See{" "}
            <Link href="/listing-review" className="font-semibold text-brand-strong hover:underline">
              how listings are reviewed
            </Link>
            .
          </>
        ),
      },
      {
        question: "Can I change my asking price after I list?",
        answer: "You control your listing's price. If your figures change, or you don't see interest at your current price, you can update your listing to reflect it.",
      },
    ],
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { q: "Does Durqo tell me exactly what my website is worth?", a: "No. Durqo doesn't run a valuation calculator or set your asking price. You decide your own price when you list, informed by your income history, the factors on this page, and what comparable listings in your category are asking on Durqo." },
    { q: "What's the simplest way to estimate a starting price?", a: "A common industry approach is to multiply your average monthly net profit by a multiple, then adjust that multiple up or down based on income stability, traffic diversification, SEO strength, verification, and owner dependency. This is a general rule of thumb, not a guaranteed sale price." },
    { q: "Is revenue or profit the better number to value?", a: "Most valuation approaches for content and affiliate websites use net profit (revenue minus real operating costs), not gross revenue, since profit reflects what a buyer actually takes home." },
    { q: "How can I support a higher valuation before I list?", a: "Connect Google Analytics and Search Console where possible, submit clear revenue evidence, and describe your traffic sources and operating routine in detail." },
    { q: "Does Durqo's listing review affect my valuation?", a: "Listing review checks your submission for accuracy and completeness before it goes live, which supports buyer confidence, but it isn't an independent appraisal or a guarantee of your asking price." },
    { q: "Can I change my asking price after I list?", a: "You control your listing's price. If your figures change, or you don't see interest at your current price, you can update your listing to reflect it." },
  ].map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

export default function HowMuchIsAWebsiteWorthInBangladeshPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />

      {/* HERO */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="grid gap-10 lg:grid-cols-[56fr_44fr] lg:gap-16">
              <div className="min-w-0">
                <DashEyebrow>Valuation guide · Bangladesh</DashEyebrow>
                <h1 className="max-w-[26ch] text-4xl leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
                  How Much Is a Website Worth in <span className="text-brand">Bangladesh?</span>
                </h1>
                <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-ink-soft">
                  There&rsquo;s no single number. A website&rsquo;s value comes from its income, how stable and
                  diversified that income is, its SEO strength, and how well the numbers behind it can be verified.
                  This guide walks through how that value is typically estimated.
                </p>
                <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-rule bg-brand-soft/40 px-4 py-3">
                  <Sparkles size={15} className="mt-0.5 shrink-0 text-brand-strong" aria-hidden />
                  <p className="text-sm leading-relaxed text-ink">
                    <span className="font-semibold">Quick answer:</span> Most buyers value a website as a multiple of
                    its average monthly net profit, then adjust that multiple based on income stability, traffic
                    sources, SEO strength and how verified the numbers are.
                  </p>
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Reviewed by the Durqo Marketplace Team · Updated September 2026
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button href="/sell" size="lg">
                    List Your Website
                    <ArrowRight size={16} />
                  </Button>
                  <Button href="/buy/websites" variant="secondary" size="lg">
                    Compare Listed Websites
                  </Button>
                </div>
              </div>

              <div className="min-w-0 rounded-2xl border border-rule bg-paper-raised p-6 shadow-sm sm:p-7">
                <p className="mono mb-4 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  A Simple Example
                </p>
                <p className="text-xs leading-relaxed text-ink-faint">
                  Illustrative only, using a widely-cited industry rule of thumb, not a Durqo valuation or a
                  guaranteed sale price.
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-rule pt-4">
                  <span className="text-sm text-ink-soft">Average monthly net profit</span>
                  <span className="mono text-sm font-semibold tabular-nums text-ink">$1,000</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-ink-soft">Common multiple range</span>
                  <span className="mono text-sm font-semibold tabular-nums text-ink">24x&ndash;40x</span>
                </div>
                <div className="mt-4 rounded-lg bg-brand-soft px-3.5 py-3 text-center">
                  <p className="mono text-sm font-bold tabular-nums text-brand-strong">
                    Roughly $24,000&ndash;$40,000
                  </p>
                  <p className="mt-1 text-[0.7rem] text-brand-strong/80">Illustrative range only</p>
                </div>

                <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-paper-sunk px-3.5 py-3">
                  <Info size={14} className="mt-0.5 shrink-0 text-ink-faint" />
                  <p className="text-xs leading-relaxed text-ink-faint">
                    Actual sale prices vary widely based on buyer demand, growth trajectory, risk factors and how
                    well the listing&rsquo;s numbers are verified. This is not professional valuation advice.
                  </p>
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* THE APPROACH */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="max-w-[70ch]">
              <DashEyebrow>The common approach</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Profit multiplied by a risk-adjusted number.</h2>
              <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">
                Across online business marketplaces, the most commonly cited starting point is: average monthly net
                profit, multiplied by a number that reflects how risky or stable that income looks to a buyer. A
                site with steady, diversified, well-documented income typically sits toward the higher end of a
                category&rsquo;s typical multiple range; a site with a shrinking, unverified or single-source income
                typically sits toward the lower end. Multiples also vary by category: a subscription SaaS business
                with predictable recurring revenue is often valued differently from a content website earning
                mostly from display ads or affiliate commissions. This is a widely-used rule of thumb, not a formula
                Durqo applies to your listing or a guarantee of what a buyer will pay.
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      {/* VALUE FACTORS */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>What moves the multiple</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Five factors buyers actually weigh.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {VALUE_FACTORS.map(({ icon: Icon, title, body, effect }) => (
                <div key={title} className="rounded-xl border border-rule bg-paper-raised p-5">
                  <div className="flex items-start gap-3.5">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                      <Icon size={16} />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-ink">{title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{body}</p>
                    </div>
                  </div>
                  <p className="mono mt-3 border-t border-rule pt-3 text-[0.68rem] font-semibold uppercase tracking-wide text-brand-strong">
                    {effect}
                  </p>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* SUPPORTING YOUR PRICE */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>Backing up the number</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Evidence is what makes a price credible.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                A price is only as convincing as the evidence behind it. Before you set an asking price, line up:
              </p>
            </div>
            <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {[
                "Up to 12 months of revenue evidence, with supporting screenshots",
                "A connected Google Analytics property, where possible, for a live panel and a GA Verified badge",
                "Search Console, SEMrush or Ahrefs data, where available",
                "A clear description of your traffic sources and how the business is operated",
                "Seller identity verification, for a Verified Seller badge",
                "An honest account of any single-source dependency or declining trend",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-strong" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-[70ch] text-xs leading-relaxed text-ink-faint">
              Durqo&rsquo;s{" "}
              <Link href="/listing-review" className="font-semibold text-ink-soft hover:underline">
                listing review
              </Link>{" "}
              checks your submission for accuracy and completeness, which supports buyer confidence, but it is not
              an independent appraisal of your business or a guarantee of your asking price.
            </p>
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
                { href: "/how-to-sell-a-website-in-bangladesh", label: "How to Sell a Website in Bangladesh" },
                { href: "/verify-before-buying", label: "How to Verify Revenue and Traffic Before Buying" },
                { href: "/website-due-diligence-checklist-for-buyers", label: "Website Due Diligence Checklist for Buyers" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline">
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
            <h2 className="text-2xl sm:text-3xl">Ready to find out what buyers will offer?</h2>
            <p className="mx-auto mt-3 max-w-[52ch] text-sm text-white/70">
              List your website with clear evidence, and set the price you believe reflects its value.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button href="/sell" size="lg">
                List Your Website
                <ArrowRight size={16} />
              </Button>
              <Button href="/buy/websites" variant="on-dark" size="lg">
                Compare Listed Websites
              </Button>
            </div>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
