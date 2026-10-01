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
//
// Sep 22, 2026: this page's "Selling & payouts" FAQ group and seller-payout
// section previously only said payouts were "subject to seller eligibility,
// verification" — vague enough that it never actually named identity
// verification (KYC) or the payout-name-matching requirement (site owner's
// KYC policy, same day — see claude/kyc-identity-verification-and-buyer-
// verification-addendum.md). Added an explicit FAQ (mirrored in the
// FAQPage JSON-LD) and a callout box in the seller-payout section naming
// both requirements directly, matching how every other payout-related page
// now states them.
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
  { title: "Choose a Business", body: "Browse the listing, check the business details, and message the seller if you have questions." },
  { title: "Select BDT Payment", body: "At checkout, choose SSLCommerz and pick bKash, Nagad, Rocket, your bank or a card." },
  { title: "Review the Amount", body: "Check the price, the exchange rate and the exact BDT total before you confirm." },
  { title: "Complete the Funding", body: "Pay the full BDT amount if the price is USD 2,000 or less. For anything higher, pay the first USD 2,000 and follow the emailed instructions for the rest." },
  { title: "Start the Asset Transfer", body: "Once your full payment clears, you and the seller get access to a private Transfer Room to hand over everything you bought." },
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
  { icon: Landmark, title: "Bank Transfer", body: "Send your earnings straight to a Bangladeshi bank account.", tint: "text-brand-strong" },
  { icon: BkashIcon, title: "bKash", body: "Withdraw to your bKash account.", tint: "text-[#E2136E]" },
  { icon: Smartphone, title: "Nagad", body: "Withdraw to your Nagad account.", tint: "text-[#ED1C24]" },
  { icon: RocketGlyph, title: "Rocket", body: "Withdraw to your Rocket account.", tint: "text-[#7B1E3F]" },
];

const PAYOUT_LIMITS = [
  { method: "bKash", limit: "Up to ৳50,000 per day and ৳300,000 per month" },
  { method: "Nagad", limit: "Up to ৳50,000 per day and ৳300,000 per month" },
  { method: "Rocket", limit: "Up to ৳50,000 per day and ৳300,000 per month" },
];

const TRANSFER_STEPS = [
  { title: "Seller Submits the Agreed Assets", body: "The seller hands over everything agreed on, such as websites, domains, apps, source files, accounts or documents." },
  { title: "Buyer Reviews Each Item", body: "The buyer checks each item against what was agreed." },
  { title: "Transfer Is Approved or Reviewed", body: "The buyer approves the transfer, or reports an issue if something's off." },
];

