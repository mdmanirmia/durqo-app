import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Activity,
  AlertTriangle,
  Boxes,
  Calendar,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  Compass,
  DollarSign,
  FileSearch,
  FileText,
  Globe,
  Handshake,
  Info,
  Landmark,
  Layers,
  Link as LinkIcon,
  Lock,
  Package,
  Repeat,
  Rocket as RocketGlyph,
  Scale,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  TrendingUp,
  Users,
  Wallet,
  PlaySquare,
} from "lucide-react";
import Container from "@/components/ui/Container";
import GroupedFaq, { type FaqGroup } from "@/components/GroupedFaq";
import { BkashIcon } from "@/components/icons/PaymentIcons";
import { SUCCESS_FEE_TIERS, fmtRate } from "@/lib/fees";
import TrackedCta, { ArticleViewTracker } from "./CtaTracking";

// Sep 27, 2026 build — the Bangladesh seller-acquisition content page from
// the "DURQO — BANGLADESH SELLER ACQUISITION CONTENT" brief (see claude/
// bangladesh-seller-acquisition-page-and-ad-copy-addendum.md for the full
// brief, the analytics wiring this page depends on, and the accompanying
// Facebook/Instagram ad copy). Built as the landing destination for a
// Facebook/Instagram ad campaign targeting the funnel: Ad Click -> Article
// View -> Sell CTA Click -> Listing Started -> Listing Submitted -> Listing
// Approved.
//
// Distinct from two existing pages it sits next to:
//   - /how-to-sell-a-website-in-bangladesh: Websites category only.
//   - /how-to-sell: general seller guide, not Bangladesh-specific and not
//     built for a paid-ad funnel (no CTA-level or article-view tracking).
// This page covers every digital business category Durqo lists (websites,
// SaaS, e-commerce, apps, YouTube channels, domains, and more), written for
// a founder in Bangladesh deciding whether and how to sell.
//
// Every claim on this page is either a real, current fact about how Durqo
// works (its 8-step listing/review/transfer process, its existing BDT
// payout page, its existing FAQ/valuation/listing-review pages, "free to
// list with no upfront charge" — the same claim already made on /sell,
// /how-to-sell and /seller-faq) or a general, unattributed statement about
// how buyers evaluate businesses — never a specific number, buyer count,
// transaction count, testimonial, or outcome guarantee. Per the brief's own
// implementation rules, this page deliberately does NOT: state or imply
// Durqo guarantees a buyer, a sale, a valuation, a price, or a transaction
// timeframe; quote fees, BDT payment methods, or verification rules inline
// (it links to /buy-and-sell-digital-businesses-in-bdt, /seller-payouts and
// /listing-review instead, so this page never drifts out of sync with
// those); or invent usage statistics.
//
// Sep 27, 2026 revision: redesigned after direct feedback that the first
// version read as visually flat next to sibling guide pages. Rebuilt the
// hero as a two-column layout with an "Overview" info panel (matching the
// pattern already established on /how-to-sell-a-website-in-bangladesh and
// /sell), converted the flat bullet/number-square sections into icon-carded
// grids and a connected vertical step timeline (matching /how-to-sell's own
// 8-step STEPS pattern), and turned the bare BDT internal link into a
// resource card. No new facts were introduced — every added line (the
// trust-row items, the overview panel's copy) restates something already
// said elsewhere on this same page or already established sitewide.
//
// Not added to the Footer's "Resources" column, matching how every other
// page in this same Sep 22, 2026 batch of keyword/campaign-targeted guide
// pages (how-to-buy-a-website-in-bangladesh, how-to-sell-a-website-in-
// bangladesh, how-much-is-a-website-worth-in-bangladesh, online-businesses-
// for-sale-in-bangladesh, website-due-diligence-checklist-for-buyers) was
// also left out of it — these are meant to be found via search, the
// sitemap, and contextual internal links, not to permanently widen the
// sitewide footer. It IS added to sitemap.ts, following that same batch's
// precedent (see sitemap.ts's own Sep 22, 2026 entries).
//
// Oct 3, 2026 revision: merchant asked for more information and an updated
// design, noting this specific page gets heavy Bangladeshi traffic ("beshi
// bangladeshi manush eita porteche"). Clarified scope before building (see
// claude/bangladesh-seller-acquisition-page-and-ad-copy-addendum.md): add a
// Marketplace Fees section, a Seller FAQ section, a Stats strip + BDT payout
// showcase, and a Transfer Room walkthrough, plus light design polish
// (icon-badge headers, hover states, alternating section backgrounds)
// already proven elsewhere on the site — not a structural redesign. Every
// new fact is sourced from, and kept in sync with, the same live modules
// and pages the rest of the site already uses, never invented:
//   - Marketplace Fees: SUCCESS_FEE_TIERS/fmtRate from src/lib/fees.ts, the
//     same single source of truth /durqo-bangladesh and /buy-and-sell-
//     digital-businesses-in-bdt already render. This page previously
//     deliberately omitted the exact rates in favor of linking out; the
//     merchant's own "more information" request is read as authorization to
//     show the schedule now that it's already public on sibling pages.
//   - Seller FAQ: the new FAQ_GROUPS below are pulled near-verbatim from the
//     live /seller-faq page's "Fees & getting paid" and "Buyers & disputes"
//     groups, trimmed to the questions a Bangladeshi seller is most likely
//     to ask (fees, BDT withdrawal methods and caps, payout timing, the
//     Transfer Room, disputes) — no new claims.
//   - Stats strip: "16 digital business categories" and the 7-day buyer
//     inspection window match src/lib/categories.ts and /transfer-room
//     (also already cited on /durqo-bangladesh); "4 local BDT payout
//     methods" and "Free to list" match this page's own existing claims.
//   - BDT payout showcase: bank transfer/bKash/Nagad/Rocket, same four
//     seller payout methods and icon/tint treatment already used on
//     /durqo-bangladesh (BkashIcon from PaymentIcons.tsx, Nagad/Rocket as
//     tinted lucide glyphs) — this page's own hero and BDT resource link
//     already named these methods in prose; this only adds the visual badges.
//   - Transfer Room walkthrough: the four-step sequence (Mark In Progress /
//     Mark Submitted / Buyer Marks Received / Buyer Approves or Reports an
//     Issue) is copied from /transfer-room's own real action labels and
//     TRANSFER_FLOW, the identical steps already used on /durqo-bangladesh's
//     own "Inside the Transfer Room" section — not new copy.
// Background alternation was rebalanced after the inserts: "Buyers Outside
// Bangladesh" moved from paper-sunk to the default background, and "How
// Durqo Works" moved from the default background to paper-sunk, so no two
// consecutive sections still share a background.
//
// Oct 3, 2026 revision (scope-tightening pass, same day): direct feedback
// that content had drifted from the page's own title and that the design
// had become messy with gaps in several places. Three concrete fixes:
//   - Removed the Stats Strip section outright (merchant pointed at it
//     specifically and said it was not needed).
//   - Removed the standalone "Inside the Transfer Room" walkthrough. It
//     duplicated Step 07 of "How Selling on Durqo Works" below and the
//     FAQ's own "What exactly is the Transfer Room?" answer, so cutting it
//     tightens the page without losing any information — the FAQ answer and
//     the /transfer-room link (now surfaced from Related Reading instead)
//     still cover it.
//   - Merged "Your buyer does not have to be in Bangladesh" into "Selling a
//     digital business from Bangladesh": both were short, Bangladesh-
//     specific asides (reach, then payments) sitting three sections apart,
//     and the first read as a thin, mostly-empty section on its own. One
//     combined section reads as a single BD-specific logistics section
//     instead of two half-finished ones.
// Reordered the remaining sections into a single pass that reads start to
// finish as: is this sellable -> why people sell -> what determines value
// -> think like a buyer -> prepare -> seller checklist -> (CTA) -> price it
// -> what it costs -> how the process works -> build buyer trust -> selling
// from Bangladesh specifically -> FAQ. The Seller Checklist moved up to sit
// directly after Prepare Your Business (same "getting ready" cluster,
// instead of being stranded near the bottom of the page), and the mid-page
// CTA moved with it to mark the break between preparing and pricing/process.
// No facts changed — only section order, section count, and one bug fix
// below.
// Background alternation was recalculated end to end for the new order
// (Seller Checklist, Asking Price, Marketplace Fees, Building Buyer
// Confidence, Selling from Bangladesh, and Related Reading all changed
// which of paper-sunk/default they use) so no two consecutive sections
// still share a background.
// Also fixed a real layout bug in the Marketplace Fees footnote: it used
// `flex` directly on a `<p>` that mixed plain text with an inline `<Link>`,
// which splits each text/link run into its own flex column instead of
// letting it wrap as one sentence — this is what rendered as the broken,
// gappy "Applies to the full final sale price. See / Buy & Sell in BDT /
// for payout details." layout. Fixed by switching to the same div-wraps-
// icon-and-paragraph structure the working `InfoNote` component already
// uses elsewhere on this page.
//
// Oct 4, 2026 revision: merchant feedback that the content "wasn't valuable
// enough" and that the design had visible gaps on the right side in several
// places. Two kinds of changes:
//   Content — added substance that teaches something, rather than more
//   restated generalities, while staying inside this page's own no-invented-
//   numbers rule:
//     - New "Common Mistakes to Avoid" section (between What Determines
//       Value and Think Like a Buyer): six concrete, generalized mistakes
//       sellers commonly make, ending with a line tying back to Durqo's
//       listing review process. General M&A/marketplace knowledge, not a
//       Durqo-specific claim.
//     - Set a Realistic Asking Price now explains Seller's Discretionary
//       Earnings (SDE) and how profit multiples are commonly used as a
//       starting reference point, with explicit, repeated caveats that any
//       multiple cited is a rough industry reference only — never framed as
//       what a specific business will sell for, and still points to
//       /valuation for an actual estimate. General industry knowledge
//       (commonly cited in M&A/marketplace literature), not a Durqo number.
//     - Step 07 ("Transfer the Business") and Step 08 ("Complete the
//       Transaction") now state the real payment-protection mechanic
//       instead of generic process language: the buyer's payment is held by
//       Durqo or by Escrow.com as a neutral third party and is not released
//       until the buyer approves the transfer in the Transfer Room. Sourced
//       from the live /after-you-pay page and the Transfer Room's own
//       release logic — not new copy, surfaced here as a concrete "how it
//       works" answer instead of a duplicate section (the FAQ's "What
//       exactly is the Transfer Room?" answer already covers the mechanics
//       in detail and was deliberately not restated here).
//     - Hero's "Selling Overview" panel gained a third item (payment
//       protection) restating the same escrow fact, to balance the panel's
//       height against the left column (see design fixes below).
//   Design — three concrete right-side-gap defects found via a visual
//   audit, each fixed directly:
//     - Hero: the right "Selling Overview" card ended noticeably shorter
//       than the left column at desktop widths. Fixed by adding the third
//       item above.
//     - Seller Checklist: 11 items in a 2-column grid left an orphaned gap
//       in the last row. Added a 12th item (offering a short handover
//       period) so the grid is an even 2x6.
//     - How Selling on Durqo Works: the worst offender. Its 8 steps lived in
//       a single narrow left-aligned vertical timeline (numbered circle +
//       connector line + text column) inside the full 1040px container,
//       leaving the entire right half of a 1200px+ tall section empty.
//       Rebuilt as a 2-column icon-badge card grid (same card shape as the
//       Why Founders Sell / Prepare Your Business sections elsewhere on
//       this page) so all 8 steps fill the full width evenly.
// Inserting the new Common Mistakes section shifted every later section's
// background by one position; background alternation was recalculated end
// to end from that point on (What Buyers Want to Know, Prepare Your
// Business, Seller Checklist, Asking Price, Marketplace Fees, How Durqo
// Works, Building Buyer Confidence, Selling from Bangladesh, FAQ and
// Related Reading all flipped paper-sunk/default) so no two consecutive
// sections still share a background.
const META_TITLE = "How to Sell an Online Business from Bangladesh | Durqo";
const META_DESCRIPTION =
  "A practical guide for entrepreneurs in Bangladesh: how to prepare a website, SaaS, e-commerce, app or other digital business for sale, what buyers look for, and how to list it on Durqo.";

export const metadata: Metadata = {
  title: META_TITLE,
  description: META_DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: META_TITLE,
    description: META_DESCRIPTION,
    url: "https://www.durqo.com/sell-your-online-business-bangladesh",
  },
  twitter: { card: "summary_large_image", title: META_TITLE, description: META_DESCRIPTION },
  alternates: {
