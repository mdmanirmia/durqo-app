import type { Metadata } from "next";
import {
  ArrowRight,
  Package,
  PenLine,
  ShieldCheck,
  HeartHandshake,
  Tag,
  Gift,
  Truck,
  StickyNote,
  ListChecks,
  AlertTriangle,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

// Sep 17, 2026: new standalone explainer page, "What Is Included When You
// Buy a Digital Business in Durqo Marketplace?" — built the same way as
// /transfer-room, /listing-review, /after-you-pay and /report-an-issue:
// matches the existing guide-page visual system exactly (DashEyebrow/Inner
// helpers, section rhythm, page-scoped duplication per the established "no
// shared-component churn" convention). Cross-linked to /transfer-room
// rather than repeating its content.
//
// Every claim below is traced to the real, live listing/asset-list code,
// not invented copy:
// - The structured asset list (AssetListEditor.tsx, `listing_assets` table,
//   migration 036) IS "Assets included" on the listing page — not a second
//   thing under it. Per that component's own header comment: "100%
//   seller-authored — no category templates, no auto-suggestion, no
//   AI-derived asset list, ever," and it's "deliberately just four plain
//   text fields per row, no dropdowns or suggestions of any kind."
// - The four fields and their exact labels/placeholders (Asset name — "e.g.
//   Domain name"; What the buyer receives — "e.g. Full ownership transfer";
//   How it will be transferred — "e.g. Registrar transfer"; Note (optional)
//   — "Anything the buyer should know") come straight from
//   AssetListEditor.tsx's input labels and placeholders.
// - Mandatory since Sep 16, 2026 (claude/mandatory-sale-includes-assets-
//   addendum.md, PR #72): a listing can't be published or updated without
//   at least one named asset row — enforced in both the new-listing form
//   and the shared edit form, and server-side in updateListingFull()
//   (src/lib/actions/listing-edit.ts), not just client-side.
// - Confirmation is instant: saving a non-empty list confirms it the same
//   moment, in the same save — no separate "Confirm this list" step (that
//   button was removed 2026-09-12, per AssetListEditor.tsx's own comment).
//   The three real status states ("No assets listed yet — can't be sold" /
//   "Will confirm when you save" / "Confirmed") are quoted verbatim from
//   that component.
// - On the public listing page (src/app/listing/[slug]/page.tsx), the
//   "Sale Includes" SectionCard shows a free-text Assets/Post-sale support
//   summary plus, once assetsConfirmedAt is set, the full item-by-item
//   breakdown ("What's included, item by item") rendering each asset's
//   name, what the buyer receives, transfer method, and note exactly as
//   the seller entered them.
// - Post-sale support is a separate free-text field (seller/listings/new/
//   page.tsx, placeholder "e.g. 30 days of email support") — entirely the
//   seller's own words, not part of the structured asset list.
// - "Freezes into the buyer's Transfer Room when they pay" is
//   AssetListEditor.tsx's own stated description of what happens to this
//   exact list — matching /transfer-room's own sourcing on the checklist
//   (Mark Submitted / Mark Received / Approve Transfer) being built from
//   this same per-asset list, kept consistent rather than re-derived.
export const metadata: Metadata = {
  title: "What Is Included When You Buy a Digital Business in Durqo Marketplace? | Durqo",
  description:
    "How Durqo listings spell out exactly what a buyer gets, asset by asset — the four fields every listing must fill in, why it's mandatory, and how it becomes your Transfer Room checklist.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "What Is Included When You Buy a Digital Business in Durqo Marketplace?",
    description:
      "How Durqo listings spell out exactly what a buyer gets, asset by asset — before you ever pay for one.",
    url: "https://www.durqo.com/whats-included",
  },
  twitter: {
    card: "summary_large_image",
    title: "What Is Included When You Buy a Digital Business in Durqo Marketplace?",
    description:
      "How Durqo listings spell out exactly what a buyer gets, asset by asset — before you ever pay for one.",
  },
  alternates: { canonical: "https://www.durqo.com/whats-included" },
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
  { icon: Package, label: "Every listing must name at least one asset before it can even go live" },
  { icon: PenLine, label: "100% seller-authored — no templates, no AI-generated lists" },
  { icon: ListChecks, label: "The exact list you see is what freezes into your Transfer Room after you pay" },
  { icon: HeartHandshake, label: "Post-sale support terms are separate and spelled out in the seller's own words" },
];

const ASSET_FIELDS = [
  { icon: Tag, title: "Asset name", body: "What the item actually is — a domain, a codebase, a social account, a customer list. Example: “Domain name.”" },
  { icon: Gift, title: "What the buyer receives", body: "Exactly what changes hands for that asset. Example: “Full ownership transfer.”" },
  { icon: Truck, title: "How it will be transferred", body: "The actual handover mechanism. Example: “Registrar transfer.”" },
  { icon: StickyNote, title: "Note (optional)", body: "Anything else the buyer should know about that specific asset before they buy." },
] as const;

