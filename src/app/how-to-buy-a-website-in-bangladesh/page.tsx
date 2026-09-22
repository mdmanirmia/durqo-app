import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  MessageSquare,
  ShieldCheck,
  FileSearch,
  BadgeCheck,
  CreditCard,
  Globe2,
  TrendingUp,
  Wallet,
  Info,
  CheckCircle2,
  Unlock,
  Send,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import GroupedFaq, { type FaqGroup } from "@/components/GroupedFaq";
import { BkashIcon } from "@/components/icons/PaymentIcons";

// Sep 22, 2026: new keyword-targeted guide page — "How to Buy a Website in
// Bangladesh" — requested as its own page/post around that exact keyword,
// alongside the site's existing generic /how-to-buy guide (all categories,
// not BD-specific) and /buy-and-sell-digital-businesses-in-bdt (all
// categories, BD-specific). This page sits at the intersection of both:
// the Websites category specifically, for a Bangladeshi buyer specifically.
//
// Sep 22, 2026 revision (same day, per an explicit content/SEO/accuracy
// review brief): this page was rewritten in place, not just extended.
// Before touching any copy, the brief's "critical payment and terms check"
// was run against the LIVE production site, not just this repo's source:
// /terms was suspected of still describing Stripe/SSLCommerz as "planned"
// and local BD payment methods as "not yet available," which would
// contradict this page and /payments. That suspicion did not hold up —
// /terms was already corrected before this revision (see its own commits
// "Update Terms content: Escrow.com, SSLCommerz, and withdrawal payouts
// are now live" and "Correct terms page: $2,000 cap is SSLCommerz-only,
// not Stripe") and every payment section there now carries a "Currently
// operational" status badge. So no /terms changes were needed this pass —
// this page's payment claims were re-verified against that live text
// instead, and every mention of "held funds" below now explicitly
// distinguishes Durqo (Stripe/SSLCommerz — Durqo holds the payment
// directly, no third-party escrow) from Escrow.com (an independent,
// licensed third-party escrow company that holds and releases funds under
// its own terms) rather than treating "held until transfer" as one
// undifferentiated mechanism.
//
// This revision also: softened every claim that read as a guarantee
// ("real income and traffic data," "12 months of Proof of Income" stated
// as fact) into evidence-submitted-for-review / where-available framing,
// since a Durqo listing review is a quality/clarity pass, not an
// independent audit of every seller's figures; added a "What Exactly Will
// Be Transferred" checklist and a post-payment timeline section; replaced
// the six-step flow's old two-copies-of-the-same-text (one <ol> shown on
// mobile, a second hidden md:block>) with a single <ol> whose layout
// changes responsively via CSS only, so the step text exists once in the
// DOM; added a visible breadcrumb; and added Article schema alongside the
// existing Breadcrumb/FAQPage JSON-LD, with real (not invented) dates and
// "Durqo Marketplace Team" as author/publisher — the same attribution
// already shown in the page's own visible byline, not a fabricated name.
//
// Every factual claim is still grounded in real, live source, not
// invented copy:
//   - The three real Buy Now payment rails and their exact scope: Card
//     (Stripe, src/lib/stripe.ts), bKash/Rocket/Nagad/Bank (SSLCommerz,
//     BDT — src/lib/sslcommerz.ts), and Escrow.com (src/lib/escrow.ts, a
//     genuine independent third-party escrow provider — the only rail that
//     earns the word "escrow").
//   - The $2,000 online-deposit cap (src/lib/payment-terms.ts,
//     ONLINE_DEPOSIT_CAP) applies to SSLCommerz only, not Stripe or
//     Escrow.com.
//   - The Websites category's own Quick Statistics vocabulary (monthly
//     income, monthly views, authority score, articles posted, indexed
//     pages) comes straight from src/lib/categories.ts's "websites" entry.
//   - No buyer marketplace fee matches the homepage/BDT-page's own
//     established wording verbatim rather than introducing a new claim.
// No payment calculation, database schema, or checkout behavior was
// touched to build or revise this page.
export const metadata: Metadata = {
  title: "How to Buy a Website in Bangladesh: Step-by-Step Guide | Durqo",
  description:
    "Learn how to find, review and buy a website in Bangladesh, compare payment options, verify revenue and traffic, and complete the asset transfer on Durqo.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "How to Buy a Website in Bangladesh: Step-by-Step Guide | Durqo",
    description:
      "Learn how to find, review and buy a website in Bangladesh, compare payment options, verify revenue and traffic, and complete the asset transfer on Durqo.",
    url: "https://www.durqo.com/how-to-buy-a-website-in-bangladesh",
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Buy a Website in Bangladesh: Step-by-Step Guide | Durqo",
    description:
      "Learn how to find, review and buy a website in Bangladesh, compare payment options, verify revenue and traffic, and complete the asset transfer on Durqo.",
  },
  alternates: { canonical: "https://www.durqo.com/how-to-buy-a-website-in-bangladesh" },
};

