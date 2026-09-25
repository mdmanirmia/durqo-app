import type { Metadata } from "next";
import {
  ArrowRight,
  Percent,
  Wallet,
  Clock,
  ShieldCheck,
  Landmark,
  Smartphone,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  XCircle,
  Ban,
  Info,
  UserCheck,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

// Sep 17, 2026: new standalone explainer page, "How Seller Payouts Work
// After a Completed Sale" — built the same way as /transfer-room,
// /listing-review, /after-you-pay, /report-an-issue and /whats-included:
// matches the existing guide-page visual system exactly (DashEyebrow/Inner
// helpers, section rhythm, page-scoped duplication per this project's own
// "no shared-component churn" convention). Cross-linked to /transfer-room
// and /report-an-issue rather than repeating their content.
//
// Every claim below is traced to real, live withdrawal/payout code and the
// site's own confirmed policy docs, not invented copy:
// - "Completed" eligibility: an order only becomes withdrawable once
//   orders.status = 'completed', which only happens via the buyer's
//   transfer_approve() RPC (after Approve Transfer, once the 7-day
//   inspection window hasn't expired) or an admin resolving a dispute in
//   the seller's favor (resolveTransferDispute('approved_despite_report')
//   in dashboard/admin/actions.ts). Sellers/buyers can't set this status
//   directly — see claude/payout-processing-policy-implementation-plan-
//   addendum.md, section 2.
// - Success Fee: flat (never marginal) tiered rate on the order's full
//   sale price — under $50,000 -> 10%, $50,000-$250,000 -> 7%
//   (inclusive both ends), over $250,000 -> 5% — straight from
//   src/lib/fees.ts's own documented policy and successFeeRate()'s
//   boundary rule.
// - "Available to Withdraw" is already net of the fee — getAvailableBalance()
//   (src/lib/data/earnings.client.ts) reads from the order_remaining_
//   balances view (gross minus fee), and the Earnings page's own copy says
//   exactly this ("Your available balance is what's left of your completed
//   orders after any previous withdrawal requests, minus Durqo's Success
//   Fee.").
// - Payout methods and their exact labels (Bank Transfer, bKash, Rocket,
//   Nagad, PayPal, Wise) come from PAYOUT_METHODS in
//   dashboard/seller/earnings/page.tsx.
// - The ৳50,000/day and ৳300,000/month caps on bKash/Rocket/Nagad are
//   independent per method (not pooled) — 032_withdrawal_mfs_per_method_
//   caps.sql — and a single order larger than the cap can be split across
//   multiple requests over time rather than being a dead end —
//   033_withdrawal_order_splitting.sql. Bank Transfer/PayPal/Wise carry no
//   cap, per the same page's own MFS_METHOD_IDS set.
// - Escrow.com orders are excluded from Durqo's withdrawal ledger entirely
//   (035_exclude_escrow_com_from_payout_ledger.sql) — Escrow.com pays the
//   seller directly, and the Earnings page's own escrow.com banner warns
//   sellers to check what it's already paid before requesting a Durqo
//   withdrawal that would double-count it.
// - The 9-value withdrawal status model (Requested, Under review, Action
//   required, Approved, Processing, Paid, On hold, Rejected, Cancelled)
//   and its exact labels/tones come from STATUS_LABEL/STATUS_TONE in
//   dashboard/seller/earnings/page.tsx, and the "3-5 business days,
//   estimated not guaranteed" policy language, plus the rule that the
//   estimate pauses entirely during Action required/On hold, comes
//   verbatim from src/lib/payout-eta.ts's own top-of-file comment and
//   claude/payout-policy-v2-deployment-addendum.md's shipped policy text.
// - Cancellation: a seller can only self-cancel a request while it's still
//   Requested or Under review (SELF_CANCELLABLE_STATUSES in earnings/
//   page.tsx, matching cancel_withdrawal_request()'s own check) — after
//   that point only an admin's status change moves it forward.
//
// Sep 22, 2026: this page never mentioned identity verification (KYC) at
// all, even though it's a real, live gate on the first withdrawal
// (profiles.payout_verified, enforced inside create_withdrawal_request()
// itself — see claude/payout-policy-v2-deployment-addendum.md) — and never
// mentioned the newer payout-name-matching requirement either (site
// owner's KYC policy, Sep 2026 — see claude/kyc-identity-verification-and-
// buyer-verification-addendum.md). Added a dedicated section plus a
// KEY_FACTS strip item so this dedicated payouts explainer actually
// explains both gates, not just the fee/method/status mechanics.
export const metadata: Metadata = {
  title: "How Seller Payouts Work After a Completed Sale | Durqo",
  description:
    "How a sale becomes withdrawable, how Durqo's Success Fee is calculated, the payout methods and their limits, and exactly what happens after you request a payout.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "How Seller Payouts Work After a Completed Sale",
    description:
      "How a sale becomes withdrawable, how the Success Fee is calculated, and what happens after you request a payout.",
    url: "https://www.durqo.com/seller-payouts",
  },
  twitter: {
    card: "summary_large_image",
    title: "How Seller Payouts Work After a Completed Sale",
    description:
      "How a sale becomes withdrawable, how the Success Fee is calculated, and what happens after you request a payout.",
  },
  alternates: { canonical: "https://www.durqo.com/seller-payouts" },
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
  { icon: UserCheck, label: "Identity verification (KYC) is required before your very first withdrawal" },
  { icon: Percent, label: "A flat Success Fee - 10% under $50k, 7% from $50k–$250k, 5% above $250k" },
  { icon: Wallet, label: "Available to Withdraw is already net of the fee - no surprise deduction later" },
  { icon: Clock, label: "Payout requests are normally reviewed within an estimated 3–5 business days" },
  { icon: ShieldCheck, label: "Escrow.com sales pay you directly - never through Durqo's own withdrawal system" },
];

