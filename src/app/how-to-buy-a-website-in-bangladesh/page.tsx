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
// Built the same way those two pages were — same DashEyebrow/Inner/Container/
// Button design system, same page-scoped-helpers convention, same
// Breadcrumb+WebPage+FAQPage JSON-LD pattern lifted directly from
// buy-and-sell-digital-businesses-in-bdt/page.tsx — and every factual claim
// below is grounded in real, live source rather than invented copy:
//   - The three real Buy Now payment rails and their exact scope: Card
//     (Stripe, src/lib/stripe.ts), bKash/Rocket/Nagad/Bank (SSLCommerz,
//     BDT — src/lib/sslcommerz.ts), and Escrow.com (src/lib/escrow.ts, a
//     genuine independent third-party escrow provider — the only rail that
//     earns the word "escrow"; Stripe/SSLCommerz are described as Durqo
//     holding the payment, per /terms's own "How payment works today").
//   - The $2,000 online-deposit cap (src/lib/payment-terms.ts,
//     ONLINE_DEPOSIT_CAP) applies to SSLCommerz only, not Stripe or
//     Escrow.com — matches the Sep 11, 2026 correction already applied to
//     /how-to-buy and the BDT page.
//   - The Websites category's own Quick Statistics vocabulary (monthly
//     income, monthly views, authority score, articles posted, indexed
//     pages — all auto-computed from Proof of Income / GA / GSC / SEMrush
//     data, never typed in manually) comes straight from src/lib/
//     categories.ts's "websites" entry.
//   - No buyer marketplace fee, and the seller-side success fee framing,
//     match the homepage/BDT-page's own established wording verbatim
//     rather than introducing new claims.
// No payment calculation, database schema, or checkout behavior was
// touched to build this page — it's a content/SEO page over existing,
// already-live behavior only, same as its two siblings above.
export const metadata: Metadata = {
  title: "How to Buy a Website in Bangladesh | Durqo",
  description:
    "A step-by-step guide for buyers in Bangladesh: how to find, review and safely buy an income-generating website on Durqo, with bKash, Rocket, Nagad, bank, card and Escrow.com payment options.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "How to Buy a Website in Bangladesh | Durqo",
    description:
      "Find, verify and buy an income-generating website on Durqo — with payment options built for buyers in Bangladesh.",
    url: "https://www.durqo.com/how-to-buy-a-website-in-bangladesh",
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Buy a Website in Bangladesh | Durqo",
    description:
      "Find, verify and buy an income-generating website on Durqo — with payment options built for buyers in Bangladesh.",
  },
  alternates: { canonical: "https://www.durqo.com/how-to-buy-a-website-in-bangladesh" },
};

const PAGE_URL = "https://www.durqo.com/how-to-buy-a-website-in-bangladesh";

const BREADCRUMB_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.durqo.com" },
    { "@type": "ListItem", position: 2, name: "How to Buy a Website in Bangladesh", item: PAGE_URL },
  ],
};

const WEBPAGE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "How to Buy a Website in Bangladesh",
  description:
    "A step-by-step guide for buyers in Bangladesh: how to find, review and safely buy an income-generating website on Durqo, with bKash, Rocket, Nagad, bank, card and Escrow.com payment options.",
  url: PAGE_URL,
  isPartOf: { "@type": "WebSite", name: "Durqo", url: "https://www.durqo.com" },
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