type Cell = { text: string; highlight?: boolean };
const COMPARISON_ROWS: { feature: string; durqo: Cell; flippa: Cell; acquire: Cell; empireFlippers: Cell; motionInvest: Cell }[] = [
  {
    feature: "Market focus",
    durqo: { text: "Built for Bangladesh, open to global listings", highlight: true },
    flippa: { text: "Global marketplace and exit platform" },
    acquire: { text: "Global marketplace for online businesses" },
    empireFlippers: { text: "Curated brokerage for established businesses" },
    motionInvest: { text: "Focused on content sites and YouTube channels" },
  },
  {
    feature: "Digital business types",
    durqo: { text: "Websites, e-commerce, SaaS, apps and more", highlight: true },
    flippa: { text: "A wide range of online businesses" },
    acquire: { text: "SaaS, e-commerce, agencies, apps and more" },
    empireFlippers: { text: "Vetted e-commerce, SaaS, content and service businesses" },
    motionInvest: { text: "Mainly content sites and YouTube channels" },
  },
  {
    feature: "Bangladesh-focused BDT flow",
    durqo: { text: "Yes, BDT payments and payouts", highlight: true },
    flippa: { text: "No dedicated BDT payment flow" },
    acquire: { text: "No dedicated BDT payment flow" },
    empireFlippers: { text: "No dedicated BDT payment flow" },
    motionInvest: { text: "No dedicated BDT payment flow" },
  },
  {
    feature: "Seller fee",
    durqo: { text: "Tiered success fee, charged only after a sale", highlight: true },
    flippa: { text: "Listing fee plus a plan-based success fee" },
    acquire: { text: "Listing and closing fees, plan-based" },
    empireFlippers: { text: "Brokerage commission, based on sale terms" },
    motionInvest: { text: "Fees vary by transaction and platform terms" },
  },
  {
    feature: "Transfer support",
    durqo: { text: "Private Transfer Room tied to each order", highlight: true },
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
  { icon: ShoppingCart, title: "Pay in BDT", body: "Pay for the business in Bangladeshi Taka through SSLCommerz, and see the exact amount before you confirm." },
  { icon: Landmark, title: "Get Paid Out in BDT", body: "Once your sale and transfer are complete, withdraw your earnings through bank transfer, bKash, Nagad or Rocket." },
  { icon: Layers, title: "Many Kinds of Businesses", body: "Buy and sell websites, e-commerce stores, SaaS products, apps and other income-generating businesses." },
  { icon: ShieldCheck, title: "A Transfer Room for Every Order", body: "The Transfer Room only unlocks once your full payment is received and confirmed, so payment and handover always stay in sync." },
  { icon: Users, title: "No Fee for Buyers", body: "Durqo doesn't charge buyers a marketplace fee. You just pay the agreed price, plus any payment-provider or currency charges your bank discloses." },
  { icon: Percent, title: "Sellers Only Pay After a Sale", body: "Durqo only deducts its success fee once your sale has gone through." },
];

const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: "Buying in BDT",
    items: [
      {
        question: "Who can pay for a business in BDT?",
        answer: "Buyers based in Bangladesh, by choosing SSLCommerz at checkout.",
      },
      {
        question: "Which payment methods are available through SSLCommerz?",
        answer: "Through SSLCommerz, you can pay with bKash, Nagad, Rocket, your bank, or a credit or debit card.",
      },
      {
        question: "What happens if the business costs USD 2,000 or less?",
        answer:
          "You pay the full BDT equivalent through SSLCommerz, right at checkout. Durqo shows you the exchange rate and the exact amount before you confirm.",
      },
      {
        question: "What happens if the business costs more than USD 2,000?",
        answer:
          "You pay the BDT equivalent of USD 2,000 through SSLCommerz to start. Once that's confirmed, Durqo emails you instructions for paying the rest. The sale only moves to asset transfer once the full amount has been received and confirmed.",
      },
      {
        question: "Can buyers and sellers both use Bangladeshi Taka on Durqo?",
        answer:
          "Yes. Buyers in Bangladesh can pay in BDT through SSLCommerz, and once a sale closes, the transfer is complete and any required review has finished, sellers can withdraw their earnings through supported BDT payout methods too.",
      },
    ],
  },
  {
    heading: "Selling & payouts",
    items: [
      {
        question: "When does the Transfer Room become available?",
        answer:
          "As soon as your full payment is received and confirmed. A partial payment, like the initial $2,000 on a larger purchase, doesn't unlock it on its own.",
      },
      {
        question: "When can a seller request a payout?",
        answer:
          "After your sale and asset transfer are complete, any required review has finished, and your earnings show as available in the Seller Dashboard.",
      },
      {
        question: "Which BDT payout methods does Durqo support?",
        answer:
          "Bank transfer, bKash, Nagad and Rocket, depending on your eligibility, verification status and that method's withdrawal limits.",
      },
      {
        question: "Does a seller need to verify their identity before withdrawing?",
        answer:
          "Yes. You'll need to complete identity verification (KYC) before your first withdrawal, no matter which payout method you use. The name on your payout account also has to match your verified legal name, Durqo checks this by hand before approving the payout.",
      },
      {
        question: "How long does a seller payout take?",
        answer:
          "Durqo typically reviews and processes a payout within 3–5 business days. After that, your bank or mobile wallet provider may take a little longer to actually credit your account.",
      },
    ],
  },
  {
    heading: "Fees",
    items: [
      {
        question: "Does Durqo charge buyers a marketplace fee?",
        answer:
          "No. You just pay the agreed purchase price, plus any payment-provider, banking or currency charges your bank or SSLCommerz discloses.",
      },
      {
        question: "How much does Durqo charge sellers?",
        answer: (
          <>
            <p>Durqo takes a tiered success fee based on your final sale price, and only once the sale goes through.</p>
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
        answer: "No. SSLCommerz is a payment gateway, it processes your payment, but it doesn't hold funds in escrow.",
      },
      {
        question: "How is Durqo different from Flippa or Acquire.com?",
        answer:
          "Flippa and Acquire.com are established international marketplaces built for a global audience. Durqo is the first marketplace built specifically for buying digital businesses in BDT and paying out eligible sellers through local methods.",
      },
      {
        question: "What should I do if my payment status is pending?",
        answer: (
          <>
            Don&rsquo;t submit the same payment again right away. Check your order status and contact{" "}
            <a href="mailto:support@durqo.com" className="font-semibold text-brand-strong hover:underline">
              support@durqo.com
            </a>{" "}
            so we can review the transaction.
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
            before you repeat a payment, switch payment methods, or send money using different instructions.
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
    { q: "Who can pay for a business in BDT?", a: "Buyers based in Bangladesh, by choosing SSLCommerz at checkout." },
    { q: "Which payment methods are available through SSLCommerz?", a: "Through SSLCommerz, you can pay with bKash, Nagad, Rocket, your bank, or a credit or debit card." },
    { q: "What happens if the business costs USD 2,000 or less?", a: "You pay the full BDT equivalent through SSLCommerz, right at checkout. Durqo shows you the exchange rate and the exact amount before you confirm." },
    { q: "What happens if the business costs more than USD 2,000?", a: "You pay the BDT equivalent of USD 2,000 through SSLCommerz to start. Once that's confirmed, Durqo emails you instructions for paying the rest. The sale only moves to asset transfer once the full amount has been received and confirmed." },
    { q: "Can buyers and sellers both use Bangladeshi Taka on Durqo?", a: "Yes. Buyers in Bangladesh can pay in BDT through SSLCommerz, and once a sale closes, the transfer is complete and any required review has finished, sellers can withdraw their earnings through supported BDT payout methods too." },
    { q: "When does the Transfer Room become available?", a: "As soon as your full payment is received and confirmed. A partial payment, like the initial $2,000 on a larger purchase, doesn't unlock it on its own." },
    { q: "When can a seller request a payout?", a: "After your sale and asset transfer are complete, any required review has finished, and your earnings show as available in the Seller Dashboard." },
    { q: "Which BDT payout methods does Durqo support?", a: "Bank transfer, bKash, Nagad and Rocket, depending on your eligibility, verification status and that method's withdrawal limits." },
    { q: "Does a seller need to verify their identity before withdrawing?", a: "Yes. You'll need to complete identity verification (KYC) before your first withdrawal, no matter which payout method you use. The name on your payout account also has to match your verified legal name, Durqo checks this by hand before approving the payout." },
    { q: "How long does a seller payout take?", a: "Durqo typically reviews and processes a payout within 3-5 business days. After that, your bank or mobile wallet provider may take a little longer to actually credit your account." },
    { q: "Does Durqo charge buyers a marketplace fee?", a: "No. You just pay the agreed purchase price, plus any payment-provider, banking or currency charges your bank or SSLCommerz discloses." },
    { q: "How much does Durqo charge sellers?", a: `Durqo takes a tiered success fee based on your final sale price, and only once the sale goes through: ${SUCCESS_FEE_TIERS.map((t) => `${t.label} → ${fmtRate(t.rate)}`).join(", ")}.` },
    { q: "Is SSLCommerz an escrow service?", a: "No. SSLCommerz is a payment gateway, it processes your payment, but it doesn't hold funds in escrow." },
    { q: "How is Durqo different from Flippa or Acquire.com?", a: "Flippa and Acquire.com are established international marketplaces built for a global audience. Durqo is the first marketplace built specifically for buying digital businesses in BDT and paying out eligible sellers through local methods." },
    { q: "What should I do if my payment status is pending?", a: "Don't submit the same payment again right away. Check your order status and contact support@durqo.com so we can review the transaction." },
    { q: "Where can I get help?", a: "Contact support@durqo.com before you repeat a payment, switch payment methods, or send money using different instructions." },
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
            <div className="grid gap-10 lg:grid-cols-[56fr_44fr] lg:items-start lg:gap-16">
              <div className="min-w-0">
                <DashEyebrow>BDT payments for Bangladesh</DashEyebrow>
                <h1 className="text-4xl leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
                  Buy and Sell Digital Businesses with{" "}
                  <span className="text-brand">Bangladeshi Taka (BDT).</span>
                </h1>
                <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-ink-soft">
                  Durqo is the first marketplace built for buying and selling digital businesses in BDT. Buyers in
                  Bangladesh can purchase websites, e-commerce stores, SaaS products, apps and other
                  income-generating businesses using local payment methods. Once a sale and the asset transfer are
                  complete, sellers can withdraw their earnings the same way, straight to a BDT bank account or
                  mobile wallet.
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
                    { icon: CheckCircle2, label: "See the exact BDT amount before you pay" },
                    { icon: ShieldCheck, label: "Pay and get paid with bKash, Nagad, Rocket, bank or card" },
                    { icon: Landmark, label: "Every handover tracked in the Transfer Room" },
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
                      Pay with bKash, Nagad, Rocket, your bank, or a credit or debit card, all through SSLCommerz.
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
                    <h3 className="text-sm font-semibold text-ink">Get paid out in BDT</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      Withdraw through bank transfer, bKash, Nagad or Rocket once your sale is complete and your
                      identity is verified.
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
                    Buyer payments and seller payouts are two separate steps. A buyer&rsquo;s payment doesn&rsquo;t
                    instantly put money in a seller&rsquo;s account.
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
              <DashEyebrow center>Find what applies to you</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Buying and Selling Work a Little Differently</h2>
              <p className="mx-auto mt-3 max-w-[52ch] text-center text-sm text-ink-soft">
                Jump to the part that matches what you&rsquo;re doing on Durqo.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-rule bg-paper-raised p-7">
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                  <ShoppingCart size={19} />
                </span>
                <p className="mono mb-1 text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">For buyers</p>
                <h3 className="text-lg font-semibold text-ink">Buy a Business and Pay in BDT</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  See exactly how much you&rsquo;ll pay in BDT, which payment methods you can use, and what happens
                  for purchases over $2,000.
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
                <h3 className="text-lg font-semibold text-ink">Sell a Business and Get Paid in BDT</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  See when your money becomes available after a sale, and how to withdraw it to your bank account or
                  mobile wallet.
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
                At checkout, choose SSLCommerz and pay in BDT. Durqo shows you the exact amount, and the exchange
                rate used to calculate it, before you confirm anything.
              </p>
            </div>

            <h3 className="mb-2 text-lg font-semibold text-ink">Ways to Pay</h3>
            <p className="mb-4 max-w-[70ch] text-sm text-ink-soft">
              Through SSLCommerz, you can pay with bKash, Nagad, Rocket, your bank, or a credit or debit card.
            </p>
            <div className="mb-14 flex flex-wrap gap-2">
              {BUYER_PAYMENT_CHANNELS.map((label) => (
                <span key={label} className="mono rounded-full border border-rule bg-paper-raised px-3.5 py-1.5 text-xs text-ink-soft">
                  {label}
                </span>
              ))}
            </div>

            <h3 className="mb-5 text-lg font-semibold text-ink">What You&rsquo;ll Pay at Checkout</h3>
            <p className="mb-6 max-w-[70ch] text-sm text-ink-soft">
              How much you pay through SSLCommerz depends on the business&rsquo;s listed price in USD.
            </p>
            <div className="mb-5 grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-rule bg-brand-soft p-6">
                <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-paper-raised text-brand-strong">
                  <Tag size={18} />
                </span>
                <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">USD 2,000 or less</p>
                <h4 className="mt-1 text-base font-semibold text-ink">Pay the Full BDT Amount Online</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  Pay the full BDT equivalent through SSLCommerz, right at checkout. You&rsquo;ll see the exact
                  amount and the exchange rate before you confirm.
                </p>
                <p className="mono mt-3 text-xs font-semibold text-brand-strong">Status: Paid in full, right away</p>
              </div>
              <div className="rounded-xl border border-gold/30 bg-gold-soft p-6">
                <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-paper-raised text-[#92730F]">
                  <FileText size={18} />
                </span>
                <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-[#92730F]">Above USD 2,000</p>
                <h4 className="mt-1 text-base font-semibold text-ink">Pay the Initial USD 2,000 Equivalent</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  Pay the BDT equivalent of $2,000 through SSLCommerz to start. Once that&rsquo;s confirmed, Durqo
                  emails you instructions for paying the rest by wire transfer, credit card or debit card.
                </p>
                <p className="mono mt-3 text-xs font-semibold text-[#92730F]">Status: Unlocks once the full balance clears</p>
              </div>
            </div>
            <div className="mb-14 flex items-start gap-3 rounded-xl border border-rule bg-paper-raised p-5">
              <Info size={18} className="mt-0.5 shrink-0 text-brand-strong" />
              <p className="text-sm leading-relaxed text-ink-soft">
                For purchases over $2,000, that first SSLCommerz payment is just a deposit. The sale only moves to
                asset transfer once Durqo has received and confirmed the full amount.
              </p>
            </div>

            <DashEyebrow>Step by step</DashEyebrow>
            <h3 className="mb-2 text-lg font-semibold text-ink">How Buying in BDT Works</h3>
            <p className="mb-8 max-w-[70ch] text-sm text-ink-soft">
              From choosing a business to receiving it, here&rsquo;s the full path.
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
              <h2 className="text-2xl sm:text-3xl">Get Paid Out in BDT</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                A buyer&rsquo;s payment doesn&rsquo;t land in your account right away. First the sale has to close,
                the handover has to finish, and Durqo has to complete its review, then your payout becomes
                available.
              </p>
            </div>

            <h3 className="mb-8 text-lg font-semibold text-ink">From Sale to Payout</h3>
            <NumberedFlow steps={SELLER_STATUSES} />

            <h3 className="mb-5 mt-14 text-lg font-semibold text-ink">Where the Money Goes</h3>
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
              Once your earnings show as available in the Seller Dashboard, just open Earnings &amp; Withdrawals,
              pick a payout method, enter your account details and submit the request.
            </p>

            <div className="mt-5 flex max-w-[72ch] items-start gap-2.5 rounded-lg border border-rule bg-paper-raised px-4 py-3.5">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand-strong" aria-hidden />
              <p className="text-sm leading-relaxed text-ink">
                Before your first withdrawal, you&rsquo;ll need to verify your identity (KYC). The name on your
                payout account also has to match your verified legal name, Durqo checks every payout by hand.
              </p>
            </div>

            <div className="mt-5 max-w-[72ch] rounded-xl border border-rule bg-paper-raised p-5">
              <p className="text-sm font-semibold text-ink">Each method has its own daily and monthly limit:</p>
              <dl className="mt-3 flex flex-col gap-1.5">
                {PAYOUT_LIMITS.map(({ method, limit }) => (
                  <div key={method} className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <dt className="mono text-xs font-semibold uppercase tracking-wider text-ink-soft">{method}</dt>
                    <dd className="text-sm text-ink">{limit}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-ink-faint">
                These limits are separate for each method, using bKash doesn&rsquo;t affect your Nagad or Rocket
                limit. Bank transfer isn&rsquo;t capped this way at all. Either way, the withdrawal form always shows
                the USD amount leaving your balance and the BDT amount you&rsquo;ll receive.
              </p>
            </div>

            <p className="mt-5 max-w-[72ch] text-sm leading-relaxed text-ink-soft">
              Most payouts are reviewed and sent within 3&ndash;5 business days. After that, your bank or mobile
              wallet provider may take a little longer to actually credit your account.
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
                    Every business is listed in USD. When you choose to pay in BDT, Durqo shows you the exchange
                    rate and the exact BDT total before you confirm anything.
                  </p>
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Store size={16} className="text-brand-strong" />
                    <h4 className="text-sm font-semibold text-ink">When You Request a Payout</h4>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    When you withdraw your USD earnings to a BDT method, the Seller Dashboard shows the exchange
                    rate, the USD amount deducted and the BDT you&rsquo;ll receive, all before you submit the
                    request.
                  </p>
                </div>
              </div>
              <p className="mt-6 text-xs leading-relaxed text-ink-faint">
                Whatever you see on that final screen is exactly what you&rsquo;ll pay or receive.
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
              <p className="mx-auto mt-3 max-w-[64ch] text-center text-[0.95rem] leading-relaxed text-ink-soft">
                Once your full payment is in, you and the seller move into a private Transfer Room for that order.
                The seller hands over every asset in the sale, you check each one, then approve the transfer, or
                flag anything that doesn&rsquo;t match.
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
                The Transfer Room only opens once the full purchase price has been received and confirmed. For a
                purchase above $2,000, that initial SSLCommerz payment alone doesn&rsquo;t unlock it. SSLCommerz is a
                payment gateway, it processes the payment, it doesn&rsquo;t hold the seller&rsquo;s funds in escrow
                until the buyer approves the transfer.
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
                Flippa, Acquire.com, Empire Flippers and Motion Invest are well-established international
                marketplaces. Durqo isn&rsquo;t trying to be bigger than them, it&rsquo;s built for one thing they
                aren&rsquo;t: buying and selling digital businesses in Bangladeshi Taka, from payment to payout.
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
              <p className="mx-auto mt-3 max-w-[60ch] text-center text-[0.95rem] leading-relaxed text-ink-soft">
                Pay and get paid in Bangladeshi Taka, with one clear, tracked process from payment to handover.
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
            <p className="mx-auto mt-3 max-w-[54ch] text-center text-[0.95rem] leading-relaxed text-white/65">
              Browse income-generating digital businesses, or list yours and start reaching buyers in Bangladesh and
              beyond.
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
          </Inner>
        </Container>
      </section>
    </main>
  );
}
