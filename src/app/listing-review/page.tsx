import type { Metadata } from "next";
import { ArrowRight, FileCheck, BarChart3, Video, UserCheck, CheckCircle2, XCircle, ShieldCheck, Image as ImageIcon } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

// Sep 17, 2026: new standalone explainer page, "How Durqo Reviews a Digital
// Business Before It Goes Live" — built the same way as /transfer-room:
// matches the existing guide-page visual system exactly (DashEyebrow/Inner
// helpers, section rhythm, page-scoped duplication per the established
// "no shared-component churn" convention), and every claim is traced to
// the real, live listing-submission and admin-review code, not invented
// copy.
//
// Sources for every claim below:
// - A new listing is created with status "pending_review" and is not
//   visible on the public marketplace until an admin changes its status —
//   see src/app/dashboard/seller/listings/new/page.tsx (the insert) and
//   getMarketplaceListings()'s status gate in src/lib/data/listings.server.ts
//   (only "published"/"sold" show publicly).
// - What a seller submits for review: 12 months of income figures + Proof
//   of Income images ("bank statements, payment processor dashboards...
//   shown publicly on your listing so buyers can verify your income"),
//   monthly expenses, monetization methods, and — for categories with real
//   traffic/SEO data — Google Analytics stats + screenshots, Google Search
//   Console stats + screenshots, SEMrush and Ahrefs data, all shown
//   publicly on the listing (src/app/listing/[slug]/page.tsx renders each
//   via ProofGalleryButton). All copy/hints taken verbatim in substance
//   from src/app/dashboard/seller/listings/new/page.tsx.
// - The Loom video walkthrough is explicitly optional and, per its own
//   field hint, "Shared with our review team only, not shown publicly" —
//   the one submitted item that stays admin-only.
// - The GA access-confirmation checkbox ("I've added support@durqo.com as
//   a Viewer... Our team will check it before publishing") is the seller's
//   own self-declaration; "GA Verified" is a separate, admin-only signal
//   set after an admin actually reviews the property, per
//   AdminListingRow's own code comment in AdminListingsTable.tsx ("admin-
//   only, set after an admin actually logs into the GA property and
//   confirms the submitted numbers look real"). Three real states used
//   here: No access yet / Access confirmed / GA Verified, matching that
//   file's gaSection() exactly.
// - Admin's two decisions on a pending_review listing are literally
//   "Approve" (-> published, live) and "Reject" (-> archived) — see the
//   action buttons in AdminListingsTable.tsx and setListingStatus() in
//   dashboard/admin/actions.ts, which emails the seller either way
//   ("approved and is now live" / "wasn't approved... this time") and
//   allows a rejected listing to be restored later.
// - Seller identity verification (passport/national ID/driving license) is
//   a separate, independent admin-reviewed process at
//   dashboard/seller/verification, approved or rejected with a reason,
//   per claude/build-plan-and-decisions.md and
//   dashboard-audit-and-premium-polish-addendum.md — not merged with the
//   listing content review on this page, since the codebase itself keeps
//   them as two distinct flows.
// - "Verified" on public listing cards reflects status = published/sold
//   (the buy-page-redesign-addendum's documented decision — listings.
//   is_verified exists but is never set true by any code path, so the
//   admin-approval-to-publish gate is the real verification signal today).
// - Sep 17, 2026: confirmed directly by the Durqo team that the manual
//   check isn't GA-only — Search Console, SEMrush, and Ahrefs data
//   submitted by the seller are each manually checked by the review team
//   too, and a listing only goes live once everything submitted has been
//   checked this way (step 03/04 updated to say so explicitly).
export const metadata: Metadata = {
  title: "How Durqo Reviews a Digital Business Before It Goes Live | Durqo",
  description:
    "What a seller submits and what Durqo's team actually checks - proof of income, real traffic data, and identity verification - before a listing ever reaches a buyer.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "How Durqo Reviews a Digital Business Before It Goes Live",
    description:
      "What a seller submits and what Durqo's team actually checks before a listing ever reaches a buyer.",
    url: "https://www.durqo.com/listing-review",
  },
  twitter: {
    card: "summary_large_image",
    title: "How Durqo Reviews a Digital Business Before It Goes Live",
    description:
      "What a seller submits and what Durqo's team actually checks before a listing ever reaches a buyer.",
  },
  alternates: { canonical: "https://www.durqo.com/listing-review" },
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
  { icon: ShieldCheck, label: "No listing goes live without admin approval" },
  { icon: FileCheck, label: "Real proof of income, not just a claimed number" },
  { icon: BarChart3, label: "Traffic and SEO data cross-checked at the source" },
  { icon: UserCheck, label: "Seller identity checked, independently of the listing" },
];

const SUBMISSION_ITEMS = [
  {
    icon: FileCheck,
    title: "Proof of Income",
    body: "12 months of income figures, plus images - bank statements, payment processor dashboards and similar - shown right on the listing so buyers can check it themselves.",
  },
  {
    icon: BarChart3,
    title: "Traffic & SEO data",
    body: "For categories where it applies: Google Analytics and Search Console stats with screenshots, plus SEMrush and Ahrefs data, all shown publicly alongside the listing.",
  },
  {
    icon: ImageIcon,
    title: "Analytics account access",
    body: "The seller adds support@durqo.com as a Viewer on the real Google Analytics property (and Restricted access on Search Console) so the numbers can actually be checked, not just screenshotted.",
  },
  {
    icon: Video,
    title: "An optional Loom walkthrough",
    body: "A short screen recording of the live income dashboard. Seen only by Durqo's review team, never shown publicly - harder to fake than a static image.",
  },
] as const;

