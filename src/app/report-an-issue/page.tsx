import type { Metadata } from "next";
import {
  ArrowRight,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Mail,
  PackageX,
  WifiOff,
  ListChecks,
  FileWarning,
  KeyRound,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  Banknote,
  Handshake,
  Ban,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

// Sep 17, 2026: new standalone explainer page, "What Happens If a
// Transferred Asset Is Missing or Incorrect?" — built the same way as
// /transfer-room, /listing-review and /after-you-pay: matches the existing
// guide-page visual system exactly (DashEyebrow/Inner helpers, section
// rhythm, page-scoped duplication per the established "no shared-component
// churn" convention). Cross-linked to /transfer-room and /after-you-pay
// rather than repeating their content.
//
// Every claim below is traced to the real, live dispute-handling code, not
// invented copy:
// - Report an Issue is buyer-only and ONLY callable during the
//   `inspection_active` stage — transfer_report_issue() in supabase/
//   migrations/037_asset_transfer_system_rpcs.sql raises an exception
//   outside that stage, and ReportIssueButton in TransferRoomView.tsx is
//   disabled (with that exact tooltip text) whenever room.stage isn't
//   inspection_active.
// - A room only reaches inspection_active once EVERY item has been marked
//   Received (transfer_item_mark_received() in the same migration checks
//   `v_remaining = 0` across all items before flipping the stage and
//   starting the 7-day `inspection_deadline_at` countdown) — stated here as
//   "once you've marked everything Received" rather than "as soon as
//   something looks wrong," since that's the actual gate.
// - The six issue categories (not_received, not_working, incomplete,
//   misrepresented, credentials_invalid, other) and their exact labels come
//   straight from ISSUE_CATEGORIES in TransferRoomView.tsx.
// - ReportIssueModal's own copy — "This goes to a Durqo admin for review —
//   funds stay held until it's resolved," the optional per-asset picker,
//   category, and free-text explanation fields — matches the real modal
//   exactly.
// - Reporting an issue immediately sets the room's stage to admin_review
//   (same migration, transfer_report_issue()'s final update) — STAGE_LABEL
//   in TransferRoomView.tsx renders this as "Under Admin Review" (danger
//   tone).
// - transfer_approve() (supabase/migrations/043_transfer_approve_enforces_
//   deadline.sql) independently enforces the same window at the database
//   level: even a same-second "Approve Transfer" click after the deadline
//   is rejected and the room is moved to admin_review instead of releasing
//   funds, so this isn't only a client-side button state.
// - The five resolution outcomes (returned_to_seller, approved_despite_
//   report, refund_authorized, settlement_recorded, order_cancelled), their
//   exact admin-facing labels/hints, and the stage each one resolves to
//   come straight from RESOLUTION_OPTIONS and RESOLUTION_STAGE in
//   src/app/dashboard/admin/transfers/[roomId]/AdminTransferDetail.tsx and
//   src/app/dashboard/admin/actions.ts's resolveTransferDispute(). That same
//   file's header comment states plainly that resolving a dispute records
//   the outcome only — actually moving money (a refund, a reversal) still
//   happens on the relevant payment rail separately, not automatically.
// - resolveTransferDispute() emails both buyer and seller with the
//   resolution outcome and a link back to the Transfer Room (per
//   claude/transactional-email-system-completion-addendum.md, gap #3).
// - sweep_expired_inspections() (037) and transfer_approve()'s own deadline
//   check (043) both send an expired, un-acted-on window to admin_review,
//   never to an automatic approval — matching /after-you-pay's and
//   /transfer-room's own sourcing on this point, kept consistent rather
//   than re-derived.
export const metadata: Metadata = {
  title: "What Happens If a Transferred Asset Is Missing or Incorrect? | Durqo",
  description:
    "Exactly what happens when you report a problem in your Transfer Room - when you can report it, what a Durqo admin reviews, and the five possible outcomes.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "What Happens If a Transferred Asset Is Missing or Incorrect?",
    description:
      "Exactly what happens when you report a problem in your Transfer Room - when you can report it, what gets reviewed, and how it gets resolved.",
    url: "https://www.durqo.com/report-an-issue",
  },
  twitter: {
    card: "summary_large_image",
    title: "What Happens If a Transferred Asset Is Missing or Incorrect?",
    description:
      "Exactly what happens when you report a problem in your Transfer Room - when you can report it, what gets reviewed, and how it gets resolved.",
  },
  alternates: { canonical: "https://www.durqo.com/report-an-issue" },
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
  { icon: AlertTriangle, label: "Reporting an issue instantly freezes the transfer - nothing releases until it's resolved" },
  { icon: Clock, label: "Issues can only be reported during your 7-day inspection window" },
  { icon: ShieldCheck, label: "A Durqo admin reviews every report personally" },
  { icon: Mail, label: "You and the seller are both emailed the outcome, whichever way it goes" },
];

