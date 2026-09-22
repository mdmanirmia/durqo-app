import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Layers,
  Wallet,
  ShieldCheck,
  Info,
  Globe2,
  CreditCard,
  FileSearch,
  Percent,
  Sparkles,
  ShoppingBag,
  Video,
  Share2,
  Cloud,
  Bot,
  Smartphone,
  Rocket,
  Puzzle,
  Link2,
  Package,
  Briefcase,
  Users,
  Gamepad2,
  Mail,
  Bitcoin,
  type LucideIcon,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import GroupedFaq, { type FaqGroup } from "@/components/GroupedFaq";
import { BkashIcon } from "@/components/icons/PaymentIcons";
import { CATEGORIES } from "@/lib/categories";

// Sep 22, 2026: new keyword-targeted hub page, "Online Businesses for Sale
// in Bangladesh," built for a Bangladeshi buyer who's shopping across
// categories rather than one specific type of business (the role
// /how-to-buy-a-website-in-bangladesh plays for the Websites category
// specifically). This page deliberately doesn't list or invent any specific
// business "for sale" — actual listings change constantly and live only in
// the real marketplace at /buy — so the category grid below is built
// straight from CATEGORIES in src/lib/categories.ts, the same 15-category
// list every other page on this site already uses, each card linking to
// that category's real /buy/[id] route. No listing counts, prices or
// business examples are invented anywhere on this page.
//
// Every other factual claim is grounded the same way as this page's
// sibling BD guides: the three live payment rails and their scope (Stripe,
// SSLCommerz for BDT via bKash/Rocket/Nagad/bank, and Escrow.com as an
// independent third-party option, all documented on /payments and
// /terms), and "no buyer marketplace fee" matching the wording already
// established on /how-to-buy-a-website-in-bangladesh and
// /buy-and-sell-digital-businesses-in-bdt. No visible breadcrumb nav,
// matching the same choice made across this page's sibling guides.
const META_TITLE = "Online Businesses for Sale in Bangladesh | Durqo";
const META_DESCRIPTION =
  "Browse online businesses for sale in Bangladesh across 15+ categories on Durqo: websites, e-commerce, SaaS, apps, domains and more, with BDT, card and Escrow.com payment options.";

export const metadata: Metadata = {
  title: META_TITLE,
  description: META_DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: META_TITLE,
    description: META_DESCRIPTION,
    url: "https://www.durqo.com/online-businesses-for-sale-in-bangladesh",
  },
  twitter: { card: "summary_large_image", title: META_TITLE, description: META_DESCRIPTION },
  alternates: { canonical: "https://www.durqo.com/online-businesses-for-sale-in-bangladesh" },
};

const PAGE_URL = "https://www.durqo.com/online-businesses-for-sale-in-bangladesh";
const PAGE_TITLE = "Online Businesses for Sale in Bangladesh";
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

// Purely visual: one icon per category id, matched by look/theme (not part
// of CATEGORIES itself in src/lib/categories.ts) so the category grid below
// reads as icon cards rather than plain text links. Falls back to Layers
// for any category id not listed here, so a future category addition never
// breaks this page.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  websites: Globe2,
  "e-commerce": ShoppingBag,
  "youtube-channels": Video,
  "social-media-accounts": Share2,
  saas: Cloud,
  "ai-apps-tools": Bot,
  "apps-tools": Smartphone,
  "startup-business": Rocket,
  "plugins-themes-extensions": Puzzle,
  domains: Link2,
  "amazon-stores-kdp": Package,
  "service-business": Briefcase,
  "digital-agencies": Users,
  games: Gamepad2,
  newsletters: Mail,
  "crypto-blockchain": Bitcoin,
};

const WHY_CARDS = [
  {
    icon: FileSearch,
    title: "Evidence, not just a listing photo",
    body: "Every listing carries Quick Statistics for its category, and Websites, e-commerce and SaaS listings can add Google Analytics, Search Console, SEMrush or Ahrefs data for extra verification.",
  },
  {
    icon: Layers,
    title: "One marketplace, every category",
    body: "Websites, e-commerce, SaaS, apps, domains, YouTube channels, startups and more, all reviewed and listed in the same place, instead of switching platforms by category.",
  },
  {
    icon: ShieldCheck,
    title: "A tracked handover",
    body: "Every order gets its own Transfer Room checklist, and Escrow.com is available as an independent third-party option for buyers who want it.",
  },
];

