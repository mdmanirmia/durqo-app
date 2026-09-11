import type { Metadata } from "next";
import {
  ArrowRight,
  CreditCard,
  BadgeCheck,
  ShieldCheck,
  Landmark,
  Smartphone,
  Wallet,
  Info,
  Tag,
  Ban,
  CheckCircle2,
} from "lucide-react";
import { SUCCESS_FEE_TIERS, fmtRate } from "@/lib/fees";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import GroupedFaq from "@/components/GroupedFaq";

// Sep 11, 2026: new page explaining, in one place, how money actually moves
// through Durqo today — both the buyer side (three real Buy Now payment
// options) and the seller side (withdrawal methods, caps, and the success
// fee). Built alongside /how-to-buy, /how-to-sell, /buyer-faq and
// /seller-faq.
//
// Accuracy notes (this page is the one most exposed to getting these
// details wrong, so every claim below is traced to real code/docs):
// - The three Buy Now payment options and their exact behavior are read
//   straight from src/components/BuyNowButton.tsx, SslcommerzConfirmModal,
//   EscrowConfirmModal, and src/lib/escrow.ts. Escrow.com is a genuine,
//   independent, licensed third-party escrow provider (see escrow.ts's own
//   comments) — this is the ONLY payment method on this page described
//   using the word "escrow" for that reason.
// - For Stripe and SSLCommerz, Durqo itself holds the payment (no
//   third-party escrow) until the transfer is confirmed complete — this is
//   /terms's own "How payment works today" language ("Durqo holds the
//   payment until the Seller has transferred the agreed assets and the
//   Buyer has confirmed receipt"), not a new claim invented for this page.
// - The $2,000 online-deposit-cap behavior and its two different
//   remainder policies (Stripe: settled directly between buyer/seller,
//   off-platform; SSLCommerz: Durqo emails wire/card instructions and
//   holds completion until it verifies the balance) come from
//   src/lib/payment-terms.ts and claude/sslcommerz-bdt-confirmation-and-
//   payment-breakdown-addendum.md. Escrow.com has no such cap — the full
//   price goes through it.
// - Success Fee tiers imported from the single authoritative
//   src/lib/fees.ts (never hardcoded).
// - Withdrawal methods, the per-method (not pooled) ৳50,000/day and
//   ৳300,000/month caps on bKash/Rocket/Nagad specifically, and the manual
//   admin pending → approved → paid review flow all match
//   src/app/dashboard/seller/earnings/page.tsx and
//   claude/payment-history-withdrawals-receipts-addendum.md exactly —
//   never described as instant/automatic.
export const metadata: Metadata = {
  title: "Payment & Withdrawal | Durqo",
  description: "How payments are collected and held on Durqo, how the success fee works, and how sellers withdraw their earnings.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "Payment & Withdrawal | Durqo",
    description: "How payments are collected and held on Durqo, how the success fee works, and how sellers withdraw their earnings.",
    url: "https://www.durqo.com/payments",
  },
  twitter: {
    card: "summary_large_image",
    title: "Payment & Withdrawal | Durqo",
    description: "How payments are collected and held on Durqo, how the success fee works, and how sellers withdraw their earnings.",
  },
  alternates: { canonical: "https://www.durqo.com/payments" },
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

const BUYER_METHODS = [
  {
    icon: CreditCard,
    title: "Card — Stripe",
    body: "Pay by credit or debit card in USD. Durqo holds the payment until the transfer is confirmed complete, then pays the seller.",
  },
  {
    icon: BadgeCheck,
    title: "bKash / Rocket / Nagad / Bank — SSLCommerz",
    body: "For buyers in Bangladesh. You see the exact BDT amount and exchange rate before you confirm. Durqo holds the payment the same way as with Stripe.",
  },
  {
    icon: ShieldCheck,
    title: "Escrow.com",
    body: "An independent, licensed escrow provider — your full payment is held by Escrow.com itself, not Durqo, and released once you confirm you've received the business.",
  },
];

const PRICING_TIERS = SUCCESS_FEE_TIERS.map((t) => ({ label: t.label, percent: fmtRate(t.rate) }));

const PRICING_FOOTNOTES = [
  { icon: Tag, label: "$0 upfront listing fee" },
  { icon: Ban, label: "No monthly subscription" },
  { icon: CheckCircle2, label: "Charged only when sold" },
];

