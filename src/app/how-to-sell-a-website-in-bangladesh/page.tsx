import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  FileSearch,
  ShieldCheck,
  CreditCard,
  Wallet,
  Info,
  BadgeCheck,
  Landmark,
  Smartphone,
  Clock,
  PenLine,
  Search,
  Sparkles,
  Percent,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import GroupedFaq, { type FaqGroup } from "@/components/GroupedFaq";
import { BkashIcon } from "@/components/icons/PaymentIcons";
import { SUCCESS_FEE_TIERS, fmtRate } from "@/lib/fees";

// Sep 22, 2026: new keyword-targeted guide page, "How to Sell a Website in
// Bangladesh," the seller-side counterpart to /how-to-buy-a-website-in-
// bangladesh (built the same day). Same intersection: the Websites category
// specifically, for a seller based in Bangladesh specifically, distinct from
// the generic /how-to-sell guide (all categories, not BD-specific) and
// /buy-and-sell-digital-businesses-in-bdt (all categories, BD-specific).
//
// Every factual claim is grounded in real, live source, not invented copy:
//   - The Websites category's own Quick Statistics (monthly income, monthly
//     views, business age, authority score, articles posted, indexed pages)
//     are computed automatically from a seller's submitted evidence and
//     connected Google Analytics / Search Console / SEMrush / Ahrefs data
//     (src/lib/categories.ts's "websites" entry, and /verify-before-buying's
//     own description of that same evidence).
//   - The Success Fee schedule (10% under $50k, 7% from $50k-$250k, 5% over
//     $250k, flat on the whole sale price) comes straight from
//     SUCCESS_FEE_TIERS in src/lib/fees.ts, the single source every other
//     page quoting this number already imports from.
//   - Payout methods and their exact per-method limits (Bank Transfer/
//     PayPal/Wise: no cap; bKash/Rocket/Nagad: ৳50,000/day, ৳300,000/month
//     each, independent per method) and the 3-5 business day review window
//     match /seller-payouts's own PAYOUT_METHODS_INFO and STATUS_FLOW
//     content exactly, not a new claim.
//   - Escrow.com sales paying the seller directly, outside Durqo's own
//     withdrawal ledger, matches /seller-payouts's own documented behavior.
//   - The listing-to-payout flow (create listing, verification, submit for
//     review, buyer questions, Transfer Room, payout) mirrors the real
//     8-step flow already on /how-to-sell, condensed to what's specific to
//     a Websites listing and a Bangladeshi seller's payout options.
// No visible breadcrumb nav, matching the same choice already made on this
// page's sibling guides for consistency.
const META_TITLE = "How to Sell a Website in Bangladesh: Step-by-Step Guide | Durqo";
const META_DESCRIPTION =
  "Learn how to list, price and sell a website in Bangladesh: what buyers check, Durqo's seller fee tiers, and how to get paid in BDT through bKash, Rocket, Nagad or bank.";

export const metadata: Metadata = {
  title: META_TITLE,
  description: META_DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: META_TITLE,
    description: META_DESCRIPTION,
    url: "https://www.durqo.com/how-to-sell-a-website-in-bangladesh",
  },
  twitter: { card: "summary_large_image", title: META_TITLE, description: META_DESCRIPTION },
  alternates: { canonical: "https://www.durqo.com/how-to-sell-a-website-in-bangladesh" },
};

const PAGE_URL = "https://www.durqo.com/how-to-sell-a-website-in-bangladesh";
const PAGE_TITLE = "How to Sell a Website in Bangladesh";
const PUBLISHED_DATE = "2026-09-22";
const MODIFIED_DATE = "2026-09-22";

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

function DashEyebrow({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <p className={`mono mb-4 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-ink-soft ${center ? "justify-center" : ""}`}>
      <span className="h-px w-6 bg-brand" aria-hidden />
      {children}
    </p>
  );
}