const FEE_TIERS = [
  { label: "Under $50,000", rate: "10%" },
  { label: "$50,000 – $250,000", rate: "7%" },
  { label: "Over $250,000", rate: "5%" },
] as const;

const PAYOUT_METHODS_INFO = [
  { icon: Landmark, name: "Bank Transfer", cap: "No daily or monthly cap" },
  { icon: Smartphone, name: "bKash", cap: "Up to ৳50,000/day · ৳300,000/month" },
  { icon: Smartphone, name: "Rocket", cap: "Up to ৳50,000/day · ৳300,000/month" },
  { icon: Smartphone, name: "Nagad", cap: "Up to ৳50,000/day · ৳300,000/month" },
  { icon: CreditCard, name: "PayPal", cap: "No daily or monthly cap" },
  { icon: CreditCard, name: "Wise", cap: "No daily or monthly cap" },
] as const;

const STATUS_FLOW = [
  { label: "Requested", tone: "gold" as const },
  { label: "Under review", tone: "gold" as const },
  { label: "Approved", tone: "brand" as const },
  { label: "Processing", tone: "brand" as const },
  { label: "Paid", tone: "dark" as const },
];

const STATUS_BRANCHES = [
  { icon: AlertTriangle, label: "Action required", body: "Durqo needs something from you - usually a payout-detail fix. The 3–5 day clock pauses until it's resolved." },
  { icon: PauseCircle, label: "On hold", body: "A dispute or compliance check paused the request. The clock pauses here too, same as Action required." },
  { icon: XCircle, label: "Rejected", body: "The request didn't go through. Any orders it had claimed are released back into your available balance." },
  { icon: Ban, label: "Cancelled", body: "You can cancel it yourself - but only while it's still Requested or Under review, before Durqo starts processing it." },
];