// Horizontal-on-desktop / vertical-on-mobile numbered flow, same pure-CSS
// pattern as the sibling pages' own NumberedFlow — kept page-scoped rather
// than shared, per this codebase's established "no shared-component churn"
// convention for small per-page layout helpers.
function NumberedFlow({ steps }: { steps: { title: string; body: string }[] }) {
  const n = steps.length;
  const inset = (0.5 / n) * 100;
  return (
    <div>
      <ol className="flex flex-col gap-6 md:hidden">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="mono grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
                {i + 1}
              </span>
              {i < n - 1 && <span className="mt-2 w-px flex-1 bg-rule" aria-hidden />}
            </div>
            <div className="pb-1">
              <h4 className="text-sm font-semibold text-ink">{step.title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="relative hidden md:block">
        <div className="absolute top-6 h-px bg-rule" style={{ left: `${inset}%`, right: `${inset}%` }} aria-hidden />
        <ol className="flex gap-4">
          {steps.map((step, i) => (
            <li key={step.title} className="flex flex-1 flex-col items-center gap-3 text-center">
              <span className="mono relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h4 className="text-sm font-semibold text-ink">{step.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
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
    title: "See real numbers first",
    body: "Review a listing's Proof of Income, Google Analytics and Search Console data before you ever pay — not after.",
  },
  {
    icon: ShieldCheck,
    title: "A tracked handover, not a handshake",
    body: "Your payment stays with Durqo and is only released once the seller has transferred the agreed assets and you've confirmed you received them.",
  },
];

const BUYER_STEPS = [
  {
    title: "Decide Your Budget and Goals",
    body: "Work out how much you can spend and what kind of website you want — a content site, an affiliate property, or something in another category — before you start browsing.",
  },
  {
    title: "Browse Website Listings",
    body: "Open the Websites category on Durqo and compare listings by their Quick Statistics: monthly income, monthly views, business age, authority score, articles posted and indexed pages.",
  },
  {
    title: "Verify the Numbers, Ask Questions",
    body: "Check the listing's Proof of Income images, its Google Analytics/Search Console access confirmation, and the seller's own verification badge. Use the Comments section to ask the seller anything before you commit.",
  },
  {
    title: "Choose How You Pay",
    body: "Pay by Card, or in BDT through bKash, Rocket, Nagad or a supported bank via SSLCommerz, or through Escrow.com — whichever option the listing offers.",
  },
  {
    title: "Your Payment Is Held Until Transfer",
    body: "Durqo holds your payment. It's released to the seller only after the agreed assets are transferred and you've confirmed you received them in your order's Transfer Room.",
  },
  {
    title: "Take Ownership of the Website",
    body: "Mark each item Received and select Approve Transfer once everything checks out, then work with the seller to move over the domain, hosting and analytics access.",
  },
];

const CHECK_ITEMS = [
  { icon: FileSearch, title: "12 months of Proof of Income", body: "Real submitted income figures and images, not just a typed-in number on the listing." },
  { icon: Search, title: "Google Analytics & Search Console access", body: "Look for the listing's GA/GSC access-confirmed badges — a manual review layer on top of the seller's own reported traffic." },
  { icon: BadgeCheck, title: "Domain age, authority and indexed pages", body: "Quick Statistics on a Websites listing include SEMrush/Ahrefs-sourced authority scores alongside domain age and indexed page counts." },
  { icon: ShieldCheck, title: "Seller identity verification", body: "A Verified Seller badge means the seller's identity document (passport, national ID or driving license) has been reviewed." },
  { icon: MessageSquare, title: "Questions answered in the open", body: "Read the listing's Comments thread, or ask your own question — a seller's answers stay visible to every future buyer, not just you." },
];

const PAYMENT_OPTIONS = [
  {
    icon: CreditCard,
    title: "Card",
    tint: "text-brand-strong",
    bg: "bg-brand-soft",
    body: "Pay the full listing price in one payment by credit or debit card, processed through Stripe.",
  },
  {
    icon: Wallet,
    title: "bKash, Rocket, Nagad or Bank",
    tint: "text-[#92730F]",
    bg: "bg-gold-soft",
    body: "Pay in Bangladeshi Taka through SSLCommerz. For a listing priced at USD 2,000 or less, you pay the full BDT amount at checkout. Above USD 2,000, you pay the BDT equivalent of USD 2,000 through SSLCommerz first, then follow Durqo's emailed instructions to pay the remaining balance — asset transfer starts only once the complete amount is received and verified.",
  },
  {
    icon: Globe2,
    title: "Escrow.com",
    tint: "text-ink",
    bg: "bg-paper-sunk",
    body: "An independent, licensed third-party escrow provider — the full listing price is paid in one payment, with no online deposit cap.",
  },
];

const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: "Paying in Bangladesh",
    items: [
      {
        question: "Can I pay for a website using bKash, Rocket or Nagad?",
        answer:
          "Yes, on listings that offer BDT checkout through SSLCommerz. Payment channels include bKash, Nagad, Rocket, supported banks, and credit or debit cards.",
      },
      {
        question: "Is there a limit on how much I can pay through bKash, Rocket, Nagad or bank?",
        answer:
          "For a website priced at USD 2,000 or less, you pay the full BDT amount through SSLCommerz. Above USD 2,000, you pay the BDT equivalent of USD 2,000 through SSLCommerz, then Durqo emails you instructions for paying the remaining balance — asset transfer starts once the full amount is received and verified.",
      },
      {
        question: "Can I pay by card if I'm buying from outside Bangladesh, or don't use mobile banking?",
        answer:
          "Yes. Card payments through Stripe, and Escrow.com, are both available independently of BDT/SSLCommerz — either one lets you pay the full listing price in a single payment with no online deposit cap.",
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
        question: "Is it safe to buy a website on Durqo?",
        answer:
          "Your payment is held by Durqo (or, on an Escrow.com purchase, by Escrow.com itself) and is only released to the seller once the agreed assets are transferred and you've confirmed you received them — you're never asked to pay a seller directly outside the platform.",
      },
      {
        question: "What should I check before I buy a website?",
        answer:
          "Review the listing's Proof of Income, its Google Analytics/Search Console access confirmation, its domain authority and indexed-page figures, the seller's identity verification badge, and the Comments thread for any open questions.",
      },
      {
        question: "What happens after I complete payment?",
        answer:
          "Your order gets its own Transfer Room. The seller submits the agreed assets there, you review and mark each item Received, and payment is released to the seller once you select Approve Transfer.",
      },
      {
        question: "What if the website doesn't match what was described?",
        answer: (
          <>
            Use Report an Issue in the Transfer Room instead of approving the transfer. Your payment stays held while
            Durqo reviews it — see{" "}
            <Link href="/report-an-issue" className="font-semibold text-brand-strong hover:underline">
              Report an Issue
            </Link>{" "}
            for how that review works.
          </>
        ),
      },
      {
        question: "How do I actually take over the website after I've paid?",
        answer: (
          <>
            The seller transfers the domain, hosting access, content and any other agreed assets through the Transfer
            Room. See{" "}
            <Link href="/whats-included" className="font-semibold text-brand-strong hover:underline">
              What&rsquo;s Included
            </Link>{" "}
            for what a typical website sale covers.
          </>
        ),
      },
    ],
  },
];

// Plain-text mirror of FAQ_GROUPS for FAQPage structured data — same
// pattern (and same reason: a couple of answers above are JSX with links)
// as buy-and-sell-digital-businesses-in-bdt/page.tsx's own FAQ_JSON_LD.
const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { q: "Can I pay for a website using bKash, Rocket or Nagad?", a: "Yes, on listings that offer BDT checkout through SSLCommerz. Payment channels include bKash, Nagad, Rocket, supported banks, and credit or debit cards." },
    { q: "Is there a limit on how much I can pay through bKash, Rocket, Nagad or bank?", a: "For a website priced at USD 2,000 or less, you pay the full BDT amount through SSLCommerz. Above USD 2,000, you pay the BDT equivalent of USD 2,000 through SSLCommerz, then Durqo emails you instructions for paying the remaining balance — asset transfer starts once the full amount is received and verified." },
    { q: "Can I pay by card if I'm buying from outside Bangladesh, or don't use mobile banking?", a: "Yes. Card payments through Stripe, and Escrow.com, are both available independently of BDT/SSLCommerz — either one lets you pay the full listing price in a single payment with no online deposit cap." },
    { q: "Does Durqo charge buyers a marketplace fee?", a: "No. Durqo does not charge buyers a marketplace fee. You pay the agreed purchase price, although disclosed payment-provider, banking or currency-related charges may apply." },
    { q: "Is it safe to buy a website on Durqo?", a: "Your payment is held by Durqo (or, on an Escrow.com purchase, by Escrow.com itself) and is only released to the seller once the agreed assets are transferred and you've confirmed you received them — you're never asked to pay a seller directly outside the platform." },
    { q: "What should I check before I buy a website?", a: "Review the listing's Proof of Income, its Google Analytics/Search Console access confirmation, its domain authority and indexed-page figures, the seller's identity verification badge, and the Comments thread for any open questions." },
    { q: "What happens after I complete payment?", a: "Your order gets its own Transfer Room. The seller submits the agreed assets there, you review and mark each item Received, and payment is released to the seller once you select Approve Transfer." },
    { q: "What if the website doesn't match what was described?", a: "Use Report an Issue in the Transfer Room instead of approving the transfer. Your payment stays held while Durqo reviews it." },
    { q: "How do I actually take over the website after I've paid?", a: "The seller transfers the domain, hosting access, content and any other agreed assets through the Transfer Room." },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBPAGE_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />

      {/* HERO */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <DashEyebrow>Buyer guide · Bangladesh</DashEyebrow>
            <h1 className="max-w-[26ch] text-4xl leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
              How to Buy a Website in <span className="text-brand">Bangladesh.</span>
            </h1>
            <p className="mt-5 max-w-[68ch] text-lg leading-relaxed text-ink-soft">
              A step-by-step guide to finding, verifying and buying an income-generating website on Durqo — with
              payment options built for buyers in Bangladesh, and a payment that stays held until you confirm you
              got what you paid for.
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
                { icon: FileSearch, label: "Real income and traffic data before you buy" },
                { icon: BkashIcon, label: "Pay in BDT, by card, or through Escrow.com" },
                { icon: ShieldCheck, label: "Payment held until you confirm the transfer" },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-2 text-sm text-ink-soft">
                  <Icon size={15} className="text-brand" />
                  {label}
                </span>
              ))}
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
            <Link
              href="/verify-before-buying"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline"
            >
              See exactly how to verify a listing&rsquo;s numbers
              <ArrowRight size={14} />
            </Link>
          </Inner>
        </Container>
      </section>

      {/* PAYMENT OPTIONS */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>How you pay</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Payment options for buyers in Bangladesh.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Which options appear depends on the listing. Durqo does not charge buyers a marketplace fee — you pay
                the agreed purchase price, although disclosed payment-provider, banking or currency-related charges
                may apply.
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
            <div className="mt-6 flex items-start gap-2.5 rounded-lg bg-paper-sunk px-3.5 py-3">
              <Info size={14} className="mt-0.5 shrink-0 text-ink-faint" />
              <p className="text-xs leading-relaxed text-ink-faint">
                Durqo shows the applicable exchange rate and exact BDT amount before you confirm a bKash, Rocket,
                Nagad or bank payment. See{" "}
                <Link href="/payments" className="font-semibold text-ink-soft hover:underline">
                  Payment &amp; Withdrawal
                </Link>{" "}
                for the full breakdown.
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

      {/* FINAL CTA */}
      <section className="bg-ink py-16 text-white sm:py-20">
        <Container>
          <Inner className="text-center">
            <h2 className="text-2xl sm:text-3xl">Ready to find your next website?</h2>
            <p className="mx-auto mt-3 max-w-[52ch] text-sm text-white/70">
              Browse Website listings with real income and traffic data, and pay the way that works for you.
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
