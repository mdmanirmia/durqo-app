import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FileSearch,
  Search,
  BadgeCheck,
  ShieldCheck,
  MessageSquare,
  Unlock,
  Globe2,
  Info,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import GroupedFaq, { type FaqGroup } from "@/components/GroupedFaq";

// Sep 22, 2026: new keyword-targeted guide page, "Website Due Diligence
// Checklist for Buyers." This page is a checklist-format companion to
// /verify-before-buying (which explains each verification signal in
// depth) and /how-to-buy-a-website-in-bangladesh (which walks through the
// whole buying flow) — this page's job is to give a buyer, for any
// category, a single scannable checklist to work through before paying,
// rather than duplicating either page's own full explanation.
//
// Every checklist item is grounded in real, live product features, not
// invented process:
//   - Financial/traffic evidence items (income evidence, Google Analytics
//     live panel vs. self-reported + screenshots, Search Console, SEMrush,
//     Ahrefs data) match /verify-before-buying's own DATA_SECTIONS content
//     exactly.
//   - "Google Analytics Verified" and "Reviewed by Durqo" are real,
//     distinct signals described on /verify-before-buying, not invented
//     badges.
//   - "Verified Seller" (identity verification) is a separate signal from
//     listing review, per /how-to-buy-a-website-in-bangladesh's own
//     CHECK_ITEMS content.
//   - The Comments thread, Transfer Room checklist, Escrow.com option and
//     Report an Issue flow match the same live features described across
//     this site's other buyer-facing guides.
// No visible breadcrumb nav, matching this page's sibling guides.
const META_TITLE = "Website Due Diligence Checklist for Buyers | Durqo";
const META_DESCRIPTION =
  "A practical due diligence checklist for buying a website or online business: what to verify in the numbers, the listing, the seller and the payment before you pay.";

export const metadata: Metadata = {
  title: META_TITLE,
  description: META_DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: META_TITLE,
    description: META_DESCRIPTION,
    url: "https://www.durqo.com/website-due-diligence-checklist-for-buyers",
  },
  twitter: { card: "summary_large_image", title: META_TITLE, description: META_DESCRIPTION },
  alternates: { canonical: "https://www.durqo.com/website-due-diligence-checklist-for-buyers" },
};

const PAGE_URL = "https://www.durqo.com/website-due-diligence-checklist-for-buyers";
const PAGE_TITLE = "Website Due Diligence Checklist for Buyers";
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

const CHECKLIST_GROUPS: {
  heading: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  bg: string;
  tint: string;
  items: string[];
}[] = [
  {
    heading: "Financial and traffic evidence",
    icon: FileSearch,
    bg: "bg-brand-soft",
    tint: "text-brand-strong",
    items: [
      "Up to 12 months of revenue evidence, ideally with supporting screenshots rather than one typed-in number",
      "Whether Google Analytics is a live, auto-updating panel or self-reported numbers with proof screenshots",
      "Google Search Console data: total clicks, impressions, indexed pages and average CTR",
      "SEMrush or Ahrefs data, where available: authority score, backlinks, keyword rankings",
      "Whether the income trend is stable, growing, or declining over the reported period",
    ],
  },
  {
    heading: "Listing and seller trust signals",
    icon: BadgeCheck,
    bg: "bg-gold-soft",
    tint: "text-[#92730F]",
    items: [
      "A \"Google Analytics Verified\" badge, meaning Durqo checked a connected property against the listing's claims",
      "A \"Reviewed by Durqo\" tag on individual data cards, a separate signal from general listing review",
      "A Verified Seller badge, meaning the seller's identity document was reviewed (separate from listing review)",
      "The listing's Comments thread, for questions other buyers already asked and how the seller answered",
      "Domain age, authority score and indexed-page counts, where shown for the category",
    ],
  },
  {
    heading: "Operational and legal readiness",
    icon: Search,
    bg: "bg-sky-soft",
    tint: "text-sky",
    items: [
      "A clear description of how the business actually runs day to day, not just its numbers",
      "Which assets are explicitly included: domain, hosting, source code, content, social accounts, SOPs",
      "Whether any included account (advertising, affiliate, merchant) is actually transferable under that platform's own terms",
      "Any single-source dependency: one traffic channel, one client, one supplier, or one key relationship",
      "Agreed post-sale support, if any, and for how long",
    ],
  },
  {
    heading: "Payment and handover protection",
    icon: ShieldCheck,
    bg: "bg-paper-sunk",
    tint: "text-ink",
    items: [
      "Which payment method applies to this listing: card via Stripe, BDT via SSLCommerz, or Escrow.com",
      "That your payment is held (by Durqo, or independently by Escrow.com) until you approve the transfer",
      "That your order gets its own Transfer Room checklist to track each asset as it's handed over",
      "How to report an issue if a transferred asset doesn't match what was agreed, before approving",
    ],
  },
];