const PAGE_URL = "https://www.durqo.com/how-to-buy-a-website-in-bangladesh";
const PAGE_TITLE = "How to Buy a Website in Bangladesh";

// Real dates only: this page was first published and this revision was
// made on the same day (see this file's own git history) — neither date
// is a placeholder.
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

// Publisher/author is the real organization behind this page — the same
// "Durqo Marketplace Team" byline shown on the page itself — never an
// invented individual name.
const DURQO_ORG = { "@type": "Organization", name: "Durqo Marketplace Team", url: "https://www.durqo.com" };

const ARTICLE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: PAGE_TITLE,
  description:
    "Learn how to find, review and buy a website in Bangladesh, compare payment options, verify revenue and traffic, and complete the asset transfer on Durqo.",
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

// Single semantic <ol> — one heading and one paragraph of text per step,
// existing exactly once in the DOM. Responsive presentation (stacked row
// on mobile, column-with-connecting-line on desktop) is done entirely with
// CSS: the badge/connector wrapper uses `md:contents` so it drops out of
// the box model at the md breakpoint and its children (the number badge,
// and — mobile only — a small vertical connector line) lay out directly
// inside the <li>, which itself switches from `flex` (row) to
// `md:flex-col` (column) via Tailwind responsive classes. No step's title
// or body is ever rendered twice, so there's nothing for a screen reader
// or a crawler to read as duplicate content.
function NumberedFlow({ steps }: { steps: { title: string; body: string }[] }) {
  const n = steps.length;
  const inset = (0.5 / n) * 100;
  return (
    <div className="relative">
      <div
        className="absolute top-6 hidden h-px bg-rule md:block"
        style={{ left: `${inset}%`, right: `${inset}%` }}
        aria-hidden
      />
      <ol className="relative flex flex-col gap-6 md:grid md:grid-cols-6 md:gap-4">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4 md:flex-col md:items-center md:gap-3 md:text-center">
            <div className="flex flex-col items-center md:contents">
              <span className="mono relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white md:h-12 md:w-12">
                {i + 1}
              </span>
              {i < n - 1 && <span className="mt-2 w-px flex-1 bg-rule md:hidden" aria-hidden />}
            </div>
            <div className="pb-1 md:pb-0">
              <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const WHY_CARDS = [
  {
    icon: TrendingUp,
    title: "Skip the slow start",
    body: "An established website already has traffic, content and (in many cases) income — you're buying past those first, slowest months of building from zero.",
  },
  {
    icon: FileSearch,
    title: "Review the evidence first",
    body: "Review a listing's income evidence, Google Analytics and Search Console information, where available, before you decide to buy — not after.",
  },
  {
    icon: ShieldCheck,
    title: "A tracked handover, not a handshake",
    body: "Your payment is held — by Durqo, or by Escrow.com on an Escrow.com purchase — and is only released once the seller has transferred the agreed assets and you've confirmed you received them.",
  },
];

const BUYER_STEPS = [
  {
    title: "Set Your Budget and Acquisition Goals",
    body: "Work out how much you can spend and what kind of website you want — a content site, an affiliate property, or something in another category — before you start comparing listings.",
  },
  {
    title: "Browse Websites for Sale",
    body: "Open the Websites category on Durqo and compare listings by their Quick Statistics: monthly income, monthly views, business age, authority score, articles posted and indexed pages, where available.",
  },
  {
    title: "Review Revenue, Traffic and Operations",
    body: "Look at the revenue evidence, traffic information and any Google Analytics/Search Console access confirmation included with the listing, where available, alongside how the business actually runs day to day.",
  },
  {
    title: "Ask Questions and Confirm What Is Included",
    body: "Use the Comments section to ask the seller anything before you commit, and confirm exactly which assets, accounts and support are included in the sale.",
  },
  {
    title: "Choose an Available Payment Method",
    body: "Pay by card, in BDT through bKash, Rocket, Nagad or a supported bank via SSLCommerz, or through Escrow.com — whichever option is available for that listing and your location.",
  },
  {
    title: "Complete the Transfer and Approve the Assets",
    body: "Once payment is confirmed, the seller transfers the agreed assets in your order's Transfer Room (or through Escrow.com's own process). Review each item, then approve the transfer — or report an issue if something doesn't match what was agreed.",
  },
];

const CHECK_ITEMS = [
  {
    icon: FileSearch,
    title: "Revenue evidence, where available",
    body: "Up to 12 months of revenue evidence and supporting images submitted for review, where available and applicable — not just a typed-in number.",
  },
  {
    icon: Search,
    title: "Google Analytics & Search Console access",
    body: "Some listings include a GA/GSC access-confirmation badge — an additional review layer on top of the seller's own reported traffic, where applicable.",
  },
  {
    icon: BadgeCheck,
    title: "Domain age, authority and indexed pages",
    body: "Where available, a Websites listing's Quick Statistics may include SEMrush/Ahrefs-sourced authority scores alongside domain age and indexed-page counts.",
  },
  {
    icon: ShieldCheck,
    title: "Seller verification status",
    body: "A Verified Seller badge means that seller's identity document has been reviewed. Listing review and seller identity verification are separate processes — not every seller carries this badge.",
  },
  {
    icon: MessageSquare,
    title: "Questions answered in the open",
    body: "Read the listing's Comments thread, or ask your own question — a seller's answers stay visible to every future buyer, not just you.",
  },
];

const TRANSFER_CHECKLIST = [
  "Domain name and registrar access",
  "Hosting or server access",
  "CMS and website administrator access",
  "Source code, website files and database",
  "Analytics and Search Console access, where applicable",
  "Content, media and brand assets included in the sale",
  "Advertising, affiliate or merchant accounts, only when transferable",
  "Social accounts included in the agreement",
  "SOPs, supplier details or operating documentation",
  "Agreed post-sale support",
];

const PAYMENT_OPTIONS = [
  {
    icon: CreditCard,
    title: "Card (Stripe)",
    tint: "text-brand-strong",
    bg: "bg-brand-soft",
    body: "The full purchase amount may be paid by card for eligible transactions, processed through Stripe. Durqo holds the payment until the transfer is confirmed.",
  },
  {
    icon: Wallet,
    title: "bKash, Rocket, Nagad or Bank (SSLCommerz)",
    tint: "text-[#92730F]",
    bg: "bg-gold-soft",
    body: "Eligible Bangladesh buyers may be able to pay using supported local methods such as bKash, Nagad, Rocket, bank payment or card through SSLCommerz. For a transaction priced above the equivalent of USD 2,000, the initial payment covers the BDT equivalent of USD 2,000; Durqo then emails instructions for the remaining balance, and the asset transfer begins only once the complete amount has been received and verified.",
  },
  {
    icon: Globe2,
    title: "Escrow.com",
    tint: "text-ink",
    bg: "bg-paper-sunk",
    body: "As an alternative, Escrow.com independently holds and releases the funds under its own transaction terms — Durqo is not a party to funds it holds and does not control their release.",
  },
];

const TRANSFER_TIMELINE = [
  { icon: CheckCircle2, label: "Payment confirmed" },
  { icon: Unlock, label: "Transfer Room opens" },
  { icon: Send, label: "Seller transfers the agreed assets" },
  { icon: CheckCircle2, label: "Buyer checks and approves the assets" },
];

const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: "Paying in Bangladesh",
    items: [
      {
        question: "Can I pay for a website using bKash, Rocket or Nagad?",
        answer:
          "On listings that offer BDT checkout through SSLCommerz, eligible payment channels include bKash, Nagad, Rocket, supported banks, and credit or debit cards.",
      },
      {
        question: "Is there a limit on how much I can pay through bKash, Rocket, Nagad or bank?",
        answer:
          "For a website priced at USD 2,000 or less, you can pay the full BDT amount through SSLCommerz. Above that, the initial payment covers the BDT equivalent of USD 2,000, and Durqo emails instructions for the remaining balance — the asset transfer begins once the full amount has been received and verified.",
      },
      {
        question: "Can I pay by card if I'm buying from outside Bangladesh, or don't use mobile banking?",
        answer:
          "Card payments through Stripe, and Escrow.com, are both available independently of BDT/SSLCommerz for eligible transactions — either option lets you pay the full listing price in a single payment with no online deposit cap.",
      },
      {
        question: "Does Durqo charge buyers a marketplace fee?",
        answer:
          "No. Durqo does not charge buyers a marketplace fee. You pay the agreed purchase price, although disclosed payment-provider, banking or currency-related charges may apply.",
      },
    ],
  },
  {
    heading: "Buying safely",
    items: [
      {
        question: "Is buying a website through Durqo safe?",
        answer:
          "Durqo provides a structured listing, payment and transfer process, but no acquisition is completely risk-free. Buyers should review the evidence, ask questions, confirm the included assets and complete their own due diligence before paying.",
      },
      {
        question: "What should I check before I buy a website?",
        answer:
          "Review the listing's revenue and traffic evidence, any Google Analytics/Search Console access confirmation, domain authority and indexed-page figures where available, the seller's verification status, and the Comments thread for any open questions.",
      },
      {
        question: "What happens after I complete payment?",
        answer:
          "Your order gets its own Transfer Room (or, on an Escrow.com purchase, its own Escrow.com process). The seller transfers the agreed assets, you review them, and payment is released once you approve the transfer.",
      },
      {
        question: "What if the website doesn't match what was described?",
        answer: (
          <>
            Report the issue instead of approving the transfer. Your payment stays held while Durqo reviews it — see{" "}
            <Link href="/report-an-issue" className="font-semibold text-brand-strong hover:underline">
              Report an Issue
            </Link>{" "}
            for how that review works.
          </>
        ),
      },
      {
        question: "How do I actually take over the website after I've paid?",
        answer:
          "The seller transfers the domain, hosting access, content and any other agreed assets — see What Exactly Will Be Transferred below for the full checklist.",
      },
      {
        question: "Does Durqo guarantee the website's future income?",
        answer:
          "No. Revenue, traffic and operating data describe historical performance only. Durqo does not guarantee that a website will maintain the same income, traffic, rankings or profitability after the sale.",
      },
    ],
  },
];

