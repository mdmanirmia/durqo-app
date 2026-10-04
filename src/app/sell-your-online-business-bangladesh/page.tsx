import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Activity,
  Boxes,
  Calendar,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  Compass,
  DollarSign,
  FileSearch,
  FileText,
  Globe,
  Handshake,
  Info,
  Landmark,
  Layers,
  Link as LinkIcon,
  Package,
  Repeat,
  Rocket as RocketGlyph,
  Scale,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  TrendingUp,
  Users,
  Wallet,
  PlaySquare,
} from "lucide-react";
import Container from "@/components/ui/Container";
import GroupedFaq, { type FaqGroup } from "@/components/GroupedFaq";
import { BkashIcon } from "@/components/icons/PaymentIcons";
import { SUCCESS_FEE_TIERS, fmtRate } from "@/lib/fees";
import TrackedCta, { ArticleViewTracker } from "./CtaTracking";

// Sep 27, 2026 build — the Bangladesh seller-acquisition content page from
// the "DURQO — BANGLADESH SELLER ACQUISITION CONTENT" brief (see claude/
// bangladesh-seller-acquisition-page-and-ad-copy-addendum.md for the full
// brief, the analytics wiring this page depends on, and the accompanying
// Facebook/Instagram ad copy). Built as the landing destination for a
// Facebook/Instagram ad campaign targeting the funnel: Ad Click -> Article
// View -> Sell CTA Click -> Listing Started -> Listing Submitted -> Listing
// Approved.
//
// Distinct from two existing pages it sits next to:
//   - /how-to-sell-a-website-in-bangladesh: Websites category only.
//   - /how-to-sell: general seller guide, not Bangladesh-specific and not
//     built for a paid-ad funnel (no CTA-level or article-view tracking).
// This page covers every digital business category Durqo lists (websites,
// SaaS, e-commerce, apps, YouTube channels, domains, and more), written for
// a founder in Bangladesh deciding whether and how to sell.
//
// Every claim on this page is either a real, current fact about how Durqo
// works (its 8-step listing/review/transfer process, its existing BDT
// payout page, its existing FAQ/valuation/listing-review pages, "free to
// list with no upfront charge" — the same claim already made on /sell,
// /how-to-sell and /seller-faq) or a general, unattributed statement about
// how buyers evaluate businesses — never a specific number, buyer count,
// transaction count, testimonial, or outcome guarantee. Per the brief's own
// implementation rules, this page deliberately does NOT: state or imply
// Durqo guarantees a buyer, a sale, a valuation, a price, or a transaction
// timeframe; quote fees, BDT payment methods, or verification rules inline
// (it links to /buy-and-sell-digital-businesses-in-bdt, /seller-payouts and
// /listing-review instead, so this page never drifts out of sync with
// those); or invent usage statistics.
//
// Sep 27, 2026 revision: redesigned after direct feedback that the first
// version read as visually flat next to sibling guide pages. Rebuilt the
// hero as a two-column layout with an "Overview" info panel (matching the
// pattern already established on /how-to-sell-a-website-in-bangladesh and
// /sell), converted the flat bullet/number-square sections into icon-carded
// grids and a connected vertical step timeline (matching /how-to-sell's own
// 8-step STEPS pattern), and turned the bare BDT internal link into a
// resource card. No new facts were introduced — every added line (the
// trust-row items, the overview panel's copy) restates something already
// said elsewhere on this same page or already established sitewide.
//
// Not added to the Footer's "Resources" column, matching how every other
// page in this same Sep 22, 2026 batch of keyword/campaign-targeted guide
// pages (how-to-buy-a-website-in-bangladesh, how-to-sell-a-website-in-
// bangladesh, how-much-is-a-website-worth-in-bangladesh, online-businesses-
// for-sale-in-bangladesh, website-due-diligence-checklist-for-buyers) was
// also left out of it — these are meant to be found via search, the
// sitemap, and contextual internal links, not to permanently widen the
// sitewide footer. It IS added to sitemap.ts, following that same batch's
// precedent (see sitemap.ts's own Sep 22, 2026 entries).
//
// Oct 3, 2026 revision: merchant asked for more information and an updated
// design, noting this specific page gets heavy Bangladeshi traffic ("beshi
// bangladeshi manush eita porteche"). Clarified scope before building (see
// claude/bangladesh-seller-acquisition-page-and-ad-copy-addendum.md): add a
// Marketplace Fees section, a Seller FAQ section, a Stats strip + BDT payout
// showcase, and a Transfer Room walkthrough, plus light design polish
// (icon-badge headers, hover states, alternating section backgrounds)
// already proven elsewhere on the site — not a structural redesign. Every
// new fact is sourced from, and kept in sync with, the same live modules
// and pages the rest of the site already uses, never invented:
//   - Marketplace Fees: SUCCESS_FEE_TIERS/fmtRate from src/lib/fees.ts, the
//     same single source of truth /durqo-bangladesh and /buy-and-sell-
//     digital-businesses-in-bdt already render. This page previously
//     deliberately omitted the exact rates in favor of linking out; the
//     merchant's own "more information" request is read as authorization to
//     show the schedule now that it's already public on sibling pages.
//   - Seller FAQ: the new FAQ_GROUPS below are pulled near-verbatim from the
//     live /seller-faq page's "Fees & getting paid" and "Buyers & disputes"
//     groups, trimmed to the questions a Bangladeshi seller is most likely
//     to ask (fees, BDT withdrawal methods and caps, payout timing, the
//     Transfer Room, disputes) — no new claims.
//   - Stats strip: "16 digital business categories" and the 7-day buyer
//     inspection window match src/lib/categories.ts and /transfer-room
//     (also already cited on /durqo-bangladesh); "4 local BDT payout
//     methods" and "Free to list" match this page's own existing claims.
//   - BDT payout showcase: bank transfer/bKash/Nagad/Rocket, same four
//     seller payout methods and icon/tint treatment already used on
//     /durqo-bangladesh (BkashIcon from PaymentIcons.tsx, Nagad/Rocket as
//     tinted lucide glyphs) — this page's own hero and BDT resource link
//     already named these methods in prose; this only adds the visual badges.
//   - Transfer Room walkthrough: the four-step sequence (Mark In Progress /
//     Mark Submitted / Buyer Marks Received / Buyer Approves or Reports an
//     Issue) is copied from /transfer-room's own real action labels and
//     TRANSFER_FLOW, the identical steps already used on /durqo-bangladesh's
//     own "Inside the Transfer Room" section — not new copy.
// Background alternation was rebalanced after the inserts: "Buyers Outside
// Bangladesh" moved from paper-sunk to the default background, and "How
// Durqo Works" moved from the default background to paper-sunk, so no two
// consecutive sections still share a background.
//
// Oct 3, 2026 revision (scope-tightening pass, same day): direct feedback
// that content had drifted from the page's own title and that the design
// had become messy with gaps in several places. Three concrete fixes:
//   - Removed the Stats Strip section outright (merchant pointed at it
//     specifically and said it was not needed).
//   - Removed the standalone "Inside the Transfer Room" walkthrough. It
//     duplicated Step 07 of "How Selling on Durqo Works" below and the
//     FAQ's own "What exactly is the Transfer Room?" answer, so cutting it
//     tightens the page without losing any information — the FAQ answer and
//     the /transfer-room link (now surfaced from Related Reading instead)
//     still cover it.
//   - Merged "Your buyer does not have to be in Bangladesh" into "Selling a
//     digital business from Bangladesh": both were short, Bangladesh-
//     specific asides (reach, then payments) sitting three sections apart,
//     and the first read as a thin, mostly-empty section on its own. One
//     combined section reads as a single BD-specific logistics section
//     instead of two half-finished ones.
// Reordered the remaining sections into a single pass that reads start to
// finish as: is this sellable -> why people sell -> what determines value
// -> think like a buyer -> prepare -> seller checklist -> (CTA) -> price it
// -> what it costs -> how the process works -> build buyer trust -> selling
// from Bangladesh specifically -> FAQ. The Seller Checklist moved up to sit
// directly after Prepare Your Business (same "getting ready" cluster,
// instead of being stranded near the bottom of the page), and the mid-page
// CTA moved with it to mark the break between preparing and pricing/process.
// No facts changed — only section order, section count, and one bug fix
// below.
// Background alternation was recalculated end to end for the new order
// (Seller Checklist, Asking Price, Marketplace Fees, Building Buyer
// Confidence, Selling from Bangladesh, and Related Reading all changed
// which of paper-sunk/default they use) so no two consecutive sections
// still share a background.
// Also fixed a real layout bug in the Marketplace Fees footnote: it used
// `flex` directly on a `<p>` that mixed plain text with an inline `<Link>`,
// which splits each text/link run into its own flex column instead of
// letting it wrap as one sentence — this is what rendered as the broken,
// gappy "Applies to the full final sale price. See / Buy & Sell in BDT /
// for payout details." layout. Fixed by switching to the same div-wraps-
// icon-and-paragraph structure the working `InfoNote` component already
// uses elsewhere on this page.
const META_TITLE = "How to Sell an Online Business from Bangladesh | Durqo";
const META_DESCRIPTION =
  "A practical guide for entrepreneurs in Bangladesh: how to prepare a website, SaaS, e-commerce, app or other digital business for sale, what buyers look for, and how to list it on Durqo.";