const PAYMENT_OPTIONS = [
  {
    icon: CreditCard,
    title: "Card (Stripe)",
    tint: "text-brand-strong",
    bg: "bg-brand-soft",
    body: "Pay the full purchase price by card for eligible transactions, processed through Stripe. Durqo holds the payment until the transfer is confirmed.",
  },
  {
    icon: Wallet,
    title: "bKash, Rocket, Nagad or Bank",
    tint: "text-[#92730F]",
    bg: "bg-gold-soft",
    body: "Eligible Bangladesh buyers can pay using bKash, Nagad, Rocket, a supported bank, or card through SSLCommerz, with the exact BDT amount shown before you confirm.",
  },
  {
    icon: Globe2,
    title: "Escrow.com",
    tint: "text-ink",
    bg: "bg-paper-sunk",
    body: "As an alternative, Escrow.com independently holds and releases the funds under its own transaction terms.",
  },
];

const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: "Buying across categories",
    items: [
      {
        question: "What kinds of online businesses can I buy on Durqo?",
        answer: "Durqo lists businesses across 15+ categories, including Websites, E-commerce, SaaS, AI Apps & Tools, Android & iOS Apps, Domains, YouTube Channels, Social Media Accounts, Startup Business, Digital Agencies and more. Browse any category to see its current listings.",
      },
      {
        question: "Does every category show the same information?",
        answer: "No. Each category has its own Quick Statistics: a website shows monthly income and traffic figures, a domain shows its age and registrar, an app shows ratings and downloads, for example. The category page shows exactly what's tracked for that type of business.",
      },
      {
        question: "Can I filter listings specifically for Bangladesh?",
        answer: (
          <>
            Durqo doesn&rsquo;t restrict listings to one country, but every listing on the marketplace supports BDT
            checkout for eligible Bangladesh buyers, alongside card and Escrow.com. Browse{" "}
            <Link href="/buy" className="font-semibold text-brand-strong hover:underline">
              the full marketplace
            </Link>{" "}
            and filter by category to compare what&rsquo;s currently listed.
          </>
        ),
      },
    ],
  },
  {
    heading: "Paying and staying protected",
    items: [
      {
        question: "Does Durqo charge buyers a fee?",
        answer: "No. Durqo does not charge buyers a marketplace fee. You pay the agreed purchase price, and any disclosed payment-provider or currency-related charges.",
      },
      {
        question: "How is my payment protected?",
        answer: "Durqo holds your payment (or, for BDT payments, releases it in line with the SSLCommerz process) until the seller transfers the agreed assets and you approve the transfer in your order's Transfer Room. Escrow.com is available as an independent alternative.",
      },
    ],
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { q: "What kinds of online businesses can I buy on Durqo?", a: "Durqo lists businesses across 15+ categories, including Websites, E-commerce, SaaS, AI Apps & Tools, Android & iOS Apps, Domains, YouTube Channels, Social Media Accounts, Startup Business, Digital Agencies and more." },
    { q: "Does every category show the same information?", a: "No. Each category has its own Quick Statistics: a website shows monthly income and traffic figures, a domain shows its age and registrar, an app shows ratings and downloads, for example." },
    { q: "Can I filter listings specifically for Bangladesh?", a: "Durqo doesn't restrict listings to one country, but every listing on the marketplace supports BDT checkout for eligible Bangladesh buyers, alongside card and Escrow.com." },
    { q: "Does Durqo charge buyers a fee?", a: "No. Durqo does not charge buyers a marketplace fee. You pay the agreed purchase price, and any disclosed payment-provider or currency-related charges." },
    { q: "How is my payment protected?", a: "Durqo holds your payment (or, for BDT payments, releases it in line with the SSLCommerz process) until the seller transfers the agreed assets and you approve the transfer in your order's Transfer Room. Escrow.com is available as an independent alternative." },
  ].map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

