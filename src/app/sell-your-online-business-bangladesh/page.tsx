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
  Layers,
  Link as LinkIcon,
  Package,
  Repeat,
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
                    Building an online business takes time. Whether you have developed a profitable website, SaaS
                    product, e-commerce business, app, YouTube channel, or another digital business, there may come a
                    point when selling becomes the right next step.
                  </p>
                  <p className="text-[1.05rem]">
                    This guide explains how to prepare your business for sale, understand what buyers look for,
                    organize the information needed for due diligence, and list it for potential buyers, wherever
                    they are based.
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
                Many digital businesses can potentially be sold when ownership of the underlying assets and operations
                can be transferred to another owner. A business does not need to be a large company to attract
                acquisition interest. What matters is whether a prospective buyer can understand what the business
                does, how it generates value, what assets are included, and how the business could operate after
                ownership changes.
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
                Owners consider selling for many reasons. You may want to:
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
              Whatever the reason, preparing properly before approaching buyers can make the selling process more
              organized and transparent.
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
                There is no single formula that determines the value of every digital business - different buyers may
                evaluate the same opportunity differently. Buyers commonly consider factors such as:
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
              A credible asking price should be supported by the actual characteristics and performance of the
              business, not simply the amount the seller hopes to receive.
            </p>
          </Inner>
        </Container>
      </section>

      {/* WHAT BUYERS WANT TO KNOW */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-8 max-w-[70ch]">
              <DashEyebrow>Buyer&rsquo;s perspective</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Think like a buyer before you list.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Before making an offer, a serious buyer will usually want to understand both the opportunity and the
                risks. Expect questions such as:
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
              Preparing clear answers before listing can make conversations with prospective buyers more productive.
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
                Good preparation can make it easier for potential buyers to evaluate an opportunity. Before creating a
                listing, organize the key information about your business.
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

      {/* MID-PAGE CTA */}
      <section className="border-b border-rule bg-brand-strong py-14 text-center sm:py-16">
        <Container>
          <Inner className="max-w-[720px]">
            <DashEyebrow onDark center>
              Ready when you are
            </DashEyebrow>
            <h2 className="text-2xl text-white sm:text-3xl">Built something valuable?</h2>
            <p className="mx-auto mt-3 max-w-[56ch] text-[0.95rem] leading-relaxed text-white/70">
              If you have built a website, SaaS product, e-commerce business, app, or another digital business, you
              can explore listing it on Durqo and presenting the opportunity to potential buyers.
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
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[760px]">
            <DashEyebrow>Pricing</DashEyebrow>
            <h2 className="text-2xl sm:text-3xl">Set a realistic asking price.</h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
              An unrealistic asking price can make it difficult to generate serious buyer interest. Before deciding on
              a price, consider:
            </p>
            <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {PRICE_FACTORS.map((f) => (
                <Dot key={f}>{f}</Dot>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-ink-soft">
              The objective should be to establish an asking price that you can explain and support with business
              information.
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

      {/* BUYERS OUTSIDE BANGLADESH */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[760px]">
            <DashEyebrow>Reach</DashEyebrow>
            <h2 className="text-2xl sm:text-3xl">Your buyer does not have to be in Bangladesh.</h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
              Digital businesses differ from many traditional businesses because their operations and assets are not
              always tied to one physical location. A digital business built in Bangladesh may therefore potentially
              attract buyers from other countries, including those interested in established websites, profitable
              SaaS businesses, e-commerce operations, apps, content businesses, and other digital assets.
            </p>
            <InfoNote>
              Presenting a business through a marketplace can give sellers an opportunity to make their listing
              discoverable to a broader audience. This does not guarantee international buyer interest or a sale.
            </InfoNote>
          </Inner>
        </Container>
      </section>

      {/* HOW DURQO WORKS */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
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
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[760px]">
            <DashEyebrow>Trust</DashEyebrow>
            <h2 className="text-2xl sm:text-3xl">Give buyers information they can evaluate.</h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
              Trust is particularly important when buying a digital business. A strong listing should clearly
              distinguish between information that can be supported and information that is simply provided by the
              seller. Where applicable, Durqo may provide verification or review features for certain information.
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
              A transparent listing can help prospective buyers evaluate an opportunity more effectively.
            </p>
          </Inner>
        </Container>
      </section>

      {/* SELLING FROM BANGLADESH / BDT LINK */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[760px]">
            <DashEyebrow>Selling from Bangladesh</DashEyebrow>
            <h2 className="text-2xl sm:text-3xl">Selling a digital business from Bangladesh.</h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
              Durqo supports digital entrepreneurs in Bangladesh who want to participate in the digital-business
              marketplace. Review the current Durqo information on supported transaction methods, BDT-related
              payment or payout options, verification requirements, and any transaction limitations before
              proceeding.
            </p>
            <Link
              href="/buy-and-sell-digital-businesses-in-bdt"
              className="mt-5 flex items-center gap-3.5 rounded-xl border border-rule bg-paper-raised p-5 transition hover:border-brand-strong"
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

      {/* SELLER CHECKLIST */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner className="max-w-[900px]">
            <div className="mb-8 max-w-[70ch]">
              <DashEyebrow>Before you list</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Seller checklist.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Before listing your business, make sure you can clearly explain:
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

      {/* RELATED READING */}
      <section className="border-b border-rule py-10">
        <Container>
          <Inner>
            <p className="mono mb-4 text-xs font-semibold uppercase tracking-wider text-ink-faint">Keep exploring</p>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {[
                { href: "/how-to-sell", label: "How Selling on Durqo Works" },
                { href: "/valuation", label: "Free Business Valuation" },
                { href: "/seller-faq", label: "Seller’s FAQ" },
                { href: "/listing-review", label: "How Listings Are Reviewed" },
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
              If you are considering selling your digital business, start by presenting the opportunity clearly.
              Create your Durqo listing, provide the relevant business information, and make your business available
              for potential buyers to discover.
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