const ISSUE_CATEGORIES = [
  { icon: PackageX, label: "Never received this asset" },
  { icon: WifiOff, label: "Doesn't work as described" },
  { icon: ListChecks, label: "Incomplete transfer" },
  { icon: FileWarning, label: "Misrepresented on the listing" },
  { icon: KeyRound, label: "Login/credentials don't work" },
  { icon: HelpCircle, label: "Other" },
] as const;

const REPORT_STEPS = [
  {
    n: "01",
    title: "Pick the asset (optional)",
    body: "Point to the specific item that's wrong, or leave it as a general issue with the whole order.",
  },
  {
    n: "02",
    title: "Choose a category",
    body: "One of the six reasons above - it tells the admin what kind of problem they're looking at before they even read your explanation.",
  },
  {
    n: "03",
    title: "Explain what happened",
    body: "In your own words. This is required - the admin is a real person deciding a real outcome, not a form being auto-processed.",
  },
  {
    n: "04",
    title: "Submit",
    body: "The room moves to \"Under Admin Review\" immediately. Funds stay exactly where they are until an admin resolves it.",
  },
] as const;

const OUTCOMES = [
  {
    icon: RotateCcw,
    title: "Send back to seller",
    body: "Reopens the flagged asset - or the whole room - for the seller to redo. The only outcome that keeps the deal alive rather than closing it out.",
  },
  {
    icon: CheckCircle2,
    title: "Approve despite report",
    body: "The admin sides with the seller: finishes the transfer as if you had approved it yourself. Funds become eligible for the seller's payout.",
  },
  {
    icon: Banknote,
    title: "Refund authorized",
    body: "Closes the transfer as refunded. The actual refund is then processed on the payment rail you paid through, separately.",
  },
  {
    icon: Handshake,
    title: "Settlement recorded",
    body: "Closes the transfer with a recorded settlement between you and the seller - for example, a partial resolution agreed outside a full refund.",
  },
  {
    icon: Ban,
    title: "Order cancelled",
    body: "Closes the transfer as cancelled.",
  },
] as const;

