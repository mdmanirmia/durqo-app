import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Wallet,
  Landmark,
  ShieldCheck,
  ClipboardCheck,
  Handshake,
  Calculator,
  CheckCircle2,
  Smartphone,
  Rocket as RocketGlyph,
  CreditCard,
  Percent,
  Info,
  Send,
  Eye,
  XCircle,
  Search,
  Clock,
  Lock,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import GroupedFaq, { type FaqGroup } from "@/components/GroupedFaq";
import { BkashIcon, StripeIcon, EscrowIcon } from "@/components/icons/PaymentIcons";
import { CATEGORIES } from "@/lib/categories";
import { categoryIcon } from "@/lib/category-icons";
import { SUCCESS_FEE_TIERS, fmtRate } from "@/lib/fees";
import type { CSSProperties } from "react";
import CountUp from "@/components/CountUp";
import MouseGlow from "@/components/home/MouseGlow";
import { CATEGORY_ACCENTS } from "@/lib/category-accents";
import BdHeroVideo from "@/components/bangladesh/BdHeroVideo";
import ListingCard from "@/components/ListingCard";
import { getPublishedListings } from "@/lib/data/listings.server";

// Oct 30, 2026 ("ei page er design ta perfect koro. Motion type and
// dynamic and khub e premium ... photo or video add korte hole baniye
// koro"): same motion system as the homepage and /sell (globals.css dq-*
// + [data-reveal]); the hero's photo/video slot is a code-built animated
// network (BdNetwork.tsx). Copy is unchanged. Oct 30 (take 2): the hero now
// carries a rendered product film (BdHeroVideo, public/video/), category
// tiles show live listing counts, and problems are an interactive explorer.
function enterDelay(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties;
}
function revealDelay(ms: number): CSSProperties {
  return { "--reveal-delay": `${ms}ms` } as CSSProperties;
}

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
//
// Oct 1, 2026 (Revision 10): merchant asked for more sections/content
// overall after the em-dash + hero-graphic polish pass. Added three new
// sections, each built from already-published facts/copy elsewhere on the
// site rather than anything invented:
//   - Marketplace Fees — the real tiered seller success-fee schedule
//     (SUCCESS_FEE_TIERS/fmtRate from src/lib/fees.ts, the same single
//     source of truth /buy-and-sell-digital-businesses-in-bdt already
//     renders), inserted between Pay & Get Paid in BDT and the 16
//     Categories grid. This page previously deliberately omitted the exact
//     rates; the user's own "more content" request is read as authorization
//     to show the schedule, which is already public on a sibling page.
//   - Free Valuation CTA — a standalone callout linking to /valuation,
//     reusing that page's own copy ("instant estimate," "free, always,"
//     "based on how similar businesses sell on Durqo") and the "before
//     deciding whether or when to sell" phrasing already used in this
//     page's own Problems & Solutions row #10, inserted between Why Durqo
//     and the FAQ.
//   - Related Reading — six internal links (BDT guide, Bangladesh buy/sell
//     how-to pages, how-to-buy, how-to-sell, free valuation), matching the
//     "Keep exploring" pattern already used on
//     /sell-your-online-business-bangladesh, inserted between the FAQ and
//     the Final CTA.
export const metadata: Metadata = {
  title: "Buy & Sell Digital Businesses in BDT | Durqo Bangladesh",
  description:
    "Durqo connects Bangladesh to the global digital business marketplace. Buy in BDT through bKash, Nagad, Rocket, bank transfer or card, or sell internationally and get paid out in BDT, across 16 digital business categories with a structured payment, transfer and inspection process built in.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "Buy & Sell Digital Businesses in BDT | Durqo Bangladesh",
    description:
      "Bangladeshi buyers can purchase digital businesses in BDT. Bangladeshi sellers can reach global buyers and get paid out in BDT. A structured payment, transfer and inspection process keeps every deal organized.",
    url: "https://www.durqo.com/durqo-bangladesh",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy & Sell Digital Businesses in BDT | Durqo Bangladesh",
    description:
      "Bangladeshi buyers can purchase digital businesses in BDT. Bangladeshi sellers can reach global buyers and get paid out in BDT. A structured payment, transfer and inspection process keeps every deal organized.",
  },
  alternates: { canonical: "https://www.durqo.com/durqo-bangladesh" },
};

// Live per-category listing counts must match /buy at request time (same
// reason the homepage is force-dynamic), not a build-time snapshot.
export const dynamic = "force-dynamic";

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