const WITHDRAWAL_METHODS = [
  { icon: Landmark, title: "Bank Transfer", body: "No daily or monthly cap." },
  { icon: Smartphone, title: "bKash", body: "Up to ৳50,000/day, ৳300,000/month." },
  { icon: Smartphone, title: "Rocket", body: "Up to ৳50,000/day, ৳300,000/month." },
  { icon: Smartphone, title: "Nagad", body: "Up to ৳50,000/day, ৳300,000/month." },
  { icon: Wallet, title: "PayPal", body: "No daily or monthly cap." },
  { icon: Wallet, title: "Wise", body: "No daily or monthly cap." },
];

const FAQ_GROUPS = [
  {
    heading: "Buying",
    items: [
      {
        question: "How is my payment protected?",
        answer:
          "For Stripe and SSLCommerz purchases, Durqo holds your payment until the seller has transferred the agreed assets and the deal is confirmed complete — Durqo does not use a third-party escrow provider for these two methods. If you'd like your funds held by an independent third party instead, choose Escrow.com at checkout.",
      },
      {
        question: "What happens on purchases over $2,000?",
        answer:
          "If you pay by card or SSLCommerz, Durqo collects the first $2,000 (or its BDT equivalent) online. For card payments, the remaining balance is settled directly between you and the seller, off-platform. For SSLCommerz, Durqo emails you instructions to pay the remainder by wire transfer, credit card or debit card, and the purchase isn't complete until Durqo has received and verified it. Choosing Escrow.com avoids this split — the full price goes through escrow in one payment.",
      },
      {
        question: "Do I need to be in Bangladesh to buy on Durqo?",
        answer:
          "No. Card payments through Stripe and Escrow.com are available to buyers anywhere. The bKash/Rocket/Nagad/Bank option through SSLCommerz is specifically for buyers paying in Bangladeshi Taka.",
      },
    ],
  },
  {
    heading: "Selling & fees",
    items: [
      {
        question: "How much does Durqo charge sellers?",
        answer:
          "A tiered success fee based on your final sale price — 10% under $50,000, 7% from $50,000 to $250,000, and 5% above $250,000. There's no charge to create or maintain a listing, and the fee only applies once a sale completes.",
      },
      {
        question: "When is the success fee deducted?",
        answer:
          "When you request a withdrawal, Durqo deducts the applicable success fee from the sale proceeds and pays out the remaining net amount.",
      },
    ],
  },
  {
    heading: "Withdrawing your earnings",
    items: [
      {
        question: "How do I withdraw my earnings?",
        answer:
          "From your seller Earnings dashboard, once a sale is marked complete. Choose a payout method, enter your details, and submit a request — the Durqo team reviews and processes it.",
      },
      {
        question: "Are bKash, Rocket and Nagad withdrawals limited?",
        answer:
          "Yes — each of the three has its own independent limit of ৳50,000 per day and ৳300,000 per month, calculated at that day's exchange rate. You can withdraw up to all three limits on the same day, since they don't share one combined cap. Bank Transfer, PayPal and Wise have no such limit.",
      },
      {
        question: "How long does a withdrawal take?",
        answer:
          "Withdrawals are reviewed manually, not paid out instantly. A request starts as Pending, and our team either approves and pays it or rejects it (in which case the funds return to your available balance) — you'll see the status update on your Earnings page.",
      },
    ],
  },
];

