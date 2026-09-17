import type { Metadata } from "next";
import { Fragment } from "react";
import {
  ArrowRight,
  Lock,
  Mail,
  Clock,
  Wallet,
  CreditCard,
  Landmark,
  ShieldCheck,
  Send,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Inbox,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

// Sep 17, 2026: new standalone explainer page, "What Happens After You Pay
// for a Digital Business on Durqo?" — built the same way as /transfer-room
// and /listing-review: matches the existing guide-page visual system
// exactly (DashEyebrow/Inner helpers, section rhythm, page-scoped
// duplication per the established "no shared-component churn" convention).
// Where /transfer-room explains the shared room mechanism itself, this page
// is the buyer's own timeline from the moment payment clears through to a
// completed sale — cross-linked to /transfer-room for the deeper mechanics
// rather than repeating them.
//
// Every claim below is traced to the real, live checkout/redirect code, not
// invented copy:
// - Stripe: /api/checkout's success_url carries `order_ids`; checkout/
//   success/page.tsx redirects straight to /dashboard/transfer/{orderId}
//   when exactly one order id is present (multi-item carts fall back to the
//   generic confirmation screen) — see the Sep 12, 2026 comment block in
//   that file and asset-transfer-post-purchase-redirect-and-payout-release-
//   addendum.md.
// - SSLCommerz (card, bKash, Rocket, Nagad, bank transfer): api/sslcommerz/
//   success/route.ts looks the order up by `sslcommerz_tran_id` and 303-
//   redirects straight to the Transfer Room when exactly one order matches,
//   same fallback rule for multi-item carts.
// - Escrow.com: EscrowConfirmModal.tsx's own "success" state tells the
//   buyer Escrow.com just emailed them a "Please agree to the transaction"
//   message — Click to Agree, review terms, pay, all on Escrow.com's own
//   hosted pages. src/lib/escrow.ts confirms Durqo's API has no way to
//   redirect the buyer back from there. Per the redirect addendum, once
//   that payment clears, both buyer and seller emails get the "Open the
//   Transfer Room" CTA — the only channel where both sides need it in
//   email, since the buyer has no in-app redirect.
// - Order status after payment: OrderStatus in src/lib/data/orders.client.ts
//   includes "in_escrow" and "in_durqo" as two distinct states (migration
//   038) — Badge.tsx labels them "Held by Escrow.com" and "Payment
//   Received" respectively. Only the escrow_com channel actually sits with
//   a third party; Stripe/SSLCommerz funds are held by Durqo itself until
//   release (migration 039's transfer_approve()).
// - "Buy Now — Pay Later" (BuyNowButton.tsx / api/pay-later/init/route.ts)
//   is a separate, no-payment internal test tool, not a real buyer payment
//   method — it creates a real order with zero money collected. It's
//   deliberately left out of this page's buyer-facing copy, matching how
//   /terms's own top-of-file comment deliberately excludes it too.
// - NoRoomState in TransferRoomView.tsx: a buyer who lands on the room a
//   beat before the creation RPC finishes now auto-polls every 4s (up to 8
//   tries) instead of hitting a dead end — mentioned here as "give it a
//   moment" rather than treated as an error state.
// - The Transfer Room flow (Mark Submitted / Mark Received / Approve
//   Transfer), the 7-day inspection window (`interval '7 days'`,
//   037_asset_transfer_system_rpcs.sql), "Report an Issue", and an expired
//   window always landing in admin_review (never auto-approving) all match
//   /transfer-room's own sourcing — kept consistent rather than re-derived.
// - buyerTransferGuidanceHtml() / sellerTransferGuidanceHtml() in
//   src/lib/asset-transfer-room.ts are the literal 4-step emailed
//   instructions referenced in the "what lands in your inbox" section.
// - Payout-on-approval and the escrow_com payout exception match migration
//   039, same as /transfer-room.
export const metadata: Metadata = {
  title: "What Happens After You Pay for a Digital Business on Durqo? | Durqo",
  description:
    "The exact sequence after a Durqo purchase — where your money sits, how you land in your Transfer Room, and what happens during the 7-day inspection window before a sale is final.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "What Happens After You Pay for a Digital Business on Durqo?",
    description:
      "The exact sequence after a Durqo purchase — where your money sits, how you land in your Transfer Room, and what happens before a sale is final.",
    url: "https://www.durqo.com/after-you-pay",
  },
  twitter: {
    card: "summary_large_image",
    title: "What Happens After You Pay for a Digital Business on Durqo?",
    description:
      "The exact sequence after a Durqo purchase — where your money sits, how you land in your Transfer Room, and what happens before a sale is final.",
  },
  alternates: { canonical: "https://www.durqo.com/after-you-pay" },
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
  { icon: Lock, label: "Your payment is held by Durqo or Escrow.com, not the seller, until you approve" },
  { icon: Mail, label: "Most purchases drop you straight into a private Transfer Room" },
  { icon: Clock, label: "A 7-day inspection window before anything is treated as final" },
  { icon: Wallet, label: "The seller isn't paid out until you click Approve Transfer" },
];