function SectionHead({
  eyebrow,
  title,
  body,
  action,
  center = false,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
  center?: boolean;
  dark?: boolean;
}) {
  return (
    <div className={`mb-10 flex flex-col gap-6 sm:mb-12 ${center ? "items-center text-center" : "lg:flex-row lg:items-end lg:justify-between"}`}>
      <div data-reveal className={`max-w-[64ch] ${center ? "mx-auto" : ""}`}>
        <p
          className={`mono mb-4 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider ${center ? "justify-center" : ""} ${
            dark ? "text-white/55" : "text-ink-soft"
          }`}
        >
          <span className="h-px w-6 bg-brand" aria-hidden />
          {eyebrow}
        </p>
        <h2 className={`text-3xl tracking-tight sm:text-[2.5rem] sm:leading-[1.1] ${dark ? "text-white" : ""}`}>{title}</h2>
        {body && (
          <p className={`mt-4 text-[1rem] leading-relaxed ${center ? "mx-auto text-center" : ""} ${dark ? "text-white/65" : "text-ink-soft"}`}>{body}</p>
        )}
      </div>
      {action && (
        <div data-reveal style={revealDelay(120)} className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}

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

const BUYER_STEPS = [
  { title: "Choose a business", sub: "Browse listings and ask the seller questions.", icon: Search },
  { title: "Pick BDT at checkout", sub: "Select SSLCommerz to pay in Taka.", icon: Wallet },
  { title: "See the exact amount", sub: "Rate and BDT total shown before you confirm.", icon: Eye },
  { title: "Complete the payment", sub: "Durqo verifies it before the next step.", icon: CreditCard },
  { title: "Receive the assets", sub: "Handover and 7-day inspection in the Transfer Room.", icon: Handshake },
];

const LISTING_REVIEW = [
  { title: "Submit your listing", sub: "Add your business data, numbers and assets.", icon: Send },
  { title: "Checked by hand", sub: "Our team manually reviews and verifies your data.", icon: ClipboardCheck },
  { title: "Goes live", sub: "Published only after verification.", icon: CheckCircle2 },
];

const SELLER_STATS = [
  { value: "৳50,000", label: "per day on bKash, Nagad or Rocket (each)", icon: Smartphone, dark: false },
  { value: "৳300,000", label: "per month on each of them. Bank: no MFS limit", icon: Landmark, dark: false },
  { value: "3–5 days", label: "business days to review and process a payout", icon: Clock, dark: true },
  { value: "Exact BDT", label: "rate, USD deduction and BDT payout shown before you submit", icon: Eye, dark: true },
];

const SELLER_STATUSES = ["Sale Completed", "Payout Eligible", "Withdrawal Requested", "Under Review", "Processing", "Paid"];

type Cell = { text: string };
const COMPARISON_ROWS: { feature: string; durqo: Cell; flippa: Cell; acquire: Cell; empireFlippers: Cell; motionInvest: Cell }[] = [
  { feature: "Market focus", durqo: { text: "Global marketplace that accepts BDT payment methods" }, flippa: { text: "Global marketplace and exit platform" }, acquire: { text: "Global marketplace for online businesses" }, empireFlippers: { text: "Curated brokerage for established businesses" }, motionInvest: { text: "Focused on content sites and YouTube channels" } },
  { feature: "Digital business types", durqo: { text: "Websites, e-commerce, SaaS, apps and more" }, flippa: { text: "A wide range of online businesses" }, acquire: { text: "SaaS, e-commerce, agencies, apps and more" }, empireFlippers: { text: "Vetted e-commerce, SaaS, content and service businesses" }, motionInvest: { text: "Mainly content sites and YouTube channels" } },
  { feature: "BDT payment methods", durqo: { text: "Yes - BDT payments and payouts" }, flippa: { text: "No dedicated BDT payment flow" }, acquire: { text: "No dedicated BDT payment flow" }, empireFlippers: { text: "No dedicated BDT payment flow" }, motionInvest: { text: "No dedicated BDT payment flow" } },
  { feature: "Seller fee", durqo: { text: "Tiered success fee, charged only after a sale" }, flippa: { text: "Listing fee plus a plan-based success fee" }, acquire: { text: "Listing and closing fees, plan-based" }, empireFlippers: { text: "Brokerage commission, based on sale terms" }, motionInvest: { text: "Fees vary by transaction and platform terms" } },
  { feature: "Transfer support", durqo: { text: "Private Transfer Room tied to each order" }, flippa: { text: "Deal-management and transaction-support tools" }, acquire: { text: "Acquisition, document and closing tools" }, empireFlippers: { text: "Managed migration and transaction assistance" }, motionInvest: { text: "Transfer assistance for eligible digital assets" } },
];
const COMPARISON_COMPANIES = [
  { name: "Durqo", highlight: true, key: "durqo" as const },
  { name: "Flippa", key: "flippa" as const },
  { name: "Acquire.com", key: "acquire" as const },
  { name: "Empire Flippers", key: "empireFlippers" as const },
  { name: "Motion Invest", key: "motionInvest" as const },
].map((c) => ({ ...c, rows: COMPARISON_ROWS.map((r) => ({ feature: r.feature, value: r[c.key].text })) }));

const TRANSFER_FLOW = [
  { who: "Seller", title: "Hands over each asset", body: "Marks every item on the checklist In Progress, then Submitted, with an optional note such as a transfer code or login details." },
  { who: "Buyer", title: "Checks it within 7 days", body: "Reviews each asset against what was agreed and marks it Received." },
  { who: "Buyer", title: "Approves the handover", body: "Once everything matches, approving completes the sale so the seller's payout can follow." },
  { who: "If something is wrong", title: "Reports an issue", body: "The payment stays on hold and the seller is not paid until Durqo's team has reviewed it." },
];

const TRANSFER_ASSETS: { name: string; status: "received" | "submitted" | "progress" | "pending" }[] = [
  { name: "Domain", status: "received" },
  { name: "Website files and code", status: "submitted" },
  { name: "Hosting account", status: "progress" },
  { name: "Admin and social accounts", status: "pending" },
];

const ASSET_STATUS = {
  received: { label: "✓ RECEIVED", cls: "bg-brand-soft text-brand-strong" },
  submitted: { label: "SUBMITTED", cls: "bg-[#EEF2FF] text-[#4F46E5]" },
  progress: { label: "IN PROGRESS", cls: "bg-gold-soft text-[#92730F]" },
  pending: { label: "PENDING", cls: "bg-paper-sunk text-ink-faint" },
} as const;

const PROBLEMS: { audience: "For Buyers" | "For Sellers" | "For Everyone"; problem: string; solution: string }[] = [
  { audience: "For Buyers", problem: "Global marketplaces only take USD cards or wires.", solution: "Pay in BDT: bKash, Nagad, Rocket, bank or card." },
  { audience: "For Sellers", problem: "Hard to reach buyers outside Bangladesh.", solution: "Your listing is seen by buyers worldwide, across 16 categories." },
  { audience: "For Sellers", problem: "Getting paid back home in BDT is harder still.", solution: "Payout in BDT to bank, bKash, Nagad or Rocket." },
  { audience: "For Buyers", problem: "Can the listing numbers be trusted?", solution: "Every listing is checked by hand and its business data verified before it goes live." },
  { audience: "For Buyers", problem: "Paid, but will the assets ever arrive?", solution: "The Transfer Room tracks every asset, with a 7-day inspection." },
  { audience: "For Buyers", problem: "Assets missing or not as promised.", solution: "Report an issue: payment stays on hold, the seller is not paid until Durqo reviews." },
  { audience: "For Sellers", problem: "A buyer from Facebook, but no reliable way to close.", solution: "Bring them to Durqo and close through the Transfer Room." },
  { audience: "For Sellers", problem: "No idea what the business is worth.", solution: "Get a free, instant valuation estimate." },
];



const RELATED_LINKS = [
  { href: "/buy-and-sell-digital-businesses-in-bdt", label: "Buy & Sell in BDT: The Full Guide" },
  { href: "/how-to-buy-a-website-in-bangladesh", label: "How to Buy a Website in Bangladesh" },
  { href: "/sell-your-online-business-bangladesh", label: "How to Sell an Online Business from Bangladesh" },
  { href: "/how-to-buy", label: "How Buying on Durqo Works" },
  { href: "/how-to-sell", label: "How Selling on Durqo Works" },
  { href: "/valuation", label: "Get a Free Business Valuation" },
];

const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: "Getting started",
    items: [
      {
        question: "Do I need an account to browse listings?",
        answer: "No. Anyone can browse and view listing details, but you'll need a free buyer account to message a seller or make a purchase.",
      },
      {
        question: "Do I need to be in Bangladesh to buy?",
        answer: (
          <>
            No. Durqo is open to buyers anywhere - card payments and Escrow.com are available globally, while bKash,
            Nagad, Rocket and bank transfer are specifically for buyers paying in BDT. See{" "}
            <Link href="/buy-and-sell-digital-businesses-in-bdt" className="font-semibold text-brand-strong hover:underline">
              Buy &amp; Sell in BDT
            </Link>{" "}
            for the full walkthrough.
          </>
        ),
      },
      {
        question: "How do I create a listing?",
        answer: "Sign up for a free seller account, then use “Add New Business” from your seller dashboard to build your listing.",
      },
      {
        question: "Can I list more than one business?",
        answer: "Yes, there's no limit on how many listings you can create.",
      },
    ],
  },
  {
    heading: "Buying & selling in BDT",
    items: [
      {
        question: "Who can pay for a business in BDT?",
        answer: "The BDT checkout option is for Bangladesh-based buyers who select SSLCommerz.",
      },
      {
        question: "What happens if the business costs USD 2,000 or less?",
        answer: "You pay the complete BDT equivalent through SSLCommerz at checkout. Durqo shows the applicable exchange rate and exact BDT amount before you confirm the payment.",
      },
      {
        question: "Can I pay for a business in BDT from Bangladesh?",
        answer: "Yes. Bangladesh-based buyers can pay for eligible digital businesses in BDT through SSLCommerz, using bKash, Nagad, Rocket, a supported bank, or a credit or debit card.",
      },
      {
        question: "Which payment methods are available through SSLCommerz?",
        answer: "SSLCommerz payment channels include bKash, Nagad, Rocket, supported banks, and credit or debit cards.",
      },
      {
        question: "What happens if the business costs more than USD 2,000?",
        answer:
          "You pay the BDT equivalent of USD 2,000 through SSLCommerz at checkout. After that payment is confirmed, Durqo emails you instructions for paying the remaining balance. The purchase proceeds to asset transfer only after the complete balance has been received and verified.",
      },
      {
        question: "Can I get paid out in BDT as a Bangladeshi seller?",
        answer: "Yes. After a successful sale, completed asset transfer and any required review, eligible sellers can request their available earnings through bank transfer, bKash, Nagad or Rocket.",
      },
      {
        question: "I already have a buyer through Facebook or a personal contact - can I still use Durqo?",
        answer: "Yes. Bring that buyer onto Durqo and run the sale through the same structured payment, Transfer Room and inspection process as any other listing.",
      },
      {
        question: "How much does it cost to buy or sell on Durqo?",
        answer: (
          <>
            Durqo does not charge buyers a marketplace fee. Sellers are charged a tiered success fee, deducted only
            after a successful sale - see{" "}
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
    heading: "Listings, badges & verification",
    items: [
      {
        question: "Is a seller's business data checked before the listing goes live?",
        answer: "Yes. Every listing is manually reviewed by Durqo's team, and the seller's business data is verified before the listing is published.",
      },
      {
        question: "What does “Reviewed by Durqo” mean?",
        answer: "Every listing is manually reviewed by our team for accuracy and completeness before it's allowed to publish.",
      },
      {
        question: "What does a “GA Verified” badge mean?",
        answer: "It means Durqo was given read-only access to that listing's Google Analytics account and reviewed the real traffic numbers being shown.",
      },
      {
        question: "What does a “Verified” seller badge mean?",
        answer: "That seller submitted an identity document which Durqo's team reviewed and approved.",
      },
      {
        question: "What is seller identity verification (KYC)?",
        answer:
          "An optional step where a seller uploads an ID document from their dashboard. Once Durqo's team reviews and approves it, the seller's profile shows a Verified badge. The public badge itself is optional, but completing this same identity verification is required before a seller's very first withdrawal.",
      },
      {
        question: "Can I ask the seller questions before buying?",
        answer:
          "Yes, three ways. Many listings already answer common questions in their own Questions & Answers section, written by the seller. You can also post a question in the Comments section on the listing page, and the seller is notified and replies there publicly. Or message the seller directly for a private conversation, which stays in your dashboard inbox.",
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
        answer: "The buyer can report an issue during the 7-day inspection. The payment stays on hold and the seller is not paid until Durqo's team has reviewed the transaction, instead of the sale auto-approving.",
      },
      {
        question: "How is Durqo different from Flippa or Acquire.com?",
        answer:
          "Flippa and Acquire.com are established international marketplaces serving broad global audiences. Durqo is also a global marketplace, but it accepts BDT: buyers in Bangladesh can pay through local methods, and eligible sellers can be paid out in BDT.",
      },
    ],
  },
  {
    heading: "Payouts & support",
    items: [
      {
        question: "When does the Transfer Room become available?",
        answer: "The Transfer Room becomes available after the complete purchase price has been received and verified. An initial partial payment does not make the order fully funded.",
      },
      {
        question: "When can a seller request a payout?",
        answer: "A seller can request a payout after the sale and agreed asset transfer are completed, any required review has finished and the eligible earnings appear as available in the Seller Dashboard.",
      },
      {
        question: "Which BDT payout methods does Durqo support?",
        answer: "Supported local payout methods include bank transfer, bKash, Nagad and Rocket, subject to seller eligibility, verification and applicable withdrawal limits.",
      },
      {
        question: "Does a seller need to verify their identity before withdrawing?",
        answer: "Yes. Identity verification (KYC) is required before a seller's very first withdrawal, regardless of payout method. The account holder name on the withdrawal request must also match the seller's verified legal name, which Durqo checks by hand before approving the payout.",
      },
      {
        question: "What are the withdrawal limits for bKash, Nagad and Rocket?",
        answer: "Each of bKash, Nagad and Rocket allows up to ৳50,000 per day and ৳300,000 per month. The limits apply to each method on its own and are not combined, and bank transfer does not use these mobile financial service limits.",
      },
      {
        question: "How long does a seller payout take?",
        answer:
          "Durqo normally reviews and processes a payout request within 3–5 business days. The receiving bank or payment provider may require additional time to credit the seller's account.",
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

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { q: "Do I need an account to browse listings?", a: "No. Anyone can browse and view listing details, but you'll need a free buyer account to message a seller or make a purchase." },
    { q: "Do I need to be in Bangladesh to buy?", a: "No. Durqo is open to buyers anywhere - card payments and Escrow.com are available globally, while bKash, Nagad, Rocket and bank transfer are specifically for buyers paying in BDT." },
    { q: "How do I create a listing?", a: "Sign up for a free seller account, then use “Add New Business” from your seller dashboard to build your listing." },
    { q: "Can I list more than one business?", a: "Yes, there's no limit on how many listings you can create." },
    { q: "Who can pay for a business in BDT?", a: "The BDT checkout option is for Bangladesh-based buyers who select SSLCommerz." },
    { q: "What happens if the business costs USD 2,000 or less?", a: "You pay the complete BDT equivalent through SSLCommerz at checkout. Durqo shows the applicable exchange rate and exact BDT amount before you confirm the payment." },
    { q: "Can I pay for a business in BDT from Bangladesh?", a: "Yes. Bangladesh-based buyers can pay for eligible digital businesses in BDT through SSLCommerz, using bKash, Nagad, Rocket, a supported bank, or a credit or debit card." },
    { q: "Which payment methods are available through SSLCommerz?", a: "SSLCommerz payment channels include bKash, Nagad, Rocket, supported banks, and credit or debit cards." },
    { q: "What happens if the business costs more than USD 2,000?", a: "You pay the BDT equivalent of USD 2,000 through SSLCommerz at checkout. After that payment is confirmed, Durqo emails you instructions for paying the remaining balance. The purchase proceeds to asset transfer only after the complete balance has been received and verified." },
    { q: "Can I get paid out in BDT as a Bangladeshi seller?", a: "Yes. After a successful sale, completed asset transfer and any required review, eligible sellers can request their available earnings through bank transfer, bKash, Nagad or Rocket." },
    { q: "I already have a buyer through Facebook or a personal contact - can I still use Durqo?", a: "Yes. Bring that buyer onto Durqo and run the sale through the same structured payment, Transfer Room and inspection process as any other listing." },
    { q: "How much does it cost to buy or sell on Durqo?", a: "Durqo does not charge buyers a marketplace fee. Sellers are charged a tiered success fee, deducted only after a successful sale." },
    { q: "Is a seller's business data checked before the listing goes live?", a: "Yes. Every listing is manually reviewed by Durqo's team, and the seller's business data is verified before the listing is published." },
    { q: "What does “Reviewed by Durqo” mean?", a: "Every listing is manually reviewed by our team for accuracy and completeness before it's allowed to publish." },
    { q: "What does a “GA Verified” badge mean?", a: "It means Durqo was given read-only access to that listing's Google Analytics account and reviewed the real traffic numbers being shown." },
    { q: "What does a “Verified” seller badge mean?", a: "That seller submitted an identity document which Durqo's team reviewed and approved." },
    { q: "What is seller identity verification (KYC)?", a: "An optional step where a seller uploads an ID document from their dashboard. Once Durqo's team reviews and approves it, the seller's profile shows a Verified badge. The public badge itself is optional, but completing this same identity verification is required before a seller's very first withdrawal." },
    { q: "Can I ask the seller questions before buying?", a: "Yes, three ways. Many listings already answer common questions in their own Questions & Answers section, written by the seller. You can also post a question in the Comments section on the listing page, and the seller is notified and replies there publicly. Or message the seller directly for a private conversation, which stays in your dashboard inbox." },
    { q: "Is SSLCommerz an escrow service?", a: "No. SSLCommerz is a payment gateway or payment processor and is not described as an escrow provider. Durqo holds the buyer's payment until the transfer is approved, and supported transactions may also use Escrow.com as an independent escrow option." },
    { q: "What happens if the assets don't match what was agreed?", a: "The buyer can report an issue during the 7-day inspection. The payment stays on hold and the seller is not paid until Durqo's team has reviewed the transaction, instead of the sale auto-approving." },
    { q: "How is Durqo different from Flippa or Acquire.com?", a: "Flippa and Acquire.com are established international marketplaces serving broad global audiences. Durqo is also a global marketplace, but it accepts BDT: buyers in Bangladesh can pay through local methods, and eligible sellers can be paid out in BDT." },
    { q: "When does the Transfer Room become available?", a: "The Transfer Room becomes available after the complete purchase price has been received and verified. An initial partial payment does not make the order fully funded." },
    { q: "When can a seller request a payout?", a: "A seller can request a payout after the sale and agreed asset transfer are completed, any required review has finished and the eligible earnings appear as available in the Seller Dashboard." },
    { q: "Which BDT payout methods does Durqo support?", a: "Supported local payout methods include bank transfer, bKash, Nagad and Rocket, subject to seller eligibility, verification and applicable withdrawal limits." },
    { q: "Does a seller need to verify their identity before withdrawing?", a: "Yes. Identity verification (KYC) is required before a seller's very first withdrawal, regardless of payout method. The account holder name on the withdrawal request must also match the seller's verified legal name, which Durqo checks by hand before approving the payout." },
    { q: "What are the withdrawal limits for bKash, Nagad and Rocket?", a: "Each of bKash, Nagad and Rocket allows up to ৳50,000 per day and ৳300,000 per month. The limits apply to each method on its own and are not combined, and bank transfer does not use these mobile financial service limits." },
    { q: "How long does a seller payout take?", a: "Durqo normally reviews and processes a payout request within 3–5 business days. The receiving bank or payment provider may require additional time to credit the seller's account." },
    { q: "What should I do if my payment status is pending?", a: "Do not submit the same payment again immediately. Check your order status and contact support@durqo.com so the transaction can be reviewed." },
    { q: "Where can I get help?", a: "Contact support@durqo.com before repeating a payment, changing payment methods or sending money using different instructions." },
  ].map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};


export default async function DurqoBangladeshPage() {
  // Real catalog numbers, computed exactly like the homepage: sold listings
  // are excluded so every count matches what /buy shows by default.
  const listings = await getPublishedListings();
  const activeListings = listings.filter((l) => l.status !== "sold");
  const categoryCounts = new Map<string, number>();
  for (const l of activeListings) categoryCounts.set(l.categoryId, (categoryCounts.get(l.categoryId) ?? 0) + 1);
  const totalActive = activeListings.length;
  // Most-stocked categories first; ties keep the canonical CATEGORIES order.
  const sortedCategories = CATEGORIES.map((c, idx) => ({ c, idx, count: categoryCounts.get(c.id) ?? 0 })).sort(
    (a, b) => b.count - a.count || a.idx - b.idx,
  );
  const profitOf = (l: (typeof listings)[number]) => {
    const revenue = l.quickStats.monthly_income as number | undefined;
    if (revenue === undefined) return undefined;
    const exp = l.monthlyExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return l.monthlyExpenses.length > 0 ? revenue - exp : revenue;
  };
  const featured = [...activeListings]
    .sort((a, b) => (profitOf(b) ?? -1) - (profitOf(a) ?? -1) || (b.discountedPrice ?? b.price) - (a.discountedPrice ?? a.price))
    .slice(0, 3);

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBPAGE_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />

      {/* HERO: text left, film right */}
      <section className="relative overflow-hidden bg-[#0A1120] py-14 sm:py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_0%_0%,rgba(16,185,129,0.22),transparent_70%),radial-gradient(45%_55%_at_100%_100%,rgba(59,130,246,0.14),transparent_70%)]" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_70%_70%_at_25%_35%,#000_20%,transparent_75%)]"
          aria-hidden
        />
        <MouseGlow />
        <Container className="relative">
          <Inner>
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14">
              <div className="min-w-0">
                <Link
                  href="#categories"
                  className="dq-enter group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] py-1 pl-1 pr-3 text-xs text-white/75 backdrop-blur transition hover:border-brand/60 hover:text-white"
                  style={enterDelay(0)}
                >
                  <span className="mono flex items-center gap-1.5 rounded-full bg-brand px-2.5 py-1 text-[0.65rem] font-bold text-white">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    LIVE
                  </span>
                  <span>
                    <span className="font-semibold text-white">{totalActive}</span> businesses for sale
                  </span>
                  <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                </Link>
                <h1 className="dq-enter mt-6 text-[2.5rem] leading-[1.05] tracking-tight text-white sm:text-[3.2rem] lg:text-[3.5rem]" style={enterDelay(100)}>
                  The Global Marketplace to{" "}
                  <span className="bg-gradient-to-r from-[#6EE7B7] via-brand to-[#2DD4BF] bg-clip-text text-transparent">Buy and Sell in BDT.</span>
                </h1>
                <p className="dq-enter mt-5 max-w-[52ch] text-[1.08rem] leading-relaxed text-white/75" style={enterDelay(180)}>
                  A global marketplace for digital businesses that accepts BDT. Buyers in Bangladesh pay with local methods,
                  sellers get paid out in BDT, and every handover runs through a tracked Transfer Room.
                </p>
                <div className="dq-enter mt-8 flex flex-col gap-3 sm:flex-row" style={enterDelay(320)}>
                  <Button href="#buyers" size="lg" className="dq-shine shadow-[0_14px_30px_-12px_rgba(16,185,129,0.9)]">
                    I&rsquo;m Buying
                    <ArrowRight size={16} />
                  </Button>
                  <Button href="#sellers" variant="on-dark" size="lg">
                    I&rsquo;m Selling
                    <ArrowRight size={16} />
                  </Button>
                </div>
                <div className="dq-enter mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/55" style={enterDelay(400)}>
                  <span className="mono uppercase tracking-wider">Secured by</span>
                  <span className="flex items-center gap-1.5 font-semibold text-white/80"><StripeIcon size={14} />Stripe</span>
                  <span className="flex items-center gap-1.5 font-semibold text-white/80"><ShieldCheck size={14} className="text-brand" />SSLCommerz</span>
                  <span className="flex items-center gap-1.5 font-semibold text-white/80"><EscrowIcon size={9} className="text-[#7BE35A]" /><span className="sr-only">Escrow.com</span></span>
                </div>
              </div>
              <div className="dq-enter min-w-0" style={enterDelay(260)}>
                <BdHeroVideo />
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* PROBLEMS & SOLUTIONS, grouped by audience */}
      <section className="border-b border-rule py-16 sm:py-24">
        <Container>
          <Inner>
            <SectionHead
              center
              eyebrow="Why Durqo"
              title="The Problems Bangladeshi Buyers and Sellers Face, Solved"
              body="Each problem on the left, and how Durqo fixes it on the right."
            />
            <div className="grid gap-6 lg:grid-cols-2">
              {(["For Buyers", "For Sellers"] as const).map((aud, gi) => (
                <div key={aud} data-reveal style={revealDelay(gi * 120)} className="overflow-hidden rounded-3xl border border-rule bg-paper-raised shadow-[0_24px_50px_-40px_rgba(11,19,36,0.5)]">
                  <div className={`flex items-center gap-3 px-6 py-5 ${gi === 0 ? "bg-brand-soft" : "bg-gold-soft"}`}>
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${gi === 0 ? "bg-brand text-white" : "bg-gold text-[#0B1324]"}`}>
                      {gi === 0 ? <Wallet size={18} /> : <Landmark size={18} />}
                    </span>
                    <h3 className="text-xl font-semibold text-ink">{aud}</h3>
                  </div>
                  <ul className="divide-y divide-rule">
                    {PROBLEMS.filter((p) => p.audience === aud).map(({ problem, solution }) => (
                      <li key={problem} className="px-6 py-5">
                        <p className="flex items-start gap-3 text-[0.98rem] font-semibold text-ink">
                          <XCircle size={19} className="mt-0.5 shrink-0 text-[#E11D48]" />
                          {problem}
                        </p>
                        <p className="mt-2 flex items-start gap-3 text-[0.95rem] leading-relaxed text-ink-soft">
                          <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-brand" />
                          {solution}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* BUYER GUIDE (visual) */}
      <section id="buyers" className="scroll-mt-24 border-b border-rule bg-paper-sunk py-16 sm:py-24">
        <Container>
          <Inner>
            <div data-reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="mono inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">
                  <Wallet size={12} />
                  For buyers
                </span>
                <h2 className="mt-3 text-3xl tracking-tight sm:text-[2.5rem] sm:leading-[1.1]">How Buying Works in BDT</h2>
                <p className="mt-3 max-w-[60ch] text-[1rem] leading-relaxed text-ink-soft">Pick a business, pay in Bangladeshi Taka, then receive and check every asset before the sale is final.</p>
              </div>
              <Button href="/buy" size="lg" className="dq-shine">
                Browse Businesses
                <ArrowRight size={16} />
              </Button>
            </div>

            {/* Step strip */}
            <ol data-reveal className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {BUYER_STEPS.map(({ title, sub, icon: Icon }, i) => (
                <li key={title} className="relative flex flex-col items-center gap-2 rounded-2xl border border-rule bg-paper-raised px-3 py-5 text-center">
                  <span className="mono absolute left-3 top-3 text-[0.65rem] font-bold text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                  <span className="dq-icon-pop grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
                    <Icon size={20} />
                  </span>
                  <span className="mt-1 text-[0.95rem] font-semibold leading-snug text-ink">{title}</span>
                  <span className="text-sm leading-snug text-ink-soft">{sub}</span>
                </li>
              ))}
            </ol>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              {/* Pay with */}
              <div data-reveal className="rounded-3xl border border-rule bg-paper-raised p-6 sm:p-7">
                <h3 className="text-lg font-semibold text-ink">Pay with</h3>
                <p className="mt-1 text-sm text-ink-soft">Choose any of these at checkout. Durqo charges buyers no marketplace fee.</p>
                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  {BUYER_CHANNELS.map(({ icon: Icon, label, tint }) => (
                    <span key={label} className="flex flex-col items-center gap-2 rounded-2xl border border-rule bg-paper px-2 py-4 text-center text-sm font-semibold text-ink">
                      <Icon size={22} className={tint} />
                      {label}
                    </span>
                  ))}
                  <span className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-brand px-2 py-4 text-center text-white">
                    <span className="text-xl font-bold leading-none">৳0</span>
                    <span className="text-[0.68rem] font-semibold leading-tight">buyer fee</span>
                  </span>
                </div>
              </div>

              {/* Checkout amount graphic */}
              <div data-reveal style={revealDelay(100)} className="rounded-3xl border border-rule bg-paper-raised p-6 sm:p-7">
                <h3 className="text-lg font-semibold text-ink">What you pay at checkout</h3>
                <p className="mt-1 text-sm text-ink-soft">Businesses are priced in USD. What you pay up front depends on the price.</p>
                <div className="mt-5 flex flex-col gap-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-ink">Price up to $2,000</span>
                      <span className="mono text-xs text-brand-strong">100% at checkout</span>
                    </div>
                    <div className="h-9 overflow-hidden rounded-xl bg-paper-sunk">
                      <div data-reveal className="dq-line flex h-full w-full items-center rounded-xl bg-brand px-3 text-xs font-semibold text-white">Full amount in BDT</div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-ink">Price above $2,000</span>
                      <span className="mono text-xs text-[#92730F]">$2,000 now + balance</span>
                    </div>
                    <div className="flex h-9 gap-1.5">
                      <div className="flex w-2/5 items-center rounded-xl bg-brand px-3 text-xs font-semibold text-white">$2,000 in BDT</div>
                      <div className="flex flex-1 items-center rounded-xl border-2 border-dashed border-gold bg-gold-soft px-3 text-xs font-semibold text-[#92730F]">Balance: instructions by email</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </Inner>
        </Container>
      </section>

      {/* TRANSFER ROOM: how the handover works, with a product view */}
      <section id="transfer-room" className="relative scroll-mt-24 overflow-hidden bg-[#0A1120] py-16 text-white sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_60%_at_100%_20%,rgba(16,185,129,0.18),transparent_70%),radial-gradient(40%_50%_at_0%_100%,rgba(59,130,246,0.12),transparent_70%)]" aria-hidden />
        <Container className="relative">
          <Inner>
            <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
              <div data-reveal>
                <p className="mono flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-white/55">
                  <span className="h-px w-6 bg-brand" aria-hidden />
                  For buyers and sellers
                </p>
                <h2 className="mt-4 text-3xl tracking-tight text-white sm:text-[2.5rem] sm:leading-[1.1]">Inside the Transfer Room</h2>
                <p className="mt-4 max-w-[54ch] text-[1rem] leading-relaxed text-white/70">
                  A private space for each order, shared only by the buyer and the seller. It opens once the full purchase price
                  has been received and verified, and every asset in the sale is handed over and checked one by one.
                </p>
                <ol className="mt-8 flex flex-col gap-5">
                  {TRANSFER_FLOW.map(({ who, title, body }, i) => (
                    <li key={title} className="flex gap-4">
                      <span className={`mono grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${i === TRANSFER_FLOW.length - 1 ? "bg-[#F59E0B] text-[#0B1324]" : "bg-brand text-white"}`}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="mono text-[0.65rem] font-semibold uppercase tracking-wider text-white/45">{who}</p>
                        <h3 className="text-base font-semibold text-white">{title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-white/65">{body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Product view */}
              <div data-reveal style={revealDelay(150)} className="relative lg:sticky lg:top-24">
                <span className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-brand/20 blur-3xl" aria-hidden />
                <div className="relative overflow-hidden rounded-2xl bg-white text-ink shadow-[0_40px_90px_-30px_rgba(0,0,0,0.85)]">
                  <div className="flex items-center gap-2 border-b border-rule bg-paper-sunk px-4 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                    <span className="mono ml-3 flex-1 truncate rounded-md bg-paper-raised px-3 py-1 text-[0.65rem] text-ink-faint">durqo.com/transfer-room</span>
                  </div>
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-lg font-semibold">Your private Transfer Room</p>
                        <p className="text-xs text-ink-soft">Example sale: content website</p>
                      </div>
                      <span className="mono flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[0.65rem] font-semibold text-brand-strong">
                        <Lock size={11} />
                        Payment held by Durqo
                      </span>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-ink">7-day buyer inspection</span>
                        <span className="mono text-ink-soft">Day 3 of 7</span>
                      </div>
                      <div className="mt-2 grid grid-cols-7 gap-1">
                        {Array.from({ length: 7 }, (_, d) => (
                          <span key={d} className={`h-2 rounded-full ${d < 3 ? "bg-brand" : "bg-paper-sunk"}`} />
                        ))}
                      </div>
                    </div>

                    <ul className="mt-5 flex flex-col gap-2">
                      {TRANSFER_ASSETS.map(({ name, status }) => {
                        const st = ASSET_STATUS[status];
                        return (
                          <li key={name} className="flex items-center justify-between gap-3 rounded-xl border border-rule px-3.5 py-3">
                            <span className="text-sm font-medium text-ink">{name}</span>
                            <span className={`mono whitespace-nowrap rounded-full px-2.5 py-1 text-[0.62rem] font-semibold ${st.cls}`}>{st.label}</span>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="mt-5 grid grid-cols-2 gap-2.5">
                      <span className="rounded-xl bg-brand px-3 py-3 text-center text-sm font-semibold text-white">Approve handover</span>
                      <span className="rounded-xl border border-[#E11D48]/40 px-3 py-3 text-center text-sm font-semibold text-[#BE123C]">Report an issue</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* SELLER GUIDE (visual) */}
      <section id="sellers" className="scroll-mt-24 border-b border-rule py-16 sm:py-24">
        <Container>
          <Inner>
            <div data-reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="mono inline-flex items-center gap-2 rounded-full bg-gold-soft px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-[#92730F]">
                  <Landmark size={12} />
                  For sellers
                </span>
                <h2 className="mt-3 text-3xl tracking-tight sm:text-[2.5rem] sm:leading-[1.1]">How Selling Works in BDT</h2>
                <p className="mt-3 max-w-[60ch] text-[1rem] leading-relaxed text-ink-soft">Create a free seller account, get your listing checked by our team, sell to buyers anywhere and withdraw in Bangladeshi Taka.</p>
              </div>
              <Button href="/sell" size="lg" className="dq-shine">
                Sell a Business
                <ArrowRight size={16} />
              </Button>
            </div>

            {/* Listing review */}
            <div data-reveal className="grid gap-3 sm:grid-cols-3">
              {LISTING_REVIEW.map(({ title, sub, icon: Icon }, i) => (
                <div key={title} className={`flex items-center gap-4 rounded-2xl p-5 ${i === 2 ? "bg-brand text-white" : "border border-rule bg-paper-raised"}`}>
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${i === 2 ? "bg-white/15" : "bg-gold-soft text-[#92730F]"}`}>
                    <Icon size={20} />
                  </span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className={`text-sm ${i === 2 ? "text-white/85" : "text-ink-soft"}`}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Payout timeline */}
            <div data-reveal className="mt-5 rounded-3xl border border-rule bg-paper-raised p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-ink">From sale to payout</h3>
              <p className="mt-1 text-sm text-ink-soft">Earnings become available once the sale and handover are complete and any review has finished.</p>
              <ol className="relative mt-6 grid grid-cols-3 gap-y-6 sm:grid-cols-6">
                <span className="absolute left-[8%] right-[8%] top-5 hidden h-0.5 bg-rule sm:block" aria-hidden />
                <span data-reveal className="dq-line absolute left-[8%] right-[8%] top-5 hidden h-0.5 bg-brand sm:block" aria-hidden />
                {SELLER_STATUSES.map((st, i) => (
                  <li key={st} className="relative flex flex-col items-center gap-2 text-center">
                    <span className={`mono relative z-10 grid h-10 w-10 place-items-center rounded-full text-xs font-bold ring-4 ring-paper-raised ${i === SELLER_STATUSES.length - 1 ? "bg-brand text-white" : "bg-gold-soft text-[#92730F]"}`}>
                      {i === SELLER_STATUSES.length - 1 ? <CheckCircle2 size={16} /> : i + 1}
                    </span>
                    <span className="text-sm font-semibold leading-snug text-ink">{st}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
              {/* Methods + KYC */}
              <div data-reveal className="rounded-3xl border border-rule bg-paper-raised p-6 sm:p-7">
                <h3 className="text-lg font-semibold text-ink">Get paid to</h3>
                <p className="mt-1 text-sm text-ink-soft">Request a withdrawal from Earnings &amp; Withdrawals in your Seller Dashboard.</p>
                <div className="mt-4 grid grid-cols-4 gap-2.5">
                  {PAYOUT_METHODS.map(({ icon: Icon, label, tint }) => (
                    <span key={label} className="flex flex-col items-center gap-2 rounded-2xl border border-rule bg-paper px-1 py-4 text-center text-sm font-semibold text-ink">
                      <Icon size={22} className={tint} />
                      {label}
                    </span>
                  ))}
                </div>
                <p className="mt-4 flex items-center gap-2.5 rounded-xl bg-brand-soft/60 px-3.5 py-3 text-sm font-medium text-ink">
                  <ShieldCheck size={16} className="shrink-0 text-brand-strong" />
                  KYC before your first withdrawal. Account name must match your verified name.
                </p>
              </div>

              {/* Stat tiles */}
              <div data-reveal style={revealDelay(100)} className="grid grid-cols-2 gap-3">
                {SELLER_STATS.map(({ value, label, icon: Icon, dark }) => (
                  <div key={label} className={`flex flex-col justify-between gap-4 rounded-3xl p-5 ${dark ? "bg-[#0B1324] text-white" : "border border-rule bg-paper-raised"}`}>
                    <Icon size={20} className={dark ? "text-[#34D399]" : "text-brand-strong"} />
                    <div>
                      <p className="text-2xl font-bold tracking-tight sm:text-[1.7rem]">{value}</p>
                      <p className={`mt-1 text-sm leading-snug ${dark ? "text-white/70" : "text-ink-soft"}`}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* CATEGORIES with live counts */}
      <section id="categories" className="scroll-mt-24 border-b border-rule py-16 sm:py-24">
        <Container>
          <Inner>
            <SectionHead
              eyebrow="16 categories"
              title="Browse by Category"
              body="Each category shows how many businesses are for sale in it right now. Choose one to see its listings."
              action={
                <Link
                  href="/buy"
                  className="group inline-flex min-h-11 items-center gap-2 rounded-xl border border-rule bg-paper-raised px-4 text-sm font-semibold text-ink shadow-[0_1px_2px_rgba(11,19,36,0.05)] transition hover:border-ink"
                >
                  <span className="mono text-brand-strong">{totalActive}</span> live listings
                  <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                </Link>
              }
            />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {sortedCategories.map(({ c, count }, i) => {
                const Icon = categoryIcon(c.id);
                const accent = CATEGORY_ACCENTS[c.id] ?? "#10B981";
                return (
                  <Link
                    key={c.id}
                    href={`/buy/${c.id}`}
                    data-reveal
                    style={{ ...revealDelay((i % 4) * 60), "--accent": accent } as CSSProperties}
                    className="group relative flex flex-col rounded-2xl border border-rule bg-paper-raised p-4 shadow-[0_1px_2px_rgba(11,19,36,0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-[var(--accent)] sm:p-5 hover:shadow-[0_18px_36px_-24px_rgba(11,19,36,0.35)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="grid h-11 w-11 place-items-center rounded-xl transition duration-300 group-hover:scale-105"
                        style={{ color: accent, backgroundColor: `color-mix(in srgb, ${accent} 11%, #fff)` }}
                      >
                        <Icon size={19} />
                      </span>
                      <span className="grid h-8 w-8 place-items-center rounded-full border border-rule text-ink-faint transition group-hover:border-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white">
                        <ArrowRight size={14} />
                      </span>
                    </div>
                    <h3 className="mt-4 text-sm font-semibold leading-snug text-ink sm:text-[0.95rem]">{c.name}</h3>
                    <p className="mt-1 line-clamp-2 hidden text-sm leading-relaxed text-ink-soft sm:block">{c.description}</p>
                    <p className="mt-auto flex items-center gap-2 border-t border-rule pt-3 text-xs font-semibold" style={{ marginTop: "1rem" }}>
                      {count > 0 ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
                          <span className="mono" style={{ color: accent }}>
                            {count} for sale
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-rule-strong" />
                          <span className="mono text-ink-faint">No listings yet</span>
                        </>
                      )}
                    </p>
                  </Link>
                );
              })}
            </div>
          </Inner>
        </Container>
      </section>

      {/* LIVE LISTINGS */}
      {featured.length > 0 && (
        <section className="border-b border-rule bg-paper-sunk py-16 sm:py-24">
          <Container>
            <Inner>
              <SectionHead
                eyebrow="Live on Durqo right now"
                title="Businesses You Can Buy in BDT Today"
                action={
                  <Button href="/buy" variant="secondary" className="min-h-11">
                    View all {totalActive} listings
                    <ArrowRight size={15} />
                  </Button>
                }
              />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((l, i) => (
                  <div key={l.id} data-reveal style={revealDelay(i * 110)} className={i === 2 ? "sm:hidden lg:block" : ""}>
                    <div data-tilt className="dq-tilt h-full">
                      <ListingCard listing={l} />
                    </div>
                  </div>
                ))}
              </div>
            </Inner>
          </Container>
        </section>
      )}

      {/* FEES + VALUATION */}
      <section className="border-b border-rule bg-paper-sunk py-16 sm:py-24">
        <Container>
          <Inner>
            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div data-reveal className="rounded-3xl border border-rule bg-paper-raised p-7 shadow-[0_1px_2px_rgba(11,19,36,0.04)] sm:p-9">
                <DashEyebrow>What it costs</DashEyebrow>
                <h2 className="text-3xl tracking-tight sm:text-[2.2rem] sm:leading-tight">Marketplace Fees</h2>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                  Buyers pay no marketplace fee. Sellers pay a tiered success fee, only after a successful sale.
                </p>
                <div className="mt-7 overflow-hidden rounded-2xl border border-rule">
                  <div className="mono grid grid-cols-2 bg-paper-sunk px-5 py-2.5 text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint">
                    <span>Final sale price</span>
                    <span className="text-right">Seller success fee</span>
                  </div>
                  <dl className="divide-y divide-rule">
                    {SUCCESS_FEE_TIERS.map((tier, i) => (
                      <div key={tier.id} data-reveal style={revealDelay(150 + i * 110)} className="grid grid-cols-2 items-center px-5 py-4">
                        <dt className="text-sm text-ink">{tier.label}</dt>
                        <dd className="mono text-right text-2xl font-bold text-brand-strong">
                          <CountUp value={fmtRate(tier.rate)} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-faint">
                  <Info size={13} className="mt-0.5 shrink-0" />
                  <span>
                    Applies to the full final sale price. See{" "}
                    <Link href="/buy-and-sell-digital-businesses-in-bdt" className="font-semibold text-brand-strong hover:underline">
                      Buy &amp; Sell in BDT
                    </Link>{" "}
                    for the full fee schedule and payout details.
                  </span>
                </p>
              </div>

              <div data-reveal style={revealDelay(120)} className="relative flex flex-col overflow-hidden rounded-3xl bg-[#0B1324] p-7 text-white sm:p-9">
                <span className="dq-glow pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand/25 blur-3xl" aria-hidden />
                <span className="dq-icon-pop relative mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white">
                  <Calculator size={20} />
                </span>
                <h2 className="relative text-2xl font-semibold leading-tight sm:text-[1.9rem]">Not Sure What Your Business Is Worth?</h2>
                <p className="relative mt-3 text-sm leading-relaxed text-white/70">
                  Get a free, instant estimate based on how similar businesses sell on Durqo, before deciding whether
                  or when to sell.
                </p>
                <div className="relative mt-auto pt-8">
                  <Button href="/valuation" size="lg" className="dq-shine w-full sm:w-auto">
                    Get a Free Valuation
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* MARKETPLACE COMPARISON */}
      <section className="border-b border-rule py-16 sm:py-24">
        <Container>
          <Inner>
            <SectionHead
              eyebrow="Compare marketplaces"
              title="How Durqo Compares with Major Marketplaces"
              body="All are global marketplaces. Durqo is the one that also accepts BDT payment methods and pays sellers out in BDT."
            />
            <div data-reveal className="hidden overflow-hidden rounded-3xl border border-rule bg-paper-raised md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-rule bg-paper-sunk">
                    <th scope="col" className="mono px-5 py-4 text-[0.68rem] font-semibold uppercase tracking-wider text-ink-faint">Feature</th>
                    {COMPARISON_COMPANIES.map((c) => (
                      <th key={c.name} scope="col" className={`px-5 py-4 text-sm font-semibold ${c.highlight ? "bg-brand text-white" : "text-ink"}`}>{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr key={row.feature} className={i !== COMPARISON_ROWS.length - 1 ? "border-b border-rule" : ""}>
                      <th scope="row" className="px-5 py-4 text-sm font-semibold text-ink">{row.feature}</th>
                      <td className="bg-brand-soft/60 px-5 py-4 text-sm font-semibold text-brand-strong">{row.durqo.text}</td>
                      <td className="px-5 py-4 text-sm text-ink-soft">{row.flippa.text}</td>
                      <td className="px-5 py-4 text-sm text-ink-soft">{row.acquire.text}</td>
                      <td className="px-5 py-4 text-sm text-ink-soft">{row.empireFlippers.text}</td>
                      <td className="px-5 py-4 text-sm text-ink-soft">{row.motionInvest.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 md:hidden">
              {COMPARISON_COMPANIES.map((c) => (
                <div key={c.name} data-reveal className={`rounded-2xl border p-5 ${c.highlight ? "border-brand bg-brand-soft/50" : "border-rule bg-paper-raised"}`}>
                  <h3 className={`text-sm font-semibold ${c.highlight ? "text-brand-strong" : "text-ink"}`}>{c.name}</h3>
                  <dl className="mt-3 flex flex-col gap-2.5">
                    {c.rows.map((r) => (
                      <div key={r.feature}>
                        <dt className="mono text-[0.62rem] font-semibold uppercase tracking-wider text-ink-faint">{r.feature}</dt>
                        <dd className="mt-0.5 text-sm leading-relaxed text-ink-soft">{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
            <p className="mt-4 max-w-[80ch] text-xs leading-relaxed text-ink-faint">
              Marketplace services, fees and eligibility requirements can change. Review each platform&rsquo;s current terms
              before making a decision. Reviewed 14 September 2026 against each marketplace&rsquo;s own public pages.
            </p>
          </Inner>
        </Container>
      </section>

      {/* FAQ */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[860px]">
            <div data-reveal>
              <DashEyebrow center>Frequently asked questions</DashEyebrow>
              <h2 className="mb-8 text-center text-2xl sm:text-3xl">Everything About Buying and Selling from Bangladesh.</h2>
            </div>
            <div data-reveal style={revealDelay(120)}>
              <GroupedFaq groups={FAQ_GROUPS} />
            </div>
          </Inner>
        </Container>
      </section>

      {/* RELATED READING */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div data-reveal>
              <DashEyebrow>Keep exploring</DashEyebrow>
              <h2 className="mb-6 text-2xl sm:text-3xl">Related Reading</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {RELATED_LINKS.map(({ href, label }, i) => (
                <Link
                  key={href}
                  href={href}
                  data-reveal
                  style={revealDelay((i % 3) * 80)}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-rule bg-paper-raised px-5 py-4 transition duration-300 hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_14px_28px_-20px_rgba(11,19,36,0.35)]"
                >
                  <span className="text-sm font-semibold text-ink">{label}</span>
                  <ArrowRight
                    size={15}
                    className="shrink-0 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-brand-strong"
                  />
                </Link>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-brand-strong bg-[radial-gradient(60%_90%_at_50%_0%,rgba(16,185,129,0.20),transparent_60%),linear-gradient(180deg,#0B1324,#0F1A30)] py-16 text-center sm:py-20">
        <MouseGlow />
        <div
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_60%_70%_at_50%_40%,#000_20%,transparent_75%)]"
          aria-hidden
        />
        <div className="dq-glow pointer-events-none absolute -bottom-32 left-1/2 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" aria-hidden />
        <Container className="relative">
          <Inner>
            <h2 data-reveal className="text-2xl text-white sm:text-[2.4rem] sm:leading-tight">Ready to Buy or Sell a Digital Business?</h2>
            <p className="mx-auto mt-3 max-w-[54ch] text-center text-[0.95rem] leading-relaxed text-white/65">
              Browse income-generating digital businesses, or list your business and reach buyers around the
              world.
            </p>
            <div data-reveal style={revealDelay(120)} className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button href="/buy" size="lg" className="dq-shine w-full shadow-[0_12px_28px_-12px_rgba(16,185,129,0.9)] sm:w-auto">
                Browse Businesses
                <ArrowRight size={16} />
              </Button>
              <Button href="/sell" variant="on-dark" size="lg" className="w-full sm:w-auto">
                Sell a Business
              </Button>
            </div>
            <div className="mono mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-white/60">
              <span className="flex items-center gap-1.5">
                <Percent size={13} className="shrink-0 text-white/50" />
                No buyer marketplace fee
              </span>
              <span className="flex items-center gap-1.5">
                <ClipboardCheck size={13} className="shrink-0 text-white/50" />
                7-day buyer inspection
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="shrink-0 text-white/50" />
                Payments secured via Stripe &amp; SSLCommerz
              </span>
            </div>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