// Plain-text mirror of FAQ_GROUPS for FAQPage structured data, kept in
// sync with the visible copy above — same pattern (and same reason: one
// answer above is JSX with a link) as buy-and-sell-digital-businesses-in-
// bdt/page.tsx's own FAQ_JSON_LD.
const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { q: "Can I pay for a website using bKash, Rocket or Nagad?", a: "On listings that offer BDT checkout through SSLCommerz, eligible payment channels include bKash, Nagad, Rocket, supported banks, and credit or debit cards." },
    { q: "Is there a limit on how much I can pay through bKash, Rocket, Nagad or bank?", a: "For a website priced at USD 2,000 or less, you can pay the full BDT amount through SSLCommerz. Above that, the initial payment covers the BDT equivalent of USD 2,000, and Durqo emails instructions for the remaining balance — the asset transfer begins once the full amount has been received and verified." },
    { q: "Can I pay by card if I'm buying from outside Bangladesh, or don't use mobile banking?", a: "Card payments through Stripe, and Escrow.com, are both available independently of BDT/SSLCommerz for eligible transactions — either option lets you pay the full listing price in a single payment with no online deposit cap." },
    { q: "Does Durqo charge buyers a marketplace fee?", a: "No. Durqo does not charge buyers a marketplace fee. You pay the agreed purchase price, although disclosed payment-provider, banking or currency-related charges may apply." },
    { q: "Is buying a website through Durqo safe?", a: "Durqo provides a structured listing, payment and transfer process, but no acquisition is completely risk-free. Buyers should review the evidence, ask questions, confirm the included assets and complete their own due diligence before paying." },
    { q: "What should I check before I buy a website?", a: "Review the listing's revenue and traffic evidence, any Google Analytics/Search Console access confirmation, domain authority and indexed-page figures where available, the seller's verification status, and the Comments thread for any open questions." },
    { q: "What happens after I complete payment?", a: "Your order gets its own Transfer Room (or, on an Escrow.com purchase, its own Escrow.com process). The seller transfers the agreed assets, you review them, and payment is released once you approve the transfer." },
    { q: "What if the website doesn't match what was described?", a: "Report the issue instead of approving the transfer. Your payment stays held while Durqo reviews it." },
    { q: "How do I actually take over the website after I've paid?", a: "The seller transfers the domain, hosting access, content and any other agreed assets — see What Exactly Will Be Transferred for the full checklist." },
    { q: "Does Durqo guarantee the website's future income?", a: "No. Revenue, traffic and operating data describe historical performance only. Durqo does not guarantee that a website will maintain the same income, traffic, rankings or profitability after the sale." },
  ].map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function HowToBuyAWebsiteInBangladeshPage() {
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
                <DashEyebrow>Buyer guide · Bangladesh</DashEyebrow>
                <h1 className="max-w-[26ch] text-4xl leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
                  How to Buy a Website in <span className="text-brand">Bangladesh</span>
                </h1>
                <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-ink-soft">
                  Buying an existing website can give you an established domain, content, audience and revenue
                  history. This guide explains how buyers in Bangladesh can review a listing, verify the business,
                  choose an available payment method and complete the asset transfer through Durqo.
                </p>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Reviewed by the Durqo Marketplace Team · Updated September 2026
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button href="/buy/websites" size="lg">
                    Browse Websites for Sale
                    <ArrowRight size={16} />
                  </Button>
                  <Button href="/payments" variant="secondary" size="lg">
                    How Payments Are Held
                  </Button>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
                  {[
                    { icon: FileSearch, label: "Income and traffic evidence submitted for review" },
                    { icon: BkashIcon, label: "Pay in BDT, by card, or through Escrow.com" },
                    { icon: ShieldCheck, label: "Payment protection based on the selected payment method" },
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
                  Buying Overview
                </p>

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <Search size={16} />
                  </span>
                  <div>
                    <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">Before you buy</p>
                    <h3 className="text-sm font-semibold text-ink">Review the listing&rsquo;s evidence</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      Compare revenue evidence, traffic information and Google Analytics/Search Console access, where
                      available, before you decide.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {["Revenue evidence", "GA/GSC access", "Domain authority"].map((label) => (
                        <span key={label} className="mono rounded-full border border-rule px-2.5 py-1 text-[0.65rem] text-ink-soft">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="my-5 h-px bg-rule" aria-hidden />

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold-soft text-[#92730F]">
                    <CreditCard size={16} />
                  </span>
                  <div>
                    <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-[#92730F]">How you pay</p>
                    <h3 className="text-sm font-semibold text-ink">Card, BDT, or Escrow.com</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      Pay by card, in BDT through bKash, Rocket, Nagad or a supported bank, or through Escrow.com —
                      whichever option is available for that listing.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {["Stripe", "bKash", "Rocket", "Nagad", "Bank", "Escrow.com"].map((label) => (
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
                    Payment protection depends on the method you choose — Durqo or Escrow.com holds the funds until
                    the transfer is confirmed.
                  </p>
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* WHY BUY AN EXISTING WEBSITE */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>Why buy instead of build</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Buy something that&rsquo;s already working.</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {WHY_CARDS.map(({ icon: Icon, title, body }) => (
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

      {/* STEP BY STEP */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>The process</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Six steps, from browsing to ownership.</h2>
            </div>
            <NumberedFlow steps={BUYER_STEPS} />
          </Inner>
        </Container>
      </section>

      {/* WHAT TO CHECK */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>Before you buy</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">What to check on a Website listing.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {CHECK_ITEMS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex items-start gap-3.5 rounded-xl border border-rule bg-paper-raised p-5">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <Icon size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">{body}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-[70ch] text-xs leading-relaxed text-ink-faint">
              Durqo&rsquo;s{" "}
              <Link href="/listing-review" className="font-semibold text-ink-soft hover:underline">
                listing review
              </Link>{" "}
              helps improve the quality and clarity of listing information, but it does not replace the buyer&rsquo;s
              independent due diligence. Historical revenue and traffic do not guarantee future performance.
            </p>
            <Link
              href="/verify-before-buying"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline"
            >
              See exactly how to verify a listing&rsquo;s numbers
              <ArrowRight size={14} />
            </Link>
          </Inner>
        </Container>
      </section>

      {/* WHAT WILL BE TRANSFERRED */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>The handover</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">What exactly will be transferred?</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                What&rsquo;s included varies by listing and by agreement. A typical website sale can cover:
              </p>
            </div>
            <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {TRANSFER_CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-strong" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-[70ch] text-xs leading-relaxed text-ink-faint">
              Third-party accounts can only be transferred when the relevant platform&rsquo;s terms allow it. The
              buyer and seller should confirm every included asset before payment.
            </p>
            <Link
              href="/whats-included"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline"
            >
              See what&rsquo;s included in a typical sale
              <ArrowRight size={14} />
            </Link>
          </Inner>
        </Container>
      </section>

      {/* PAYMENT OPTIONS */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>How you pay</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Payment options for buyers in Bangladesh.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Available payment methods may depend on the listing, transaction amount, buyer location and
                payment-provider eligibility. Durqo does not charge buyers a marketplace fee.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {PAYMENT_OPTIONS.map(({ icon: Icon, title, body, tint, bg }) => (
                <div key={title} className="rounded-xl border border-rule bg-paper-raised p-6">
                  <span className={`mb-4 grid h-11 w-11 place-items-center rounded-lg ${bg} ${tint}`}>
                    <Icon size={19} />
                  </span>
                  <h3 className="text-base font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-start gap-2.5 rounded-lg bg-paper-raised px-3.5 py-3">
              <Info size={14} className="mt-0.5 shrink-0 text-ink-faint" />
              <p className="text-xs leading-relaxed text-ink-faint">
                Durqo shows the applicable exchange rate and exact BDT amount before you confirm a bKash, Rocket,
                Nagad or bank payment. See{" "}
                <Link href="/payments" className="font-semibold text-ink-soft hover:underline">
                  Payment &amp; Withdrawal
                </Link>{" "}
                for the full breakdown, and{" "}
                <Link href="/terms" className="font-semibold text-ink-soft hover:underline">
                  Terms of Service
                </Link>{" "}
                for the complete payment terms.
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      {/* POST-PAYMENT TIMELINE */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>After you pay</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">What happens next.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Once payment is confirmed, your order moves into the{" "}
                <Link href="/transfer-room" className="font-semibold text-brand-strong hover:underline">
                  Transfer Room
                </Link>
                :
              </p>
            </div>
            <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-4">
              {TRANSFER_TIMELINE.map(({ icon: Icon, label }, i) => (
                <li key={label} className="flex items-center gap-2">
                  <span className="flex items-center gap-2 rounded-full border border-rule bg-paper-raised px-4 py-2.5 text-sm font-semibold text-ink">
                    <Icon size={15} className="text-brand-strong" aria-hidden />
                    {label}
                  </span>
                  {i < TRANSFER_TIMELINE.length - 1 && (
                    <ArrowRight size={16} className="hidden text-ink-faint sm:block" aria-hidden />
                  )}
                </li>
              ))}
            </ol>
            <p className="mx-auto mt-6 max-w-[60ch] text-center text-sm leading-relaxed text-ink-soft">
              If an agreed asset is missing, incorrect or inaccessible, the buyer should{" "}
              <Link href="/report-an-issue" className="font-semibold text-brand-strong hover:underline">
                report the issue
              </Link>{" "}
              before approving the transfer.
            </p>
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

      {/* FINAL CTA */}
      <section className="bg-ink py-16 text-white sm:py-20">
        <Container>
          <Inner className="text-center">
            <h2 className="text-2xl sm:text-3xl">Ready to find your next website?</h2>
            <p className="mx-auto mt-3 max-w-[52ch] text-sm text-white/70">
              Browse Website listings with income and traffic evidence submitted for review, and pay the way that
              works for you.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button href="/buy/websites" size="lg">
                Browse Websites for Sale
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