const REDIRECT_METHODS = [
  {
    icon: CreditCard,
    title: "Card, or bKash / Rocket / Nagad / bank transfer",
    body: "Paid through Stripe or SSLCommerz for a single listing? You're redirected straight into your Transfer Room the moment payment is confirmed — no confirmation page to click through first.",
  },
  {
    icon: Landmark,
    title: "Escrow.com",
    body: "Escrow.com runs its own hosted checkout: after you confirm on Durqo, Escrow.com emails you to \"Click to Agree,\" review the terms, and pay there. Durqo can't redirect you back automatically from their site, so once that payment clears, you (and the seller) get an email with a direct link into the Transfer Room instead.",
  },
  {
    icon: ShieldCheck,
    title: "More than one listing in one order",
    body: "Each listing you buy gets its own order and its own Transfer Room. With more than one, there's no single room to land on, so you'll see a general confirmation page instead — every room is still reachable from your dashboard.",
  },
] as const;

const MONEY_HOLDING = [
  {
    title: "Paid via Escrow.com",
    status: "Held by Escrow.com",
    body: "Your order status shows \"Held by Escrow.com\" — the funds sit with Escrow.com itself, a neutral third party, until the transfer is approved.",
  },
  {
    title: "Paid via Stripe or SSLCommerz",
    status: "Payment Received",
    body: "Your order status shows \"Payment Received\" — Durqo is holding the funds directly. It isn't a third-party escrow service for these channels, but the same rule applies: nothing moves to the seller until you approve.",
  },
] as const;

const TRANSFER_FLOW = [
  { title: "Seller: Mark Submitted", body: "One asset at a time, as it's handed over.", icon: Send, badge: "bg-gold-soft text-[#92730F]" },
  { title: "Buyer: Mark Received", body: "After inspecting it in the inspection window.", icon: Eye, badge: "bg-gold-soft text-[#92730F]" },
  { title: "Buyer: Approve Transfer", body: "Releases payment. The sale is final.", icon: CheckCircle2, badge: "bg-brand text-white" },
] as const;

