import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  MessageSquare,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  FileSearch,
  BadgeCheck,
  Receipt,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

// Sep 11, 2026: new step-by-step buyer guide, built alongside /how-to-sell,
// /payments, /buyer-faq and /seller-faq (all linked from the Footer's new
// Resources column). Matches the visual system established by the Sep 6
// homepage/sell-page redesign (see claude/homepage-redesign-addendum.md and
// claude/sell-page-redesign-addendum.md) — same DashEyebrow/Inner helpers,
// same section rhythm — kept page-scoped rather than shared, per the same
// "no shared-component churn" convention src/app/sell/page.tsx documents.
//
// Every claim below is grounded in what's actually live in this codebase,
// not aspirational copy: the three real Buy Now payment options and their
// exact button labels (src/components/BuyNowButton.tsx — Stripe, SSLCommerz,
// Escrow.com), the $2,000 online-deposit-cap behavior for Stripe/SSLCommerz
// (src/lib/payment-terms.ts, the Sep 9 SSLCommerz addendum), and the "Durqo
// holds payment until the seller transfers the agreed assets and confirms
// receipt" framing straight from /terms's own "How payment works today"
// section — never the word "escrow" for Stripe/SSLCommerz, since /terms is
// explicit that Durqo has no third-party escrow provider for those two
// rails (Escrow.com, the third option, genuinely is one).
export const metadata: Metadata = {
  title: "How to Buy a Business | Durqo",
  description: "A step-by-step guide to browsing, reviewing and buying a digital business on Durqo, including how payments are held until your purchase is complete.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "How to Buy a Business | Durqo",
    description: "A step-by-step guide to browsing, reviewing and buying a digital business on Durqo.",
    url: "https://www.durqo.com/how-to-buy",
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Buy a Business | Durqo",
    description: "A step-by-step guide to browsing, reviewing and buying a digital business on Durqo.",
  },
  alternates: { canonical: "https://www.durqo.com/how-to-buy" },
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

const STEPS = [
  {
    n: "01",
    icon: Search,
    title: "Browse and discover",
    body: "Explore listings by category — websites, e-commerce stores, apps, YouTube channels, domains and more. Filter by price and review each listing's Quick Statistics.",
  },
  {
    n: "02",
    icon: FileSearch,
    title: "Review the details",
    body: "Check the financial summary, traffic and audience data, and any Google Analytics numbers Durqo has reviewed. Message the seller directly from the listing page with any questions.",
  },
  {
    n: "03",
    icon: CreditCard,
    title: "Choose how to pay",
    body: "Pay by card (Stripe), or — if you're in Bangladesh — by bKash, Rocket, Nagad or bank card through SSLCommerz. Want extra protection on a single purchase? Choose Escrow.com instead.",
  },
  {
    n: "04",
    icon: ShieldCheck,
    title: "Your payment is held",
    body: "Durqo holds your payment until the seller has transferred the agreed assets — or, if you chose Escrow.com, the funds sit with that independent, licensed escrow service until you confirm receipt.",
  },
  {
    n: "05",
    icon: CheckCircle2,
    title: "Confirm and take ownership",
    body: "Once the transfer is complete, the deal closes and the seller is paid. Your receipt and full order history stay available from your buyer dashboard.",
  },
] as const;

const PAYMENT_METHODS = [
  {
    icon: CreditCard,
    title: "Card — Stripe",
    body: "Pay by credit or debit card in USD. Available to buyers anywhere.",
  },
  {
    icon: BadgeCheck,
    title: "bKash / Rocket / Nagad / Bank — SSLCommerz",
    body: "For buyers in Bangladesh. Durqo shows the exact BDT amount and exchange rate before you confirm.",
  },
  {
    icon: ShieldCheck,
    title: "Escrow.com",
    body: "An independent, licensed escrow provider. Your full payment is held by Escrow.com itself and released once you confirm you've received the business.",
  },
];

