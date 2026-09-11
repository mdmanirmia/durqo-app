import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Mail } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import GroupedFaq from "@/components/GroupedFaq";

// Sep 11, 2026: new Seller FAQ page, built alongside /buyer-faq, /payments,
// /how-to-buy and /how-to-sell. Fee and payout answers are grounded in the
// same authoritative sources as /how-to-sell and /payments: src/lib/fees.ts
// for the 10%/7%/5% tiered schedule, and
// src/app/dashboard/seller/earnings/page.tsx + claude/payment-history-
// withdrawals-receipts-addendum.md for the real withdrawal methods, the
// per-method (not pooled) ৳50,000/day + ৳300,000/month caps on
// bKash/Rocket/Nagad, and the manual admin review flow — never described
// as instant or automatic.
export const metadata: Metadata = {
  title: "Seller FAQ | Durqo",
  description: "Answers to common questions about listing, selling and getting paid for a digital business on Durqo.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "Seller FAQ | Durqo",
    description: "Answers to common questions about listing, selling and getting paid for a digital business on Durqo.",
    url: "https://www.durqo.com/seller-faq",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seller FAQ | Durqo",
    description: "Answers to common questions about listing, selling and getting paid for a digital business on Durqo.",
  },
  alternates: { canonical: "https://www.durqo.com/seller-faq" },
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
        question: "Is it free to list my business?",
        answer: "Yes — there's no upfront listing fee and no monthly subscription. Durqo only charges a success fee, and only once your business actually sells.",
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
    heading: "Listing review & trust badges",
    items: [
      {
        question: "How long does listing review take?",
        answer: "Our team manually reviews every submission for accuracy and completeness before it goes live. There's no fixed turnaround time, but we email you as soon as a decision is made.",
      },
      {
        question: "Can I edit my listing after it's published?",
        answer: "Yes, at any time, from your My Listings page.",
      },
      {
        question: "What is Google Analytics verification?",
        answer: "An optional step where you connect your Google Analytics account so Durqo can confirm your real traffic numbers. Once reviewed, your listing shows a GA Verified badge that helps build buyer trust.",
      },
      {
        question: "What is seller identity verification?",
        answer: "An optional step where you upload an ID document from your dashboard. Once Durqo's team reviews and approves it, your profile shows a Verified badge.",
      },
    ],
  },
  {
    heading: "Fees & getting paid",
    items: [
      {
        question: "How much does Durqo charge?",
        answer: (
          <>
            A tiered success fee based on your final sale price — 10% under $50,000, 7% from $50,000 to $250,000,
            and 5% above $250,000 — deducted only when your business sells. See the full breakdown on the{" "}
            <Link href="/payments" className="font-semibold text-brand-strong hover:underline">
              Payment &amp; Withdrawal
            </Link>{" "}
            page.
          </>
        ),
      },
      {
        question: "When can I withdraw my earnings?",
        answer: "Once a sale is marked complete, request a withdrawal from your Earnings dashboard. Our team reviews and processes each request — it isn't instant.",
      },
      {
        question: "What withdrawal methods can I use?",
        answer: "Bank Transfer, bKash, Rocket, Nagad, PayPal or Wise. bKash, Rocket and Nagad each have their own independent limit of ৳50,000 per day and ৳300,000 per month; the other methods have no such cap.",
      },
    ],
  },
  {
    heading: "Buyers & disputes",
    items: [
      {
        question: "Can I message buyers directly?",
        answer: "Yes — once your listing is published, interested buyers can message you, and your conversations stay in your dashboard inbox.",
      },
      {
        question: "What if a buyer disputes a completed sale?",
        answer: "Disputes must be reported to Durqo within 7 days of the transaction completing. Where a dispute can't be resolved directly between buyer and seller, Durqo will review the available evidence and help mediate a resolution.",
      },
    ],
  },
];

export default function SellerFaqPage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-rule bg-brand-strong py-16 sm:py-20 lg:py-20">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
          aria-hidden
        />
        <Container className="relative">
          <Inner>
            <div className="mx-auto max-w-[62ch] text-center">
              <DashEyebrow onDark center>
                Seller FAQ
              </DashEyebrow>
              <h1 className="text-4xl leading-[1.1] text-white sm:text-5xl">
                Your selling questions, <span className="text-brand">answered.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-[52ch] text-lg leading-relaxed text-white/70">
                Everything you need to know about listing, selling and getting paid on Durqo.
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
                <Button href="/sell" size="lg">
                  <FileText size={16} />
                  List your business
                </Button>
                <Button href="/contact" variant="secondary" size="lg">
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