export default function WhatsIncludedPage() {
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
                What you&rsquo;re actually buying
              </DashEyebrow>
              <h1 className="text-4xl leading-[1.1] text-white sm:text-5xl">
                Every listing spells out <span className="text-brand">exactly what you get.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-[56ch] text-lg leading-relaxed text-white/70">
                No vague bundles. Before a listing can even go live, the seller has to break down what&rsquo;s
                included, asset by asset — written entirely in their own words.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button href="/buy" size="lg">
                  Browse listings
                  <ArrowRight size={16} />
                </Button>
                <Button href="/how-to-buy" variant="on-dark" size="lg">
                  How to buy
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

      {/* FOUR FIELDS PER ASSET */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[64ch]">
              <DashEyebrow>Four fields per asset</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">One row for every item in the sale.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                No dropdowns, no auto-suggestions, nothing generated for the seller. Each asset in the sale gets its
                own row with the same four plain-text fields.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {ASSET_FIELDS.map(({ icon: Icon, title, body }) => (
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

      {/* WHY IT'S MANDATORY */}
      <section className="border-b border-rule bg-paper-sunk py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-8 max-w-[64ch]">
              <DashEyebrow>Why it&rsquo;s mandatory</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">A listing can&rsquo;t go live without it.</h2>
            </div>
            <div className="rounded-xl border border-rule bg-paper-raised p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <AlertTriangle size={20} className="mt-0.5 shrink-0 text-gold" />
                <p className="text-sm leading-relaxed text-ink-soft">
                  A listing with zero named assets is blocked from publishing or being updated — by the seller or
                  by an admin — until at least one is added. The moment a save includes a named asset, the list
                  confirms instantly; there&rsquo;s no separate &ldquo;confirm this list&rdquo; step. Sellers see
                  exactly where their listing stands: &ldquo;No assets listed yet &mdash; can&rsquo;t be sold,&rdquo;
                  &ldquo;Will confirm when you save,&rdquo; or &ldquo;Confirmed.&rdquo;
                </p>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* WHERE YOU SEE IT */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mb-10 max-w-[64ch]">
              <DashEyebrow>Where you see it</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">On the listing itself, before you buy anything.</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                Every listing has a &ldquo;Sale Includes&rdquo; section with a quick Assets / Post-sale support
                summary, plus &mdash; once the seller has confirmed it &mdash; the full item-by-item breakdown
                underneath.
              </p>
            </div>
            <div className="rounded-xl border border-rule bg-paper-raised p-4 sm:p-6">
              <p className="mono mb-3 text-xs uppercase tracking-wide text-ink-faint">What&rsquo;s included, item by item</p>
              <ul className="flex flex-col gap-3">
                <li className="border-b border-rule pb-3">
                  <p className="text-sm font-semibold text-ink">Domain name</p>
                  <p className="mt-0.5 text-sm text-ink-soft">Full ownership transfer</p>
                  <p className="mt-0.5 text-xs text-ink-faint">Transfer method: Registrar transfer</p>
                </li>
                <li className="border-b border-rule pb-3">
                  <p className="text-sm font-semibold text-ink">Source code repository</p>
                  <p className="mt-0.5 text-sm text-ink-soft">Full access, transferred to the buyer&rsquo;s own account</p>
                  <p className="mt-0.5 text-xs text-ink-faint">Transfer method: Repository ownership transfer</p>
                </li>
                <li>
                  <p className="text-sm font-semibold text-ink">Social media accounts</p>
                  <p className="mt-0.5 text-sm text-ink-soft">Admin access handed over, then full ownership</p>
                  <p className="mt-0.5 text-xs text-ink-faint">Transfer method: Platform-specific account transfer</p>
                </li>
              </ul>
              <p className="mt-4 text-xs text-ink-faint">
                Illustrative example &mdash; the actual assets, wording, and count vary listing by listing, since
                every row is written by that listing&rsquo;s own seller.
              </p>
            </div>
          </Inner>
        </Container>
      </section>

      {/* POST-SALE SUPPORT */}
      <section className="border-b border-rule bg-brand-soft py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="mx-auto max-w-[820px] rounded-2xl border border-rule bg-paper-raised p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-10">
              <div className="mx-auto max-w-[600px] text-center">
                <DashEyebrow center>Separate from the asset list</DashEyebrow>
                <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Post-sale support, in the seller&rsquo;s own words.</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  A short free-text field the seller fills in themselves &mdash; for example, &ldquo;30 days of
                  email support.&rdquo; It&rsquo;s not part of the itemized asset list, and it&rsquo;s entirely up
                  to the seller what, if anything, they offer.
                </p>
              </div>
            </div>
          </Inner>
        </Container>
      </section>

      {/* FROM LISTING TO TRANSFER ROOM */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <Inner>
            <div className="flex items-start gap-5 rounded-xl border border-rule bg-paper-raised p-6 sm:p-8">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong">
                <ShieldCheck size={19} />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-ink">The same list becomes your checklist.</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  Once you pay, this exact asset list freezes into your private Transfer Room &mdash; the same
                  names, the same descriptions. Each one gets marked In Progress, then Submitted by the seller, and
                  Received by you, before you Approve Transfer and the deal is done.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  Want the full mechanics?{" "}
                  <a href="/transfer-room" className="font-semibold text-brand-strong hover:underline">
                    Read the Transfer Room guide →
                  </a>{" "}
                  or see{" "}
                  <a href="/report-an-issue" className="font-semibold text-brand-strong hover:underline">
                    what happens if something&rsquo;s missing or wrong →
                  </a>
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
                  <Package size={20} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-ink sm:text-2xl">Ready to see it on a real listing?</h2>
                  <p className="mt-1 max-w-[46ch] text-sm text-ink-soft">
                    Every published listing has its own Sale Includes section, right where you&rsquo;d expect it.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/buy" size="lg">
                  Browse listings
                  <ArrowRight size={16} />
                </Button>
                <Button href="/sell" variant="secondary" size="lg">
                  List your business
                </Button>
              </div>
            </div>
          </Inner>
        </Container>
      </section>
    </main>
  );
}