export default function AfterYouPayPage() {
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
                After you pay
              </DashEyebrow>
              <h1 className="text-4xl leading-[1.1] text-white sm:text-5xl">
                You&rsquo;ve paid. <span className="text-brand">Here&rsquo;s exactly what happens next.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-[56ch] text-lg leading-relaxed text-white/70">
                Paying for a listing isn&rsquo;t the end of the deal — it&rsquo;s the start of a guided handover.
                Here&rsquo;s the exact sequence, payment method by payment method.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button href="/transfer-room" size="lg">
                  The Transfer Room
                  <ArrowRight size={16} />
                </Button>
                <Button href="/buy" variant="on-dark" size="lg">
                  Browse listings
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

      {/* THE MOMENT PAYMENT CLEARS */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[64ch]">
              <DashEyebrow>The moment payment clears</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Where you land depends on how you paid.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Every Durqo purchase ends up in the same place — a private Transfer Room for that order — but how
                you get there differs slightly by payment method.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {REDIRECT_METHODS.map(({ icon: Icon, title, body }) => (
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
              Land on the room a beat too early? It auto-checks again every few seconds on its own — payment
              confirmation and the room being ready aren&rsquo;t always the exact same instant, so give it a moment
              before assuming something&rsquo;s wrong.
            </p>
          </Inner>
        </Container>
      </section>

      {/* WHERE YOUR MONEY SITS */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[64ch]">
              <DashEyebrow>Where your money actually sits</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Two channels, one rule: nothing moves without your approval.</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {MONEY_HOLDING.map(({ title, status, body }) => (
                <div key={title} className="rounded-xl border border-rule bg-paper-raised p-6 sm:p-8">
                  <span className="mono mb-3 inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-strong">
                    {status}
                  </span>
                  <h4 className="text-base font-semibold text-ink">{title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* INSIDE THE TRANSFER ROOM */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[64ch]">
              <DashEyebrow>Inside the Transfer Room</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">A checklist, not a waiting room.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                The room is built around whatever the listing includes — domain, codebase, social accounts, and so
                on. Each item moves through the same three steps.
              </p>
            </div>
            <div className="rounded-2xl border border-rule bg-paper-raised p-6 sm:p-8">
              <div className="flex flex-col items-stretch gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
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
            </div>
            <p className="mt-6 text-sm leading-relaxed text-ink-soft">
              Want the full mechanics — Deal Messages, Activity History, amendments, disputes?{" "}
              <a href="/transfer-room" className="font-semibold text-brand-strong hover:underline">
                Read the full Transfer Room guide →
              </a>
            </p>
          </Inner>
        </Container>
      </section>

      {/* 7-DAY INSPECTION WINDOW */}
      <section className="border-b border-rule bg-brand-soft py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mx-auto max-w-[820px] rounded-2xl border border-rule bg-paper-raised p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-10">
              <div className="mx-auto max-w-[600px] text-center">
                <DashEyebrow center>Before anything is final</DashEyebrow>
                <h2 className="text-2xl font-semibold text-ink sm:text-3xl">A 7-day inspection window.</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  Once every item on the checklist is marked Received, you get 7 days to actually use what you
                  bought before approving.
                </p>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-rule bg-paper-sunk p-6">
                  <AlertTriangle size={20} className="mb-2 text-gold" />
                  <h4 className="text-base font-semibold text-ink">Something&rsquo;s off?</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    Report an Issue right in the room — pick a category, flag the specific asset if relevant, and
                    explain what went wrong, instead of being forced to approve.
                  </p>
                </div>
                <div className="rounded-xl border border-rule bg-paper-sunk p-6">
                  <Clock size={20} className="mb-2 text-brand-strong" />
                  <h4 className="text-base font-semibold text-ink">Window runs out with no action?</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    It doesn&rsquo;t auto-complete. The order goes to Durqo&rsquo;s admin review, so a real person
                    looks at it before anything is finalized either way.
                  </p>
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* WHAT LANDS IN YOUR INBOX */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[64ch]">
              <DashEyebrow>What lands in your inbox</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">A confirmation email, with actual instructions.</h2>
            </div>
            <div className="flex items-start gap-5 rounded-xl border border-rule bg-paper-raised p-6 sm:p-8">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                <Inbox size={19} />
              </span>
              <div>
                <p className="text-sm leading-relaxed text-ink-soft">
                  Every purchase gets a confirmation email that spells out the four steps to receiving your
                  assets — open the room, watch each item arrive, mark it Received, then Approve once everything
                  checks out. If you paid through Escrow.com, this email is more than a courtesy: it&rsquo;s
                  literally how you and the seller both get the link into your Transfer Room, since there&rsquo;s
                  no in-app redirect for that channel.
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
                  <h2 className="text-xl font-semibold text-ink sm:text-2xl">Already paid?</h2>
                  <p className="mt-1 max-w-[46ch] text-sm text-ink-soft">
                    Check your order and jump straight back into your Transfer Room.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/dashboard/buyer/orders" size="lg">
                  View my orders
                  <ArrowRight size={16} />
                </Button>
                <Button href="/payments" variant="secondary" size="lg">
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
