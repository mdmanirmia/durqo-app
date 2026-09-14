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
  Layers,
  Users,
  Percent,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import GroupedFaq, { type FaqGroup } from "@/components/GroupedFaq";
import { BkashIcon } from "@/components/icons/PaymentIcons";
import { SUCCESS_FEE_TIERS, fmtRate } from "@/lib/fees";

// Sep 14, 2026: content/SEO/positioning rewrite of this page per the
// merchant's follow-up brief (see chat — "Update and improve the complete
// content of the following existing Durqo page"), superseding the copy this
// file originally shipped with the same day. Two changes worth flagging for
// future readers of this file:
//
// 1. The buyer (+৳6/USD) and seller-withdrawal (-৳1.50/USD) exchange-rate
//    margins were disclosed in plain language in the previous version of
//    this page, per that version's own spec. This revision's spec
//    explicitly reverses that instruction and asks the exact margins not to
//    appear publicly, describing instead only that the applicable rate and
//    exact BDT amount are shown on the confirmation screen before the
//    payment or payout is submitted. This is a copy-visibility change only —
//    the underlying calculation is untouched. It still lives in
//    src/lib/currency.ts: convertUsdToBdt() (buyer, +6 BDT) and
//    getUsdToBdtWithdrawalRate() (seller, -1.5 BDT). Anyone reinstating a
//    public disclosure of these numbers later should re-derive the copy
//    from that file, never hardcode a figure here.
// 2. Every "may include" instance describing a confirmed, already-live
//    payment or payout channel was changed to "include" — those channels
//    are not speculative, so the more confident wording is accurate, not
//    aspirational.
//
// No payment calculation, database schema, checkout behavior, withdrawal
// rule or legal document was touched to make this revision — same as the
// original build of this page, it is a copy/design/SEO pass over existing,
// already-live behavior only. Source-of-truth figures un-changed by this
// pass and still traced to real code, not invented:
//   - $2,000 online cap: src/lib/payment-terms.ts (ONLINE_DEPOSIT_CAP)
//   - ৳50,000/day + ৳300,000/month per-method caps on bKash/Rocket/Nagad
//     payouts, 3–5 business day manual review: matches /payments and
//     src/app/dashboard/seller/earnings/page.tsx
//   - Success fee tiers imported from src/lib/fees.ts, the single
//     authoritative source (never hardcoded) — 10%/7%/5% matches exactly.
//
// Design: unchanged from the original build of this page. The spec's brand
// colors (#F7F9FC / #0B1426 / #64748B / #10B981 / #E8F8F2 / #FFFFFF /
// #DCE5EF / #FFF8E6 / #8A6410) map onto Durqo's existing design tokens
// (paper/brand-strong/ink-soft/brand/brand-soft/paper-raised/rule/gold-soft,
// and text-[#92730F] for amber text — the app's existing convention for
// that exact situation) rather than hardcoded hex, preserving sitewide
// dark-mode support and staying inside the real design system.
export const metadata: Metadata = {
  title: "Buy and Sell Digital Businesses in BDT | Durqo",
  description:
    "Durqo is the first marketplace for buying and selling digital businesses in BDT. Buyers can pay through SSLCommerz, while eligible sellers can receive payouts through supported local methods.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "Buy and Sell Digital Businesses in BDT | Durqo",
    description:
      "Durqo is the first marketplace for buying and selling digital businesses in BDT. Pay through SSLCommerz and receive eligible seller payouts through supported local methods.",
    url: "https://www.durqo.com/buy-and-sell-digital-businesses-in-bdt",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy and Sell Digital Businesses in BDT | Durqo",
    description:
      "Durqo is the first marketplace for buying and selling digital businesses in BDT. Pay through SSLCommerz and receive eligible seller payouts through supported local methods.",
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
  description:
    "Durqo is the first marketplace for buying and selling digital businesses in BDT, with SSLCommerz buyer payments and eligible seller payouts through supported local methods.",
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
// the 5-step buyer timeline and the 6-step seller payout-status flow. Pure
// CSS toggle (no client JS / no hydration cost) — the inactive variant is
// `display:none`, so it isn't duplicated for screen readers either.
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

const BUYER_PAYMENT_CHANNELS = ["bKash", "Nagad", "Rocket", "Supported Banks", "Credit or Debit Card"];

const BUYER_STEPS = [
  { title: "Choose a Business", body: "Review the listing, examine the available business information and communicate with the seller if you need clarification." },
  { title: "Select BDT Payment", body: "Choose SSLCommerz at checkout and select one of the supported payment channels." },
  { title: "Review the Amount", body: "Review the listing price, applicable exchange rate and exact BDT amount before confirming your payment." },
  { title: "Complete the Funding", body: "For a purchase priced at USD 2,000 or less, pay the complete BDT amount through SSLCommerz. For a purchase priced above USD 2,000, pay the initial USD 2,000 equivalent and follow Durqo's emailed instructions for paying the remaining balance." },
  { title: "Start the Asset Transfer", body: "After the complete purchase price has been received and verified, the buyer and seller can use the order's private Transfer Room to complete the agreed asset handover." },
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

const PAYOUT_LIMITS = [
  { method: "bKash", limit: "Up to ৳50,000 per day and ৳300,000 per month" },
  { method: "Nagad", limit: "Up to ৳50,000 per day and ৳300,000 per month" },
  { method: "Rocket", limit: "Up to ৳50,000 per day and ৳300,000 per month" },
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
    durqo: { text: "Bangladesh-focused with global digital-business access", highlight: true },
    flippa: { text: "Global digital-business marketplace and exit platform" },
    acquire: { text: "Global marketplace for profitable online businesses" },
    empireFlippers: { text: "Curated brokerage-style marketplace for established online businesses" },
    motionInvest: { text: "Specialized marketplace for profitable content websites and YouTube channels" },
  },
  {
    feature: "Digital business types",
    durqo: { text: "Websites, e-commerce businesses, SaaS products, mobile apps and other eligible income-generating digital businesses", highlight: true },
    flippa: { text: "A broad range of online businesses and digital assets" },
    acquire: { text: "SaaS, e-commerce, agencies, content businesses, mobile apps and other online businesses" },
    empireFlippers: { text: "Vetted e-commerce, SaaS, content, service and other online businesses" },
    motionInvest: { text: "Primarily content websites and YouTube channels" },
  },
  {
    feature: "Bangladesh-focused BDT flow",
    durqo: { text: "Yes — BDT buyer payments and eligible seller payouts", highlight: true },
    flippa: { text: "Not specifically designed around local Bangladesh buyer payments and seller payouts" },
    acquire: { text: "Not specifically designed around local Bangladesh buyer payments and seller payouts" },
    empireFlippers: { text: "Not specifically designed around local Bangladesh buyer payments and seller payouts" },
    motionInvest: { text: "Not specifically designed around local Bangladesh buyer payments and seller payouts" },
  },
  {
    feature: "Seller fee",
    durqo: { text: "Tiered success fee deducted only after a successful sale", highlight: true },
    flippa: { text: "Listing packages and success fees based on the applicable service and transaction" },
    acquire: { text: "Listing and closing fees depend on the applicable plan and transaction" },
    empireFlippers: { text: "Brokerage commission based on the applicable sale terms" },
    motionInvest: { text: "Applicable fees depend on the transaction and current platform terms" },
  },
  {
    feature: "Transfer support",
    durqo: { text: "Private Transfer Room connected to the order and full-payment status", highlight: true },
    flippa: { text: "Deal-management and transaction-support tools" },
    acquire: { text: "Acquisition, document and closing tools" },
    empireFlippers: { text: "Managed migration and transaction assistance" },
    motionInvest: { text: "Transfer assistance for eligible digital assets" },
  },
];

// Mobile stacked-card view derives from COMPARISON_ROWS (single source of
// truth — nothing here is retyped) so the two layouts can never drift apart.
const COMPARISON_COMPANIES = [
  { name: "Durqo", highlight: true, key: "durqo" as const },
  { name: "Flippa", key: "flippa" as const },
  { name: "Acquire.com", key: "acquire" as const },
  { name: "Empire Flippers", key: "empireFlippers" as const },
  { name: "Motion Invest", key: "motionInvest" as const },
].map((company) => ({
  ...company,
  rows: COMPARISON_ROWS.map((row) => ({ feature: row.feature, value: row[company.key].text })),
}));

const WHY_DIFFERENT_CARDS = [
  { icon: ShoppingCart, title: "Buy Digital Businesses in BDT", body: "Bangladesh-based buyers can pay for eligible digital businesses in Bangladeshi Taka through SSLCommerz and review the exact payable amount before confirming." },
  { icon: Landmark, title: "Receive Sale Proceeds in BDT", body: "After completing the sale and transfer requirements, eligible sellers can request their available earnings through bank transfer, bKash, Nagad or Rocket." },
  { icon: Layers, title: "Explore Multiple Business Categories", body: "Buy and sell eligible websites, e-commerce businesses, SaaS products, mobile applications and other income-generating digital businesses." },
  { icon: ShieldCheck, title: "Use a Tracked Transfer Process", body: "Payment status and asset transfer remain connected to the order. The Transfer Room stays locked until the complete purchase price has been received and verified." },
  { icon: Users, title: "No Buyer Marketplace Fee", body: "Durqo does not charge buyers a marketplace fee. Buyers pay the agreed purchase price, although disclosed payment-provider, banking or currency-related charges may apply." },
  { icon: Percent, title: "Pay a Seller Fee Only After a Sale", body: "Durqo deducts the applicable success fee from the seller only after a successful sale." },
];

const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: "Buying in BDT",
    items: [
      {
        question: "Who can pay for a business in BDT?",
        answer: "The BDT checkout option is for Bangladesh-based buyers who select SSLCommerz.",
      },
      {
        question: "Which payment methods are available through SSLCommerz?",
        answer: "SSLCommerz payment channels include bKash, Nagad, Rocket, supported banks, and credit or debit cards.",
      },
      {
        question: "What happens if the business costs USD 2,000 or less?",
        answer:
          "You pay the complete BDT equivalent through SSLCommerz at checkout. Durqo shows the applicable exchange rate and exact BDT amount before you confirm the payment.",
      },
      {
        question: "What happens if the business costs more than USD 2,000?",
        answer:
          "You pay the BDT equivalent of USD 2,000 through SSLCommerz at checkout. After that payment is confirmed, Durqo emails you instructions for paying the remaining balance. The purchase proceeds to asset transfer only after the complete balance has been received and verified.",
      },
      {
        question: "Can buyers and sellers both use Bangladeshi Taka on Durqo?",
        answer:
          "Yes. Bangladesh-based buyers can pay for eligible digital businesses in BDT through SSLCommerz. After a successful sale, completed asset transfer and required review, eligible sellers can request their available earnings through supported BDT payout methods.",
      },
    ],
  },
  {
    heading: "Selling & payouts",
    items: [
      {
        question: "When does the Transfer Room become available?",
        answer:
          "The Transfer Room becomes available after the complete purchase price has been received and verified. An initial partial payment does not make the order fully funded.",
      },
      {
        question: "When can a seller request a payout?",
        answer:
          "A seller can request a payout after the sale and agreed asset transfer are completed, any required review has finished and the eligible earnings appear as available in the Seller Dashboard.",
      },
      {
        question: "Which BDT payout methods does Durqo support?",
        answer:
          "Supported local payout methods include bank transfer, bKash, Nagad and Rocket, subject to seller eligibility, verification and applicable withdrawal limits.",
      },
      {
        question: "How long does a seller payout take?",
        answer:
          "Durqo normally reviews and processes a payout request within 3–5 business days. The receiving bank or payment provider may require additional time to credit the seller's account.",
      },
    ],
  },
  {
    heading: "Fees",
    items: [
      {
        question: "Does Durqo charge buyers a marketplace fee?",
        answer:
          "No. Durqo does not charge buyers a marketplace fee. The buyer pays the agreed purchase price, although disclosed payment-provider, banking or currency-related charges may apply.",
      },
      {
        question: "How much does Durqo charge sellers?",
        answer: (
          <>
            <p>Durqo deducts a tiered success fee based on the final sale price. The success fee is deducted only after a successful sale.</p>
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
        answer: "No. SSLCommerz is a payment gateway or payment processor and is not described as an escrow provider.",
      },
      {
        question: "How is Durqo different from Flippa or Acquire.com?",
        answer:
          "Flippa and Acquire.com are established international marketplaces serving broad global audiences. Durqo is the first marketplace specifically built to support the purchase of digital businesses in BDT and eligible seller payouts through supported local methods.",
      },
      {
        question: "What should I do if my payment status is pending?",
        answer: (
          <>
            Do not submit the same payment again immediately. Check your order status and contact{" "}
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
// wants the same visible questions and answers, as plain text. Kept
// hand-written rather than derived from the JSX above because a couple of
// answers there are React fragments including links; this list is checked
// against the visible copy above whenever either changes.
const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { q: "Who can pay for a business in BDT?", a: "The BDT checkout option is for Bangladesh-based buyers who select SSLCommerz." },
    { q: "Which payment methods are available through SSLCommerz?", a: "SSLCommerz payment channels include bKash, Nagad, Rocket, supported banks, and credit or debit cards." },
    { q: "What happens if the business costs USD 2,000 or less?", a: "You pay the complete BDT equivalent through SSLCommerz at checkout. Durqo shows the applicable exchange rate and exact BDT amount before you confirm the payment." },
    { q: "What happens if the business costs more than USD 2,000?", a: "You pay the BDT equivalent of USD 2,000 through SSLCommerz at checkout. After that payment is confirmed, Durqo emails you instructions for paying the remaining balance. The purchase proceeds to asset transfer only after the complete balance has been received and verified." },
    { q: "Can buyers and sellers both use Bangladeshi Taka on Durqo?", a: "Yes. Bangladesh-based buyers can pay for eligible digital businesses in BDT through SSLCommerz. After a successful sale, completed asset transfer and required review, eligible sellers can request their available earnings through supported BDT payout methods." },
    { q: "When does the Transfer Room become available?", a: "The Transfer Room becomes available after the complete purchase price has been received and verified. An initial partial payment does not make the order fully funded." },
    { q: "When can a seller request a payout?", a: "A seller can request a payout after the sale and agreed asset transfer are completed, any required review has finished and the eligible earnings appear as available in the Seller Dashboard." },
    { q: "Which BDT payout methods does Durqo support?", a: "Supported local payout methods include bank transfer, bKash, Nagad and Rocket, subject to seller eligibility, verification and applicable withdrawal limits." },
    { q: "How long does a seller payout take?", a: "Durqo normally reviews and processes a payout request within 3-5 business days. The receiving bank or payment provider may require additional time to credit the seller's account." },
    { q: "Does Durqo charge buyers a marketplace fee?", a: "No. Durqo does not charge buyers a marketplace fee. The buyer pays the agreed purchase price, although disclosed payment-provider, banking or currency-related charges may apply." },
    { q: "How much does Durqo charge sellers?", a: `Durqo deducts a tiered success fee based on the final sale price: ${SUCCESS_FEE_TIERS.map((t) => `${t.label} → ${fmtRate(t.rate)}`).join(", ")}. The success fee is deducted only after a successful sale.` },
    { q: "Is SSLCommerz an escrow service?", a: "No. SSLCommerz is a payment gateway or payment processor and is not described as an escrow provider." },
    { q: "How is Durqo different from Flippa or Acquire.com?", a: "Flippa and Acquire.com are established international marketplaces serving broad global audiences. Durqo is the first marketplace specifically built to support the purchase of digital businesses in BDT and eligible seller payouts through supported local methods." },
    { q: "What should I do if my payment status is pending?", a: "Do not submit the same payment again immediately. Check your order status and contact support@durqo.com so the transaction can be reviewed." },
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
            <div className="grid gap-10 lg:grid-cols-[56fr_44fr] lg:gap-16">
              <div className="min-w-0">
                <DashEyebrow>BDT payments for Bangladesh</DashEyebrow>
                <h1 className="text-4xl leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
                  Buy and Sell Digital Businesses with{" "}
                  <span className="text-brand">Bangladeshi Taka (BDT).</span>
                </h1>
                <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-ink-soft">
                  Durqo is the first marketplace for buying and selling digital businesses in BDT. Bangladesh-based
                  buyers can purchase eligible websites, e-commerce businesses, SaaS products, mobile apps and other
                  income-generating digital businesses using supported local payment channels. After a successful
                  sale and completed asset transfer, eligible sellers can receive their sale proceeds through
                  supported BDT payout methods.
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

              <div className="min-w-0 rounded-2xl border border-rule bg-paper-raised p-6 shadow-sm sm:p-7">
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
                      Payment channels include bKash, Nagad, Rocket, supported banks, and credit or debit cards
                      through SSLCommerz.
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
                    <h3 className="text-sm font-semibold text-ink">Receive eligible earnings in BDT</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      Supported payout methods include bank transfer, bKash, Nagad and Rocket, subject to seller
                      eligibility, account verification and applicable withdrawal limits.
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
                    Buyer payments and seller payouts follow separate processes. A confirmed buyer payment does not
                    immediately create an available seller balance.
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
              <h2 className="text-2xl sm:text-3xl">Buying and Selling Follow Different BDT Processes</h2>
              <p className="mx-auto mt-3 max-w-[52ch] text-sm text-ink-soft">
                Choose the information that applies to your role in the transaction.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-rule bg-paper-raised p-7">
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                  <ShoppingCart size={19} />
                </span>
                <p className="mono mb-1 text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">For buyers</p>
                <h3 className="text-lg font-semibold text-ink">Purchase a Digital Business in BDT</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Learn how Durqo displays the BDT checkout amount, processes SSLCommerz payments and handles
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
                <h3 className="text-lg font-semibold text-ink">Receive Eligible Sale Proceeds in BDT</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Learn when completed sale proceeds become available and how an eligible seller submits a local
                  payout request.
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

      {/* BUYER PAYMENT — INTRO + CHANNELS + RULES + PROCESS */}
      <section id="buyer-payment" className="scroll-mt-20 border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>For buyers</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Pay for a Digital Business in BDT</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Bangladesh-based buyers can choose SSLCommerz at checkout. Before confirming payment, Durqo displays
                the applicable exchange rate and exact amount payable in Bangladeshi Taka.
              </p>
            </div>

            <h3 className="mb-2 text-lg font-semibold text-ink">Supported Payment Channels</h3>
            <p className="mb-4 max-w-[70ch] text-sm text-ink-soft">
              SSLCommerz payment channels include bKash, Nagad, Rocket, supported banks, and credit or debit cards.
            </p>
            <div className="mb-14 flex flex-wrap gap-2">
              {BUYER_PAYMENT_CHANNELS.map((label) => (
                <span key={label} className="mono rounded-full border border-rule bg-paper-raised px-3.5 py-1.5 text-xs text-ink-soft">
                  {label}
                </span>
              ))}
            </div>

            <h3 className="mb-5 text-lg font-semibold text-ink">How Much Will You Pay at Checkout?</h3>
            <p className="mb-6 max-w-[70ch] text-sm text-ink-soft">
              The amount collected through SSLCommerz depends on the listing&rsquo;s price in USD.
            </p>
            <div className="mb-5 grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-rule bg-brand-soft p-6">
                <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-paper-raised text-brand-strong">
                  <Tag size={18} />
                </span>
                <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">USD 2,000 or less</p>
                <h4 className="mt-1 text-base font-semibold text-ink">Pay the Full BDT Amount Online</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  You pay the complete BDT equivalent through SSLCommerz at checkout. Durqo displays the applicable
                  exchange rate and exact BDT total before you confirm the payment.
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
                  You pay the BDT equivalent of USD 2,000 through SSLCommerz at checkout. After the initial payment
                  is confirmed, Durqo emails you instructions for paying the remaining balance by wire transfer,
                  credit card or debit card.
                </p>
                <p className="mono mt-3 text-xs font-semibold text-[#92730F]">Status: The complete balance must be received and verified</p>
              </div>
            </div>
            <div className="mb-14 flex items-start gap-3 rounded-xl border border-rule bg-paper-raised p-5">
              <Info size={18} className="mt-0.5 shrink-0 text-brand-strong" />
              <p className="text-sm leading-relaxed text-ink-soft">
                A purchase priced above USD 2,000 is not fully funded after the initial SSLCommerz payment. The
                transaction proceeds to asset transfer only after Durqo receives and verifies the complete purchase
                price.
              </p>
            </div>

            <DashEyebrow>Step by step</DashEyebrow>
            <h3 className="mb-2 text-lg font-semibold text-ink">How Buying in BDT Works</h3>
            <p className="mb-8 max-w-[70ch] text-sm text-ink-soft">
              A clear process connects the buyer&rsquo;s payment with the digital-asset transfer.
            </p>
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

            <h3 className="mb-8 text-lg font-semibold text-ink">How Sellers Get Paid in BDT</h3>
            <NumberedFlow steps={SELLER_STATUSES} />

            <h3 className="mb-5 mt-14 text-lg font-semibold text-ink">Supported Local Payout Methods</h3>
            <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:grid-cols-4">
              {PAYOUT_METHODS.map(({ icon: Icon, title, body, tint }) => (
                <div key={title} className="rounded-xl border border-rule bg-paper-raised p-5">
                  <Icon size={18} className={`mb-2 ${tint}`} />
                  <h4 className="text-sm font-semibold text-ink">{title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>

            <p className="mt-5 max-w-[72ch] text-sm leading-relaxed text-ink-soft">
              Once eligible earnings appear as available in the Seller Dashboard, the seller can open Earnings &amp;
              Withdrawals, select a supported payout method, provide the required account details and submit a
              withdrawal request.
            </p>

            <div className="mt-5 max-w-[72ch] rounded-xl border border-rule bg-paper-raised p-5">
              <p className="text-sm font-semibold text-ink">Each withdrawal limit applies independently to the selected method:</p>
              <dl className="mt-3 flex flex-col gap-1.5">
                {PAYOUT_LIMITS.map(({ method, limit }) => (
                  <div key={method} className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <dt className="mono text-xs font-semibold uppercase tracking-wider text-ink-soft">{method}</dt>
                    <dd className="text-sm text-ink">{limit}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-ink-faint">
                Durqo does not combine the bKash, Nagad and Rocket limits. Bank Transfer does not use these mobile
                financial service limits. The withdrawal form displays both the USD amount deducted from your
                available earnings and the estimated BDT amount you will receive.
              </p>
            </div>

            <p className="mt-5 max-w-[72ch] text-sm leading-relaxed text-ink-soft">
              Durqo normally reviews and processes payout requests within 3&ndash;5 business days. The receiving bank
              or payment provider may require additional time to credit the seller&rsquo;s account after Durqo sends
              the payment.
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
                    Digital businesses are listed in USD. When a Bangladesh-based buyer chooses BDT payment, Durqo
                    displays the applicable exchange rate and exact BDT amount before the payment is confirmed.
                  </p>
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Store size={16} className="text-brand-strong" />
                    <h4 className="text-sm font-semibold text-ink">When You Request a Payout</h4>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    When eligible USD earnings are requested through a BDT payout method, the Seller Dashboard
                    displays the applicable exchange rate, USD deduction and estimated BDT payout before the
                    withdrawal request is submitted.
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
              <p className="mx-auto mt-3 max-w-[64ch] text-[0.95rem] leading-relaxed text-ink-soft">
                After the complete purchase price has been received and verified, the buyer and seller use a private
                Transfer Room for the order. The seller submits each asset included in the sale, and the buyer
                reviews and confirms each item before approving the completed transfer or reporting an issue.
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
                The Transfer Room opens only after the complete purchase price has been received and verified. For a
                purchase above USD 2,000, the initial SSLCommerz payment does not unlock the Transfer Room.
                SSLCommerz is a payment gateway or payment processor, not an escrow provider &mdash; it does not hold
                the seller&rsquo;s funds until the buyer approves the transfer.
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      {/* MARKETPLACE COMPARISON */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[75ch]">
              <DashEyebrow>Compare marketplaces</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">How Durqo Compares with Major Digital-Business Marketplaces</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Flippa, Acquire.com, Empire Flippers and Motion Invest serve international buyers and sellers
                through different marketplace and brokerage models. Durqo is the first marketplace specifically
                built to let buyers purchase digital businesses in BDT and eligible sellers receive their sale
                proceeds through supported local BDT payout methods. Durqo is not presented as larger or more
                established than these international platforms. Its distinction is its Bangladesh-focused BDT
                transaction experience.
              </p>
            </div>

            {/* Desktop / tablet: full comparison table. Hidden on mobile per
                spec ("do not create a horizontally scrolling comparison
                table on mobile") in favor of the stacked cards below. */}
            <div className="hidden overflow-x-auto rounded-xl border border-rule md:block">
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

            {/* Mobile: stacked comparison cards, one per marketplace, derived
                from the same COMPARISON_ROWS data as the table above. */}
            <div className="flex flex-col gap-4 md:hidden">
              {COMPARISON_COMPANIES.map((company) => (
                <div
                  key={company.name}
                  className={`rounded-xl border p-5 ${
                    company.highlight ? "border-brand/30 bg-brand-soft/40" : "border-rule bg-paper-raised"
                  }`}
                >
                  <h3 className={`text-sm font-semibold ${company.highlight ? "text-brand-strong" : "text-ink"}`}>
                    {company.name}
                  </h3>
                  <dl className="mt-3 flex flex-col gap-3">
                    {company.rows.map((row) => (
                      <div key={row.feature}>
                        <dt className="mono text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint">{row.feature}</dt>
                        <dd className="mt-0.5 text-sm leading-relaxed text-ink-soft">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>

            <p className="mt-4 max-w-[80ch] text-xs leading-relaxed text-ink-faint">
              Marketplace services, fees and eligibility requirements can change. Buyers and sellers should review
              each platform&rsquo;s current terms before making a transaction decision. Reviewed 14 September 2026
              against each marketplace&rsquo;s own public pages ({" "}
              <a href="https://flippa.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-strong">Flippa</a>,{" "}
              <a href="https://acquire.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-strong">Acquire.com</a>,{" "}
              <a href="https://empireflippers.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-strong">Empire Flippers</a>,{" "}
              <a href="https://www.motioninvest.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-strong">Motion Invest</a>
              ).
            </p>
          </Inner>
        </Container>
      </section>

      {/* WHY DURQO IS DIFFERENT */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch] text-center sm:mx-auto">
              <DashEyebrow center>Built for Bangladesh</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Why Buy and Sell Digital Businesses Through Durqo?</h2>
              <p className="mx-auto mt-3 max-w-[60ch] text-[0.95rem] leading-relaxed text-ink-soft">
                Durqo combines Bangladesh-focused payment accessibility with a structured marketplace and
                asset-transfer process.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {WHY_DIFFERENT_CARDS.map(({ icon: Icon, title, body }) => (
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
      <section className="border-b border-rule py-14 sm:py-16">
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
            <p className="mx-auto mt-3 max-w-[54ch] text-[0.95rem] leading-relaxed text-white/65">
              Explore income-generating digital businesses or create a listing and connect with interested buyers
              through Durqo.
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
            <p className="mx-auto mt-4 flex max-w-[52ch] flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-white/40">
              <span>Transparent transaction process</span>
              <span>Support from listing to asset transfer</span>
            </p>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