const PROTECTIONS = [
  { icon: FileSearch, label: "Every listing reviewed before it goes live" },
  { icon: MessageSquare, label: "Message sellers directly, before you pay" },
  { icon: ShieldCheck, label: "Payment held until the transfer is confirmed" },
  { icon: Receipt, label: "Full order history and printable receipts" },
];

export default function HowToBuyPage() {
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-rule bg-brand-strong py-16 sm:py-20 lg:py-24">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
          aria-hidden
        />
        <Container className="relative">
          <Inner>
            <div className="mx-auto max-w-[62ch] text-center">
              <DashEyebrow onDark center>
                How to buy
              </DashEyebrow>
              <h1 className="text-4xl leading-[1.1] text-white sm:text-5xl">
                Buy a digital business, <span className="text-brand">step by step.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-[52ch] text-lg leading-relaxed text-white/70">
                From browsing your first listing to holding the keys — here&rsquo;s exactly how a purchase works on
                Durqo, and how your payment is protected along the way.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button href="/buy" size="lg">
                  Browse listings
                  <ArrowRight size={16} />
                </Button>
                <Button href="/buyer-faq" variant="on-dark" size="lg">
                  Read the Buyer FAQ
                </Button>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* PROTECTIONS STRIP */}
      <section className="border-b border-rule bg-paper-sunk py-6">
        <Container>
          <Inner>
            <div className="grid grid-cols-2 divide-y divide-rule sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              {PROTECTIONS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center justify-center gap-2.5 px-4 py-3 text-center sm:py-0">
                  <Icon size={16} className="shrink-0 text-brand" />
                  <span className="text-sm font-medium text-ink">{label}</span>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* STEPS */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[60ch]">
              <DashEyebrow>The buying process</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">From first look to closed deal.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Five steps, start to finish. Every listing is reviewed before it publishes, and your payment stays
                protected until the transfer is done.
              </p>
            </div>
            <div className="flex flex-col gap-8">
              {STEPS.map(({ n, icon: Icon, title, body }, i) => (
                <div key={n} data-reveal className="flex gap-5 sm:gap-6">
                  <div className="flex flex-col items-center">
                    <span className="mono grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand-strong">
                      {n}
                    </span>
                    {i < STEPS.length - 1 && <span className="mt-2 w-px flex-1 bg-rule" aria-hidden />}
                  </div>
                  <div className="pb-2">
                    <div className="mb-1.5 flex items-center gap-2">
                      <Icon size={16} className="text-brand" />
                      <h4 className="text-base font-semibold text-ink">{title}</h4>
                    </div>
                    <p className="max-w-[62ch] text-sm leading-relaxed text-ink-soft">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* PAYMENT METHODS */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[60ch]">
              <DashEyebrow>Ways to pay</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Choose the payment method that works for you.</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {PAYMENT_METHODS.map(({ icon: Icon, title, body }) => (
                <div key={title} data-reveal className="rounded-xl border border-rule bg-paper-raised p-6">
                  <span className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <Icon size={19} />
                  </span>
                  <h4 className="text-base font-semibold text-ink">{title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-[70ch] text-xs leading-relaxed text-ink-faint">
              For purchases above $2,000 paid by card or SSLCommerz, Durqo collects the first $2,000 (or its BDT
              equivalent) online, and the exact amount and remaining-balance process is shown before you confirm.
              See{" "}
              <Link href="/payments" className="font-semibold text-brand-strong hover:underline">
                Payment &amp; Withdrawal
              </Link>{" "}
              for the full breakdown.
            </p>
          </Inner>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="py-10 sm:py-12">
        <Container>
          <Inner>
            <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-brand-soft p-8 sm:p-10">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-paper-raised text-brand-strong">
                  <Search size={20} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-ink sm:text-2xl">Ready to find your next business?</h2>
                  <p className="mt-1 max-w-[46ch] text-sm text-ink-soft">
                    Browse reviewed listings across every category on Durqo.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/buy" size="lg">
                  Browse listings
                  <ArrowRight size={16} />
                </Button>
                <Button href="/contact" variant="secondary" size="lg">
                  Ask us a question
                </Button>
              </div>
            </div>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
