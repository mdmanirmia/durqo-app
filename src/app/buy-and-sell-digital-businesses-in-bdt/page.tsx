import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Landmark,
  Smartphone,
  Rocket as RocketGlyph,
  ShoppingCart,
  Store,
  ShieldCheck,
  CheckCircle2,
  Tag,
  FileText,
  Info,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import GroupedFaq, { type FaqGroup } from "@/components/GroupedFaq";
import { BkashIcon } from "@/components/icons/PaymentIcons";
import { SUCCESS_FEE_TIERS, fmtRate } from "@/lib/fees";

// Sep 14, 2026: replaces /pay-in-taka (see next.config.ts for the permanent
// redirect) with the full spec supplied by the merchant — "DURQO: Buy and
// Sell Digital Businesses with Bangladeshi Taka (BDT), Complete SEO Website
// Copy, Marketplace Comparison and Design Specification", reviewed 14 Sep
// 2026. That document is the source of truth for every sentence below;
// nothing here is invented copy.
//
// Pre-implementation findings reported to the merchant before this file was
// written (see chat): SSLCommerz is confirmed live in production
// (src/app/api/sslcommerz/init, /ipn), so this page describes BDT payment
// as currently available, not "coming soon," per the spec's own gate.
// Buyer/seller figures below are traced to the same real code /payments
// already uses — no numbers are invented for this page:
//   - $2,000 online cap: src/lib/payment-terms.ts (ONLINE_DEPOSIT_CAP)
//   - buyer BDT rate = market rate + a flat ৳6/USD margin: src/lib/currency.ts
//     (convertUsdToBdt) — disclosed in plain language per the spec's explicit
//     instruction not to use a vague phrase like "conversion margin"
//   - seller BDT payout rate (bKash/Rocket/Nagad only) = market rate minus
//     ৳1.50/USD: src/lib/currency.ts (getUsdToBdtWithdrawalRate)
//   - ৳50,000/day + ৳300,000/month per-method caps on bKash/Rocket/Nagad
//     payouts, 3–5 business day manual review: matches /payments and
//     src/app/dashboard/seller/earnings/page.tsx
//   - Success fee tiers imported from src/lib/fees.ts, the single
//     authoritative source (never hardcoded) — "up to 10%" matches exactly.
// No payment calculation, database schema, checkout behavior, withdrawal
// rule or legal document was touched to build this page — it is a copy/
// design/SEO pass over existing, already-live behavior only.
//
// Colors: the spec's brand-color table (#F7F9FC / #0B1426 / #64748B /
// #10B981 / #E8F8F2 / #FFFFFF / #DCE5EF / #FFF8E6 / #8A6410) maps almost
// exactly onto Durqo's existing design tokens (paper/brand-strong/ink-soft/
// brand/brand-soft/paper-raised/rule/gold-soft) — several are exact hex
// matches. Reusing those existing tokens instead of hardcoding the spec's
// literal hex values keeps this page inside Durqo's real design system
// (per the "honor what exists" rule) and preserves sitewide dark-mode
// support, which literal hex values would silently break. The one color
// the spec calls out as distinctly darker ("Amber text #8A6410", chosen for
// WCAG contrast on a soft-amber background) is matched using the app's own
// existing convention for that exact situation — `text-[#92730F]` — already
// used sitewide for gold-soft badges/panels (Badge.tsx, admin tables,
// seller earnings notices), not a new one-off value.
export const metadata: Metadata = {
  title: "Buy and Sell Digital Businesses with Bangladeshi Taka (BDT) | Durqo",
  description:
    "Buy and sell digital businesses in Bangladesh using BDT. Pay through SSLCommerz and request eligible seller payouts through supported local methods.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "Buy and Sell Digital Businesses with Bangladeshi Taka (BDT) | Durqo",
    description:
      "Bangladesh-based buyers can pay for eligible digital-business purchases in BDT, while eligible sellers can request payouts through supported local methods.",
    url: "https://www.durqo.com/buy-and-sell-digital-businesses-in-bdt",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy and Sell Digital Businesses with Bangladeshi Taka (BDT) | Durqo",
    description:
      "Bangladesh-based buyers can pay for eligible digital-business purchases in BDT, while eligible sellers can request payouts through supported local methods.",
  },
  alternates: { canonical: "https://www.durqo.com/buy-and-sell-digital-businesses-in-bdt" },
};