function Inner({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1200px] ${className}`}>{children}</div>;
}

function NumberedFlow({ steps }: { steps: { title: string; body: string }[] }) {
  const n = steps.length;
  const inset = (0.5 / n) * 100;
  return (
    <div className="relative">
      <div className="absolute top-6 hidden h-px bg-rule md:block" style={{ left: `${inset}%`, right: `${inset}%` }} aria-hidden />
      <ol className="relative flex flex-col gap-6 md:grid md:grid-cols-6 md:gap-4">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4 md:flex-col md:items-center md:gap-3 md:text-center">
            <div className="flex flex-col items-center md:contents">
              <span className="mono relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white md:h-12 md:w-12">
                {i + 1}
              </span>
              {i < n - 1 && <span className="mt-2 w-px flex-1 bg-rule md:hidden" aria-hidden />}
            </div>
            <div className="pb-1 md:pb-0">
              <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const WHY_CARDS = [
  {
    icon: TrendingUp,
    title: "Reach buyers looking to buy, not build",
    body: "Durqo's buyers are specifically looking for an already-running website, so you're pricing in the traffic, content and income history you've already built, not starting a negotiation from zero.",
  },
  {
    icon: FileSearch,
    title: "Evidence does the selling for you",
    body: "Quick Statistics, income evidence and Google Analytics/Search Console access, where connected, let a serious buyer evaluate your website without a long back-and-forth.",
  },
  {
    icon: ShieldCheck,
    title: "A tracked handover, not a handshake",
    body: "The buyer's payment is held by Durqo, or independently by Escrow.com on an Escrow.com sale, and only released to you once the buyer has confirmed they received the agreed assets.",
  },
];

const SELLER_STEPS = [
  {
    title: "Create Your Seller Account",
    body: "Sign up with your email. Listing is free, with no upfront charge to publish a Websites listing.",
  },
  {
    title: "Build Your Listing",
    body: "Add your website's details, revenue history and story under the Websites category. Quick Statistics such as monthly income, monthly views, authority score, articles posted and indexed pages are generated from what you submit and any connected data.",
  },
  {
    title: "Verify What You Can",
    body: "Connect Google Analytics for a GA Verified badge, and submit revenue evidence and Search Console, SEMrush or Ahrefs data where available. Verifying your identity adds a Verified Seller badge too.",
  },
  {
    title: "Submit for Listing Review",
    body: "Durqo's team reviews every submission for accuracy and completeness before it goes live, and emails you once a decision is made.",
  },
  {
    title: "Answer Buyer Questions",
    body: "Once published, reply to public questions in your listing's Comments thread and handle private offers from your dashboard inbox.",
  },
  {
    title: "Transfer the Assets and Get Paid",
    body: "Once a buyer pays, hand over the agreed assets in your order's Transfer Room. After the buyer approves the transfer, request your payout in BDT or another available method.",
  },
];

const BUYER_CHECKS = [
  {
    icon: FileSearch,
    title: "Revenue evidence",
    body: "Up to 12 months of income evidence, ideally with supporting screenshots rather than a single typed-in number.",
  },
  {
    icon: Search,
    title: "Google Analytics & Search Console",
    body: "A connected GA property earns a live, auto-updating panel and a GA Verified badge. Search Console, SEMrush and Ahrefs data, where added, each come with their own proof screenshots.",
  },
  {
    icon: BadgeCheck,
    title: "Domain age, authority and indexed pages",
    body: "These figures let a buyer judge your website's SEO footprint at a glance, alongside your monthly income and views.",
  },
  {
    icon: PenLine,
    title: "A clear, specific listing story",
    body: "Buyers weigh a well-documented business model, traffic sources and operating routine more heavily than a bare set of numbers.",
  },
];

const FEE_ROWS = SUCCESS_FEE_TIERS.map((tier) => ({
  label: tier.label,
  rate: fmtRate(tier.rate),
  highlight: tier.id === "50k-250k",
}));

const PAYOUT_METHODS = [
  { icon: Landmark, name: "Bank Transfer", cap: "No daily or monthly cap" },
  { icon: Smartphone, name: "bKash", cap: "Up to ৳50,000/day · ৳300,000/month" },
  { icon: Smartphone, name: "Rocket", cap: "Up to ৳50,000/day · ৳300,000/month" },
  { icon: Smartphone, name: "Nagad", cap: "Up to ৳50,000/day · ৳300,000/month" },
  { icon: CreditCard, name: "PayPal", cap: "No daily or monthly cap" },
  { icon: CreditCard, name: "Wise", cap: "No daily or monthly cap" },
];

const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: "Pricing and fees",
    items: [
      {
        question: "How much does it cost to sell a website on Durqo?",
        answer: "Listing a website is free, with no upfront charge. Durqo only charges a Success Fee once your sale completes, calculated as a flat percentage of the entire final sale price: 10% under $50,000, 7% from $50,000 to $250,000, and 5% over $250,000.",
      },
      {
        question: "How much is my website worth?",
        answer: (
          <>
            That depends on your income history, traffic, niche and how well-documented your listing is. See{" "}
            <Link href="/how-much-is-a-website-worth-in-bangladesh" className="font-semibold text-brand-strong hover:underline">
              How Much Is a Website Worth in Bangladesh?
            </Link>{" "}
            for a walkthrough of how buyers typically approach valuation.
          </>
        ),
      },
      {
        question: "Does Durqo charge buyers a fee too?",
        answer: "No. Durqo does not charge buyers a marketplace fee. Only the seller's Success Fee applies, and only once a sale completes.",
      },
    ],
  },
  {
    heading: "Getting paid in Bangladesh",
    items: [
      {
        question: "Can I get paid in BDT through bKash, Rocket or Nagad?",
        answer: "Yes. Once your sale is complete and eligible for payout, you can withdraw to bKash, Rocket or Nagad, each capped at ৳50,000 per day and ৳300,000 per month independently, or to Bank Transfer, PayPal or Wise with no daily or monthly cap.",
      },
      {
        question: "How long does a payout take?",
        answer: "Eligible payout requests are normally reviewed and processed within an estimated 3-5 business days. The Available to Withdraw balance shown in your dashboard is already net of Durqo's Success Fee, so there's no surprise deduction later.",
      },
      {
        question: "What if my buyer paid through Escrow.com?",
        answer: "Escrow.com sales are paid out to you directly by Escrow.com under its own terms, not through Durqo's own withdrawal system, and don't appear on Durqo's payout ledger.",
      },
    ],
  },
  {
    heading: "Listing and verification",
    items: [
      {
        question: "Is seller identity verification required?",
        answer: "The public Verified Seller badge is optional, but the same identity check is required before your very first payout, so most sellers complete it early.",
      },
      {
        question: "Does connecting Google Analytics help my listing?",
        answer: (
          <>
            Yes. A connected GA property shows buyers a live, auto-updating panel and earns a GA Verified badge, an
            extra credibility signal. See{" "}
            <Link href="/verify-before-buying" className="font-semibold text-brand-strong hover:underline">
              how buyers verify a listing&rsquo;s numbers
            </Link>{" "}
            to see exactly what they&rsquo;re looking for.
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
    { q: "How much does it cost to sell a website on Durqo?", a: "Listing a website is free, with no upfront charge. Durqo only charges a Success Fee once your sale completes, calculated as a flat percentage of the entire final sale price: 10% under $50,000, 7% from $50,000 to $250,000, and 5% over $250,000." },
    { q: "How much is my website worth?", a: "That depends on your income history, traffic, niche and how well-documented your listing is." },
    { q: "Does Durqo charge buyers a fee too?", a: "No. Durqo does not charge buyers a marketplace fee. Only the seller's Success Fee applies, and only once a sale completes." },
    { q: "Can I get paid in BDT through bKash, Rocket or Nagad?", a: "Yes. Once your sale is complete and eligible for payout, you can withdraw to bKash, Rocket or Nagad, each capped at ৳50,000 per day and ৳300,000 per month independently, or to Bank Transfer, PayPal or Wise with no daily or monthly cap." },
    { q: "How long does a payout take?", a: "Eligible payout requests are normally reviewed and processed within an estimated 3-5 business days. The Available to Withdraw balance shown in your dashboard is already net of Durqo's Success Fee." },
    { q: "What if my buyer paid through Escrow.com?", a: "Escrow.com sales are paid out to you directly by Escrow.com under its own terms, not through Durqo's own withdrawal system." },
    { q: "Is seller identity verification required?", a: "The public Verified Seller badge is optional, but the same identity check is required before your very first payout, so most sellers complete it early." },
    { q: "Does connecting Google Analytics help my listing?", a: "Yes. A connected GA property shows buyers a live, auto-updating panel and earns a GA Verified badge, an extra credibility signal." },
  ].map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

export default function HowToSellAWebsiteInBangladeshPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />

      {/* HERO */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="grid gap-10 lg:grid-cols-[56fr_44fr] lg:gap-16">
              <div className="min-w-0">
                <DashEyebrow>Seller guide · Bangladesh</DashEyebrow>
                <h1 className="max-w-[26ch] text-4xl leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
                  How to Sell a Website in <span className="text-brand">Bangladesh</span>
                </h1>
                <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-ink-soft">
                  Turn your website into a completed sale. This guide walks through building a listing buyers trust,
                  what Durqo charges, and how to get paid in BDT once your sale is done.
                </p>
                <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-rule bg-brand-soft/40 px-4 py-3">
                  <Sparkles size={15} className="mt-0.5 shrink-0 text-brand-strong" aria-hidden />
                  <p className="text-sm leading-relaxed text-ink">
                    <span className="font-semibold">Quick answer:</span> Listing is free. Durqo charges a flat 10%-5%
                    Success Fee only once your sale completes, and you can withdraw in BDT through bKash, Rocket,
                    Nagad, Bank Transfer, PayPal or Wise.
                  </p>
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Reviewed by the Durqo Marketplace Team · Updated September 2026
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button href="/sell" size="lg">
                    List Your Website
                    <ArrowRight size={16} />
                  </Button>
                  <Button href="/seller-payouts" variant="secondary" size="lg">
                    How Payouts Work
                  </Button>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
                  {[
                    { icon: FileSearch, label: "Free to list, no upfront charge" },
                    { icon: BkashIcon, label: "Get paid in BDT via bKash, Rocket or Nagad" },
                    { icon: ShieldCheck, label: "10%-5% flat success fee, only on a completed sale" },
                  ].map(({ icon: Icon, label }) => (
                    <span key={label} className="flex items-center gap-2 text-sm text-ink-soft">
                      <Icon size={15} className="text-brand" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="min-w-0 rounded-2xl border border-rule bg-paper-raised p-6 shadow-sm sm:p-7">
                <p className="mono mb-4 text-xs font-semibold uppercase tracking-wider text-ink-faint">Selling Overview</p>

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <FileSearch size={16} />
                  </span>
                  <div>
                    <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">Build trust</p>
                    <h3 className="text-sm font-semibold text-ink">Evidence-backed listing</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      Revenue evidence, GA/GSC access and clear Quick Statistics help buyers evaluate your website fast.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {["Revenue evidence", "GA Verified", "Free to list"].map((label) => (
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
                    <Wallet size={16} />
                  </span>
                  <div>
                    <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-[#92730F]">Get paid</p>
                    <h3 className="text-sm font-semibold text-ink">BDT, bank, or global transfer</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      Withdraw to bKash, Rocket, Nagad, Bank Transfer, PayPal or Wise once your sale completes.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {["bKash", "Rocket", "Nagad", "Bank", "PayPal", "Wise"].map((label) => (
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
                    Durqo&rsquo;s Success Fee is only charged once a sale completes and is already deducted from your
                    Available to Withdraw balance, so there&rsquo;s no surprise deduction later.
                  </p>
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* WHY SELL ON DURQO */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>Why sell here</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Sell to buyers who are already looking.</h2>
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
              <h2 className="text-2xl sm:text-3xl">Six steps, from listing to payout.</h2>
            </div>
            <NumberedFlow steps={SELLER_STEPS} />
          </Inner>
        </Container>
      </section>

      {/* WHAT BUYERS CHECK */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>Sell it like a buyer would check it</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">What buyers look for before they pay.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Prepare these before you publish, and expect fewer back-and-forth questions once buyers start looking.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {BUYER_CHECKS.map(({ icon: Icon, title, body }) => (
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
              href="/website-due-diligence-checklist-for-buyers"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong hover:underline"
            >
              See the full buyer due diligence checklist
              <ArrowRight size={14} />
            </Link>
          </Inner>
        </Container>
      </section>

      {/* FEES */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>What it costs</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Free to list. A flat fee only when you sell.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Durqo&rsquo;s Success Fee is a flat percentage of the entire final sale price, not a marginal rate, and it
                only applies once a sale completes. Buyers pay no marketplace fee at all.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {FEE_ROWS.map((row) => (
                <div
                  key={row.label}
                  className={`relative rounded-xl border p-6 text-center ${
                    row.highlight ? "border-2 border-brand-strong bg-brand-soft/30" : "border-rule bg-paper-raised"
                  }`}
                >
                  {row.highlight && (
                    <span className="mono absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-strong px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-white">
                      Most sellers
                    </span>
                  )}
                  <span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <Percent size={18} />
                  </span>
                  <p className="mono text-4xl font-bold tabular-nums text-brand-strong">{row.rate}</p>
                  <p className="mt-2 text-sm font-medium text-ink-soft">{row.label}</p>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* PAYOUT METHODS */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>Getting paid</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Payout methods for sellers in Bangladesh.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Once your sale is complete and your payout is eligible, request a withdrawal to any available method.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PAYOUT_METHODS.map(({ icon: Icon, name, cap }) => (
                <div key={name} className="flex items-center gap-3.5 rounded-xl border border-rule bg-paper-raised p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <Icon size={17} />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{name}</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-faint">{cap}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-start gap-2.5 rounded-lg bg-paper-raised px-3.5 py-3">
              <Clock size={14} className="mt-0.5 shrink-0 text-ink-faint" />
              <p className="text-xs leading-relaxed text-ink-faint">
                Eligible payout requests are normally reviewed and processed within an estimated 3-5 business days.
                See{" "}
                <Link href="/seller-payouts" className="font-semibold text-ink-soft hover:underline">
                  How Seller Payouts Work
                </Link>{" "}
                for the full status flow.
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      {/* FAQ */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
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

      {/* RELATED READING */}
      <section className="border-b border-rule bg-paper-sunk py-10">
        <Container>
          <Inner>
            <p className="mono mb-4 text-xs font-semibold uppercase tracking-wider text-ink-faint">Keep exploring</p>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {[
                { href: "/how-much-is-a-website-worth-in-bangladesh", label: "How Much Is a Website Worth in Bangladesh?" },
                { href: "/how-to-buy-a-website-in-bangladesh", label: "How to Buy a Website in Bangladesh" },
                { href: "/seller-payouts", label: "How Seller Payouts Work" },
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
          <Inner className="text-center">
            <h2 className="text-2xl sm:text-3xl">Ready to list your website?</h2>
            <p className="mx-auto mt-3 max-w-[52ch] text-sm text-white/70">
              It&rsquo;s free to publish a listing, and you only pay Durqo&rsquo;s Success Fee once your sale completes.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button href="/sell" size="lg">
                List Your Website
                <ArrowRight size={16} />
              </Button>
              <Button href="/how-to-sell" variant="on-dark" size="lg">
                Read the Full Seller Guide
              </Button>
            </div>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