const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: "Using this checklist",
    items: [
      {
        question: "Does completing this checklist guarantee a safe purchase?",
        answer: "No. This checklist covers the signals available on a Durqo listing, but no acquisition is completely risk-free. It's a starting point for your own due diligence, not a substitute for it.",
      },
      {
        question: "Do all listings have every item on this checklist?",
        answer: "No. Available evidence varies by category and by what the individual seller has submitted or connected. Categories without SEO data, like YouTube Channels or Android & iOS Apps, won't show Google Analytics or Search Console sections at all.",
      },
      {
        question: "What's the difference between a Verified Seller badge and Google Analytics Verified?",
        answer: "Verified Seller means the seller's identity document was reviewed. Google Analytics Verified means an admin checked a connected GA property against the listing's own claims. They're separate, independent signals.",
      },
    ],
  },
  {
    heading: "If something doesn't check out",
    items: [
      {
        question: "What if a seller won't answer my questions?",
        answer: "Ask in the listing's Comments thread, where the seller's answers stay visible to every future buyer. A seller who avoids specific, direct questions is itself a signal worth weighing.",
      },
      {
        question: "What if the business doesn't match what was described after I pay?",
        answer: (
          <>
            Don&rsquo;t approve the transfer. Report the issue instead, and your payment stays held while Durqo
            reviews it. See{" "}
            <Link href="/report-an-issue" className="font-semibold text-brand-strong hover:underline">
              Report an Issue
            </Link>{" "}
            for how that review works.
          </>
        ),
      },
      {
        question: "Should I use Escrow.com instead of Durqo's own payment options?",
        answer: "That's your choice. Escrow.com is an independent, licensed third party that holds and releases funds under its own terms, which some buyers prefer for larger transactions.",
      },
    ],
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { q: "Does completing this checklist guarantee a safe purchase?", a: "No. This checklist covers the signals available on a Durqo listing, but no acquisition is completely risk-free. It's a starting point for your own due diligence, not a substitute for it." },
    { q: "Do all listings have every item on this checklist?", a: "No. Available evidence varies by category and by what the individual seller has submitted or connected. Categories without SEO data, like YouTube Channels or Android & iOS Apps, won't show Google Analytics or Search Console sections at all." },
    { q: "What's the difference between a Verified Seller badge and Google Analytics Verified?", a: "Verified Seller means the seller's identity document was reviewed. Google Analytics Verified means an admin checked a connected GA property against the listing's own claims." },
    { q: "What if a seller won't answer my questions?", a: "Ask in the listing's Comments thread, where the seller's answers stay visible to every future buyer." },
    { q: "What if the business doesn't match what was described after I pay?", a: "Don't approve the transfer. Report the issue instead, and your payment stays held while Durqo reviews it." },
    { q: "Should I use Escrow.com instead of Durqo's own payment options?", a: "That's your choice. Escrow.com is an independent, licensed third party that holds and releases funds under its own terms, which some buyers prefer for larger transactions." },
  ].map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