export default function OnlineBusinessesForSaleInBangladeshPage() {
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
                <DashEyebrow>Marketplace · Bangladesh</DashEyebrow>
                <h1 className="max-w-[26ch] text-4xl leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
                  Online Businesses for Sale in <span className="text-brand">Bangladesh</span>
                </h1>
                <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-ink-soft">
                  Durqo lists online businesses across 15+ categories, from websites and e-commerce stores to SaaS
                  products, apps and domains, all reviewed before they go live and all payable in BDT, by card, or
                  through Escrow.com.
                </p>
                <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-rule bg-brand-soft/40 px-4 py-3">
                  <Sparkles size={15} className="mt-0.5 shrink-0 text-brand-strong" aria-hidden />
                  <p className="text-sm leading-relaxed text-ink">
                    <span className="font-semibold">Quick answer:</span> Browse any of 15+ categories, pay in BDT,
                    card or through Escrow.com, and Durqo charges buyers no marketplace fee at all.
                  </p>
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Reviewed by the Durqo Marketplace Team · Updated September 2026
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button href="/buy" size="lg">
                    Browse the Marketplace
                    <ArrowRight size={16} />
                  </Button>
                  <Button href="/sell" variant="secondary" size="lg">
                    List Your Business
                  </Button>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
                  {[
                    { icon: Layers, label: "15+ categories in one marketplace" },
                    { icon: BkashIcon, label: "BDT, card or Escrow.com payments" },
                    { icon: Percent, label: "No marketplace fee for buyers" },
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
                  What&rsquo;s Available
                </p>

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <Layers size={16} />
                  </span>
                  <div>
                    <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-brand-strong">Categories</p>
                    <h3 className="text-sm font-semibold text-ink">15+ business types</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      Websites, e-commerce, SaaS, apps, domains, YouTube channels, startups and more.
                    </p>
                  </div>
                </div>

                <div className="my-5 h-px bg-rule" aria-hidden />

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold-soft text-[#92730F]">
                    <Wallet size={16} />
                  </span>
                  <div>
                    <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-[#92730F]">Payment</p>
                    <h3 className="text-sm font-semibold text-ink">BDT, card or Escrow.com</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      bKash, Rocket, Nagad and bank via SSLCommerz, Stripe for card, or an independent Escrow.com
                      transaction.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-paper-sunk px-3.5 py-3">
                  <Info size={14} className="mt-0.5 shrink-0 text-ink-faint" />
                  <p className="text-xs leading-relaxed text-ink-faint">
                    Listings change as businesses sell and new ones are published. Browse a category below to see
                    what&rsquo;s currently listed.
                  </p>
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* CATEGORY GRID */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>Browse by category</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Every category currently listed on Durqo.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((category) => {
                const Icon = CATEGORY_ICONS[category.id] ?? Layers;
                return (
                  <Link
                    key={category.id}
                    href={`/buy/${category.id}`}
                    className="group flex flex-col rounded-xl border border-rule bg-paper-raised p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-strong hover:shadow-md"
                  >
                    <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand-strong transition group-hover:bg-brand-strong group-hover:text-white">
                      <Icon size={18} />
                    </span>
                    <h3 className="text-sm font-semibold text-ink">{category.name}</h3>
                    <p className="mt-1.5 flex-1 text-xs leading-relaxed text-ink-soft">{category.description}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong">
                      Browse {category.name}
                      <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </Inner>
        </Container>
      </section>

      {/* WHY DURQO */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>Buying with confidence</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">What makes a listing worth reviewing.</h2>
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

      {/* PAYMENT OPTIONS */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[70ch]">
              <DashEyebrow>How you pay</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Payment options for buyers in Bangladesh.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Available payment methods depend on the listing, transaction amount and buyer location. Durqo does
                not charge buyers a marketplace fee.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {PAYMENT_OPTIONS.map(({ icon: Icon, title, body, tint, bg }) => (
                <div key={title} className="rounded-xl border border-rule bg-paper-raised p-6">
                  <span className={`mb-4 grid h-11 w-11 place-items-center rounded-lg ${bg} ${tint}`}>
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
                { href: "/how-to-buy-a-website-in-bangladesh", label: "How to Buy a Website in Bangladesh" },
                { href: "/buy-and-sell-digital-businesses-in-bdt", label: "Buy & Sell Digital Businesses in BDT" },
                { href: "/durqo-vs-motion-invest", label: "Durqo vs Motion Invest" },
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
            <h2 className="text-2xl sm:text-3xl">Ready to find your next business?</h2>
            <p className="mx-auto mt-3 max-w-[52ch] text-sm text-white/70">
              Browse reviewed listings across 15+ categories, or list your own business with no upfront fee.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button href="/buy" size="lg">
                Browse the Marketplace
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
