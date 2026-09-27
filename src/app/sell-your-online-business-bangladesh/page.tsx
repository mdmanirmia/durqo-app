import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Activity,
  Boxes,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  Globe,
  Layers,
  Link as LinkIcon,
  Package,
  Repeat,
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
// payout page, its existing FAQ/valuation/listing-review pages) or a
// general, unattributed statement about how buyers evaluate businesses —
// never a specific number, buyer count, transaction count, testimonial, or
// outcome guarantee. Per the brief's own implementation rules, this page
// deliberately does NOT: state or imply Durqo guarantees a buyer, a sale, a
// valuation, a price, or a transaction timeframe; quote fees, BDT payment
// methods, or verification rules inline (it links to /buy-and-sell-digital-
// businesses-in-bdt, /seller-payouts and /listing-review instead, so this
// page never drifts out of sync with those); or invent usage statistics.
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
  dateModified: PUBLISHED_DATE,
  mainEntityOfPage: { "@type": "WebPage", "@id": PAGE_URL },
  url: PAGE_URL,
};

function DashEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mono mb-4 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">
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

const SELL_REASONS = [
  "Move on to another project",
  "Free up capital for a new venture",
  "Reduce the number of businesses you operate",
  "Step away from day-to-day operations",
  "Realize some of the value you have created",
  "Find a buyer who can take the business to its next stage",
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

const SELLING_STEPS = [
  {
    title: "Create Your Listing",
    body: "Provide information about your business, performance, operations, asking price, and the assets included in the proposed sale.",
  },
  {
    title: "Listing Review",
    body: "Durqo reviews submitted listings before publication according to its current listing-review process.",
  },
  {
    title: "Present the Opportunity",
    body: "Once approved and published, your business can be discovered by prospective buyers using Durqo.",
  },
  {
    title: "Receive Buyer Interest",
    body: "Interested buyers can review the opportunity and communicate through the available marketplace process.",
  },
  {
    title: "Evaluate Offers",
    body: "Review potential offers and determine whether the proposed price and terms are acceptable.",
  },
  {
    title: "Complete Due Diligence",
    body: "The buyer may review relevant business, financial, operational, traffic, and ownership information.",
  },
  {
    title: "Transfer the Business",
    body: "Once an agreement is reached and applicable requirements are satisfied, the agreed assets can be transferred through Durqo's transaction process.",
  },
  {
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
          <Inner className="max-w-[820px]">
            <DashEyebrow>Seller guide · Bangladesh</DashEyebrow>
            <h1 className="max-w-[24ch] text-4xl leading-[1.1] sm:text-5xl lg:text-[3.2rem]">
              How to Sell an Online Business from <span className="text-brand">Bangladesh</span>
            </h1>
            <div className="mt-6 flex flex-col gap-4 text-[1.05rem] leading-relaxed text-ink-soft">
              <p>Building an online business takes time.</p>
              <p>
                Whether you have developed a profitable website, SaaS product, e-commerce business, app, YouTube
                channel, or another digital business, there may come a point when selling becomes the right next
                step.
              </p>
              <p>
                For entrepreneurs in Bangladesh, selling a digital business does not necessarily mean limiting the
                search to local buyers. A digital business can potentially be presented to buyers across different
                markets.
              </p>
              <p>
                This guide explains how to prepare your business for sale, understand what buyers look for, organize
                the information needed for due diligence, and list your business for potential buyers.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <TrackedCta href="/sell" cta="hero_primary" size="lg">
                List Your Business
                <ArrowRight size={16} />
              </TrackedCta>
              <TrackedCta href="/how-to-sell" cta="hero_secondary" variant="secondary" size="lg">
                Explore Selling on Durqo
              </TrackedCta>
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
                <div key={label} className="flex items-center gap-2.5 rounded-lg border border-rule bg-paper-raised px-3.5 py-3">
                  <Icon size={16} className="shrink-0 text-brand" />
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
          <Inner className="max-w-[760px]">
            <DashEyebrow>Why founders sell</DashEyebrow>
            <h2 className="text-2xl sm:text-3xl">Selling doesn&rsquo;t mean the business failed.</h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
              Owners consider selling for many reasons. You may want to:
            </p>
            <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {SELL_REASONS.map((r) => (
                <Dot key={r}>{r}</Dot>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-ink-soft">
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
              {BUYER_QUESTIONS.map((q) => (
                <div key={q} className="rounded-lg border border-rule bg-paper-raised px-4 py-3.5 text-sm font-medium text-ink">
                  {q}
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
      <section className="border-b border-rule bg-brand-strong py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[720px] text-center">
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
              information. Remember that an asking price is not a guarantee of the final transaction price - the
              eventual price may depend on buyer interest, due diligence, negotiations, transaction terms, and other
              factors.
            </p>
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
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              Presenting a business through a marketplace can give sellers an opportunity to make their listing
              discoverable to a broader audience. This does not guarantee international buyer interest or a sale.
            </p>
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
            <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {SELLING_STEPS.map((step, i) => (
                <li key={step.title} className="rounded-xl border border-rule bg-paper-raised p-5">
                  <span className="mono mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{step.body}</p>
                  {i === 1 && (
                    <Link href="/listing-review" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-strong hover:underline">
                      How listings are reviewed
                      <ArrowRight size={12} />
                    </Link>
                  )}
                </li>
              ))}
            </ol>
            <div className="mt-8">
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
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline"
            >
              Learn about BDT payments and payouts
              <ArrowRight size={14} />
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