export const metadata: Metadata = {
  title: META_TITLE,
  description: META_DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: META_TITLE,
    description: META_DESCRIPTION,
    url: "https://www.durqo.com/sell-your-online-business-bangladesh",
  },
  twitter: { card: "summary_large_image", title: META_TITLE, description: META_DESCRIPTION },
  alternates: { canonical: "https://www.durqo.com/sell-your-online-business-bangladesh" },
};

const PAGE_URL = "https://www.durqo.com/sell-your-online-business-bangladesh";
const PAGE_TITLE = "How to Sell an Online Business from Bangladesh";
const PUBLISHED_DATE = "2026-09-27";
const MODIFIED_DATE = "2026-09-27";

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

// Plain-text mirror of FAQ_GROUPS below, for the FAQPage structured-data
// block (JSON-LD can't hold JSX). Keep both in sync when editing either.
const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      q: "Is it free to list my business?",
      a: "Yes. There's no upfront listing fee and no monthly subscription. Durqo only charges a success fee, and only once your business actually sells.",
    },
    {
      q: "How much does Durqo charge when my business sells?",
      a: "A tiered success fee based on your final sale price, shown in the Marketplace Fees section above. It is deducted only when your business sells.",
    },
    {
      q: "What withdrawal methods can I use as a seller in Bangladesh?",
      a: "Bank Transfer, bKash, Rocket or Nagad, alongside PayPal and Wise. bKash, Rocket and Nagad each have their own independent limit of ৳50,000 per day and ৳300,000 per month; the other methods have no such cap.",
    },
    {
      q: "When can I withdraw my earnings?",
      a: "Once the buyer approves the transfer and any required review is complete, you can request a withdrawal from your Earnings dashboard. Before your very first withdrawal, you'll also need to have completed identity verification (KYC). Durqo normally reviews and processes eligible payout requests within 3-5 business days.",
    },
    {
      q: "Does my payout account name need to match my verified identity?",
      a: "Yes. The account holder name you enter when requesting a withdrawal must match the legal name on your identity verification (KYC).",
    },
    {
      q: "What exactly is the Transfer Room?",
      a: "It's the shared space, separate from checkout, where you hand a sold business over to its buyer. Every order gets one, also listed under Asset Transfers in your dashboard. You submit each asset one at a time; once the buyer approves the transfer, the sale is final and your payout becomes eligible.",
    },
    {
      q: "What happens if a buyer reports an issue instead of approving?",
      a: "Nothing is released automatically. Your payout stays on hold while Durqo's team reviews the evidence and decides what happens next.",
    },
    {
      q: "What if a buyer disputes a completed sale?",
      a: "Disputes must be reported to Durqo within 7 days of the transaction completing. Where a dispute can't be resolved directly between buyer and seller, Durqo will review the evidence and help mediate a resolution.",
    },
  ].map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
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

