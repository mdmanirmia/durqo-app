import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Wallet,
  Landmark,
  ShieldCheck,
  Lock,
  ClipboardCheck,
  Search,
  Layers,
  Handshake,
  Globe2,
  Calculator,
  CheckCircle2,
  Smartphone,
  Rocket as RocketGlyph,
  CreditCard,
  Percent,
  Info,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import GroupedFaq, { type FaqGroup } from "@/components/GroupedFaq";
import { BkashIcon } from "@/components/icons/PaymentIcons";
import { CATEGORIES } from "@/lib/categories";
import { categoryIcon } from "@/lib/category-icons";

// Sep 30, 2026: new Bangladesh-focused marketing/positioning page, built per
// the merchant's own brief (chat — "akta page banao ei gulor upor based kore
// jeno bangladeshi user der kache marketing korte pari," followed by the
// intro paragraph and a 10-row "Problems & Solutions" table). Distinct from
// /buy-and-sell-digital-businesses-in-bdt, which is a documentation-style
// page about the BDT checkout/payout mechanics — this page is a standalone
// marketing landing page (for ad traffic and general BD-audience links)
// built around "here's what's broken for Bangladeshi buyers and sellers,
// and here's Durqo's answer to each one."
//
// Sep 30, 2026 (same day) revision: merchant asked to make the design "aro
// premium" and content "aro rich" ("more premium" / "richer"). Added, on
// top of the original hero + problems grid + transaction flow + CTA:
//   - A two-column hero with a "Bangladesh at a Glance" summary card (mirrors
//     the established card pattern from /buy-and-sell-digital-businesses-in-
//     bdt's hero) instead of a single centered column.
//   - A 4-stat metrics strip (16 categories / 5 buyer payment channels / 4
//     seller payout methods / 7-day inspection) — all counts traced to real
//     data, not invented.
//   - A left-accent-bar treatment on the problem cards (color-coded by
//     audience) instead of a plain border, for faster scanning.
//   - A "Pay and Get Paid in BDT" channel showcase (real icons/colors,
//     reused from Footer.tsx's PAYMENT_BADGES and PaymentIcons.tsx).
//   - A full 16-category grid (name + real one-line description from
//     src/lib/categories.ts, real icon from src/lib/category-icons.tsx),
//     each linking to /buy/[categoryId].
//   - A "Why Durqo" 6-card section, reusing already-verified sitewide facts
//     (no buyer marketplace fee, seller fee only after a sale, tracked
//     Transfer Room, 7-day inspection) rather than inventing new claims.
//   - An FAQ section (GroupedFaq, same component as the BDT/Buyer FAQ/Seller
//     FAQ pages) with a matching FAQPage JSON-LD block. Every answer either
//     matches already-published copy elsewhere on the site verbatim/near-
//     verbatim, or restates something already stated earlier on this same
//     page — nothing new is asserted.
// No gradients were introduced — Footer.tsx/BDT page/globals.css all avoid
// decorative gradients in favor of flat design tokens (see globals.css's own
// comment on the .eyebrow pill: "restrained rather than the oversized
// gradient badges of earlier passes"), so "premium" here comes from layout,
// typography scale, real data density and consistent card treatment, not
// gradient fills.
//
// Content rules followed (anthropic-skills:durqo-content-update):
//   - The hero headline and subhead use the merchant's own intro paragraph
//     near-verbatim, not a paraphrase.
//   - Every problem/solution pair is the merchant's own wording, tightened
//     for landing-page flow but not reworded in substance.
//   - Problem #4's solution keeps the merchant's exact escrow phrasing
//     ("Supported transactions may also use Escrow.com as an independent
//     escrow option") — this site never calls the SSLCommerz/Stripe flow
//     itself "escrow"; only Escrow.com, a genuine third-party escrow
//     provider, is described that way.
//   - No exact fee tiers or FX markup figures are stated anywhere on this
//     page — fee timing (buyer: none, seller: only after a sale) is stated,
//     matching /buy-and-sell-digital-businesses-in-bdt's own WHY_DIFFERENT_
//     CARDS content, but the tiered rates themselves are left untouched and
//     unstated here, per the skill's rule against publishing exact figures
//     outside their existing source of truth (src/lib/fees.ts).
//   - No stats, testimonials, partners or features are invented anywhere.
// Facts verified against the live codebase before publishing:
//   - "16 digital business categories" — src/lib/categories.ts, CATEGORIES
//     array, exactly 16 entries. Names and one-line descriptions in the new
//     category grid are copied verbatim from that same file.
//   - "7-day inspection" — matches /transfer-room, /report-an-issue,
//     /how-to-buy and /how-to-sell.
//   - BDT payment channels (bKash/Nagad/Rocket/bank/card = 5) and BDT payout
//     methods (bank/bKash/Nagad/Rocket = 4) match /buy-and-sell-digital-
//     businesses-in-bdt and Footer.tsx's PAYMENT_BADGES exactly.
//   - "No buyer marketplace fee" / "seller fee only after a sale" — matches
//     /buy-and-sell-digital-businesses-in-bdt's WHY_DIFFERENT_CARDS and FAQ.
//   - Free valuation tool — /valuation route exists (see
//     claude/free-valuation-lead-gen-addendum.md).
export const metadata: Metadata = {
  title: "Durqo for Bangladesh | Buy and Sell Digital Businesses Worldwide",
  description:
    "Durqo connects Bangladesh to the global digital business marketplace. Buy in BDT through bKash, Nagad, Rocket, bank transfer or card, or sell internationally and get paid out in BDT, across 16 digital business categories with a structured payment, transfer and inspection process built in.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "Durqo for Bangladesh | Buy and Sell Digital Businesses Worldwide",
    description:
      "Bangladeshi buyers can purchase digital businesses in BDT. Bangladeshi sellers can reach global buyers and get paid out in BDT. A structured payment, transfer and inspection process keeps every deal organized.",
    url: "https://www.durqo.com/durqo-bangladesh",
  },
  twitter: {
    card: "summary_large_image",
    title: "Durqo for Bangladesh | Buy and Sell Digital Businesses Worldwide",
    description:
      "Bangladeshi buyers can purchase digital businesses in BDT. Bangladeshi sellers can reach global buyers and get paid out in BDT. A structured payment, transfer and inspection process keeps every deal organized.",
  },
  alternates: { canonical: "https://www.durqo.com/durqo-bangladesh" },
};

