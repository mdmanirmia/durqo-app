import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
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
  PackageCheck,
  Send,
  Eye,
  AlertTriangle,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

// Sep 13, 2026: expanded Steps 4-5 into an explicit Transfer Room step,
// now that the Asset Transfer Room system is live for every payment channel
// (see claude/asset-transfer-room-feasibility-addendum.md and
// claude/asset-transfer-post-purchase-redirect-and-payout-release-addendum.md).
// Buyers used to read a vague "until the seller has transferred the agreed
// assets" with no mechanism explained; now the page names the actual
// dashboard destination (Transfer Room / "Asset Transfers" nav item),
// the buyer's real action (mark each item Received, then Approve Transfer
// to release payment), and the inspection window / Report an Issue escape
// hatch, matching TransferRoomView.tsx's real buyer-side actions exactly.
// Same-day follow-up: made explicit what "report an issue" actually does
// (payment stays held, Durqo reviews before anything releases — never
// automatic) rather than leaving that implied.
//
// Sep 13, 2026, second follow-up: per direct owner request, bolded the
// actual clickable actions inside Steps 05-06 (Submitted, Received, Approve
// Transfer, Report an Issue) so they read as concrete UI steps rather than
// prose, and added a dedicated "The Transfer Room" spotlight card right
// after the step list — the mechanism is the single most important thing
// on this page, so it gets its own visually distinct callout instead of
// living only inside one step among six.
//
// Sep 13, 2026, third follow-up: per direct owner feedback on a live
// screenshot ("design ta valo lagchene... graphics add koro") that the
// spotlight card's plain bold-bulleted paragraph list looked flat, rebuilt
// it as an actual step-flow diagram — icon-badge nodes connected by
// arrows, colored to match the real in-app status colors (gold for the
// in-progress Submitted/Received states, brand green for the completing
// Approve Transfer step, danger red for the Report an Issue branch — see
// STAGE_LABEL / ITEM_STATUS_LABEL in
// src/app/dashboard/transfer/[orderId]/TransferRoomView.tsx) instead of
// inventing new colors, so the mechanism reads as a visual sequence rather
// than a wall of bold text.
//
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
// Escrow.com), and the "Durqo holds payment until the seller transfers the
// agreed assets and confirms receipt" framing straight from /terms's own
// "How payment works today" section — never the word "escrow" for Stripe/
// SSLCommerz, since /terms is explicit that Durqo has no third-party
// escrow provider for those two rails (Escrow.com, the third option,
// genuinely is one).
//
// Sep 11, 2026 same-day follow-up: the $2,000 online-deposit-cap behavior
// (src/lib/payment-terms.ts, the Sep 9 SSLCommerz addendum) used to apply
// to both Stripe and SSLCommerz. Per the merchant's request, that cap was
// removed for Stripe — Stripe now always charges the full price in one
// payment, same as Escrow.com. It's SSLCommerz-only now (Bangladeshi Taka
// buyers). The PAYMENT_METHODS footnote below was corrected accordingly.
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
    body: "Check the financial summary, traffic and audience data, and any Google Analytics numbers Durqo has reviewed. Many listings already answer common questions in their own Questions & Answers section — for anything else, post a question in Comments or message the seller directly.",
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
    body: "Durqo holds your payment until you approve the transfer in the next step — or, if you chose Escrow.com, the funds sit with that independent, licensed escrow service until you confirm receipt.",
  },
  {
    n: "05",
    icon: PackageCheck,
    title: "Inspect the transfer in your Transfer Room",
    body: (
      <>
        Right after paying, you&rsquo;re taken straight to your order&rsquo;s <strong className="text-ink">Transfer Room</strong> —
        also listed under <strong className="text-ink">Asset Transfers</strong> in your dashboard. The seller hands
        over each item (domain, code, accounts, socials and more) one by one, marking it{" "}
        <strong className="text-ink">Submitted</strong>; you inspect each one and mark it{" "}
        <strong className="text-ink">Received</strong>. You have an inspection window to check everything before
        deciding, and can message the seller directly from the room at any time.
      </>
    ),
  },
  {
    n: "06",
    icon: CheckCircle2,
    title: "Approve and take ownership",
    body: (
      <>
        Once every item is marked Received and matches what was agreed, click{" "}
        <strong className="text-ink">Approve Transfer</strong> — that releases your payment to the seller and makes
        the sale final. If something doesn&rsquo;t match instead, click{" "}
        <strong className="text-ink">Report an Issue</strong> before approving: your payment stays held, nothing is
        released automatically, and Durqo&rsquo;s team reviews the evidence before deciding what happens next. Your
        receipt and full order history stay available from your buyer dashboard.
      </>
    ),
  },
] as const;