export default function WebsiteDueDiligenceChecklistPage() {
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
                <DashEyebrow>Buyer checklist</DashEyebrow>
                <h1 className="max-w-[26ch] text-4xl leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
                  Website Due Diligence <span className="text-brand">Checklist</span>
                </h1>
                <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-ink-soft">
                  Before you pay for a website or online business, work through what to verify in the numbers, the
                  listing, the seller and the payment. This checklist brings all four together in one place.
                </p>
                <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-rule bg-brand-soft/40 px-4 py-3">
                  <Sparkles size={15} className="mt-0.5 shrink-0 text-brand-strong" aria-hidden />
                  <p className="text-sm leading-relaxed text-ink">
                    <span className="font-semibold">Quick answer:</span> Check the revenue and traffic evidence, the
                    seller&rsquo;s verification badges, what&rsquo;s actually included in the sale, and how your
                    payment is protected, before you approve anything.
                  </p>
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Reviewed by the Durqo Marketplace Team · Updated September 2026
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button href="/buy" size="lg">
                    Browse Listings
                    <ArrowRight size={16} />
                  </Button>
                  <Button href="/verify-before-buying" variant="secondary" size="lg">
                    How Verification Works
                  </Button>
                </div>
              </div>

              <div className="min-w-0 rounded-2xl border border-rule bg-paper-raised p-6 shadow-sm sm:p-7">
                <p className="mono mb-4 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  Four Areas to Check
                </p>

                {CHECKLIST_GROUPS.map(({ heading, icon: Icon, bg, tint }, i, arr) => (
                  <div key={heading}>
                    <div className="flex items-center gap-3">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${bg} ${tint}`}>
                        <Icon size={16} />
                      </span>
                      <h3 className="text-sm font-semibold text-ink">{heading}</h3>
                    </div>
                    {i < arr.length - 1 && <div className="my-4 h-px bg-rule" aria-hidden />}
                  </div>
                ))}

                <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-paper-sunk px-3.5 py-3">
                  <Info size={14} className="mt-0.5 shrink-0 text-ink-faint" />
                  <p className="text-xs leading-relaxed text-ink-faint">
                    Available evidence varies by category and by what the seller has submitted or connected.
                  </p>
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* CHECKLIST */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>The checklist</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Work through each group before you pay.</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {CHECKLIST_GROUPS.map(({ heading, icon: Icon, bg, tint, items }) => (
                <div key={heading} className="rounded-xl border border-rule bg-paper-raised p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${bg} ${tint}`}>
                      <Icon size={18} />
                    </span>
                    <h3 className="text-base font-semibold text-ink">{heading}</h3>
                  </div>
                  <ul className="flex flex-col gap-3">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-strong" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-[70ch] text-xs leading-relaxed text-ink-faint">
              Durqo&rsquo;s{" "}
              <Link href="/listing-review" className="font-semibold text-ink-soft hover:underline">
                listing review
              </Link>{" "}
              helps improve the quality and clarity of listing information, but it does not replace this checklist or
              your own independent due diligence.
            </p>
          </Inner>
        </Container>
      </section>

      {/* AFTER PAYMENT */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>After you pay</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Due diligence doesn&rsquo;t stop at checkout.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Once payment is confirmed, keep checking as the assets actually change hands.
              </p>
            </div>
            <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-4">
              {[
                { icon: CheckCircle2, label: "Payment confirmed" },
                { icon: Unlock, label: "Transfer Room opens" },
                { icon: MessageSquare, label: "Seller transfers each asset" },
                { icon: BadgeCheck, label: "You check and approve" },
              ].map(({ icon: Icon, label }, i, arr) => (
                <li key={label} className="flex items-center gap-2">
                  <span className="flex items-center gap-2 rounded-full border border-rule bg-paper-raised px-4 py-2.5 text-sm font-semibold text-ink">
                    <Icon size={15} className="text-brand-strong" aria-hidden />
                    {label}
                  </span>
                  {i < arr.length - 1 && <ArrowRight size={16} className="hidden text-ink-faint sm:block" aria-hidden />}
                </li>
              ))}
            </ol>
            <p className="mx-auto mt-6 max-w-[60ch] text-center text-sm leading-relaxed text-ink-soft">
              If an asset is missing, incorrect or inaccessible, report the issue before approving the transfer. On
              an Escrow.com purchase, this same check happens through Escrow.com&rsquo;s own process instead.
            </p>
            <div className="mx-auto mt-6 flex max-w-[60ch] items-start gap-2.5 rounded-lg bg-paper-sunk px-3.5 py-3">
              <Globe2 size={14} className="mt-0.5 shrink-0 text-ink-faint" />
              <p className="text-xs leading-relaxed text-ink-faint">
                Whichever payment method you used, don&rsquo;t approve the transfer until you&rsquo;ve actually
                checked every included asset works the way it was described.
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      {/* FAQ */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16 lg:py-20">
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
      <section className="border-b border-rule py-10">
        <Container>
          <Inner>
            <p className="mono mb-4 text-xs font-semibold uppercase tracking-wider text-ink-faint">Keep exploring</p>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {[
                { href: "/how-to-buy-a-website-in-bangladesh", label: "How to Buy a Website in Bangladesh" },
                { href: "/how-much-is-a-website-worth-in-bangladesh", label: "How Much Is a Website Worth in Bangladesh?" },
                { href: "/online-businesses-for-sale-in-bangladesh", label: "Online Businesses for Sale in Bangladesh" },
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
            <h2 className="text-2xl sm:text-3xl">Ready to review a listing?</h2>
            <p className="mx-auto mt-3 max-w-[52ch] text-center text-sm text-white/70">
              Work through this checklist against a real listing before you make an offer.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button href="/buy" size="lg">
                Browse Listings
                <ArrowRight size={16} />
              </Button>
              <Button href="/how-to-buy" variant="on-dark" size="lg">
                Read the Full Buyer Guide
              </Button>
            </div>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