export default function ReportAnIssuePage() {
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
                If something&rsquo;s wrong
              </DashEyebrow>
              <h1 className="text-4xl leading-[1.1] text-white sm:text-5xl">
                Something&rsquo;s off? <span className="text-brand">Here&rsquo;s exactly what happens.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-[56ch] text-lg leading-relaxed text-white/70">
                The Transfer Room isn&rsquo;t just a handshake. If an asset is missing, broken, or not what the
                listing promised, reporting it freezes the deal until a real person looks at it.
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

      {/* WHEN YOU CAN REPORT */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-8 max-w-[64ch]">
              <DashEyebrow>When you can report an issue</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Only during your inspection window - not before.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                You mark each item Received as the seller hands it over. Once every item on the checklist is marked
                Received, your 7-day inspection window opens automatically - and that&rsquo;s exactly when Report
                an Issue becomes available.
              </p>
            </div>
            <div className="rounded-xl border border-rule bg-paper-raised p-6 sm:p-8">
              <p className="text-sm leading-relaxed text-ink-soft">
                Notice something wrong with an item before you&rsquo;ve marked everything Received? The Report an
                Issue button stays disabled until the inspection window opens - use Deal Messages to sort it out
                directly with the seller first. Once every item is in and the window is open, reporting is there
                for anything that turns out to be missing, broken, or not what was promised.
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      {/* ISSUE CATEGORIES */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[64ch]">
              <DashEyebrow>What you can report</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Six categories, plus a free-text explanation.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ISSUE_CATEGORIES.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3.5 rounded-xl border border-rule bg-paper-raised p-4 sm:p-5"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-strong">
                    <Icon size={17} />
                  </span>
                  <span className="text-sm font-semibold text-ink">{label}</span>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* HOW TO REPORT */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[60ch]">
              <DashEyebrow>How to report it</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Four fields, then it&rsquo;s in Durqo&rsquo;s hands.</h2>
            </div>
            <div className="flex flex-col gap-8">
              {REPORT_STEPS.map(({ n, title, body }, i) => (
                <div key={n} data-reveal className="flex gap-5 sm:gap-6">
                  <div className="flex flex-col items-center">
                    <span className="mono grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand-strong">
                      {n}
                    </span>
                    {i < REPORT_STEPS.length - 1 && <span className="mt-2 w-px flex-1 bg-rule" aria-hidden />}
                  </div>
                  <div className="pb-2">
                    <h4 className="mb-1.5 text-base font-semibold text-ink">{title}</h4>
                    <p className="max-w-[62ch] text-sm leading-relaxed text-ink-soft">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Inner>
        </Container>
      </section>

      {/* WHAT HAPPENS AFTER YOU REPORT */}
      <section className="border-b border-rule bg-brand-soft py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mx-auto max-w-[820px] rounded-2xl border border-rule bg-paper-raised p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-10">
              <div className="mx-auto max-w-[600px] text-center">
                <DashEyebrow center>The moment you submit</DashEyebrow>
                <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Everything freezes. Nothing auto-releases.</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  The room&rsquo;s status changes to &ldquo;Under Admin Review&rdquo; the instant you submit. Deal
                  Messages and Activity History stay open the whole time, so nothing about the deal goes quiet.
                </p>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-rule bg-paper-sunk p-6">
                  <ShieldCheck size={20} className="mb-2 text-brand-strong" />
                  <h4 className="text-base font-semibold text-ink">A person reviews it</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    A Durqo admin reads your explanation, the item history, and the messages between you and the
                    seller before deciding anything.
                  </p>
                </div>
                <div className="rounded-xl border border-rule bg-paper-sunk p-6">
                  <AlertTriangle size={20} className="mb-2 text-gold" />
                  <h4 className="text-base font-semibold text-ink">Funds stay put</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    Whether the seller is paid, refunded, or something in between waits entirely on the resolution
                    &mdash; nothing moves in the meantime.
                  </p>
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* FIVE OUTCOMES */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[64ch]">
              <DashEyebrow>The five possible outcomes</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">One of these, decided by an admin, explained to both sides.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Whichever way it goes, you and the seller are both emailed the resolution and a link back into the
                room &mdash; no outcome is decided quietly.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {OUTCOMES.map(({ icon: Icon, title, body }) => (
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
              A resolution records the decision itself - an actual refund or reversal still has to be processed on
              the payment rail you used, separately from this record.
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
                  <AlertTriangle size={20} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-ink sm:text-2xl">Dealing with an issue right now?</h2>
                  <p className="mt-1 max-w-[46ch] text-sm text-ink-soft">
                    Open your Transfer Room to report it, or check what stage your order is at.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/dashboard/buyer/transfers" size="lg">
                  My Transfers
                  <ArrowRight size={16} />
                </Button>
                <Button href="/after-you-pay" variant="secondary" size="lg">
                  After You Pay
                </Button>
              </div>
            </div>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