const PAGE_URL = "https://www.durqo.com/buy-and-sell-digital-businesses-in-bdt";

const BREADCRUMB_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.durqo.com" },
    { "@type": "ListItem", position: 2, name: "Buy and Sell Digital Businesses in BDT", item: PAGE_URL },
  ],
};

const WEBPAGE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Buy and Sell Digital Businesses with Bangladeshi Taka (BDT)",
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

// Horizontal-on-desktop / vertical-on-mobile numbered flow, used for both
// the 5-step buyer timeline and the 6-step seller payout-status flow (spec:
// "display the steps horizontally with numbered circles and a subtle
// connecting line [on desktop]. Switch to a vertical layout before the
// content becomes compressed."). Pure CSS toggle (no client JS / no
// hydration cost) — the inactive variant is `display:none`, so it isn't
// duplicated for screen readers either.
function NumberedFlow({ steps }: { steps: { title: string; body?: string }[] }) {
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
            <div className={step.body ? "pb-1" : "pb-1 pt-2"}>
              <h4 className="text-sm font-semibold text-ink">{step.title}</h4>
              {step.body && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{step.body}</p>}
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
                {step.body && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{step.body}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

const BUYER_STEPS = [
  { title: "Choose a Business", body: "Review the listing, examine the available information and message the seller if you need clarification." },
  { title: "Select BDT Payment", body: "Choose SSLCommerz and pick one of the payment channels available for the transaction." },
  { title: "Review the Amount", body: "Check the listing price, the applicable exchange rate and the exact BDT amount before confirming." },
  { title: "Complete the Funding", body: "Pay the full BDT amount at $2,000 or less, or the initial $2,000 equivalent above that." },
  { title: "Start the Asset Transfer", body: "Once the full price is received and verified, use the order's private Transfer Room." },
];

const SELLER_STATUSES = [
  { title: "Sale Completed" },
  { title: "Payout Eligible" },
  { title: "Withdrawal Requested" },
  { title: "Under Review" },
  { title: "Processing" },
  { title: "Paid" },
];

const PAYOUT_METHODS = [
  { icon: Landmark, title: "Bank Transfer", body: "Request an eligible payout to a supported Bangladeshi bank account.", tint: "text-brand-strong" },
  { icon: BkashIcon, title: "bKash", body: "Request an eligible payout to a valid bKash account.", tint: "text-[#E2136E]" },
  { icon: Smartphone, title: "Nagad", body: "Request an eligible payout to a valid Nagad account.", tint: "text-[#ED1C24]" },
  { icon: RocketGlyph, title: "Rocket", body: "Request an eligible payout to a valid Rocket account.", tint: "text-[#7B1E3F]" },
];

const TRANSFER_STEPS = [
  { title: "Seller Submits the Agreed Assets", body: "The seller provides the websites, domains, applications, source files, accounts, operating documents or other assets included in the accepted agreement." },
  { title: "Buyer Reviews Each Item", body: "The buyer reviews the submitted assets and confirms whether each item matches the agreed sale terms." },
  { title: "Transfer Is Approved or Reviewed", body: "The buyer approves the completed transfer, or reports an issue when an item doesn't match what was agreed." },
];

type Cell = { text: string; highlight?: boolean };
const COMPARISON_ROWS: { feature: string; durqo: Cell; flippa: Cell; acquire: Cell; empireFlippers: Cell; motionInvest: Cell }[] = [
  {
    feature: "Market focus",
    durqo: { text: "Global, with Bangladesh focus", highlight: true },
    flippa: { text: "Global" },
    acquire: { text: "Global" },
    empireFlippers: { text: "Global" },
    motionInvest: { text: "Global" },
  },
  {
    feature: "Digital business types",
    durqo: { text: "Wide range: websites, e-commerce, SaaS, apps", highlight: true },
    flippa: { text: "Wide range" },
    acquire: { text: "Wide range" },
    empireFlippers: { text: "Vetted listings" },
    motionInvest: { text: "Content sites & YouTube channels" },
  },
  {
    feature: "Bangladesh-focused BDT flow",
    durqo: { text: "Yes", highlight: true },
    flippa: { text: "No" },
    acquire: { text: "No" },
    empireFlippers: { text: "No" },
    motionInvest: { text: "No" },
  },
  {
    feature: "Seller fee model",
    durqo: { text: "Up to 10%, transparent tiers", highlight: true },
    flippa: { text: "Packages from $29 + fees from 5%" },
    acquire: { text: "Monthly listing + closing fee (varies)" },
    empireFlippers: { text: "Brokerage commission (curated service)" },
    motionInvest: { text: "Varies — check directly" },
  },
  {
    feature: "Transfer support",
    durqo: { text: "Yes (Transfer Room)", highlight: true },
    flippa: { text: "Limited" },
    acquire: { text: "Limited" },
    empireFlippers: { text: "Yes (managed migration)" },
    motionInvest: { text: "Varies" },
  },
];

const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: "Buying in BDT",
    items: [
      {
        question: "Who can pay for a business in BDT?",
        answer: (
          <>
            The BDT checkout option is intended for eligible Bangladesh-based buyers who select SSLCommerz. Other
            available payment methods are explained on Durqo&rsquo;s{" "}
            <Link href="/payments" className="font-semibold text-brand-strong hover:underline">
              Payment &amp; Withdrawal
            </Link>{" "}
            page.
          </>
        ),
      },
      {
        question: "Which payment methods are available through SSLCommerz?",
        answer:
          "Available channels may include bKash, Nagad, Rocket, supported banks, and credit or debit cards. The methods currently available will be shown on the SSLCommerz payment screen.",
      },
      {
        question: "What happens if the business costs USD 2,000 or less?",
        answer:
          "You pay the full BDT equivalent through SSLCommerz at checkout. The applicable exchange rate and exact BDT amount are shown before you confirm.",
      },
      {
        question: "What happens if the business costs more than USD 2,000?",
        answer:
          "You pay the BDT equivalent of USD 2,000 through SSLCommerz at checkout. Durqo then emails instructions for paying the remaining balance. The purchase proceeds only after the complete balance has been received and verified.",
      },
    ],
  },
  {
    heading: "Selling & payouts",
    items: [
      {
        question: "When does the Transfer Room become available?",
        answer:
          "After the complete purchase price has been received and verified. An initial partial payment does not make the order fully funded.",
      },
      {
        question: "When can a seller request a payout?",
        answer:
          "After the sale and agreed asset transfer are completed, any required review has finished, and the eligible earnings appear as available in the Seller Dashboard.",
      },
      {
        question: "How long does a seller payout take?",
        answer:
          "Durqo normally reviews and processes a payout request within 3–5 business days. The receiving bank or payment provider may require additional time to credit the seller’s account.",
      },
    ],
  },
  {
    heading: "Fees",
    items: [
      {
        question: "Does Durqo charge buyers a marketplace fee?",
        answer:
          "No. Durqo does not charge buyers a marketplace fee. The buyer pays the agreed purchase price, although disclosed payment-provider, banking or currency-related charges may apply where relevant.",
      },
      {
        question: "How much does Durqo charge sellers?",
        answer: (
          <>
            <p>
              A tiered success fee based on the final sale price, deducted only after a successful sale. The
              applicable fee is displayed before the seller publishes or accepts the relevant transaction terms.
            </p>
            <dl className="mt-3 flex flex-col gap-1.5 rounded-lg bg-paper-sunk px-3.5 py-3">
              {SUCCESS_FEE_TIERS.map((tier) => (
                <div key={tier.id} className="flex items-center justify-between gap-4">
                  <dt className="text-ink-soft">{tier.label}</dt>
                  <dd className="mono font-semibold text-ink">{fmtRate(tier.rate)}</dd>
                </div>
              ))}
            </dl>
          </>
        ),
      },
    ],
  },
  {
    heading: "Safety & support",
    items: [
      {
        question: "Is SSLCommerz an escrow service?",
        answer: "No. SSLCommerz is a payment gateway or payment processor. Durqo does not describe it as an escrow provider.",
      },
      {
        question: "Is Durqo the same as Flippa or Acquire.com?",
        answer:
          "All three platforms help connect buyers and sellers of digital businesses, but they have different markets, fees and transaction processes. Durqo’s intended distinction is its Bangladesh-focused BDT payment and local payout experience.",
      },
      {
        question: "What should I do if my payment status is pending?",
        answer: (
          <>
            Do not submit the same payment again immediately. Check the order status and contact{" "}
            <a href="mailto:support@durqo.com" className="font-semibold text-brand-strong hover:underline">
              support@durqo.com
            </a>{" "}
            so the transaction can be reviewed.
          </>
        ),
      },
      {
        question: "Where can I get help?",
        answer: (
          <>
            Contact{" "}
            <a href="mailto:support@durqo.com" className="font-semibold text-brand-strong hover:underline">
              support@durqo.com
            </a>{" "}
            before repeating a payment, changing payment methods or sending money using different instructions.
          </>
        ),
      },
    ],
  },
];