export default function SellerPayoutsPage() {
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
                From completed sale to your account
              </DashEyebrow>
              <h1 className="text-4xl leading-[1.1] text-white sm:text-5xl">
                You made the sale. <span className="text-brand">Here&rsquo;s how the payout works.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-[56ch] text-lg leading-relaxed text-white/70">
                From the moment your order is marked complete to the money landing with your payout provider -
                exactly what Durqo deducts, when you can request it, and what each status means.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button href="/dashboard/seller/earnings" size="lg">
                  Go to Earnings &amp; Withdrawals
                  <ArrowRight size={16} />
                </Button>
                <Button href="/payments" variant="on-dark" size="lg">
                  Payment &amp; Withdrawal FAQ
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* WHEN A SALE BECOMES PAYOUT-ELIGIBLE */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-8 max-w-[64ch]">
              <DashEyebrow>When it becomes eligible</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">A sale has to be marked complete first.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                An order only counts toward your available balance once its status is Completed - and that only
                happens one of two ways.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-rule bg-paper-raised p-6">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                  <CheckCircle2 size={19} />
                </span>
                <h4 className="text-base font-semibold text-ink">The buyer approves the transfer</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  Once every asset is marked Received and the 7-day inspection window is still open, the buyer clicks
                  Approve Transfer. That&rsquo;s the normal path to Completed.{" "}
                  <a href="/transfer-room" className="font-semibold text-brand-strong hover:underline">
                    See the full Transfer Room flow →
                  </a>
                </p>
              </div>
              <div className="rounded-xl border border-rule bg-paper-raised p-6">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                  <ShieldCheck size={19} />
                </span>
                <h4 className="text-base font-semibold text-ink">An admin resolves a dispute in your favor</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  If the buyer reported an issue and Durqo&rsquo;s review decides the transfer was fine, the order is
                  moved to Completed the same way an approval would.{" "}
                  <a href="/report-an-issue" className="font-semibold text-brand-strong hover:underline">
                    See how disputes get resolved →
                  </a>
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-rule bg-paper-sunk p-5">
              <Info size={18} className="mt-0.5 shrink-0 text-ink-faint" />
              <p className="text-sm leading-relaxed text-ink-soft">
                Neither the buyer nor the seller can mark an order Completed directly - it only happens through
                one of these two flows.
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      {/* IDENTITY VERIFICATION (KYC) & NAME MATCHING */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-8 max-w-[64ch]">
              <DashEyebrow>Identity verification (KYC)</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Two checks stand between a completed sale and your money.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Being marked Completed isn&rsquo;t the only gate. Before Durqo pays out to you, two identity checks
                apply.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-rule bg-paper-raised p-6">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                  <UserCheck size={19} />
                </span>
                <h4 className="text-base font-semibold text-ink">KYC before your first withdrawal</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  Before your very first payout request, you must complete identity verification (KYC) by
                  uploading an ID document from your dashboard&rsquo;s Verification page. This is separate from
                  the optional public Verified Seller badge shown on listings. It&rsquo;s required once, and
                  every withdrawal after that draws on the same approved verification.
                </p>
              </div>
              <div className="rounded-xl border border-rule bg-paper-raised p-6">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                  <ShieldCheck size={19} />
                </span>
                <h4 className="text-base font-semibold text-ink">Your payout name must match your verified name</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  When you request a withdrawal, you enter an account holder name for the payout method you&rsquo;re
                  using. Durqo compares this by hand against the legal name on your identity verification before
                  approving the request, so make sure the name on your payout account matches your ID.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-rule bg-paper-sunk p-5">
              <Info size={18} className="mt-0.5 shrink-0 text-ink-faint" />
              <p className="text-sm leading-relaxed text-ink-soft">
                Submit your identity documents early from the{" "}
                <a href="/dashboard/seller/verification" className="font-semibold text-brand-strong hover:underline">
                  Verification page
                </a>{" "}
                so this is already done by the time you have your first payout to request.
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      {/* SUCCESS FEE */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-8 max-w-[64ch]">
              <DashEyebrow>Durqo&rsquo;s Success Fee</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">One flat rate, based on the sale price.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                The rate applies to the entire final sale price - it&rsquo;s a flat lookup, never a marginal,
                tax-bracket-style calculation.
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-rule bg-paper-raised">
              {FEE_TIERS.map((tier, i) => (
                <div
                  key={tier.label}
                  className={`flex items-center justify-between px-6 py-4 ${i !== FEE_TIERS.length - 1 ? "border-b border-rule" : ""}`}
                >
                  <span className="text-sm font-medium text-ink">{tier.label}</span>
                  <span className="mono text-lg font-semibold text-brand-strong">{tier.rate}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-ink-faint">
              Example: a $180,000 sale falls in the $50,000–$250,000 tier, so the fee is 7% of $180,000 -
              not 10% on the first $50,000 and 7% on the rest.
            </p>
          </Inner>
        </Container>
      </section>

      {/* PAYOUT METHODS */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[64ch]">
              <DashEyebrow>Payout methods</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Six ways to get paid, three with their own cap.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                bKash, Rocket and Nagad each carry their own independent daily and monthly limit - using one
                doesn&rsquo;t count against the other two. Bank Transfer, PayPal and Wise have no cap.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PAYOUT_METHODS_INFO.map(({ icon: Icon, name, cap }) => (
                <div key={name} className="flex items-center gap-3.5 rounded-xl border border-rule bg-paper-raised p-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                    <Icon size={19} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{name}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">{cap}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-rule bg-paper-sunk p-5">
              <Info size={18} className="mt-0.5 shrink-0 text-ink-faint" />
              <p className="text-sm leading-relaxed text-ink-soft">
                A single order worth more than a method&rsquo;s cap isn&rsquo;t a dead end - it can be claimed
                gradually, split across several requests over time until it&rsquo;s fully withdrawn.
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      {/* ESCROW.COM SPOTLIGHT */}
      <section className="border-b border-rule bg-brand-soft py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mx-auto max-w-[820px] rounded-2xl border border-rule bg-paper-raised p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-10">
              <div className="mx-auto max-w-[600px] text-center">
                <DashEyebrow center>The one exception</DashEyebrow>
                <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Escrow.com sales don&rsquo;t go through this system.</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  If a sale went through Escrow.com, Escrow.com pays you directly once it releases the funds -
                  Durqo never creates a second payout for that order. Those orders are excluded from your Durqo
                  balance entirely, so double-check what Escrow.com has already paid you before assuming an order is
                  still waiting on a Durqo withdrawal.
                </p>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* REQUESTING YOUR PAYOUT / STATUS FLOW */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[64ch]">
              <DashEyebrow>Requesting your payout</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">One request, nine possible statuses.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                There&rsquo;s no amount field to fill in - a request claims whatever&rsquo;s actually available,
                oldest orders first. The normal path runs straight through:
              </p>
            </div>

            <div className="mb-8 flex flex-wrap items-center gap-3">
              {STATUS_FLOW.map((s, i) => (
                <div key={s.label} className="flex items-center gap-3">
                  <Badge tone={s.tone}>{s.label}</Badge>
                  {i !== STATUS_FLOW.length - 1 && <ArrowRight size={14} className="text-ink-faint" aria-hidden />}
                </div>
              ))}
            </div>

            <p className="mb-6 max-w-[64ch] text-[0.95rem] leading-relaxed text-ink-soft">
              Durqo normally reviews and processes an eligible request within an <strong>estimated</strong> 3–5
              business days - never a guaranteed arrival date, since the destination bank or payout provider can
              add its own time on top. Four other statuses can branch off that path:
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {STATUS_BRANCHES.map(({ icon: Icon, label, body }) => (
                <div key={label} className="rounded-xl border border-rule bg-paper-raised p-5">
                  <div className="mb-2 flex items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-sunk text-ink-soft">
                      <Icon size={16} />
                    </span>
                    <p className="text-sm font-semibold text-ink">{label}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
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
                  <h2 className="text-xl font-semibold text-ink sm:text-2xl">Ready to check your balance?</h2>
                  <p className="mt-1 max-w-[46ch] text-sm text-ink-soft">
                    Your Earnings &amp; Withdrawals dashboard shows exactly what&rsquo;s available right now.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/dashboard/seller/earnings" size="lg">
                  Go to Earnings &amp; Withdrawals
                  <ArrowRight size={16} />
                </Button>
                <Button href="/how-to-sell" variant="secondary" size="lg">
                  How to sell
                </Button>
              </div>
            </div>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