// Colors mirror the real Transfer Room's own status tones exactly (see
// STAGE_LABEL / ITEM_STATUS_LABEL in TransferRoomView.tsx): gold for the
// in-progress Submitted/Received states, brand green for the completing
// Approve Transfer action.
const TRANSFER_FLOW = [
  {
    title: "Seller marks it Submitted",
    body: "As each asset is handed over, one at a time.",
    icon: Send,
    badge: "bg-gold-soft text-[#92730F]",
  },
  {
    title: "You mark it Received",
    body: "After inspecting it in your inspection window.",
    icon: Eye,
    badge: "bg-gold-soft text-[#92730F]",
  },
  {
    title: "You click Approve Transfer",
    body: "Releases your payment — the sale is final.",
    icon: CheckCircle2,
    badge: "bg-brand text-white",
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
  { icon: ShieldCheck, label: "Payment held until you approve the transfer" },
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

      {/* PROTECTIONS STRIP — Sep 11, 2026: replaced the plain divided text
          row (icons and labels crammed into thin, unevenly divided columns —
          looked cramped and dated, especially on desktop, per direct user
          feedback on a live screenshot) with a card grid matching the visual
          language already used a section down for PAYMENT_METHODS (bordered
          bg-paper-raised cards) and the icon-badge treatment used throughout
          this page (STEPS' numbered circles, FINAL CTA's icon badge) — same
          system, just applied consistently here too. */}
      <section className="border-b border-rule bg-paper-sunk py-10 sm:py-12">
        <Container>
          <Inner>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PROTECTIONS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3.5 rounded-xl border border-rule bg-paper-raised p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-strong">
                    <Icon size={19} />
                  </span>
                  <span className="text-sm font-medium leading-snug text-ink">{label}</span>
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
                Six steps, start to finish. Every listing is reviewed before it publishes, and your payment stays
                protected until you approve the transfer.
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

      {/* TRANSFER ROOM SPOTLIGHT — Sep 13, 2026: called out on its own,
          separate from the numbered steps, because it's the single most
          important mechanism on this page: it's what actually completes
          the sale and releases payment, not the payment screen itself. */}
      <section className="border-b border-rule bg-brand-soft py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mx-auto max-w-[920px] rounded-2xl border border-rule bg-paper-raised p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-10 lg:p-12">
              <div className="mx-auto max-w-[620px] text-center">
                <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
                  <PackageCheck size={26} />
                </span>
                <DashEyebrow center>Where every sale actually completes</DashEyebrow>
                <h2 className="text-2xl font-semibold text-ink sm:text-3xl">The Transfer Room</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  Every purchase on Durqo goes through a shared <strong className="text-ink">Transfer Room</strong> —
                  not just a payment screen. It&rsquo;s where the seller hands over the domain, code, accounts and
                  everything else, one item at a time, and where <strong className="text-ink">you</strong> decide
                  whether the sale is actually done.
                </p>
              </div>

              {/* step-flow diagram — icon nodes connected by arrows, one
                  column per node on desktop, stacked on mobile */}
              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-start sm:gap-2">
                {TRANSFER_FLOW.map((step, i) => (
                  <Fragment key={step.title}>
                    {i > 0 && (
                      <div className="hidden shrink-0 sm:flex sm:h-11 sm:items-center sm:justify-center">
                        <ArrowRight size={18} className="text-ink-faint" aria-hidden />
                      </div>
                    )}
                    <div className="flex items-start gap-4 sm:flex-col sm:items-center sm:gap-3 sm:text-center">
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${step.badge}`}
                        aria-hidden
                      >
                        <step.icon size={18} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">{step.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-ink-soft sm:mx-auto sm:max-w-[16ch]">
                          {step.body}
                        </p>
                      </div>
                    </div>
                  </Fragment>
                ))}
              </div>

              {/* alternate path — visually distinct (dashed border, danger
                  tone) from the happy path above */}
              <div className="mt-8 flex items-start gap-3 rounded-xl border border-dashed border-danger/40 bg-danger-soft p-4 sm:p-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-raised text-danger">
                  <AlertTriangle size={16} />
                </span>
                <p className="text-sm leading-relaxed text-danger">
                  Something not right? <strong>Click Report an Issue instead</strong> of approving — your payment
                  stays held and nothing releases automatically until Durqo&rsquo;s team reviews it.
                </p>
              </div>
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
              Card (Stripe) and Escrow.com purchases are always charged in full, in one payment. Only for
              Bangladeshi buyers paying above $2,000 in Bangladeshi Taka through SSLCommerz does Durqo collect the
              BDT equivalent of the first $2,000 online and coordinate the remaining balance separately — the
              exact amount and remaining-balance process is shown before you confirm. See{" "}
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
