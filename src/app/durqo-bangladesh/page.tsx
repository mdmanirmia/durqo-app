import type { Metadata } from "next";
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
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

// Sep 30, 2026: new Bangladesh-focused marketing/positioning page, built per
// the merchant's own brief (chat — "akta page banao ei gulor upor based kore
// jeno bangladeshi user der kache marketing korte pari," followed by the
// intro paragraph and a 10-row "Problems & Solutions" table reproduced
// below). Distinct from /buy-and-sell-digital-businesses-in-bdt, which is a
// documentation-style page about the BDT checkout/payout mechanics — this
// page is a standalone marketing landing page (for ad traffic and general
// BD-audience links) built around "here's what's broken for Bangladeshi
// buyers and sellers, and here's Durqo's answer to each one."
//
// Content rules followed (anthropic-skills:durqo-content-update):
//   - The hero headline and subhead use the merchant's own intro paragraph
//     near-verbatim, not a paraphrase.
//   - Every problem/solution pair below is the merchant's own wording,
//     tightened for landing-page flow but not reworded in substance.
//   - Problem #4's solution keeps the merchant's exact escrow phrasing
//     ("Supported transactions may also use Escrow.com as an independent
//     escrow option") — this site never calls the SSLCommerz/Stripe flow
//     itself "escrow"; only Escrow.com, a genuine third-party escrow
//     provider, is described that way. See build-plan-and-decisions.md and
//     every other payment page on the site for this same distinction.
//   - No fees, stats, testimonials or guarantees are stated anywhere on this
//     page — none were supplied, and none are invented.
// Facts verified against the live codebase before publishing:
//   - "16 digital business categories" — src/lib/categories.ts, CATEGORIES
//     array, exactly 16 entries (websites, e-commerce, youtube-channels,
//     social-media-accounts, saas, ai-apps-tools, apps-tools,
//     startup-business, plugins-themes-extensions, domains,
//     amazon-stores-kdp, service-business, digital-agencies, games,
//     newsletters, crypto-blockchain).
//   - "7-day inspection" — matches /transfer-room, /report-an-issue,
//     /how-to-buy and /how-to-sell, all describing the same buyer
//     inspection window.
//   - BDT payment channels (bKash/Nagad/Rocket/bank/card) and BDT payout
//     methods (bank transfer/bKash/Nagad/Rocket) match
//     /buy-and-sell-digital-businesses-in-bdt and Footer.tsx's PAYMENT_BADGES
//     exactly — no channel is named here that isn't already live elsewhere
//     on the site.
//   - Free valuation tool — /valuation route exists (see
//     claude/free-valuation-lead-gen-addendum.md).
export const metadata: Metadata = {
  title: "Durqo for Bangladesh | Buy and Sell Digital Businesses Worldwide",
  description:
    "Durqo connects Bangladesh to the global digital business marketplace. Buy in BDT through bKash, Nagad, Rocket, bank transfer or card, or sell internationally and get paid out in BDT — with a structured payment, asset transfer and inspection process built in.",
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

const TRUST_STRIP = [
  { icon: Wallet, label: "Buy and sell in BDT" },
  { icon: Layers, label: "16 digital business categories" },
  { icon: ShieldCheck, label: "Structured transfer + 7-day inspection" },
];

type Audience = "For Buyers" | "For Sellers" | "For Everyone";

const AUDIENCE_STYLE: Record<Audience, { pill: string; icon: string }> = {
  "For Buyers": { pill: "bg-brand-soft text-brand-strong", icon: "bg-brand-soft text-brand-strong" },
  "For Sellers": { pill: "bg-gold-soft text-[#92730F]", icon: "bg-gold-soft text-[#92730F]" },
  "For Everyone": { pill: "bg-paper-sunk text-ink-soft", icon: "bg-paper-sunk text-ink-soft" },
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

const TRANSACTION_STEPS = [
  { title: "Payment Is Confirmed", body: "The buyer's payment is received and verified before the sale moves forward." },
  { title: "Transfer Room Opens", body: "Buyer and seller move into a private Transfer Room to hand over every asset in the sale." },
  { title: "7-Day Inspection", body: "The buyer has 7 days to inspect the assets against what was agreed." },
  { title: "Buyer Approves", body: "The buyer approves the completed transfer, or reports an issue for review instead of an automatic approval." },
  { title: "Seller Is Paid Out", body: "Once the transfer is approved, the seller can request their payout — including in BDT for Bangladeshi sellers." },
];

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

      {/* HERO */}
      <section className="border-b border-rule py-14 sm:py-16 lg:py-20">
        <Container>
          <Inner>
            <div className="mx-auto max-w-[74ch] text-center">
              <DashEyebrow center>Bangladesh to the world</DashEyebrow>
              <h1 className="text-4xl leading-[1.1] sm:text-5xl lg:text-[3.2rem]">
                Durqo Connects Bangladesh to the <span className="text-brand">Global Digital Business Marketplace.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-[62ch] text-lg leading-relaxed text-ink-soft">
                Buy international digital businesses using BDT through supported local payment methods, or sell to
                buyers at home and abroad and get paid out in BDT. A structured payment, asset transfer and
                inspection process keeps every transaction organized and transparent.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button href="/buy" size="lg">
                  Browse Businesses
                  <ArrowRight size={16} />
                </Button>
                <Button href="/sell" variant="secondary" size="lg">
                  Sell a Business
                </Button>
              </div>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
                {TRUST_STRIP.map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-2 text-sm text-ink-soft">
                    <Icon size={15} className="text-brand" />
                    {label}
                  </span>
                ))}
              </div>
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
                  <div key={problem} className="rounded-xl border border-rule bg-paper-raised p-6">
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
