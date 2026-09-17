import type { Metadata } from "next";
import { Fragment } from "react";
import {
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  Clock,
  MessageSquare,
  Send,
  Eye,
  CheckCircle2,
  AlertTriangle,
  History,
  Edit3,
  Wallet,
  ListChecks,
  Users,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

// Sep 17, 2026: new standalone explainer page for the Transfer Room —
// requested as "How Durqo's Transfer Room Helps Buyers and Sellers Complete
// a Deal." Built alongside (and cross-linked with) the existing /how-to-buy,
// /how-to-sell and /payments guide pages, matching their exact visual
// system (DashEyebrow/Inner helpers, section rhythm, page-scoped duplication
// per the established "no shared-component churn" convention). Unlike those
// three, this page is dual-audience by design — it explains the ONE shared
// mechanism (the Transfer Room) from both the buyer's and the seller's side
// at once, rather than a single role's end-to-end journey.
//
// Every claim and UI label below is traced to the real, live Transfer Room
// implementation, never invented copy:
// - Exact action labels ("Mark In Progress", "Mark Submitted", "Mark
//   Received", "Approve Transfer", "Report an Issue") and the per-item
//   status set (Not Started / In Progress / Submitted / Received / Accepted)
//   come straight from ITEM_STATUS_LABEL / the action buttons in
//   src/app/dashboard/transfer/[orderId]/TransferRoomView.tsx.
// - The 7-day inspection window is the literal `interval '7 days'` set in
//   supabase/migrations/037_asset_transfer_system_rpcs.sql when every item
//   reaches Received.
// - "Nothing releases automatically" reflects that an expired inspection
//   window always lands the order in admin_review (never an auto-approve),
//   per the same migration and TransferRoomView.tsx's own copy.
// - Deal Messages, Activity History and Post-Sale Support amendments are
//   real, distinct sections of the same page (see the section headings in
//   TransferRoomView.tsx), not summarized/merged for this page.
// - Payout-on-approval (order -> completed -> withdrawable, except the
//   escrow_com channel which releases through Escrow.com itself) matches
//   migration 039 per claude/asset-transfer-post-purchase-redirect-and-
//   payout-release-addendum.md.
// - Rooms opening automatically across every real payment channel (Stripe,
//   SSLCommerz, Escrow.com), the buyer being redirected straight in for
//   single-item Stripe/SSLCommerz purchases, and the email-CTA path for
//   Escrow.com/multi-item orders, all match that same addendum. ("Buy Now —
//   Pay Later" is a separate, no-payment internal test tool — see its own
//   code comments in BuyNowButton.tsx — and is deliberately left out of
//   buyer-facing copy on this page, same as it's deliberately left out of
//   /terms.)
// - "Asset Transfers" is the real buyer/seller dashboard nav entry (see
//   lib/dashboard-nav.ts) linking to the list of a user's own rooms.
// - Stripe/SSLCommerz are never called "escrow" here, matching /terms and
//   /payments — only Escrow.com is a genuine third-party escrow provider.
export const metadata: Metadata = {
  title: "How Durqo's Transfer Room Helps Buyers and Sellers Complete a Deal | Durqo",
  description:
    "How Durqo's Transfer Room works: the shared, per-order workspace where buyers and sellers hand over assets, confirm receipt, and complete a sale.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "How Durqo's Transfer Room Helps Buyers and Sellers Complete a Deal",
    description:
      "The shared, per-order workspace where buyers and sellers hand over assets, confirm receipt, and complete a sale.",
    url: "https://www.durqo.com/transfer-room",
  },
  twitter: {
    card: "summary_large_image",
    title: "How Durqo's Transfer Room Helps Buyers and Sellers Complete a Deal",
    description:
      "The shared, per-order workspace where buyers and sellers hand over assets, confirm receipt, and complete a sale.",
  },
  alternates: { canonical: "https://www.durqo.com/transfer-room" },
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

const KEY_FACTS = [
  { icon: ShieldCheck, label: "Payment held until both sides agree" },
  { icon: ListChecks, label: "A checklist for exactly what's being handed over" },
  { icon: Clock, label: "A 7-day window to inspect before approving" },
  { icon: MessageSquare, label: "Deal Messages and a full activity record" },
];

const SELLER_STEPS = [
  { n: "01", title: "Mark In Progress", body: "As you start preparing each asset on the checklist for handover." },
  {
    n: "02",
    title: "Mark Submitted",
    body: "Once it's handed over, with an optional reference note (a transfer code, login details, anything the buyer needs).",
  },
  {
    n: "03",
    title: "Wait for the buyer",
    body: "The buyer inspects and marks it Received. Answer questions in Deal Messages, or respond if they report an issue.",
  },
];

const BUYER_STEPS = [
  { n: "01", title: "Mark Received", body: "As each item arrives, once you've checked it's what was agreed." },
  {
    n: "02",
    title: "Inspect everything",
    body: "You have a 7-day inspection window from the first Received item to make sure it all works as described.",
  },
  {
    n: "03",
    title: "Approve Transfer, or report an issue",
    body: "Once every item checks out, approve to release payment. If something's wrong, report it instead — payment stays held.",
  },
];

// Colors mirror the real Transfer Room's own status tones (see
// ITEM_STATUS_LABEL in TransferRoomView.tsx): gold for the in-progress
// Submitted/Received states, brand green for the completing action.
const TRANSFER_FLOW = [
  { title: "Seller: Mark Submitted", body: "One asset at a time, as it's handed over.", icon: Send, badge: "bg-gold-soft text-[#92730F]" },
  { title: "Buyer: Mark Received", body: "After inspecting it in the inspection window.", icon: Eye, badge: "bg-gold-soft text-[#92730F]" },
  { title: "Buyer: Approve Transfer", body: "Releases payment. The sale is final.", icon: CheckCircle2, badge: "bg-brand text-white" },
] as const;

const DOCUMENTATION = [
  {
    icon: MessageSquare,
    title: "Deal Messages",
    body: "A dedicated conversation thread attached to the order itself, so handover details never get lost in email or chat.",
  },
  {
    icon: History,
    title: "Activity History",
    body: "Every status change, message and decision on the order, timestamped, for both sides and for Durqo's team if a dispute needs review.",
  },
  {
    icon: Edit3,
    title: "Amendments",
    body: "Either side can propose a change to what's included or to Post-Sale Support terms; the buyer accepts or declines it right in the room.",
  },
];

export default function TransferRoomPage() {
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
            <div className="mx-auto max-w-[66ch] text-center">
              <DashEyebrow onDark center>
                The Transfer Room
              </DashEyebrow>
              <h1 className="text-4xl leading-[1.1] text-white sm:text-5xl">
                Where every Durqo deal <span className="text-brand">actually gets finished.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-[56ch] text-lg leading-relaxed text-white/70">
                Payment is only step one. Here&rsquo;s exactly how buyers and sellers hand over a business, confirm
                everything&rsquo;s right, and release funds &mdash; together, in one shared room built for that
                one job.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button href="/buy" size="lg">
                  Browse listings
                  <ArrowRight size={16} />
                </Button>
                <Button href="/sell" variant="on-dark" size="lg">
                  List your business
                </Button>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* KEY FACTS STRIP */}
      <section className="border-b border-rule bg-paper-sunk py-10 sm:py-12">
        <Container>
          <Inner>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {KEY_FACTS.map(({ icon: Icon, label }) => (
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

      {/* WHAT IT IS */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[800px]">
            <DashEyebrow center>What it is</DashEyebrow>
            <h2 className="mb-5 text-center text-2xl sm:text-3xl">A shared workspace, not just a payment screen.</h2>
            <p className="text-center text-[0.95rem] leading-relaxed text-ink-soft">
              The moment a payment is confirmed &mdash; by card, bKash/Rocket/Nagad/bank, or Escrow.com &mdash;
              Durqo opens a private Transfer Room for that order. It&rsquo;s where the seller hands over the
              domain, code, accounts, customer lists or whatever else the listing included, and where the buyer
              decides, item by item, whether the sale is actually done. For most single-item card and mobile-banking
              purchases, the buyer lands there automatically right after paying; for Escrow.com and multi-item
              orders, both sides get a direct email link into the room instead. Every order&rsquo;s room also shows
              up under <strong className="text-ink">Asset Transfers</strong> in each side&rsquo;s dashboard.
            </p>
          </Inner>
        </Container>
      </section>

      {/* SELLER / BUYER STEPS */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[64ch]">
              <DashEyebrow>Two sides, one room</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">What each side actually does.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Every asset on the checklist moves through the same handover, from both directions at once.
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-xl border border-rule bg-paper-raised p-6 sm:p-8">
                <div className="mb-5 flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <Users size={16} />
                  </span>
                  <h4 className="text-base font-semibold text-ink">For the seller</h4>
                </div>
                <div className="flex flex-col gap-6">
                  {SELLER_STEPS.map(({ n, title, body }, i) => (
                    <div key={n} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span className="mono grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
                          {n}
                        </span>
                        {i < SELLER_STEPS.length - 1 && <span className="mt-1.5 w-px flex-1 bg-rule" aria-hidden />}
                      </div>
                      <div className="pb-1">
                        <p className="text-sm font-semibold text-ink">{title}</p>
                        <p className="mt-1 max-w-[46ch] text-sm leading-relaxed text-ink-soft">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-rule bg-paper-raised p-6 sm:p-8">
                <div className="mb-5 flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <ShieldCheck size={16} />
                  </span>
                  <h4 className="text-base font-semibold text-ink">For the buyer</h4>
                </div>
                <div className="flex flex-col gap-6">
                  {BUYER_STEPS.map(({ n, title, body }, i) => (
                    <div key={n} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span className="mono grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
                          {n}
                        </span>
                        {i < BUYER_STEPS.length - 1 && <span className="mt-1.5 w-px flex-1 bg-rule" aria-hidden />}
                      </div>
                      <div className="pb-1">
                        <p className="text-sm font-semibold text-ink">{title}</p>
                        <p className="mt-1 max-w-[46ch] text-sm leading-relaxed text-ink-soft">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* FLOW SPOTLIGHT + REPORT AN ISSUE BRANCH */}
      <section className="border-b border-rule bg-brand-soft py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mx-auto max-w-[920px] rounded-2xl border border-rule bg-paper-raised p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-10 lg:p-12">
              <div className="mx-auto max-w-[620px] text-center">
                <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
                  <PackageCheck size={26} />
                </span>
                <DashEyebrow center>Per asset, every time</DashEyebrow>
                <h2 className="text-2xl font-semibold text-ink sm:text-3xl">The same handover, item by item.</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  Each asset on the checklist &mdash; a domain, a codebase, a social account, anything the listing
                  included &mdash; moves through this exact sequence before the sale can close.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-start sm:gap-2">
                {TRANSFER_FLOW.map((step, i) => (
                  <Fragment key={step.title}>
                    {i > 0 && (
                      <div className="hidden shrink-0 sm:flex sm:h-11 sm:items-center sm:justify-center">
                        <ArrowRight size={18} className="text-ink-faint" aria-hidden />
                      </div>
                    )}
                    <div className="flex items-start gap-4 sm:flex-col sm:items-center sm:gap-3 sm:text-center">
                      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${step.badge}`} aria-hidden>
                        <step.icon size={18} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">{step.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-ink-soft sm:mx-auto sm:max-w-[18ch]">{step.body}</p>
                      </div>
                    </div>
                  </Fragment>
                ))}
              </div>

              <div className="mt-8 flex items-start gap-3 rounded-xl border border-dashed border-danger/40 bg-danger-soft p-4 sm:p-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-raised text-danger">
                  <AlertTriangle size={16} />
                </span>
                <p className="text-sm leading-relaxed text-danger">
                  Something not right? The buyer clicks <strong>Report an Issue</strong> instead &mdash; choosing a
                  category, optionally the specific asset, and an explanation. Payment stays held, and nothing
                  releases automatically until Durqo&rsquo;s team reviews it.
                </p>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* DOCUMENTATION */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[64ch]">
              <DashEyebrow>Nothing happens off the record</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Every deal is fully documented.</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {DOCUMENTATION.map(({ icon: Icon, title, body }) => (
                <div key={title} data-reveal className="rounded-xl border border-rule bg-paper-raised p-6">
                  <span className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <Icon size={19} />
                  </span>
                  <h4 className="text-base font-semibold text-ink">{title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* WHAT HAPPENS WHEN THE DEAL CLOSES */}
      <section className="border-b border-rule bg-brand-strong py-14 sm:py-16">
        <Container>
          <Inner className="max-w-[800px]">
            <DashEyebrow onDark center>
              When the deal closes
            </DashEyebrow>
            <h2 className="mb-6 text-center text-2xl text-white sm:text-3xl">From Approved to paid out.</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <CheckCircle2 size={20} className="mb-2 text-brand" />
                <h4 className="text-base font-semibold text-white">Buyer approves</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                  The order moves to completed and becomes eligible for payout &mdash; the seller can then request a
                  withdrawal. (Escrow.com purchases release through Escrow.com&rsquo;s own process instead, since
                  that payment never sits with Durqo.)
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <Clock size={20} className="mb-2 text-brand" />
                <h4 className="text-base font-semibold text-white">Window runs out</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                  If the buyer neither approves nor reports an issue within the inspection window, the order goes to
                  Durqo&rsquo;s admin review &mdash; it never auto-releases funds without a person checking first.
                </p>
              </div>
            </div>
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
                  <h2 className="text-xl font-semibold text-ink sm:text-2xl">Want the full picture?</h2>
                  <p className="mt-1 max-w-[46ch] text-sm text-ink-soft">
                    See the complete buying or selling journey, or how payments and withdrawals work end to end.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/how-to-buy" size="lg">
                  How to buy
                  <ArrowRight size={16} />
                </Button>
                <Button href="/how-to-sell" variant="secondary" size="lg">
                  How to sell
                </Button>
                <Button href="/payments" variant="ghost" size="lg">
                  Payment &amp; Withdrawal
                </Button>
              </div>
            </div>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