// Sep 27, 2026, second revision: narrowed the shared full-width cap from
// 1200px to 1040px after direct feedback that the page felt too wide.
// Several of this page's grids hold short items (a business-type chip, a
// one-line buyer question) rather than the longer-copy cards its sibling
// guide pages use at 1200px, so the extra width mostly showed up as empty
// space inside each card rather than as content. Sections that were
// already narrower than 1040px (the 760/700/900px text columns) are
// unaffected — this only tightens the sections that used the bare
// default.
function Inner({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1040px] ${className}`}>{children}</div>;
}

function Dot({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-faint" aria-hidden />
      {children}
    </li>
  );
}

function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-paper-sunk px-3.5 py-3">
      <Info size={14} className="mt-0.5 shrink-0 text-ink-faint" />
      <p className="text-xs leading-relaxed text-ink-faint">{children}</p>
    </div>
  );
}


const HERO_TRUST_ROW = [
  { icon: Globe, label: "Every digital business category" },
  { icon: ShieldCheck, label: "Listings reviewed before publishing" },
  { icon: Compass, label: "Present to buyers in Bangladesh and beyond" },
];


// Same four seller payout methods, icons and brand tints as /durqo-bangladesh's
// PAYOUT_METHODS (BkashIcon from PaymentIcons.tsx; Nagad/Rocket as tinted
// lucide glyphs, since neither brand publishes an inline vector mark — see
// PaymentIcons.tsx's own comment on why).
const PAYOUT_METHODS = [
  { icon: Landmark, label: "Bank Transfer", tint: "text-brand-strong" },
  { icon: BkashIcon, label: "bKash", tint: "text-[#E2136E]" },
  { icon: Smartphone, label: "Nagad", tint: "text-[#ED1C24]" },
  { icon: RocketGlyph, label: "Rocket", tint: "text-[#7B1E3F]" },
];


// Pulled near-verbatim from the live /seller-faq page's "Fees & getting
// paid" and "Buyers & disputes" groups, trimmed to what a Bangladeshi seller
// is most likely to ask. Keep FAQ_JSON_LD above in sync when editing this.
const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: "Listing and fees",
    items: [
      {
        question: "Is it free to list my business?",
        answer:
          "Yes. There's no upfront listing fee and no monthly subscription. Durqo only charges a success fee, and only once your business actually sells.",
      },
      {
        question: "How much does Durqo charge when my business sells?",
        answer: (
          <>
            A tiered success fee based on your final sale price, shown in the Marketplace Fees section above. It
            is deducted only when your business sells. See the full breakdown on the{" "}
            <Link href="/payments" className="font-semibold text-brand-strong hover:underline">
              Payment &amp; Withdrawal
            </Link>{" "}
            page.
          </>
        ),
      },
    ],
  },
  {
    heading: "Getting paid in BDT",
    items: [
      {
        question: "What withdrawal methods can I use as a seller in Bangladesh?",
        answer: (
          <>
            Bank Transfer, bKash, Rocket or Nagad, alongside PayPal and Wise for sellers who prefer them. bKash,
            Rocket and Nagad each have their own independent limit of ৳50,000 per day and ৳300,000 per month; the
            other methods have no such cap. See{" "}
            <Link href="/buy-and-sell-digital-businesses-in-bdt" className="font-semibold text-brand-strong hover:underline">
              Buy and Sell Digital Businesses in BDT
            </Link>{" "}
            for the exact BDT conversion rate applied to payouts.
          </>
        ),
      },
      {
        question: "When can I withdraw my earnings?",
        answer:
          "Once the buyer approves the transfer and any required review is complete, you can request a withdrawal from your Earnings dashboard. Before your very first withdrawal, you'll also need to have completed identity verification (KYC). Durqo normally reviews and processes eligible payout requests within 3-5 business days; your bank or payout provider may require additional time to credit the funds.",
      },
      {
        question: "Does my payout account name need to match my verified identity?",
        answer:
          "Yes. The account holder name you enter when requesting a withdrawal must match the legal name on your identity verification (KYC). Durqo's team checks this by hand as part of reviewing every payout request.",
      },
    ],
  },
  {
    heading: "Completing the sale",
    items: [
      {
        question: "What exactly is the Transfer Room?",
        answer: (
          <>
            It&rsquo;s the shared space, separate from checkout, where you actually hand a sold business over to
            its buyer. Every order gets one, also listed under <strong>Asset Transfers</strong> in your dashboard.
            You submit each asset there one at a time; once the buyer inspects everything and clicks{" "}
            <strong>Approve Transfer</strong>, the sale is final and your payout becomes eligible.
          </>
        ),
      },
      {
        question: "What happens if a buyer reports an issue instead of approving?",
        answer: (
          <>
            <strong>Nothing is released automatically.</strong> Your payout stays on hold while Durqo&rsquo;s team
            reviews the evidence and decides what happens next, the same way any other dispute is handled.
          </>
        ),
      },
      {
        question: "What if a buyer disputes a completed sale?",
        answer: (
          <>
            Disputes must be reported to Durqo within <strong>7 days</strong> of the transaction completing. Where
            a dispute can&rsquo;t be resolved directly between buyer and seller, Durqo will review the available
            evidence and help mediate a resolution.
          </>
        ),
      },
    ],
  },
];

const BUSINESS_TYPES = [
  { icon: Globe, label: "Content websites" },
  { icon: Layers, label: "SaaS businesses" },
  { icon: ShoppingCart, label: "E-commerce businesses" },
  { icon: Smartphone, label: "Mobile and web apps" },
  { icon: PlaySquare, label: "YouTube channels" },
  { icon: LinkIcon, label: "Domains" },
  { icon: Share2, label: "Social media businesses" },
  { icon: Boxes, label: "Other digital businesses" },
];

const WHY_FOUNDERS_SELL = [
  { icon: Compass, text: "Move on to another project" },
  { icon: DollarSign, text: "Free up capital for a new venture" },
  { icon: Layers, text: "Reduce the number of businesses you operate" },
  { icon: Clock, text: "Step away from day-to-day operations" },
  { icon: TrendingUp, text: "Realize some of the value you have created" },
  { icon: Users, text: "Find a buyer who can take the business to its next stage" },
];

const VALUE_FACTORS = [
  { icon: DollarSign, title: "Revenue", body: "How much revenue does the business generate?" },
  { icon: Wallet, title: "Profit", body: "How much remains after operating expenses?" },
  { icon: Repeat, title: "Revenue Consistency", body: "Is revenue stable, growing, declining, recurring, or seasonal?" },
  { icon: Activity, title: "Traffic", body: "Where does the business's traffic come from?" },
  { icon: Calendar, title: "Business Age", body: "How long has the business been operating?" },
  { icon: TrendingUp, title: "Growth", body: "Is revenue, profit, traffic, or the customer base growing?" },
  { icon: Clock, title: "Owner Involvement", body: "How much time does the current owner need to spend on it?" },
  { icon: Users, title: "Customer Concentration", body: "Does revenue depend heavily on one or a few customers?" },
  { icon: Package, title: "Transferable Assets", body: "What exactly will transfer to the new owner?" },
  { icon: Compass, title: "Growth Opportunities", body: "Are there realistic opportunities a new owner could pursue?" },
];

const BUYER_QUESTIONS = [
  "How does the business make money?",
  "How consistent are revenue and profit?",
  "Where does traffic come from?",
  "Why is the owner selling?",
  "How much time does the business require?",
  "What are the main operating expenses?",
  "What assets are included?",
  "How dependent is the business on the current owner?",
  "What are the biggest risks?",
  "What opportunities exist for future growth?",
];

const PREPARE_CATEGORIES = [
  {
    icon: DollarSign,
    title: "Financial Information",
    intro: "Prepare accurate information about:",
    items: ["Revenue", "Operating expenses", "Profit", "Major recurring expenses", "Revenue sources"],
    note: "Avoid presenting financial claims that cannot be reasonably supported.",
  },
  {
    icon: Activity,
    title: "Traffic and Analytics",
    intro: "For websites and other traffic-dependent businesses, buyers may want to understand:",
    items: ["Monthly traffic", "Traffic trends", "Traffic sources", "Geographic distribution", "Organic vs. paid traffic"],
    note: "Where available, analytics verification can help support traffic information presented to buyers.",
  },
  {
    icon: Settings,
    title: "Operations",
    intro: "Explain:",
    items: [
      "How the business operates",
      "Your responsibilities",
      "Required weekly/monthly workload",
      "Employees or contractors involved",
      "Important suppliers or service providers",
      "Key operational processes",
    ],
  },
  {
    icon: Boxes,
    title: "Assets Included",
    intro: "Depending on the business, this could include:",
    items: [
      "Domain names",
      "Website files, source code, or the application",
      "Content and brand assets",
      "Social accounts",
      "Customer relationships or records where legally transferable",
      "Supplier relationships and documentation",
    ],
    note: "Only include assets that you have the legal right and practical ability to transfer.",
  },
];

const PRICE_FACTORS = [
  "Historical revenue",
  "Historical profit",
  "Growth trends",
  "Revenue stability",
  "Business risks",
  "Owner involvement",
  "Quality of traffic",
  "Customer concentration",
  "Transferability",
  "Future opportunities",
];

type SellingStep = {
  n: string;
  icon: typeof FileText;
  title: string;
  body: string;
  link?: { href: string; label: string };
};

const SELLING_STEPS: SellingStep[] = [
  {
    n: "01",
    icon: FileText,
    title: "Create Your Listing",
    body: "Provide information about your business, performance, operations, asking price, and the assets included in the proposed sale.",
  },
  {
    n: "02",
    icon: ClipboardCheck,
    title: "Listing Review",
    body: "Durqo reviews submitted listings before publication according to its current listing-review process.",
    link: { href: "/listing-review", label: "How listings are reviewed" },
  },
  {
    n: "03",
    icon: Globe,
    title: "Present the Opportunity",
    body: "Once approved and published, your business can be discovered by prospective buyers using Durqo.",
  },
  {
    n: "04",
    icon: Users,
    title: "Receive Buyer Interest",
    body: "Interested buyers can review the opportunity and communicate through the available marketplace process.",
  },
  {
    n: "05",
    icon: Scale,
    title: "Evaluate Offers",
    body: "Review potential offers and determine whether the proposed price and terms are acceptable.",
  },
  {
    n: "06",
    icon: FileSearch,
    title: "Complete Due Diligence",
    body: "The buyer may review relevant business, financial, operational, traffic, and ownership information.",
  },
  {
    n: "07",
    icon: Handshake,
    title: "Transfer the Business",
    body: "Once an agreement is reached and applicable requirements are satisfied, the agreed assets can be transferred through Durqo's transaction process.",
  },
  {
    n: "08",
    icon: CheckCircle2,
    title: "Complete the Transaction",
    body: "Complete the required confirmation and payout process according to Durqo's current transaction terms.",
  },
];

const TRUST_ITEMS = [
  "Revenue",
  "Profit",
  "Traffic",
  "Customers",
  "Business ownership",
  "Business assets",
  "Performance",
  "Verification status",
];

const CHECKLIST_ITEMS = [
  "What the business does",
  "How the business generates revenue",
  "Revenue and profit information",
  "Major operating expenses",
  "Traffic and acquisition sources, where relevant",
  "Your reason for selling",
  "How much owner involvement is required",
  "What assets are included",
  "Your asking price",
  "What information can be provided during due diligence",
  "How the relevant assets can be transferred",
];

export default function SellYourOnlineBusinessBangladeshPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
      <ArticleViewTracker />

      {/* HERO */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="grid gap-10 lg:grid-cols-[56fr_44fr] lg:items-start lg:gap-16">
              <div className="min-w-0">
                <DashEyebrow>Seller guide · Bangladesh</DashEyebrow>
                <h1 className="max-w-[24ch] text-4xl leading-[1.1] sm:text-5xl lg:text-[3.2rem]">
                  How to Sell an Online Business from <span className="text-brand">Bangladesh</span>
                </h1>
                <div className="mt-5 flex flex-col gap-4 text-lg leading-relaxed text-ink-soft">
                  <p>
                    Whether it&rsquo;s a website, SaaS product, e-commerce business, app, or YouTube channel, many
                    founders eventually ask the same question: what would it take to sell it, and to whom?
                  </p>
                  <p className="text-[1.05rem]">
                    This guide covers how to prepare your business, what buyers look for, and how to list it on
                    Durqo.
                  </p>
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Reviewed by the Durqo Marketplace Team · Updated September 2026
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <TrackedCta href="/sell" cta="hero_primary" size="lg">
                    List Your Business
                    <ArrowRight size={16} />
                  </TrackedCta>
                  <TrackedCta href="/how-to-sell" cta="hero_secondary" variant="secondary" size="lg">
                    Explore Selling on Durqo
                  </TrackedCta>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-rule pt-6">
                  {HERO_TRUST_ROW.map(({ icon: Icon, label }) => (
                    <span key={label} className="flex items-center gap-2 text-sm text-ink-soft">
                      <Icon size={15} className="text-brand" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="min-w-0 rounded-2xl border border-rule bg-paper-raised p-6 shadow-sm sm:p-7">
                <p className="mono mb-4 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  Selling Overview
                </p>

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <DollarSign size={16} />
                  </span>
                  <div>
                    <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">
                      What buyers weigh
                    </p>
                    <h3 className="text-sm font-semibold text-ink">Revenue, traffic and growth history</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      Buyers commonly evaluate revenue, profit, traffic, growth trends and how the business operates
                      before making an offer.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {["Revenue", "Profit", "Traffic"].map((label) => (
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
                    <ShieldCheck size={16} />
                  </span>
                  <div>
                    <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-[#92730F]">
                      Structured listing process
                    </p>
                    <h3 className="text-sm font-semibold text-ink">Reviewed before it goes live</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      Every submitted listing goes through Durqo&rsquo;s review process, then can be discovered by
                      buyers on the marketplace.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {["Free to list", "Reviewed", "Any category"].map((label) => (
                        <span key={label} className="mono rounded-full border border-rule px-2.5 py-1 text-[0.65rem] text-ink-soft">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <InfoNote>
                  This guide does not estimate your specific value or guarantee a buyer, price, or sale. See
                  &ldquo;What Could Your Online Business Be Worth?&rdquo; below.
                </InfoNote>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* IS YOUR BUSINESS SELLABLE */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-8 max-w-[70ch]">
              <DashEyebrow>Where to start</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Is your online business sellable?</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                If you can transfer ownership of what you have built, your business is a candidate - no
                matter its size or track record. What matters most is clarity: can a buyer understand what
                it does, how it makes money, and what is included.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {BUSINESS_TYPES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-rule bg-paper-raised p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <Icon size={16} />
                  </span>
                  <span className="text-sm font-medium text-ink">{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <TrackedCta href="/sell" cta="sellable_cta">
                Have a digital business? List your business
                <ArrowRight size={16} />
              </TrackedCta>
            </div>
          </Inner>
        </Container>
      </section>

      {/* WHY FOUNDERS SELL */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-8 max-w-[70ch]">
              <DashEyebrow>Why founders sell</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Selling doesn&rsquo;t mean the business failed.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Owners consider selling for many reasons - none of them mean the business failed:
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {WHY_FOUNDERS_SELL.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3.5 rounded-xl border border-rule bg-paper-raised p-5">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <Icon size={16} />
                  </span>
                  <p className="text-sm font-medium leading-relaxed text-ink">{text}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
              Whatever your reason, preparing properly keeps the process organized and transparent.
            </p>
          </Inner>
        </Container>
      </section>

      {/* WHAT DETERMINES VALUE */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-8 max-w-[70ch]">
              <DashEyebrow>Valuation</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">What could your online business be worth?</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                There is no single formula - different buyers weigh things differently. Here is what buyers
                commonly consider:
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {VALUE_FACTORS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-xl border border-rule bg-paper-raised p-5">
                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand-strong">
                    <Icon size={16} />
                  </span>
                  <h3 className="text-sm font-semibold text-ink">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
              A credible asking price is backed by your business&rsquo;s actual performance, not just what you
              hope to receive.
            </p>
          </Inner>
        </Container>
      </section>

      {/* WHAT BUYERS WANT TO KNOW */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[880px]">
            <div className="mb-8 max-w-[70ch]">
              <DashEyebrow>Buyer&rsquo;s perspective</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Think like a buyer before you list.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Before making an offer, buyers want to understand both the opportunity and the risks. Expect
                questions such as:
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {BUYER_QUESTIONS.map((q, i) => (
                <div key={q} className="flex items-start gap-3 rounded-lg border border-rule bg-paper-raised px-4 py-3.5">
                  <span className="mono mt-0.5 shrink-0 text-xs font-semibold text-brand-strong">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium text-ink">{q}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm leading-relaxed text-ink-soft">
              Clear answers, ready in advance, make for stronger conversations with buyers.
            </p>
          </Inner>
        </Container>
      </section>

      {/* PREPARE YOUR BUSINESS */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-8 max-w-[70ch]">
              <DashEyebrow>Preparation</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Prepare your business before going to market.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Good preparation makes it easier for buyers to evaluate your business. Start by organizing
                information in these four areas.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {PREPARE_CATEGORIES.map(({ icon: Icon, title, intro, items, note }) => (
                <div key={title} className="rounded-xl border border-rule bg-paper-raised p-6">
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-strong">
                      <Icon size={16} />
                    </span>
                    <h3 className="text-base font-semibold text-ink">{title}</h3>
                  </div>
                  <p className="text-sm text-ink-soft">{intro}</p>
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {items.map((it) => (
                      <Dot key={it}>{it}</Dot>
                    ))}
                  </ul>
                  {note && <p className="mt-4 text-xs leading-relaxed text-ink-faint">{note}</p>}
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* SELLER CHECKLIST */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner className="max-w-[900px]">
            <div className="mb-8 max-w-[70ch]">
              <DashEyebrow>Before you list</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Seller checklist.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Before listing, make sure you can clearly explain each of the following.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {CHECKLIST_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 rounded-lg border border-rule bg-paper-raised px-4 py-3.5">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-strong" />
                  <span className="text-sm text-ink">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex items-start gap-2 rounded-lg border border-rule bg-paper-raised p-4 text-xs leading-relaxed text-ink-faint">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-ink-faint" />
              Do not make unsupported financial or performance claims.
            </p>
          </Inner>
        </Container>
      </section>

      {/* MID-PAGE CTA */}
      <section className="border-b border-rule bg-brand-strong py-14 text-center sm:py-16">
        <Container>
          <Inner className="max-w-[720px]">
            <DashEyebrow onDark center>
              Ready when you are
            </DashEyebrow>
            <h2 className="text-2xl text-white sm:text-3xl">Built something valuable?</h2>
            <p className="mx-auto mt-3 max-w-[56ch] text-[0.95rem] leading-relaxed text-white/70">
              List your website, SaaS product, e-commerce business, app, or other digital business on Durqo to
              reach buyers wherever they are based.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <TrackedCta href="/sell" cta="mid_page_primary" size="lg">
                List Your Business
                <ArrowRight size={16} />
              </TrackedCta>
              <TrackedCta href="/how-to-sell" cta="mid_page_secondary" variant="on-dark" size="lg">
                Learn How Selling Works
              </TrackedCta>
            </div>
          </Inner>
        </Container>
      </section>

      {/* ASKING PRICE */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[760px]">
            <DashEyebrow>Pricing</DashEyebrow>
            <h2 className="text-2xl sm:text-3xl">Set a realistic asking price.</h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
              An unrealistic price can turn buyers away - an overly cautious one can cost you. Consider:
            </p>
            <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {PRICE_FACTORS.map((f) => (
                <Dot key={f}>{f}</Dot>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-ink-soft">
              Aim for a price you can explain and support with real business information.
            </p>
            <InfoNote>
              An asking price is not a guarantee of the final transaction price - the eventual price may depend on
              buyer interest, due diligence, negotiations, transaction terms, and other factors.
            </InfoNote>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              Not sure where to start?{" "}
              <Link href="/valuation" className="font-semibold text-brand-strong hover:underline">
                Get a free estimate of what your business could be worth
              </Link>
              .
            </p>
          </Inner>
        </Container>
      </section>

      {/* MARKETPLACE FEES */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start lg:gap-16">
              <div className="max-w-[60ch]">
                <DashEyebrow>What it costs</DashEyebrow>
                <h2 className="text-2xl sm:text-3xl">Marketplace fees.</h2>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                  There is no upfront charge to list your business, and no monthly subscription. Durqo charges
                  sellers a tiered success fee based on the final sale price, deducted only after a successful
                  sale.
                </p>
              </div>
              <div className="rounded-2xl border border-rule bg-paper-raised p-6 sm:p-7">
                <p className="mono mb-4 text-xs font-semibold uppercase tracking-wider text-ink-faint">Seller success fee</p>
                <dl className="flex flex-col gap-3">
                  {SUCCESS_FEE_TIERS.map((tier) => (
                    <div
                      key={tier.id}
                      className="flex items-center justify-between gap-4 border-b border-rule pb-3 last:border-b-0 last:pb-0"
                    >
                      <dt className="text-sm text-ink-soft">{tier.label}</dt>
                      <dd className="mono text-lg font-bold text-brand-strong">{fmtRate(tier.rate)}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 flex items-start gap-2">
                  <Info size={13} className="mt-0.5 shrink-0 text-ink-faint" />
                  <p className="text-xs leading-relaxed text-ink-faint">
                    Applies to the full final sale price. See{" "}
                    <Link href="/buy-and-sell-digital-businesses-in-bdt" className="font-semibold text-brand-strong hover:underline">
                      Buy &amp; Sell in BDT
                    </Link>{" "}
                    for payout details.
                  </p>
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* HOW DURQO WORKS */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>The process</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">How selling on Durqo works.</h2>
            </div>
            <div className="flex flex-col gap-8">
              {SELLING_STEPS.map(({ n, icon: Icon, title, body, link }, i) => (
                <div key={n} className="flex gap-5 sm:gap-6">
                  <div className="flex flex-col items-center">
                    <span className="mono grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand-strong">
                      {n}
                    </span>
                    {i < SELLING_STEPS.length - 1 && <span className="mt-2 w-px flex-1 bg-rule" aria-hidden />}
                  </div>
                  <div className="pb-2">
                    <div className="mb-1.5 flex items-center gap-2">
                      <Icon size={16} className="text-brand" />
                      <h3 className="text-base font-semibold text-ink">{title}</h3>
                    </div>
                    <p className="max-w-[62ch] text-sm leading-relaxed text-ink-soft">{body}</p>
                    {link && (
                      <Link
                        href={link.href}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-strong hover:underline"
                      >
                        {link.label}
                        <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <TrackedCta href="/sell" cta="how_it_works_cta" size="lg">
                Start Your Listing
                <ArrowRight size={16} />
              </TrackedCta>
            </div>
          </Inner>
        </Container>
      </section>

      {/* BUILDING BUYER CONFIDENCE */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[760px]">
            <DashEyebrow>Trust</DashEyebrow>
            <h2 className="text-2xl sm:text-3xl">Give buyers information they can evaluate.</h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
              Trust matters when buying a digital business. A strong listing clearly distinguishes information
              that can be supported from information simply provided by the seller. Where applicable, Durqo
              may offer verification or review features.
            </p>
            <p className="mt-4 text-sm font-semibold text-ink">
              Sellers should provide accurate information and should never intentionally misrepresent:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TRUST_ITEMS.map((item) => (
                <span key={item} className="rounded-full border border-rule bg-paper-raised px-3 py-1.5 text-xs font-medium text-ink-soft">
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-5 text-sm leading-relaxed text-ink-soft">
              A transparent listing helps buyers evaluate an opportunity - and often gets more serious
              attention.
            </p>
          </Inner>
        </Container>
      </section>

      {/* SELLING FROM BANGLADESH */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[760px]">
            <DashEyebrow>Selling from Bangladesh</DashEyebrow>
            <h2 className="text-2xl sm:text-3xl">Selling a digital business from Bangladesh.</h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
              Being based in Bangladesh does not complicate selling a digital business. Digital businesses are
              not tied to one physical location, so yours can potentially attract buyers from anywhere - your
              location does not have to limit who sees your listing.
            </p>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
              Review Durqo&rsquo;s current information on transaction methods, BDT payment and payout options,
              and verification requirements before proceeding.
            </p>
            <InfoNote>
              Presenting a business through a marketplace can give sellers an opportunity to make their listing
              discoverable to a broader audience. This does not guarantee international buyer interest or a sale.
            </InfoNote>
            <div className="mt-5 flex flex-wrap gap-2">
              {PAYOUT_METHODS.map(({ icon: Icon, label, tint }) => (
                <span
                  key={label}
                  className="mono flex items-center gap-1.5 rounded-full border border-rule bg-paper-raised px-3 py-1.5 text-xs text-ink-soft"
                >
                  <Icon size={14} className={tint} />
                  {label}
                </span>
              ))}
            </div>
            <Link
              href="/buy-and-sell-digital-businesses-in-bdt"
              className="mt-5 flex items-center gap-3.5 rounded-xl border border-rule bg-paper-raised p-5 transition hover:border-brand-strong hover:shadow-sm"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                <Wallet size={17} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-ink">BDT payments and payouts</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
                  Payment methods, payouts and transaction details for sellers in Bangladesh.
                </span>
              </span>
              <ArrowRight size={16} className="shrink-0 text-ink-faint" />
            </Link>
          </Inner>
        </Container>
      </section>

      {/* FAQ */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[760px]">
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>Common questions</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Seller questions, answered.</h2>
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
                { href: "/how-to-sell", label: "How Selling on Durqo Works" },
                { href: "/valuation", label: "Free Business Valuation" },
                { href: "/seller-faq", label: "Seller’s FAQ" },
                { href: "/listing-review", label: "How Listings Are Reviewed" },
                { href: "/transfer-room", label: "The Transfer Room" },
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
          <Inner className="max-w-[700px] text-center">
            <h2 className="text-2xl sm:text-3xl">Built the business. Ready for what comes next?</h2>
            <p className="mx-auto mt-3 max-w-[54ch] text-sm text-white/70">
              Create your Durqo listing, provide the relevant business information, and make your business
              available for potential buyers to discover.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <TrackedCta href="/sell" cta="final_primary" size="lg">
                List Your Business
                <ArrowRight size={16} />
              </TrackedCta>
              <TrackedCta href="/how-to-sell" cta="final_secondary" variant="on-dark" size="lg">
                How Selling Works
              </TrackedCta>
            </div>
            <p className="mono mt-8 text-xs uppercase tracking-wide text-white/40">
              Websites · SaaS · E-commerce · Apps · YouTube · Domains · Other Digital Businesses
            </p>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