const REVIEW_STEPS = [
  {
    n: "01",
    title: "Seller submits the listing",
    body: "Business overview, financials, monetization, and (where relevant) traffic data - with the images and account access described above.",
  },
  {
    n: "02",
    title: "It enters review, invisible to buyers",
    body: "The listing is created as pending review. It doesn’t appear on the marketplace, in search, or anywhere a buyer can find it yet.",
  },
  {
    n: "03",
    title: "Durqo's team checks the numbers",
    body: "Where analytics access was granted, an admin signs in to the real Google Analytics property and compares it against what was submitted. Search Console, SEMrush, and Ahrefs data is checked by the team the same way - every figure is manually reviewed, not just glanced at.",
  },
  {
    n: "04",
    title: "Approved and live, or sent back",
    body: "Only once everything has been manually checked does an admin make the call: approve - the listing publishes immediately and the seller is emailed - or reject, which archives the listing and emails the seller so it can be corrected and resubmitted.",
  },
] as const;

export default function ListingReviewPage() {
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
                Listing review
              </DashEyebrow>
              <h1 className="text-4xl leading-[1.1] text-white sm:text-5xl">
                Every listing is checked <span className="text-brand">before a buyer ever sees it.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-[56ch] text-lg leading-relaxed text-white/70">
                Anyone can write a good description. Here&rsquo;s what a seller actually has to submit, and what
                Durqo&rsquo;s team checks, before a business is allowed to go live on the marketplace.
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

      {/* WHAT A SELLER SUBMITS */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[64ch]">
              <DashEyebrow>What a seller submits</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Not just a description and a price.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                A listing isn&rsquo;t just typed in and published. Before it&rsquo;s even reviewed, a seller has to
                provide the evidence a buyer would actually want to see.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {SUBMISSION_ITEMS.map(({ icon: Icon, title, body }) => (
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

      {/* REVIEW STEPS */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[60ch]">
              <DashEyebrow>The review process</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">From submission to going live.</h2>
            </div>
            <div className="flex flex-col gap-8">
              {REVIEW_STEPS.map(({ n, title, body }, i) => (
                <div key={n} data-reveal className="flex gap-5 sm:gap-6">
                  <div className="flex flex-col items-center">
                    <span className="mono grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand-strong">
                      {n}
                    </span>
                    {i < REVIEW_STEPS.length - 1 && <span className="mt-2 w-px flex-1 bg-rule" aria-hidden />}
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

      {/* APPROVE / REJECT SPOTLIGHT */}
      <section className="border-b border-rule bg-brand-soft py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mx-auto max-w-[820px] rounded-2xl border border-rule bg-paper-raised p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-10">
              <div className="mx-auto max-w-[600px] text-center">
                <DashEyebrow center>One of two outcomes</DashEyebrow>
                <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Approved, or sent back.</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  There&rsquo;s no in-between state where a half-checked listing quietly appears. An admin makes an
                  explicit call on every submission.
                </p>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-rule bg-paper-sunk p-6">
                  <CheckCircle2 size={20} className="mb-2 text-brand-strong" />
                  <h4 className="text-base font-semibold text-ink">Approved</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    The listing publishes immediately and appears on the marketplace. The seller gets an email
                    confirming it&rsquo;s live.
                  </p>
                </div>
                <div className="rounded-xl border border-rule bg-paper-sunk p-6">
                  <XCircle size={20} className="mb-2 text-danger" />
                  <h4 className="text-base font-semibold text-ink">Rejected</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    The listing is archived and never reaches the marketplace. The seller is emailed, and can fix
                    the issue and resubmit - nothing is deleted outright.
                  </p>
                </div>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* TWO SEPARATE CHECKS */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[64ch]">
              <DashEyebrow>Two separate checks</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">The listing and the seller are verified independently.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Approving a listing&rsquo;s numbers doesn&rsquo;t say anything about who&rsquo;s selling it &mdash;
                that&rsquo;s checked on its own.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-rule bg-paper-raised p-6 sm:p-8">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                  <BarChart3 size={19} />
                </span>
                <h4 className="text-base font-semibold text-ink">Listing review</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  Covers the business itself: is the income real, does the traffic data hold up, is what&rsquo;s
                  being sold clearly described. This is what makes a listing go live.
                </p>
              </div>
              <div className="rounded-xl border border-rule bg-paper-raised p-6 sm:p-8">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                  <UserCheck size={19} />
                </span>
                <h4 className="text-base font-semibold text-ink">Seller identity verification</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  A separate check of the seller&rsquo;s own identity documents (passport, national ID or driving
                  licence), reviewed and approved or rejected by Durqo&rsquo;s team, shown as a badge on their
                  profile.
                </p>
              </div>
            </div>
            <p className="mt-6 max-w-[70ch] text-xs leading-relaxed text-ink-faint">
              A &ldquo;Verified&rdquo; badge on a listing card reflects the listing having cleared this review and
              being live on the marketplace &mdash; every published listing has already passed this gate before a
              buyer ever sees it.
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
                  <FileCheck size={20} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-ink sm:text-2xl">Ready to list your business?</h2>
                  <p className="mt-1 max-w-[46ch] text-sm text-ink-soft">
                    See exactly how to prepare your listing for review, step by step.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/how-to-sell" size="lg">
                  How to sell
                  <ArrowRight size={16} />
                </Button>
                <Button href="/how-to-buy" variant="secondary" size="lg">
                  How to buy
                </Button>
              </div>
            </div>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
