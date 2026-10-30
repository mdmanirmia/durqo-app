import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Wallet,
  Landmark,
  ShieldCheck,
  ClipboardCheck,
  Layers,
  Handshake,
  Globe2,
  MapPin,
  Calculator,
  CheckCircle2,
  Smartphone,
  Rocket as RocketGlyph,
  CreditCard,
  Percent,
  Info,
  Edit3,
  Send,
  Eye,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import GroupedFaq, { type FaqGroup } from "@/components/GroupedFaq";
import { BkashIcon } from "@/components/icons/PaymentIcons";
import { CATEGORIES } from "@/lib/categories";
import { categoryIcon } from "@/lib/category-icons";
import { SUCCESS_FEE_TIERS, fmtRate } from "@/lib/fees";
import type { CSSProperties } from "react";
import CountUp from "@/components/CountUp";
import MouseGlow from "@/components/home/MouseGlow";
import MoneyFlow from "@/components/bangladesh/MoneyFlow";
import { CATEGORY_ACCENTS } from "@/lib/category-accents";
import BdHeroVideo from "@/components/bangladesh/BdHeroVideo";
import ProblemExplorer, { type ProblemItem } from "@/components/bangladesh/ProblemExplorer";
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

const STATS = [
  { value: "16", label: "Digital business categories", icon: Layers },
  { value: "5", label: "Local ways to pay in BDT", icon: Wallet },
  { value: "4", label: "Local BDT payout methods", icon: Landmark },
  { value: "7-Day", label: "Buyer inspection window", icon: ClipboardCheck },
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

const PROBLEMS: ProblemItem[] = [
  {
    audience: "For Buyers",
    icon: "Wallet",
    problem: "Paying an international seller in BDT is hard. Most global marketplaces only take cards or wires priced in USD.",
    solution: "Buy in BDT through supported local payment methods, including bKash, Nagad, Rocket, bank transfer or card.",
  },
  {
    audience: "For Sellers",
    icon: "Landmark",
    problem: "Bangladeshi sellers struggle to reach buyers outside the country, and getting paid back in BDT is even harder.",
    solution: "Sell to buyers anywhere in the world and get paid out in BDT through bank transfer, bKash, Nagad or Rocket.",
  },
  {
    audience: "For Buyers",
    icon: "ShieldCheck",
    problem: "Buyers worry about paying for a business and never actually receiving the assets.",
    solution: "Every purchase moves through a structured Asset Transfer Room with a 7-day inspection period before the sale is finalized.",
  },
  {
    audience: "For Everyone",
    icon: "Lock",
    problem: "Both sides carry payment and delivery risk in a deal this size.",
    solution:
      "A structured process covering payment, transfer, inspection, approval and payout keeps things organized end to end. Supported transactions may also use Escrow.com as an independent escrow option.",
  },
  {
    audience: "For Everyone",
    icon: "ClipboardCheck",
    problem: "Assets can go missing or not match what was promised after the handover.",
    solution: "Buyers can report an issue and have the transaction reviewed, instead of the sale auto-approving.",
  },
  {
    audience: "For Buyers",
    icon: "Search",
    problem: "Listing information on many marketplaces can't be trusted.",
    solution:
      "Listings go through review before they go live and carry verification signals, including supported Google Analytics connections, though buyers should still do their own diligence.",
  },
  {
    audience: "For Everyone",
    icon: "Layers",
    problem: "A sale with several moving parts, such as the domain, app, accounts and documents, is hard to hand over cleanly.",
    solution: "The Transfer Room tracks every asset in the sale individually, so nothing gets lost in a multi-part handover.",
  },
  {
    audience: "For Sellers",
    icon: "Handshake",
    problem: "A seller already has a buyer lined up through Facebook or a personal contact, but no reliable way to actually close the deal.",
    solution: "Bring that buyer onto Durqo and run the sale through the same structured Transfer Room process.",
  },
  {
    audience: "For Sellers",
    icon: "Globe2",
    problem: "Selling only within Bangladesh limits how many buyers ever see the listing.",
    solution: "Reach international buyers across Durqo's 16 digital business categories.",
  },
  {
    audience: "For Sellers",
    icon: "Calculator",
    problem: "Many owners have no idea what their business is actually worth.",
    solution: "Get a free indicative valuation before deciding whether or when to sell.",
  },
];

const WHY_DURQO_CARDS = [
  { icon: Layers, title: "16 Digital Business Categories", body: "Buy or sell across websites, e-commerce, SaaS, apps, domains and more - all in one marketplace." },
  { icon: Wallet, title: "Buy and Sell in BDT", body: "Bangladesh-based buyers pay in BDT, and eligible sellers get paid out in BDT through supported local methods." },
  { icon: Percent, title: "No Buyer Marketplace Fee", body: "Durqo does not charge buyers a marketplace fee. Buyers pay the agreed purchase price, although disclosed payment-provider, banking or currency charges may apply." },
  { icon: Percent, title: "Seller Fee Only After a Sale", body: "Durqo deducts the applicable success fee from the seller only after a successful sale." },
  { icon: ShieldCheck, title: "Structured, Tracked Transfers", body: "Every sale moves through the Transfer Room, which stays locked until the complete purchase price has been received and verified." },
  { icon: ClipboardCheck, title: "7-Day Buyer Inspection", body: "Buyers get a 7-day window to inspect every asset in the sale before the transfer is finalized." },
];

const RELATED_LINKS = [
  { href: "/buy-and-sell-digital-businesses-in-bdt", label: "Buy & Sell in BDT: The Full Guide" },
  { href: "/how-to-buy-a-website-in-bangladesh", label: "How to Buy a Website in Bangladesh" },
  { href: "/sell-your-online-business-bangladesh", label: "How to Sell an Online Business from Bangladesh" },
  { href: "/how-to-buy", label: "How Buying on Durqo Works" },
  { href: "/how-to-sell", label: "How Selling on Durqo Works" },
  { href: "/valuation", label: "Get a Free Business Valuation" },
];

const TRANSACTION_STEPS = [
  { title: "Payment Is Confirmed", body: "The buyer's payment is received and verified before the sale moves forward.", icon: Wallet },
  { title: "Transfer Room Opens", body: "Buyer and seller move into a private Transfer Room to hand over every asset in the sale.", icon: Handshake },
  { title: "7-Day Inspection", body: "The buyer has 7 days to inspect the assets against what was agreed.", icon: ClipboardCheck },
  { title: "Buyer Approves", body: "The buyer approves the completed transfer, or reports an issue for review instead of an automatic approval.", icon: CheckCircle2 },
  { title: "Seller Is Paid Out", body: "Once the transfer is approved, the seller can request their payout - including in BDT for Bangladeshi sellers.", icon: Landmark },
];

// Oct 1, 2026 (Revision 12): zooms into step 2 of TRANSACTION_STEPS above —
// what actually happens, per asset, inside the Transfer Room itself. Every
// label and behavior here is traced to the real Transfer Room page
// (src/app/transfer-room/page.tsx, itself traced to TransferRoomView.tsx and
// the asset-transfer RPC migrations): "Mark In Progress" / "Mark Submitted"
// are the seller's real action labels (SELLER_STEPS there); "Mark Received"
// is the buyer's real action label (BUYER_STEPS there); the closing
// approve-or-report branch, including that a reported issue holds payment
// for admin review rather than auto-releasing, matches TRANSFER_FLOW and the
// "Report an Issue" copy on that same page. Nothing here is new information —
// it restates /transfer-room's own facts at a glance for this audience.
const TRANSFER_ROOM_STEPS = [
  { title: "Seller Marks In Progress", body: "As the seller starts preparing each asset on the checklist for handover.", icon: Edit3 },
  { title: "Seller Marks Submitted", body: "Once it's handed over, with an optional reference note, such as a transfer code or login details.", icon: Send },
  { title: "Buyer Marks Received", body: "After checking the asset against what was agreed, inside the 7-day inspection window.", icon: Eye },
  { title: "Buyer Approves, or Reports an Issue", body: "Approving releases payment for that asset. Reporting an issue keeps payment held until Durqo's team reviews it.", icon: CheckCircle2 },
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
        answer: "The buyer can report an issue and have the transaction reviewed, instead of the sale auto-approving.",
      },
      {
        question: "How is Durqo different from Flippa or Acquire.com?",
        answer:
          "Flippa and Acquire.com are established international marketplaces serving broad global audiences. Durqo is the first marketplace specifically built to support the purchase of digital businesses in BDT and eligible seller payouts through supported local methods.",
      },
    ],
  },
  {
    heading: "Payments & support",
    items: [
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
    { q: "Can I pay for a business in BDT from Bangladesh?", a: "Yes. Bangladesh-based buyers can pay for eligible digital businesses in BDT through SSLCommerz, using bKash, Nagad, Rocket, a supported bank, or a credit or debit card." },
    { q: "Which payment methods are available through SSLCommerz?", a: "SSLCommerz payment channels include bKash, Nagad, Rocket, supported banks, and credit or debit cards." },
    { q: "What happens if the business costs more than USD 2,000?", a: "You pay the BDT equivalent of USD 2,000 through SSLCommerz at checkout. After that payment is confirmed, Durqo emails you instructions for paying the remaining balance. The purchase proceeds to asset transfer only after the complete balance has been received and verified." },
    { q: "Can I get paid out in BDT as a Bangladeshi seller?", a: "Yes. After a successful sale, completed asset transfer and any required review, eligible sellers can request their available earnings through bank transfer, bKash, Nagad or Rocket." },
    { q: "I already have a buyer through Facebook or a personal contact - can I still use Durqo?", a: "Yes. Bring that buyer onto Durqo and run the sale through the same structured payment, Transfer Room and inspection process as any other listing." },
    { q: "How much does it cost to buy or sell on Durqo?", a: "Durqo does not charge buyers a marketplace fee. Sellers are charged a tiered success fee, deducted only after a successful sale." },
    { q: "What does “Reviewed by Durqo” mean?", a: "Every listing is manually reviewed by our team for accuracy and completeness before it's allowed to publish." },
    { q: "What does a “GA Verified” badge mean?", a: "It means Durqo was given read-only access to that listing's Google Analytics account and reviewed the real traffic numbers being shown." },
    { q: "What does a “Verified” seller badge mean?", a: "That seller submitted an identity document which Durqo's team reviewed and approved." },
    { q: "What is seller identity verification (KYC)?", a: "An optional step where a seller uploads an ID document from their dashboard. Once Durqo's team reviews and approves it, the seller's profile shows a Verified badge. The public badge itself is optional, but completing this same identity verification is required before a seller's very first withdrawal." },
    { q: "Can I ask the seller questions before buying?", a: "Yes, three ways. Many listings already answer common questions in their own Questions & Answers section, written by the seller. You can also post a question in the Comments section on the listing page, and the seller is notified and replies there publicly. Or message the seller directly for a private conversation, which stays in your dashboard inbox." },
    { q: "Is SSLCommerz an escrow service?", a: "No. SSLCommerz is a payment gateway or payment processor and is not described as an escrow provider. Durqo holds the buyer's payment until the transfer is approved, and supported transactions may also use Escrow.com as an independent escrow option." },
    { q: "What happens if the assets don't match what was agreed?", a: "The buyer can report an issue and have the transaction reviewed, instead of the sale auto-approving." },
    { q: "How is Durqo different from Flippa or Acquire.com?", a: "Flippa and Acquire.com are established international marketplaces serving broad global audiences. Durqo is the first marketplace specifically built to support the purchase of digital businesses in BDT and eligible seller payouts through supported local methods." },
    { q: "How long does a seller payout take?", a: "Durqo normally reviews and processes a payout request within 3–5 business days. The receiving bank or payment provider may require additional time to credit the seller's account." },
    { q: "What should I do if my payment status is pending?", a: "Do not submit the same payment again immediately. Check your order status and contact support@durqo.com so the transaction can be reviewed." },
    { q: "Where can I get help?", a: "Contact support@durqo.com before repeating a payment, changing payment methods or sending money using different instructions." },
  ].map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

function NumberedFlow({ steps }: { steps: { title: string; body?: string; icon?: typeof Wallet }[] }) {
  const n = steps.length;
  const inset = (0.5 / n) * 100;
  return (
    <div>
      <ol className="flex flex-col gap-6 md:hidden">
        {steps.map((step, i) => (
          <li key={step.title} data-reveal style={revealDelay(i * 120)} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="dq-icon-pop mono grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(16,185,129,0.8)]">
                {i + 1}
              </span>
              {i < n - 1 && <span className="mt-2 w-px flex-1 bg-rule" aria-hidden />}
            </div>
            <div className={step.body ? "pb-1" : "pb-1 pt-2"}>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                {step.icon && <step.icon size={14} className="shrink-0 text-brand-strong" />}
                {step.title}
              </h4>
              {step.body && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{step.body}</p>}
            </div>
          </li>
        ))}
      </ol>
      <div className="relative hidden md:block">
        <div className="absolute top-6 h-px bg-rule" style={{ left: `${inset}%`, right: `${inset}%` }} aria-hidden />
        <div data-reveal className="dq-line absolute top-6 h-0.5 -translate-y-px rounded-full bg-gradient-to-r from-brand via-brand to-brand/40" style={{ left: `${inset}%`, right: `${inset}%` }} aria-hidden />
        <ol className="flex gap-4">
          {steps.map((step, i) => (
            <li key={step.title} data-reveal style={revealDelay(i * 150)} className="group flex flex-1 flex-col items-center gap-3 text-center">
              <span className="dq-icon-pop mono relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white shadow-[0_10px_22px_-10px_rgba(16,185,129,0.9)] transition group-hover:scale-110">
                {i + 1}
              </span>
              <div>
                <h4 className="flex items-center justify-center gap-1.5 text-sm font-semibold text-ink">
                  {step.icon && <step.icon size={14} className="shrink-0 text-brand-strong" />}
                  {step.title}
                </h4>
                {step.body && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{step.body}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default async function DurqoBangladeshPage() {
  // Real catalog numbers, computed exactly like the homepage: sold listings
  // are excluded so every count matches what /buy shows by default.
  const listings = await getPublishedListings();
  const activeListings = listings.filter((l) => l.status !== "sold");
  const categoryCounts = new Map<string, number>();
  for (const l of activeListings) categoryCounts.set(l.categoryId, (categoryCounts.get(l.categoryId) ?? 0) + 1);
  const totalActive = activeListings.length;
  const maxCount = Math.max(1, ...categoryCounts.values());
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

      {/* HERO: copy left, product film right */}
      <section className="relative overflow-hidden bg-[#0B1324] bg-[radial-gradient(55%_70%_at_0%_0%,rgba(16,185,129,0.22),transparent_60%),radial-gradient(40%_55%_at_100%_100%,rgba(244,42,65,0.12),transparent_60%),linear-gradient(180deg,#0B1324,#0E1A31)] pb-28 pt-14 sm:pb-32 sm:pt-20 lg:pb-40 lg:pt-24">
        <MouseGlow />
        <div
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_70%_70%_at_30%_30%,#000_25%,transparent_75%)]"
          aria-hidden
        />
        <div className="dq-glow pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand/20 blur-3xl" aria-hidden />
        <Container className="relative">
          <Inner>
            <div className="grid gap-12 lg:grid-cols-[44fr_56fr] lg:items-center lg:gap-14">
              <div className="min-w-0">
                <Link
                  href="#categories"
                  className="dq-enter group mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] py-1 pl-1 pr-3 text-xs text-white/75 backdrop-blur transition hover:border-brand/60 hover:text-white"
                  style={enterDelay(0)}
                >
                  <span className="mono flex items-center gap-1.5 rounded-full bg-brand px-2.5 py-1 text-[0.65rem] font-bold text-white">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    LIVE
                  </span>
                  <span>
                    <span className="font-semibold text-white">{totalActive}</span> listings across 16 categories
                  </span>
                  <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                </Link>
                <div className="dq-enter mono mb-4 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-white/70" style={enterDelay(60)}>
                  <span className="flex items-center gap-1.5 text-brand">
                    <MapPin size={13} />
                    Bangladesh
                  </span>
                  <span className="flex items-center gap-1" aria-hidden="true">
                    <span className="h-px w-5 bg-white/25" />
                    <span className="h-1 w-1 animate-pulse rounded-full bg-brand" />
                    <span className="h-px w-5 bg-white/25" />
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Globe2 size={13} />
                    The World
                  </span>
                </div>
                <h1 className="dq-enter text-[2.5rem] leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[3.6rem]" style={enterDelay(120)}>
                  The Global Marketplace to{" "}
                  <span className="bg-gradient-to-r from-[#34D399] via-brand to-[#2DD4BF] bg-clip-text text-transparent">Buy and Sell in BDT.</span>
                </h1>
                <p className="dq-enter mt-6 max-w-[56ch] text-[1.05rem] leading-relaxed text-white/70" style={enterDelay(200)}>
                  Buy global digital businesses using BDT through bKash, Rocket, Nagad, bank transfer and card.
                  Sell to buyers in Bangladesh and globally and get paid out in BDT. A structured payment, asset
                  transfer and inspection process keeps every transaction organized and transparent.
                </p>
                <div className="dq-enter mt-8 flex flex-wrap gap-3" style={enterDelay(280)}>
                  <Button href="/buy" size="lg" className="dq-shine w-full shadow-[0_14px_30px_-12px_rgba(16,185,129,0.9)] sm:w-auto">
                    Browse Businesses
                    <ArrowRight size={16} />
                  </Button>
                  <Button href="/sell" variant="on-dark" size="lg" className="w-full sm:w-auto">
                    Sell a Business
                  </Button>
                </div>
                <div className="dq-enter mt-7 flex flex-wrap items-center gap-2" style={enterDelay(360)}>
                  {BUYER_CHANNELS.map(({ icon: Icon, label }, i) => (
                    <span
                      key={label}
                      className="dq-pop mono flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[0.68rem] text-white/75"
                      style={{ animationDelay: `${520 + i * 80}ms` }}
                    >
                      <Icon size={12} className="text-brand" />
                      {label}
                    </span>
                  ))}
                </div>
                <p className="dq-enter mono mt-5 flex items-start gap-1.5 text-xs leading-relaxed text-white/55" style={enterDelay(440)}>
                  <ShieldCheck size={13} className="mt-0.5 shrink-0 text-brand" />
                  <span>Payments secured through Stripe and SSLCommerz, with Escrow.com available for extra protection.</span>
                </p>
              </div>

              <div className="dq-enter min-w-0" style={enterDelay(220)}>
                <BdHeroVideo />
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* STATS: floating glass panel overlapping the hero */}
      <section className="relative z-10 -mt-16 pb-4 sm:-mt-20">
        <Container>
          <Inner>
            <div className="grid grid-cols-2 overflow-hidden rounded-3xl border border-rule bg-paper-raised shadow-[0_40px_80px_-40px_rgba(11,19,36,0.45)] sm:grid-cols-4">
              {STATS.map(({ value, label, icon: Icon }, i) => (
                <div
                  key={label}
                  data-reveal
                  style={revealDelay(i * 100)}
                  className={`group relative flex flex-col gap-1 p-5 sm:p-7 ${i % 2 === 1 ? "border-l border-rule" : ""} ${i >= 2 ? "border-t border-rule sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`}
                >
                  <span className="dq-icon-pop mb-2 grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand-strong transition group-hover:bg-brand group-hover:text-white">
                    <Icon size={17} />
                  </span>
                  <p className="mono text-3xl font-bold tabular-nums text-ink sm:text-[2.6rem] sm:leading-none">
                    <CountUp value={value} />
                  </p>
                  <p className="text-xs leading-snug text-ink-soft sm:text-sm">{label}</p>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* CATEGORIES with live counts */}
      <section id="categories" className="scroll-mt-24 border-b border-rule py-16 sm:py-20">
        <Container>
          <Inner>
            <div className="mb-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div data-reveal className="max-w-[66ch]">
                <DashEyebrow>Reach buyers beyond Bangladesh</DashEyebrow>
                <h2 className="text-3xl tracking-tight sm:text-[2.4rem] sm:leading-tight">Buy or Sell Across 16 Digital Business Categories</h2>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                  Selling only within Bangladesh limits how many buyers ever see a listing. Durqo opens every listing
                  to buyers everywhere, across 16 digital business categories - whatever kind of digital business
                  you&rsquo;re buying or selling, it has a home here.
                </p>
              </div>
              <div data-reveal style={revealDelay(120)} className="flex items-center gap-5 rounded-2xl border border-rule bg-paper-raised px-6 py-4 shadow-[0_18px_40px_-30px_rgba(11,19,36,0.4)]">
                <div>
                  <p className="mono text-4xl font-bold tabular-nums leading-none text-brand-strong">
                    <CountUp value={String(totalActive)} />
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">Live listings right now</p>
                </div>
                <Link href="/buy" className="group grid h-11 w-11 place-items-center rounded-full bg-ink text-white transition hover:bg-brand" aria-label="View all listings">
                  <ArrowRight size={17} className="transition group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            <div className="grid grid-flow-dense grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
              {sortedCategories.map(({ c, count }, i) => {
                const Icon = categoryIcon(c.id);
                const accent = CATEGORY_ACCENTS[c.id] ?? "#10B981";
                const big = i < 2 && count > 0;
                const share = Math.round((count / maxCount) * 100);
                const countLabel = count > 0 ? `${count} listing${count === 1 ? "" : "s"}` : "Coming soon";
                if (big) {
                  return (
                    <Link
                      key={c.id}
                      href={`/buy/${c.id}`}
                      data-reveal
                      style={{ ...revealDelay(i * 90), "--accent": accent } as CSSProperties}
                      className={`group relative flex min-h-[230px] flex-col overflow-hidden rounded-3xl p-6 text-white shadow-[0_30px_60px_-36px_var(--accent)] transition duration-300 hover:-translate-y-1 min-[420px]:col-span-2 sm:p-7 ${i === 0 ? "lg:row-span-2" : ""}`}
                    >
                      <span className="absolute inset-0 bg-[linear-gradient(135deg,var(--accent),color-mix(in_srgb,var(--accent)_55%,#0B1324))]" aria-hidden />
                      <span className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_80%_at_100%_0%,#000_10%,transparent_70%)]" aria-hidden />
                      <span className="pointer-events-none absolute -bottom-10 -right-6 text-white/10 transition duration-500 group-hover:-translate-y-2 group-hover:rotate-6" aria-hidden>
                        <Icon size={190} strokeWidth={1.2} />
                      </span>
                      <div className="relative flex items-start justify-between gap-3">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                          <Icon size={22} />
                        </span>
                        <span className="mono rounded-full bg-white/15 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-wider ring-1 ring-white/20">
                          {i === 0 ? "Most listings" : "Popular"}
                        </span>
                      </div>
                      <div className="relative mt-auto pt-8">
                        <p className="mono text-5xl font-bold tabular-nums leading-none">
                          <CountUp value={String(count)} />
                        </p>
                        <p className="mt-1 text-xs text-white/75">live listing{count === 1 ? "" : "s"}</p>
                        <h3 className="mt-4 text-xl font-semibold">{c.name}</h3>
                        <p className="mt-1 max-w-[46ch] text-sm leading-relaxed text-white/80">{c.description}</p>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                          Browse {c.name}
                          <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Link>
                  );
                }
                return (
                  <Link
                    key={c.id}
                    href={`/buy/${c.id}`}
                    data-reveal
                    style={{ ...revealDelay((i % 4) * 70), "--accent": accent } as CSSProperties}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-rule bg-paper-raised p-5 transition duration-300 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[0_22px_44px_-30px_var(--accent)]"
                  >
                    <span className="absolute inset-x-0 top-0 h-1 bg-[var(--accent)] opacity-80" aria-hidden />
                    <span className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[var(--accent)] opacity-0 blur-2xl transition duration-500 group-hover:opacity-20" aria-hidden />
                    <div className="relative flex items-start justify-between gap-3">
                      <span
                        className="grid h-11 w-11 place-items-center rounded-xl transition duration-300 group-hover:scale-110"
                        style={{ color: accent, backgroundColor: `color-mix(in srgb, ${accent} 12%, #fff)` }}
                      >
                        <Icon size={19} />
                      </span>
                      <span
                        className={`mono rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${count > 0 ? "" : "bg-paper-sunk text-ink-faint"}`}
                        style={count > 0 ? { color: accent, backgroundColor: `color-mix(in srgb, ${accent} 10%, #fff)` } : undefined}
                      >
                        {countLabel}
                      </span>
                    </div>
                    <h3 className="relative mt-4 text-[0.95rem] font-semibold text-ink">{c.name}</h3>
                    <p className="relative mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">{c.description}</p>
                    <div className="relative mt-auto pt-4">
                      <div className="h-1 overflow-hidden rounded-full bg-paper-sunk" aria-hidden>
                        <div data-reveal className="dq-line h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(count > 0 ? 6 : 0, share)}%` }} />
                      </div>
                      <span className="mt-3 flex items-center gap-1 text-xs font-semibold text-ink-soft transition group-hover:text-[var(--accent)]">
                        {count > 0 ? "View listings" : "Explore category"}
                        <ArrowRight size={13} className="transition group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Inner>
        </Container>
      </section>

      {/* LIVE LISTINGS */}
      {featured.length > 0 && (
        <section className="border-b border-rule bg-paper-sunk py-16 sm:py-20">
          <Container>
            <Inner>
              <div data-reveal className="mb-9 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <DashEyebrow>Live on Durqo right now</DashEyebrow>
                  <h2 className="text-3xl tracking-tight sm:text-[2.4rem] sm:leading-tight">Businesses You Can Buy in BDT Today</h2>
                </div>
                <Button href="/buy" variant="secondary" className="min-h-11">
                  View all {totalActive} listings
                  <ArrowRight size={15} />
                </Button>
              </div>
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

      {/* PROBLEMS & SOLUTIONS (interactive) */}
      <section className="relative overflow-hidden border-b border-rule py-16 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(17,24,39,0.06)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_70%_60%_at_80%_20%,#000_15%,transparent_70%)]"
          aria-hidden
        />
        <Container className="relative">
          <Inner>
            <div data-reveal className="mb-8 max-w-[70ch]">
              <DashEyebrow>The problems we hear most</DashEyebrow>
              <h2 className="text-3xl tracking-tight sm:text-[2.4rem] sm:leading-tight">What Bangladeshi Buyers and Sellers Struggle With, and How Durqo Solves It</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                These are the real obstacles Bangladeshi buyers and sellers run into when trying to buy or sell a
                digital business internationally, and how Durqo addresses each one.
              </p>
            </div>
            <div data-reveal style={revealDelay(120)}>
              <ProblemExplorer items={PROBLEMS} />
            </div>
          </Inner>
        </Container>
      </section>

      {/* PAY & GET PAID IN BDT (dark bento) */}
      <section className="relative overflow-hidden bg-[#0B1324] bg-[radial-gradient(50%_60%_at_100%_0%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(40%_50%_at_0%_100%,rgba(217,119,6,0.12),transparent_60%)] py-16 sm:py-20">
        <MouseGlow />
        <div
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_30%,#000_20%,transparent_75%)]"
          aria-hidden
        />
        <Container className="relative">
          <Inner>
            <div data-reveal className="mb-10 max-w-[70ch]">
              <p className="mono mb-4 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-white/60">
                <span className="h-px w-6 bg-brand" aria-hidden />
                Local money, global reach
              </p>
              <h2 className="text-3xl tracking-tight text-white sm:text-[2.4rem] sm:leading-tight">Pay and Get Paid the Way You Already Do</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-white/65">
                No foreign wire transfers or unfamiliar payment forms - Durqo runs on the same local payment methods
                Bangladeshi buyers and sellers already use every day.
              </p>
            </div>
            <div data-reveal className="mb-5">
              <MoneyFlow />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {[
                {
                  tag: "For buyers",
                  title: "Pay for a Business in BDT",
                  body: "Choose SSLCommerz at checkout and select one of five supported local payment channels.",
                  icon: Wallet,
                  list: BUYER_CHANNELS,
                  tone: "from-brand/25",
                  tagColor: "text-[#34D399]",
                  iconBg: "bg-brand text-white",
                },
                {
                  tag: "For sellers",
                  title: "Get Paid Out in BDT",
                  body: "Once eligible earnings are available, request a payout through one of four supported local methods.",
                  icon: Landmark,
                  list: PAYOUT_METHODS,
                  tone: "from-gold/25",
                  tagColor: "text-gold",
                  iconBg: "bg-gold text-[#0B1324]",
                },
              ].map(({ tag, title, body, icon: Icon, list, tone, tagColor, iconBg }, i) => (
                <div
                  key={title}
                  data-reveal
                  style={revealDelay(i * 120)}
                  className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${tone} to-white/[0.03] p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/25 sm:p-8`}
                >
                  <span className={`dq-icon-pop mb-5 grid h-12 w-12 place-items-center rounded-2xl ${iconBg} shadow-[0_12px_26px_-12px_rgba(0,0,0,0.8)] transition group-hover:scale-110`}>
                    <Icon size={20} />
                  </span>
                  <p className={`mono mb-1 text-[0.68rem] font-semibold uppercase tracking-wider ${tagColor}`}>{tag}</p>
                  <h3 className="text-xl font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{body}</p>
                  <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {list.map(({ icon: ItemIcon, label, tint }, j) => (
                      <span
                        key={label}
                        data-reveal
                        style={revealDelay(200 + j * 70)}
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white px-3 py-2.5 text-xs font-semibold text-ink shadow-[0_8px_20px_-14px_rgba(0,0,0,0.8)] transition hover:-translate-y-0.5"
                      >
                        <ItemIcon size={15} className={tint} />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div data-reveal className="mt-5 flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5">
              <Info size={14} className="mt-0.5 shrink-0 text-white/50" />
              <p className="text-xs leading-relaxed text-white/60">
                Buyer payments and seller payouts follow separate processes. A confirmed buyer payment does not
                immediately create an available seller balance.
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      {/* HOW A DURQO TRANSACTION WORKS */}
      <section className="relative overflow-hidden border-b border-rule py-16 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(17,24,39,0.07)_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_60%_70%_at_50%_50%,#000_20%,transparent_70%)]"
          aria-hidden
        />
        <Container className="relative">
          <Inner className="max-w-[1000px]">
            <div data-reveal className="mb-10 text-center">
              <DashEyebrow center>From payment to payout</DashEyebrow>
              <h2 className="text-3xl tracking-tight sm:text-[2.4rem] sm:leading-tight">How a Durqo Transaction Works</h2>
              <p className="mx-auto mt-3 max-w-[64ch] text-center text-[0.95rem] leading-relaxed text-ink-soft">
                The same structured flow runs behind every sale on Durqo, whether the buyer or seller is in
                Bangladesh or anywhere else.
              </p>
            </div>
            <div data-reveal className="rounded-3xl border border-rule bg-paper-raised p-6 shadow-[0_30px_60px_-44px_rgba(11,19,36,0.5)] sm:p-10">
              <NumberedFlow steps={TRANSACTION_STEPS} />
            </div>
          </Inner>
        </Container>
      </section>

      {/* INSIDE THE TRANSFER ROOM */}
      <section className="border-b border-rule bg-paper-sunk py-16 sm:py-20">
        <Container>
          <Inner className="max-w-[1000px]">
            <div data-reveal className="mb-10 text-center">
              <DashEyebrow center>Step 2, zoomed in</DashEyebrow>
              <h2 className="text-3xl tracking-tight sm:text-[2.4rem] sm:leading-tight">What Happens Inside the Transfer Room</h2>
              <p className="mx-auto mt-3 max-w-[64ch] text-center text-[0.95rem] leading-relaxed text-ink-soft">
                Every asset on the checklist, such as the domain, code, accounts or documents, moves through this
                same handover sequence before the sale can close.
              </p>
            </div>
            <div data-reveal className="rounded-3xl border border-rule bg-paper-raised p-6 shadow-[0_30px_60px_-44px_rgba(11,19,36,0.5)] sm:p-10">
              <NumberedFlow steps={TRANSFER_ROOM_STEPS} />
            </div>
            <div className="mt-8 text-center">
              <Link href="/transfer-room" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline">
                See the full Transfer Room walkthrough
                <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Inner>
        </Container>
      </section>

      {/* FEES + VALUATION */}
      <section className="border-b border-rule py-16 sm:py-20">
        <Container>
          <Inner>
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div data-reveal className="relative overflow-hidden rounded-3xl border border-rule bg-paper-raised p-7 sm:p-9">
                <span className="dq-glow pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/15 blur-3xl" aria-hidden />
                <DashEyebrow>What it costs</DashEyebrow>
                <h2 className="text-3xl tracking-tight sm:text-[2.2rem] sm:leading-tight">Marketplace Fees</h2>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                  Durqo does not charge buyers a marketplace fee. Buyers pay the agreed purchase price, although
                  disclosed payment-provider, banking or currency-related charges may apply. Sellers are charged a
                  tiered success fee based on the final sale price, deducted only after a successful sale.
                </p>
                <p className="mono mb-3 mt-7 text-xs font-semibold uppercase tracking-wider text-ink-faint">Seller success fee</p>
                <dl className="grid gap-3 sm:grid-cols-3">
                  {SUCCESS_FEE_TIERS.map((tier, i) => (
                    <div
                      key={tier.id}
                      data-reveal
                      style={revealDelay(150 + i * 120)}
                      className="rounded-2xl border border-rule bg-paper-sunk p-4 transition hover:-translate-y-0.5 hover:border-brand/50"
                    >
                      <dd className="mono text-3xl font-bold text-brand-strong">
                        <CountUp value={fmtRate(tier.rate)} />
                      </dd>
                      <dt className="mt-1 text-xs leading-snug text-ink-soft">{tier.label}</dt>
                    </div>
                  ))}
                </dl>
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

              <div data-reveal style={revealDelay(120)} className="relative flex flex-col overflow-hidden rounded-3xl bg-[linear-gradient(140deg,#10B981,#0F766E_55%,#0B1324)] p-7 text-white sm:p-9">
                <span className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:30px_30px] [mask-image:radial-gradient(ellipse_80%_70%_at_100%_0%,#000_10%,transparent_70%)]" aria-hidden />
                <span className="pointer-events-none absolute -bottom-8 -right-6 text-white/10" aria-hidden>
                  <Calculator size={200} strokeWidth={1.1} />
                </span>
                <span className="dq-icon-pop relative mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                  <Calculator size={24} />
                </span>
                <h2 className="relative text-2xl font-semibold leading-tight sm:text-3xl">Not Sure What Your Business Is Worth?</h2>
                <p className="relative mt-3 text-sm leading-relaxed text-white/80">
                  Get a free, instant estimate based on how similar businesses sell on Durqo, before deciding whether
                  or when to sell.
                </p>
                <div className="relative mt-auto pt-8">
                  <Link
                    href="/valuation"
                    className="dq-shine group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-ink shadow-[0_16px_30px_-14px_rgba(0,0,0,0.6)] transition hover:-translate-y-0.5 sm:w-auto"
                  >
                    Get a Free Valuation
                    <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* WHY DURQO (bento) */}
      <section className="border-b border-rule bg-paper-sunk py-16 sm:py-20">
        <Container>
          <Inner>
            <div data-reveal className="mb-10 max-w-[70ch]">
              <DashEyebrow>Built for Bangladesh</DashEyebrow>
              <h2 className="text-3xl tracking-tight sm:text-[2.4rem] sm:leading-tight">Why Buy and Sell Through Durqo?</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Bangladeshi buyers and sellers face real friction buying and selling internationally - paying and
                getting paid in BDT, and trusting a stranger with the handover. Durqo&rsquo;s structured, tracked
                process and local payment support solve both.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {WHY_DURQO_CARDS.map(({ icon: Icon, title, body }, i) => {
                // Bento rhythm on 3 columns: [wide, narrow], [narrow, wide],
                // [wide, narrow] - six cards, no gaps. Dark tiles on 1 and 4.
                const hero = i === 0 || i === 3;
                const wide = i === 0 || i === 3 || i === 4;
                return (
                  <div
                    key={title}
                    data-reveal
                    style={revealDelay((i % 3) * 110)}
                    className={`group relative overflow-hidden rounded-3xl p-6 transition duration-300 hover:-translate-y-1 sm:p-7 ${
                      hero
                        ? "bg-[#0B1324] text-white shadow-[0_30px_60px_-36px_rgba(11,19,36,0.8)]"
                        : "border border-rule bg-paper-raised hover:border-brand/40 hover:shadow-[0_22px_44px_-30px_rgba(11,19,36,0.4)]"
                    } ${wide ? "lg:col-span-2" : ""} ${wide && !hero ? "bg-gradient-to-br from-brand-soft to-paper-raised" : ""}`}
                  >
                    {hero && (
                      <>
                        <span className="dq-glow pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-brand/30 blur-3xl" aria-hidden />
                        <span className="pointer-events-none absolute -bottom-10 right-4 text-white/[0.06] transition duration-500 group-hover:-translate-y-2" aria-hidden>
                          <Icon size={180} strokeWidth={1.1} />
                        </span>
                      </>
                    )}
                    <span className="mono pointer-events-none absolute right-6 top-6 text-xs font-bold text-current opacity-30" aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`dq-icon-pop relative mb-5 grid h-12 w-12 place-items-center rounded-2xl transition ${
                        hero ? "bg-brand text-white" : "bg-brand-soft text-brand-strong group-hover:bg-brand group-hover:text-white"
                      }`}
                    >
                      <Icon size={20} />
                    </span>
                    <h3 className={`relative font-semibold ${hero ? "text-xl text-white" : "text-base text-ink"}`}>{title}</h3>
                    <p className={`relative mt-2 max-w-[52ch] text-sm leading-relaxed ${hero ? "text-white/70" : "text-ink-soft"}`}>{body}</p>
                  </div>
                );
              })}
            </div>
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