export default function PaymentsPage() {
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
                Payment &amp; withdrawal
              </DashEyebrow>
              <h1 className="text-4xl leading-[1.1] text-white sm:text-5xl">
                How money moves <span className="text-brand">on Durqo.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-[52ch] text-lg leading-relaxed text-white/70">
                How buyers pay, how funds are held until a deal is done, what Durqo charges, and how sellers get
                paid out.
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      {/* BUYER PAYMENT METHODS */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[64ch]">
              <DashEyebrow>For buyers</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Three ways to pay.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Choose the option that fits you at checkout. Every option starts by showing you the exact amount
                you&rsquo;ll pay before you confirm.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {BUYER_METHODS.map(({ icon: Icon, title, body }) => (
                <div key={title} data-reveal className="rounded-xl border border-rule bg-paper-raised p-6">
                  <span className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <Icon size={19} />
                  </span>
                  <h4 className="text-base font-semibold text-ink">{title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-start gap-3 rounded-xl border border-rule bg-paper-sunk p-5">
              <Info size={18} className="mt-0.5 shrink-0 text-brand-strong" />
              <p className="text-sm leading-relaxed text-ink-soft">
                <span className="font-semibold text-ink">Purchases over $2,000:</span> paying by card or
                SSLCommerz, Durqo collects the first $2,000 (or its BDT equivalent) online. The remaining balance
                is either settled directly between you and the seller (card) or paid to Durqo separately once
                we&rsquo;ve verified it (SSLCommerz). Choosing Escrow.com avoids the split entirely — the full price is
                held by escrow in one payment.
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      {/* HOW YOUR PAYMENT IS HELD */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[800px]">
            <DashEyebrow center>Where your money sits</DashEyebrow>
            <h2 className="mb-6 text-center text-2xl sm:text-3xl">Held until the deal is done.</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-rule bg-paper-raised p-6">
                <ShieldCheck size={20} className="mb-2 text-brand-strong" />
                <h4 className="text-base font-semibold text-ink">Stripe &amp; SSLCommerz</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  Durqo holds your payment directly until the seller has transferred the agreed assets and the
                  deal is confirmed complete. Durqo does not use a third-party escrow provider for these two
                  methods.
                </p>
              </div>
              <div className="rounded-xl border border-rule bg-paper-raised p-6">
                <BadgeCheck size={20} className="mb-2 text-brand-strong" />
                <h4 className="text-base font-semibold text-ink">Escrow.com</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  Your full payment is held by Escrow.com, an independent licensed escrow company — not Durqo —
                  and released once you confirm you&rsquo;ve received the business.
                </p>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* SUCCESS FEE */}
      <section className="border-b border-rule bg-brand-strong py-14 text-center sm:py-16">
        <Container>
          <Inner>
            <DashEyebrow onDark center>
              For sellers
            </DashEyebrow>
            <h2 className="text-2xl text-white sm:text-3xl">One success fee, only when you sell.</h2>
            <p className="mx-auto mt-3 max-w-[52ch] text-[0.95rem] leading-relaxed text-white/65">
              The applicable rate applies to your entire final sale price — never a marginal, bracket-by-bracket
              calculation.
            </p>

            <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-xl border border-white/10">
              <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {PRICING_TIERS.map(({ label, percent }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 px-6 py-8">
                    <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-white/50">
                      {label}
                    </p>
                    <p className="mono text-4xl font-bold text-brand sm:text-5xl">{percent}</p>
                    <p className="text-xs text-white/60">Success fee</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {PRICING_FOOTNOTES.map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-2 text-sm text-white/75">
                  <Icon size={15} className="text-brand" />
                  {label}
                </span>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* WITHDRAWAL METHODS */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[64ch]">
              <DashEyebrow>Getting paid</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Withdraw your earnings, your way.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Request a withdrawal from your Earnings dashboard once a sale is complete. Every request is
                reviewed by the Durqo team before it&rsquo;s paid out.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {WITHDRAWAL_METHODS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-xl border border-rule bg-paper-raised p-5">
                  <Icon size={18} className="mb-2 text-brand-strong" />
                  <h4 className="text-sm font-semibold text-ink">{title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-[70ch] text-xs leading-relaxed text-ink-faint">
              bKash, Rocket and Nagad each have their own independent daily/monthly limit — they don&rsquo;t share one
              combined cap, so you can withdraw up to each method&rsquo;s limit on the same day. Limits are calculated
              using that day&rsquo;s exchange rate.
            </p>
          </Inner>
        </Container>
      </section>

      {/* FAQ */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[760px]">
            <DashEyebrow center>Frequently asked questions</DashEyebrow>
            <h2 className="mb-8 text-center text-2xl sm:text-3xl">Payments and withdrawals, explained.</h2>
            <GroupedFaq groups={FAQ_GROUPS} />
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
                  <Wallet size={20} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-ink sm:text-2xl">Still have a question?</h2>
                  <p className="mt-1 max-w-[46ch] text-sm text-ink-soft">
                    Our team typically replies within a few hours.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/contact" size="lg">
                  Contact support
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