const PAGE_URL = "https://www.durqo.com/durqo-bangladesh";

const BREADCRUMB_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.durqo.com" },
    { "@type": "ListItem", position: 2, name: "Durqo for Bangladesh", item: PAGE_URL },
  ],
};

const WEBPAGE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Durqo for Bangladesh",
  description:
    "Durqo connects Bangladesh to the global digital business marketplace, with BDT payments for buyers, BDT payouts for sellers, and a structured payment, transfer and inspection process.",
  url: PAGE_URL,
  isPartOf: { "@type": "WebSite", name: "Durqo", url: "https://www.durqo.com" },
};

function DashEyebrow({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <p
      className={`mono mb-4 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-ink-soft ${
        center ? "justify-center" : ""
      }`}
    >
      <span className="h-px w-6 bg-brand" aria-hidden />
      {children}
    </p>
  );
}

function Inner({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1200px] ${className}`}>{children}</div>;
}

const STATS = [
  { value: "16", label: "Digital business categories" },
  { value: "5", label: "Local ways to pay in BDT" },
  { value: "4", label: "Local BDT payout methods" },
  { value: "7-Day", label: "Buyer inspection window" },
];

const BUYER_CHANNELS = [
  { icon: BkashIcon, label: "bKash", tint: "text-[#E2136E]" },
  { icon: Smartphone, label: "Nagad", tint: "text-[#ED1C24]" },
  { icon: RocketGlyph, label: "Rocket", tint: "text-[#7B1E3F]" },
  { icon: Landmark, label: "Bank Transfer", tint: "text-brand-strong" },
  { icon: CreditCard, label: "Card", tint: "text-ink-soft" },
];

const PAYOUT_METHODS = [
  { icon: Landmark, label: "Bank Transfer", tint: "text-brand-strong" },
  { icon: BkashIcon, label: "bKash", tint: "text-[#E2136E]" },
  { icon: Smartphone, label: "Nagad", tint: "text-[#ED1C24]" },
  { icon: RocketGlyph, label: "Rocket", tint: "text-[#7B1E3F]" },
];

type Audience = "For Buyers" | "For Sellers" | "For Everyone";

const AUDIENCE_STYLE: Record<Audience, { pill: string; icon: string; bar: string }> = {
  "For Buyers": { pill: "bg-brand-soft text-brand-strong", icon: "bg-brand-soft text-brand-strong", bar: "bg-brand" },
  "For Sellers": { pill: "bg-gold-soft text-[#92730F]", icon: "bg-gold-soft text-[#92730F]", bar: "bg-gold" },
  "For Everyone": { pill: "bg-paper-sunk text-ink-soft", icon: "bg-paper-sunk text-ink-soft", bar: "bg-ink-faint" },
};

const PROBLEMS: {
  audience: Audience;
  icon: typeof Wallet;
  problem: string;
  solution: string;
}[] = [
  {
    audience: "For Buyers",
    icon: Wallet,
    problem: "Paying an international seller in BDT is hard — most global marketplaces only take cards or wires priced in USD.",
    solution: "Buy in BDT through supported local payment methods, including bKash, Nagad, Rocket, bank transfer or card.",
  },
  {
    audience: "For Sellers",
    icon: Landmark,
    problem: "Bangladeshi sellers struggle to reach buyers outside the country, and getting paid back in BDT is even harder.",
    solution: "Sell to buyers anywhere in the world and get paid out in BDT — through bank transfer, bKash, Nagad or Rocket.",
  },
  {
    audience: "For Buyers",
    icon: ShieldCheck,
    problem: "Buyers worry about paying for a business and never actually receiving the assets.",
    solution: "Every purchase moves through a structured Asset Transfer Room with a 7-day inspection period before the sale is finalized.",
  },
  {
    audience: "For Everyone",
    icon: Lock,
    problem: "Both sides carry payment and delivery risk in a deal this size.",
    solution:
      "A structured process — payment, transfer, inspection, approval, then payout — keeps things organized end to end. Supported transactions may also use Escrow.com as an independent escrow option.",
  },
  {
    audience: "For Everyone",
    icon: ClipboardCheck,
    problem: "Assets can go missing or not match what was promised after the handover.",
    solution: "Buyers can report an issue and have the transaction reviewed, instead of the sale auto-approving.",
  },
  {
    audience: "For Buyers",
    icon: Search,
    problem: "Listing information on many marketplaces can't be trusted.",
    solution:
      "Listings go through review before they go live and carry verification signals, including supported Google Analytics connections — though buyers should still do their own diligence.",
  },
  {
    audience: "For Everyone",
    icon: Layers,
    problem: "A sale with several moving parts — domain, app, accounts, documents — is hard to hand over cleanly.",
    solution: "The Transfer Room tracks every asset in the sale individually, so nothing gets lost in a multi-part handover.",
  },
  {
    audience: "For Sellers",
    icon: Handshake,
    problem: "A seller already has a buyer lined up through Facebook or a personal contact, but no reliable way to actually close the deal.",
    solution: "Bring that buyer onto Durqo and run the sale through the same structured Transfer Room process.",
  },
  {
    audience: "For Sellers",
    icon: Globe2,
    problem: "Selling only within Bangladesh limits how many buyers ever see the listing.",
    solution: "Reach international buyers across Durqo's 16 digital business categories.",
  },
  {
    audience: "For Sellers",
    icon: Calculator,
    problem: "Many owners have no idea what their business is actually worth.",
    solution: "Get a free indicative valuation before deciding whether — or when — to sell.",
  },
];

const WHY_DURQO_CARDS = [
  { icon: Layers, title: "16 Digital Business Categories", body: "Buy or sell across websites, e-commerce, SaaS, apps, domains and more — all in one marketplace." },
  { icon: Wallet, title: "Buy and Sell in BDT", body: "Bangladesh-based buyers pay in BDT, and eligible sellers get paid out in BDT through supported local methods." },
  { icon: Percent, title: "No Buyer Marketplace Fee", body: "Durqo does not charge buyers a marketplace fee. Buyers pay the agreed purchase price, although disclosed payment-provider, banking or currency charges may apply." },
  { icon: Percent, title: "Seller Fee Only After a Sale", body: "Durqo deducts the applicable success fee from the seller only after a successful sale." },
  { icon: ShieldCheck, title: "Structured, Tracked Transfers", body: "Every sale moves through the Transfer Room, which stays locked until the complete purchase price has been received and verified." },
  { icon: ClipboardCheck, title: "7-Day Buyer Inspection", body: "Buyers get a 7-day window to inspect every asset in the sale before the transfer is finalized." },
];

const TRANSACTION_STEPS = [
  { title: "Payment Is Confirmed", body: "The buyer's payment is received and verified before the sale moves forward." },
  { title: "Transfer Room Opens", body: "Buyer and seller move into a private Transfer Room to hand over every asset in the sale." },
  { title: "7-Day Inspection", body: "The buyer has 7 days to inspect the assets against what was agreed." },
  { title: "Buyer Approves", body: "The buyer approves the completed transfer, or reports an issue for review instead of an automatic approval." },
  { title: "Seller Is Paid Out", body: "Once the transfer is approved, the seller can request their payout — including in BDT for Bangladeshi sellers." },
];

const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: "Buying & selling in BDT",
    items: [
      {
        question: "Can I pay for a business in BDT from Bangladesh?",
        answer: "Yes. Bangladesh-based buyers can pay for eligible digital businesses in BDT through SSLCommerz, using bKash, Nagad, Rocket, a supported bank, or a credit or debit card.",
      },
      {
        question: "Can I get paid out in BDT as a Bangladeshi seller?",
        answer: "Yes. After a successful sale, completed asset transfer and any required review, eligible sellers can request their available earnings through bank transfer, bKash, Nagad or Rocket.",
      },
      {
        question: "I already have a buyer through Facebook or a personal contact — can I still use Durqo?",
        answer: "Yes. Bring that buyer onto Durqo and run the sale through the same structured payment, Transfer Room and inspection process as any other listing.",
      },
      {
        question: "How much does it cost to buy or sell on Durqo?",
        answer: (
          <>
            Durqo does not charge buyers a marketplace fee. Sellers are charged a tiered success fee, deducted only
            after a successful sale — see{" "}
            <Link href="/buy-and-sell-digital-businesses-in-bdt" className="font-semibold text-brand-strong hover:underline">
              Buy &amp; Sell in BDT
            </Link>{" "}
            for the full fee schedule.
          </>
        ),
      },
    ],
  },
  {
    heading: "Trust & safety",
    items: [
      {
        question: "Is SSLCommerz an escrow service?",
        answer:
          "No. SSLCommerz is a payment gateway or payment processor and is not described as an escrow provider. Durqo holds the buyer's payment until the transfer is approved, and supported transactions may also use Escrow.com as an independent escrow option.",
      },
      {
        question: "What happens if the assets don't match what was agreed?",
        answer: "The buyer can report an issue and have the transaction reviewed, instead of the sale auto-approving.",
      },
      {
        question: "How is Durqo different from Flippa or Acquire.com?",
        answer:
          "Flippa and Acquire.com are established international marketplaces serving broad global audiences. Durqo is the first marketplace specifically built to support the purchase of digital businesses in BDT and eligible seller payouts through supported local methods.",
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

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { q: "Can I pay for a business in BDT from Bangladesh?", a: "Yes. Bangladesh-based buyers can pay for eligible digital businesses in BDT through SSLCommerz, using bKash, Nagad, Rocket, a supported bank, or a credit or debit card." },
    { q: "Can I get paid out in BDT as a Bangladeshi seller?", a: "Yes. After a successful sale, completed asset transfer and any required review, eligible sellers can request their available earnings through bank transfer, bKash, Nagad or Rocket." },
    { q: "I already have a buyer through Facebook or a personal contact — can I still use Durqo?", a: "Yes. Bring that buyer onto Durqo and run the sale through the same structured payment, Transfer Room and inspection process as any other listing." },
    { q: "How much does it cost to buy or sell on Durqo?", a: "Durqo does not charge buyers a marketplace fee. Sellers are charged a tiered success fee, deducted only after a successful sale." },
    { q: "Is SSLCommerz an escrow service?", a: "No. SSLCommerz is a payment gateway or payment processor and is not described as an escrow provider. Durqo holds the buyer's payment until the transfer is approved, and supported transactions may also use Escrow.com as an independent escrow option." },
    { q: "What happens if the assets don't match what was agreed?", a: "The buyer can report an issue and have the transaction reviewed, instead of the sale auto-approving." },
    { q: "How is Durqo different from Flippa or Acquire.com?", a: "Flippa and Acquire.com are established international marketplaces serving broad global audiences. Durqo is the first marketplace specifically built to support the purchase of digital businesses in BDT and eligible seller payouts through supported local methods." },
    { q: "Where can I get help?", a: "Contact support@durqo.com before repeating a payment, changing payment methods or sending money using different instructions." },
  ].map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

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

export default function DurqoBangladeshPage() {
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
                <DashEyebrow>🇧🇩 Bangladesh to the world</DashEyebrow>
                <h1 className="text-4xl leading-[1.1] sm:text-5xl lg:text-[3.3rem]">
                  Durqo Connects Bangladesh to the{" "}
                  <span className="text-brand">Global Digital Business Marketplace.</span>
                </h1>
                <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-ink-soft">
                  Buy international digital businesses using BDT through supported local payment methods, or sell to
                  buyers at home and abroad and get paid out in BDT. A structured payment, asset transfer and
                  inspection process keeps every transaction organized and transparent.
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
              </div>

              <div className="min-w-0 rounded-2xl border border-rule bg-paper-raised p-6 shadow-sm sm:p-7">
                <p className="mono mb-4 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  Bangladesh at a Glance
                </p>

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <Wallet size={16} />
                  </span>
                  <div>
                    <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">For buyers</p>
                    <h3 className="text-sm font-semibold text-ink">Pay in BDT Through Local Methods</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      Supported channels include bKash, Nagad, Rocket, bank transfer and card.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {BUYER_CHANNELS.map(({ label }) => (
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
                    <Landmark size={16} />
                  </span>
                  <div>
                    <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-[#92730F]">For sellers</p>
                    <h3 className="text-sm font-semibold text-ink">Get Paid Out in BDT</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      Supported payout methods include bank transfer, bKash, Nagad and Rocket, subject to eligibility
                      and verification.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {PAYOUT_METHODS.map(({ label }) => (
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

      {/* STATS STRIP */}
      <section className="border-b border-rule bg-paper-raised py-10">
        <Container>
          <Inner>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-4">
              {STATS.map((stat, i) => (
                <div
                  key={stat.label}
                  className={`px-2 text-center sm:border-l sm:border-rule sm:px-4 sm:text-left ${i === 0 ? "sm:border-l-0 sm:px-0" : ""}`}
                >
                  <p className="mono text-3xl font-bold tabular-nums text-brand-strong sm:text-4xl">{stat.value}</p>
                  <p className="mt-1 text-xs leading-snug text-ink-soft">{stat.label}</p>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* PROBLEMS & SOLUTIONS */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>The problems we hear most</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Built to Solve What Actually Gets in the Way</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                These are the real obstacles Bangladeshi buyers and sellers run into when trying to buy or sell a
                digital business internationally — and how Durqo addresses each one.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {PROBLEMS.map(({ audience, icon: Icon, problem, solution }, i) => {
                const style = AUDIENCE_STYLE[audience];
                return (
                  <div
                    key={problem}
                    className="relative overflow-hidden rounded-xl border border-rule bg-paper-raised p-6 pl-7 transition hover:border-rule-strong hover:shadow-sm"
                  >
                    <span className={`absolute inset-y-0 left-0 w-1.5 ${style.bar}`} aria-hidden />
                    <div className="mb-4 flex items-center justify-between">
                      <span className={`mono grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm ${style.icon}`}>
                        <Icon size={16} />
                      </span>
                      <span className="mono text-xs font-semibold text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <span className={`mono mb-3 inline-flex rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider ${style.pill}`}>
                      {audience}
                    </span>
                    <p className="text-sm font-medium leading-relaxed text-ink">{problem}</p>
                    <div className="mt-3 flex items-start gap-2 border-t border-rule pt-3">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand-strong" />
                      <p className="text-sm leading-relaxed text-ink-soft">{solution}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Inner>
        </Container>
      </section>

      {/* PAY & GET PAID IN BDT */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>Local money, global reach</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Pay and Get Paid the Way You Already Do</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                No foreign wire transfers or unfamiliar payment forms — Durqo runs on the same local payment methods
                Bangladeshi buyers and sellers already use every day.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-rule bg-paper-raised p-6">
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                  <Wallet size={19} />
                </span>
                <p className="mono mb-1 text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">For buyers</p>
                <h3 className="text-lg font-semibold text-ink">Pay for a Business in BDT</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Choose SSLCommerz at checkout and select one of five supported local payment channels.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {BUYER_CHANNELS.map(({ icon: Icon, label, tint }) => (
                    <span key={label} className="mono flex items-center gap-1.5 rounded-full border border-rule bg-paper-sunk px-3 py-1.5 text-xs text-ink-soft">
                      <Icon size={14} className={tint} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-rule bg-paper-raised p-6">
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-gold-soft text-[#92730F]">
                  <Landmark size={19} />
                </span>
                <p className="mono mb-1 text-[0.68rem] font-semibold uppercase tracking-wider text-[#92730F]">For sellers</p>
                <h3 className="text-lg font-semibold text-ink">Get Paid Out in BDT</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Once eligible earnings are available, request a payout through one of four supported local methods.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {PAYOUT_METHODS.map(({ icon: Icon, label, tint }) => (
                    <span key={label} className="mono flex items-center gap-1.5 rounded-full border border-rule bg-paper-sunk px-3 py-1.5 text-xs text-ink-soft">
                      <Icon size={14} className={tint} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* 16 CATEGORIES */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>One marketplace, sixteen categories</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Buy or Sell Across 16 Digital Business Categories</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Whatever kind of digital business you&rsquo;re buying or selling, it has a home on Durqo.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {CATEGORIES.map((c) => {
                const Icon = categoryIcon(c.id);
                return (
                  <Link
                    key={c.id}
                    href={`/buy/${c.id}`}
                    className="group rounded-xl border border-rule bg-paper-raised p-5 transition hover:border-brand-strong hover:shadow-sm"
                  >
                    <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-paper-sunk text-ink-soft transition group-hover:bg-brand-soft group-hover:text-brand-strong">
                      <Icon size={17} />
                    </span>
                    <h3 className="text-sm font-semibold text-ink">{c.name}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">{c.description}</p>
                  </Link>
                );
              })}
            </div>
          </Inner>
        </Container>
      </section>

      {/* HOW A DURQO TRANSACTION WORKS */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[900px]">
            <div className="mb-10 text-center">
              <DashEyebrow center>From payment to payout</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">How a Durqo Transaction Works</h2>
              <p className="mx-auto mt-3 max-w-[64ch] text-center text-[0.95rem] leading-relaxed text-ink-soft">
                The same structured flow runs behind every sale on Durqo, whether the buyer or seller is in
                Bangladesh or anywhere else.
              </p>
            </div>
            <NumberedFlow steps={TRANSACTION_STEPS} />
          </Inner>
        </Container>
      </section>

      {/* WHY DURQO */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch] text-center sm:mx-auto">
              <DashEyebrow center>Built for Bangladesh</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Why Buy and Sell Through Durqo?</h2>
              <p className="mx-auto mt-3 max-w-[60ch] text-center text-[0.95rem] leading-relaxed text-ink-soft">
                Durqo combines Bangladesh-focused payment accessibility with a structured marketplace and
                asset-transfer process.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {WHY_DURQO_CARDS.map(({ icon: Icon, title, body }) => (
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
            <h2 className="mb-8 text-center text-2xl sm:text-3xl">Everything About Buying and Selling from Bangladesh.</h2>
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
              Browse income-generating digital businesses in BDT, or list your business and reach buyers around the
              world.
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
