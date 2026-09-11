import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import GroupedFaq from "@/components/GroupedFaq";

// Sep 11, 2026: new Buyer FAQ page, built alongside /seller-faq, /payments,
// /how-to-buy and /how-to-sell. Every answer below is grounded in real,
// live functionality rather than aspirational copy — see /payments's own
// top-of-file comment for the fuller accuracy trail on payment methods,
// escrow terminology, and the $2,000 deposit-cap behavior, which this page
// intentionally keeps brief and links out to rather than duplicating in
// full. The dispute/refund answer mirrors /terms Section 06
// ("Cancellations, Refunds & Disputes") verbatim in substance: refunds
// only for confirmed fraud/misrepresentation/breach, a 7-day reporting
// window, and Durqo mediating without owning the payment rail's own
// dispute process.
export const metadata: Metadata = {
  title: "Buyer FAQ | Durqo",
  description: "Answers to common questions about browsing, buying and paying for a digital business on Durqo.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "Buyer FAQ | Durqo",
    description: "Answers to common questions about browsing, buying and paying for a digital business on Durqo.",
    url: "https://www.durqo.com/buyer-faq",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buyer FAQ | Durqo",
    description: "Answers to common questions about browsing, buying and paying for a digital business on Durqo.",
  },
  alternates: { canonical: "https://www.durqo.com/buyer-faq" },
};

function DashEyebrow({ children, onDark = false, center = false }: { children: React.ReactNode; onDark?: boolean; center?: boolean }) {
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

const FAQ_GROUPS = [
  {
    heading: "Getting started",
    items: [
      {
        question: "Do I need an account to browse listings?",
        answer: "No — anyone can browse and view listing details. You'll need a free buyer account to message a seller or make a purchase.",
      },
      {
        question: "Is it free to use Durqo as a buyer?",
        answer: "Yes. Browsing, messaging sellers and creating an account are all free. Only sellers pay a fee, and only once a sale completes.",
      },
      {
        question: "Do I need to be in Bangladesh to buy?",
        answer: (
          <>
            No. Card payments (Stripe) and Escrow.com are available to buyers anywhere. The bKash/Rocket/Nagad/Bank
            option is specifically for buyers paying in Bangladeshi Taka. See the{" "}
            <Link href="/payments" className="font-semibold text-brand-strong hover:underline">
              Payment &amp; Withdrawal
            </Link>{" "}
            page for details.
          </>
        ),
      },
    ],
  },
  {
    heading: "Listings & trust badges",
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
        question: "Can I ask the seller questions before buying?",
        answer: "Yes — every listing page has a way to message the seller directly, and your conversation stays in your dashboard inbox.",
      },
    ],
  },
  {
    heading: "Paying & protection",
    items: [
      {
        question: "What payment methods can I use?",
        answer: (
          <>
            Card via Stripe, bKash/Rocket/Nagad/Bank via SSLCommerz (for Bangladeshi buyers), or Escrow.com for
            extra protection on a single purchase. Full details are on the{" "}
            <Link href="/payments" className="font-semibold text-brand-strong hover:underline">
              Payment &amp; Withdrawal
            </Link>{" "}
            page.
          </>
        ),
      },
      {
        question: "Is my payment held securely?",
        answer: "Yes. For card and SSLCommerz purchases, Durqo holds your payment until the seller has transferred the agreed assets and the deal is confirmed complete. Choosing Escrow.com holds your full payment with that independent, licensed escrow company instead.",
      },
      {
        question: "What happens right after I pay?",
        answer: "The seller is notified that your purchase is confirmed and begins transferring the agreed assets to you. You can track the order's status from your buyer dashboard.",
      },
    ],
  },
  {
    heading: "After you buy",
    items: [
      {
        question: "Where can I see my order history and receipts?",
        answer: "Your buyer dashboard's Orders page lists every purchase, with a printable receipt for each.",
      },
      {
        question: "What if something goes wrong with my purchase?",
        answer: "Contact support@durqo.com as soon as possible — disputes must be reported within 7 days of the transaction completing. Refunds are granted for confirmed fraud, material misrepresentation, or a seller's breach of the agreed terms; where a dispute can't be resolved directly with the seller, Durqo will review the evidence and help mediate.",
      },
      {
        question: "Can I cancel an order before I pay?",
        answer: "Yes — nothing is charged until you complete checkout, so you can simply leave the payment page without confirming.",
      },
    ],
  },
];

export default function BuyerFaqPage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-rule bg-brand-strong py-16 sm:py-20 lg:py-20">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
          aria-hidden
        />
        <Container className="relative">
          <Inner>
            <div className="mx-auto max-w-[62ch] text-center">
              <DashEyebrow onDark center>
                Buyer FAQ
              </DashEyebrow>
              <h1 className="text-4xl leading-[1.1] text-white sm:text-5xl">
                Your buying questions, <span className="text-brand">answered.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-[52ch] text-lg leading-relaxed text-white/70">
                Everything you need to know before browsing, messaging a seller, or making a purchase on Durqo.
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[760px]">
            <GroupedFaq groups={FAQ_GROUPS} />
          </Inner>
        </Container>
      </section>

      <section className="py-10 sm:py-12">
        <Container>
          <Inner>
            <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-brand-soft p-8 sm:p-10">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-paper-raised text-brand-strong">
                  <Mail size={20} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-ink sm:text-2xl">Didn&rsquo;t find your answer?</h2>
                  <p className="mt-1 max-w-[46ch] text-sm text-ink-soft">
                    Our team typically replies within a few hours.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/buy" size="lg">
                  Browse listings
                  <ArrowRight size={16} />
                </Button>
                <Button href="/contact" variant="secondary" size="lg">
                  Contact support
                </Button>
              </div>
            </div>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