// Plain-text mirror of FAQ_GROUPS for FAQPage structured data — schema.org
// wants the same visible questions and answers, as plain text (spec:
// "Add FAQPage structured data containing exactly the visible questions and
// answers").
const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { q: "Who can pay for a business in BDT?", a: "The BDT checkout option is intended for eligible Bangladesh-based buyers who select SSLCommerz. Other available payment methods are explained on Durqo's Payment & Withdrawal page." },
    { q: "Which payment methods are available through SSLCommerz?", a: "Available channels may include bKash, Nagad, Rocket, supported banks, and credit or debit cards. The methods currently available will be shown on the SSLCommerz payment screen." },
    { q: "What happens if the business costs USD 2,000 or less?", a: "You pay the full BDT equivalent through SSLCommerz at checkout. The applicable exchange rate and exact BDT amount are shown before you confirm." },
    { q: "What happens if the business costs more than USD 2,000?", a: "You pay the BDT equivalent of USD 2,000 through SSLCommerz at checkout. Durqo then emails instructions for paying the remaining balance. The purchase proceeds only after the complete balance has been received and verified." },
    { q: "When does the Transfer Room become available?", a: "After the complete purchase price has been received and verified. An initial partial payment does not make the order fully funded." },
    { q: "When can a seller request a payout?", a: "After the sale and agreed asset transfer are completed, any required review has finished, and the eligible earnings appear as available in the Seller Dashboard." },
    { q: "How long does a seller payout take?", a: "Durqo normally reviews and processes a payout request within 3-5 business days. The receiving bank or payment provider may require additional time to credit the seller's account." },
    { q: "Does Durqo charge buyers a marketplace fee?", a: "No. Durqo does not charge buyers a marketplace fee. The buyer pays the agreed purchase price, although disclosed payment-provider, banking or currency-related charges may apply where relevant." },
    { q: "How much does Durqo charge sellers?", a: `A tiered success fee based on the final sale price, deducted only after a successful sale: ${SUCCESS_FEE_TIERS.map((t) => `${t.label} → ${fmtRate(t.rate)}`).join(", ")}. The applicable fee is displayed before the seller publishes or accepts the relevant transaction terms.` },
    { q: "Is SSLCommerz an escrow service?", a: "No. SSLCommerz is a payment gateway or payment processor. Durqo does not describe it as an escrow provider." },
    { q: "Is Durqo the same as Flippa or Acquire.com?", a: "All three platforms help connect buyers and sellers of digital businesses, but they have different markets, fees and transaction processes. Durqo's intended distinction is its Bangladesh-focused BDT payment and local payout experience." },
    { q: "What should I do if my payment status is pending?", a: "Do not submit the same payment again immediately. Check the order status and contact support@durqo.com so the transaction can be reviewed." },
    { q: "Where can I get help?", a: "Contact support@durqo.com before repeating a payment, changing payment methods or sending money using different instructions." },
  ].map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function BuyAndSellInBdtPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBPAGE_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />

      {/* HERO */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="grid gap-10 lg:grid-cols-[56%_44%] lg:gap-16">
              <div>
                <DashEyebrow>BDT payments for Bangladesh</DashEyebrow>
                <h1 className="text-4xl leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
                  Buy and Sell Digital Businesses with{" "}
                  <span className="text-brand">Bangladeshi Taka (BDT).</span>
                </h1>
                <p className="mt-5 max-w-[58ch] text-lg leading-relaxed text-ink-soft">
                  Durqo helps Bangladesh-based buyers purchase digital businesses using supported local payment
                  channels. After a successful sale and completed asset transfer, eligible Bangladesh-based sellers
                  can request their available earnings through supported BDT payout methods.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button href="/buy" size="lg">
                    Browse Businesses
                    <ArrowRight size={16} />
                  </Button>
                  <Button href="/sell" variant="secondary" size="lg">
                    Sell a Business
                  </Button>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
                  {[
                    { icon: CheckCircle2, label: "Exact BDT amount shown before confirming" },
                    { icon: ShieldCheck, label: "Supported local payment and payout methods" },
                    { icon: Landmark, label: "Tracked asset handover through the Transfer Room" },
                  ].map(({ icon: Icon, label }) => (
                    <span key={label} className="flex items-center gap-2 text-sm text-ink-soft">
                      <Icon size={15} className="text-brand" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-rule bg-paper-raised p-6 shadow-sm sm:p-7">
                <p className="mono mb-4 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  BDT Transaction Overview
                </p>

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <ShoppingCart size={16} />
                  </span>
                  <div>
                    <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">For buyers</p>
                    <h3 className="text-sm font-semibold text-ink">Pay in BDT through SSLCommerz</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      Available channels may include bKash, Nagad, Rocket, supported banks, and credit or debit cards.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {["bKash", "Nagad", "Rocket", "Bank", "Card"].map((label) => (
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
                    <Store size={16} />
                  </span>
                  <div>
                    <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-[#92730F]">For sellers</p>
                    <h3 className="text-sm font-semibold text-ink">Request eligible earnings in BDT</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      Available payout methods may include bank transfer, bKash, Nagad and Rocket, subject to seller
                      eligibility and verification.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {["Bank Transfer", "bKash", "Nagad", "Rocket"].map((label) => (
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
                    Buyer payments and seller payouts are separate processes.
                  </p>
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* BUYER / SELLER NAVIGATION */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 text-center">
              <DashEyebrow center>Choose the information relevant to you</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Buying and selling involve different payment steps.</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-rule bg-paper-raised p-7">
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                  <ShoppingCart size={19} />
                </span>
                <p className="mono mb-1 text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">For buyers</p>
                <h3 className="text-lg font-semibold text-ink">Purchase a digital business in BDT</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Learn how Durqo displays the checkout amount, processes an eligible SSLCommerz payment and handles
                  purchases priced above USD 2,000.
                </p>
                <a href="#buyer-payment" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline">
                  How Buyer Payments Work
                  <ArrowRight size={14} />
                </a>
              </div>
              <div className="rounded-xl border border-rule bg-paper-raised p-7">
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-gold-soft text-[#92730F]">
                  <Store size={19} />
                </span>
                <p className="mono mb-1 text-[0.68rem] font-semibold uppercase tracking-wider text-[#92730F]">For sellers</p>
                <h3 className="text-lg font-semibold text-ink">Receive eligible earnings in BDT</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Learn when completed sale proceeds become available and how an eligible Bangladesh-based seller
                  submits a local payout request.
                </p>
                <a href="#seller-payout" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#92730F] hover:underline">
                  How Seller Payouts Work
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* BUYER PAYMENT — RULES + TIMELINE */}
      <section id="buyer-payment" className="scroll-mt-20 border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>For buyers</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Pay for a Digital Business in BDT</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Eligible Bangladesh-based buyers can choose SSLCommerz at checkout. Before confirming payment, Durqo
                displays the applicable exchange rate and the exact amount payable in Bangladeshi Taka. Available
                payment channels may include bKash, Nagad, Rocket, supported banks, and credit or debit cards — the
                methods currently available will be shown on the SSLCommerz payment screen.
              </p>
            </div>

            <h3 className="mb-5 text-lg font-semibold text-ink">How Much Will You Pay at Checkout?</h3>
            <p className="mb-6 max-w-[70ch] text-sm text-ink-soft">
              The amount collected through SSLCommerz depends on the listing&rsquo;s price in USD.
            </p>
            <div className="mb-14 grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-rule bg-brand-soft p-6">
                <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-paper-raised text-brand-strong">
                  <Tag size={18} />
                </span>
                <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">USD 2,000 or less</p>
                <h4 className="mt-1 text-base font-semibold text-ink">Pay the Full BDT Amount Online</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  You pay the full BDT equivalent through SSLCommerz at checkout. The applicable exchange rate and
                  exact BDT total are displayed before you confirm the payment.
                </p>
                <p className="mono mt-3 text-xs font-semibold text-brand-strong">Status: Full payment at checkout</p>
              </div>
              <div className="rounded-xl border border-gold/30 bg-gold-soft p-6">
                <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-paper-raised text-[#92730F]">
                  <FileText size={18} />
                </span>
                <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-[#92730F]">Above USD 2,000</p>
                <h4 className="mt-1 text-base font-semibold text-ink">Pay the Initial USD 2,000 Equivalent</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  You pay the BDT equivalent of USD 2,000 through SSLCommerz at checkout. Once the initial payment is
                  confirmed, Durqo emails instructions for paying the remaining balance by wire transfer, credit card
                  or debit card.
                </p>
                <p className="mono mt-3 text-xs font-semibold text-[#92730F]">Status: Full balance must be verified</p>
              </div>
            </div>

            <h3 className="mb-2 text-lg font-semibold text-ink">How Buying in BDT Works</h3>
            <p className="mb-8 max-w-[70ch] text-sm text-ink-soft">A simple and secure process from browsing to asset transfer.</p>
            <NumberedFlow steps={BUYER_STEPS} />
          </Inner>
        </Container>
      </section>

      {/* SELLER PAYOUT */}
      <section id="seller-payout" className="scroll-mt-20 border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>For sellers</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Receive Eligible Sale Proceeds in BDT</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                A buyer&rsquo;s payment does not immediately become an available seller balance. The sale must be
                completed, the agreed assets must be transferred and received, and any required transaction review
                must finish before the seller can request a payout.
              </p>
            </div>

            <h3 className="mb-8 text-lg font-semibold text-ink">How Bangladeshi Sellers Get Paid</h3>
            <NumberedFlow steps={SELLER_STATUSES} />

            <h3 className="mb-5 mt-14 text-lg font-semibold text-ink">Supported Local Payout Methods</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {PAYOUT_METHODS.map(({ icon: Icon, title, body, tint }) => (
                <div key={title} className="rounded-xl border border-rule bg-paper-raised p-5">
                  <Icon size={18} className={`mb-2 ${tint}`} />
                  <h4 className="text-sm font-semibold text-ink">{title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 max-w-[72ch] text-xs leading-relaxed text-ink-faint">
              Each limit displayed for bKash, Nagad or Rocket applies independently to the selected method: up to
              ৳50,000 per day and ৳300,000 per month per method, calculated at that day&rsquo;s exchange rate. Bank
              Transfer has no such cap. Once eligible earnings appear as available in the Seller Dashboard, open
              Earnings &amp; Withdrawals, select an available payout method, provide the required account details and
              submit the withdrawal request.
            </p>
            <Link href="/payments" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline">
              View Payment &amp; Withdrawal Details
              <ArrowRight size={14} />
            </Link>
          </Inner>
        </Container>
      </section>

      {/* EXCHANGE RATE */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="rounded-2xl bg-brand-soft p-7 sm:p-10">
              <DashEyebrow>Clear currency conversion</DashEyebrow>
              <h2 className="mb-6 text-2xl sm:text-3xl">See the Exact BDT Amount Before Confirming</h2>
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <ShoppingCart size={16} className="text-brand-strong" />
                    <h4 className="text-sm font-semibold text-ink">When You Purchase</h4>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    Digital businesses are listed in USD. When an eligible buyer chooses BDT payment, Durqo displays
                    the applicable exchange rate and exact BDT amount before the payment is confirmed. The rate
                    applied is the current market USD&ndash;BDT rate plus a flat &#2547;6 per US dollar.
                  </p>
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Store size={16} className="text-brand-strong" />
                    <h4 className="text-sm font-semibold text-ink">When You Request a Payout</h4>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    When eligible USD earnings are requested through a BDT payout method, the Seller Dashboard
                    displays the applicable conversion rate, USD deduction and estimated BDT payout before the
                    request is submitted. For bKash, Nagad and Rocket payouts, the rate applied is the current market
                    USD&ndash;BDT rate minus &#2547;1.50 per US dollar.
                  </p>
                </div>
              </div>
              <p className="mt-6 text-xs leading-relaxed text-ink-faint">
                The confirmed payment or payout screen is always the final source of the applicable rate and amount.
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      {/* TRANSFER ROOM */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[900px]">
            <div className="mb-10 text-center">
              <DashEyebrow center>After full payment</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Complete the Handover in the Transfer Room</h2>
              <p className="mx-auto mt-3 max-w-[62ch] text-[0.95rem] leading-relaxed text-ink-soft">
                After the required full payment has been received and verified, the buyer and seller use a private
                Transfer Room for the order.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {TRANSFER_STEPS.map((step, i) => (
                <div key={step.title} className="rounded-xl border border-rule bg-paper-raised p-6">
                  <span className="mono mb-3 grid h-9 w-9 place-items-center rounded-full border border-rule text-sm font-bold text-ink">
                    {i + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-ink">{step.title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{step.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-rule bg-paper-raised p-5">
              <Info size={18} className="mt-0.5 shrink-0 text-brand-strong" />
              <p className="text-sm leading-relaxed text-ink-soft">
                The Transfer Room opens only after full payment is verified. For a purchase above USD 2,000, the
                initial SSLCommerz payment does not unlock the Transfer Room. SSLCommerz is a payment gateway or
                payment processor, not an escrow provider &mdash; it does not hold the seller&rsquo;s money until
                buyer approval.
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      {/* COMPARISON */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>How Durqo compares</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">How Durqo Compares with Major Digital-Business Marketplaces</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                International platforms have built extensive global networks and transaction tools. Durqo isn&rsquo;t
                presented as larger than these established marketplaces &mdash; its intended distinction is a
                Bangladesh-focused experience combining eligible BDT buyer payments, supported local seller payouts
                and a tracked asset-transfer workflow.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-rule">
              <table className="w-full min-w-[820px] border-collapse bg-paper-raised text-left">
                <thead>
                  <tr className="border-b border-rule bg-paper-sunk">
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">Feature</th>
                    <th scope="col" className="bg-brand-soft px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-brand-strong">Durqo</th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">Flippa</th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">Acquire.com</th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">Empire Flippers</th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">Motion Invest</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr key={row.feature} className={i !== COMPARISON_ROWS.length - 1 ? "border-b border-rule" : ""}>
                      <th scope="row" className="px-5 py-4 text-sm font-medium text-ink">{row.feature}</th>
                      <td className="bg-brand-soft/40 px-5 py-4 text-sm font-medium text-brand-strong">{row.durqo.text}</td>
                      <td className="px-5 py-4 text-sm text-ink-soft">{row.flippa.text}</td>
                      <td className="px-5 py-4 text-sm text-ink-soft">{row.acquire.text}</td>
                      <td className="px-5 py-4 text-sm text-ink-soft">{row.empireFlippers.text}</td>
                      <td className="px-5 py-4 text-sm text-ink-soft">{row.motionInvest.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 max-w-[80ch] text-xs leading-relaxed text-ink-faint">
              Reviewed 14 September 2026 against each marketplace&rsquo;s own public pages ({" "}
              <a href="https://flippa.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-strong">Flippa</a>,{" "}
              <a href="https://acquire.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-strong">Acquire.com</a>,{" "}
              <a href="https://empireflippers.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-strong">Empire Flippers</a>,{" "}
              <a href="https://www.motioninvest.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-strong">Motion Invest</a>
              ). Competitor services, eligibility rules and fees can change &mdash; verify current terms directly with
              each marketplace before relying on this comparison.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Landmark, title: "Pay in Bangladeshi Taka", body: "Eligible Bangladesh-based buyers can review the applicable exchange rate and exact BDT amount before confirming payment through a supported local channel." },
                { icon: ShoppingCart, title: "Sell Across Multiple Digital Categories", body: "Durqo is designed for eligible websites, e-commerce businesses, SaaS products, mobile applications and other income-generating digital businesses." },
                { icon: ShieldCheck, title: "Follow a Connected Transfer Process", body: "Payment status and asset transfer remain connected to the order. The Transfer Room stays unavailable until the complete purchase price has been verified." },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-xl border border-rule bg-paper-raised p-6">
                  <Icon size={18} className="mb-2 text-brand-strong" />
                  <h4 className="text-sm font-semibold text-ink">{title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* FAQ */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[860px]">
            <DashEyebrow center>Frequently asked questions</DashEyebrow>
            <h2 className="mb-8 text-center text-2xl sm:text-3xl">Everything about paying and getting paid in BDT.</h2>
            <GroupedFaq groups={FAQ_GROUPS} />
          </Inner>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="bg-brand-strong py-14 text-center sm:py-16">
        <Container>
          <Inner>
            <h2 className="text-2xl text-white sm:text-3xl">Ready to Buy or Sell a Digital Business?</h2>
            <p className="mx-auto mt-3 max-w-[52ch] text-[0.95rem] leading-relaxed text-white/65">
              Explore available digital businesses, or create a listing and connect with interested buyers on Durqo.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button href="/buy" size="lg">
                Browse Businesses
                <ArrowRight size={16} />
              </Button>
              <Button href="/sell" variant="on-dark" size="lg">
                Sell a Business
              </Button>
            </div>
            <p className="mt-6 text-sm text-white/50">
              Questions about BDT payments?{" "}
              <a href="mailto:support@durqo.com" className="font-semibold text-white/80 hover:text-white">
                Contact support@durqo.com
              </a>
            </p>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
