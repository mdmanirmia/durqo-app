import Link from "next/link";
import type { Metadata } from "next";
import {
  ShieldCheck,
  LineChart,
  UserCheck,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Check,
  Search,
  Package,
  Coins,
  LayoutGrid,
  Users,
} from "lucide-react";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { getPublishedListings, getSellerAndBuyerCount } from "@/lib/data/listings.server";
import { SUCCESS_FEE_TIERS, fmtRate } from "@/lib/fees";
import ListingCard from "@/components/ListingCard";
import WishlistButton from "@/components/WishlistButton";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { fmtUSD } from "@/lib/format";

// Sep 8, 2026 (technical SEO pass, Section 3): explicit homepage metadata
// rather than relying on the root layout's fallback title/description —
// this is the one page whose title must match the spec's exact string
// (a plain hyphen, not the layout's em dash), so it needs its own
// unconditional `metadata` export instead of the layout's `title.template`
// merging in. Visible content (the H1, Sep 16 2026: "Buy what's next. Sell
// what you've built.") is unchanged here — this only affects the <head>
// tag and the browser tab / link-preview text.
export const metadata: Metadata = {
  title: "Durqo - Buy and Sell Digital Businesses",
  description:
    "Discover reviewed websites, SaaS products, apps, e-commerce stores and other digital businesses for sale. Buy confidently or list your business on Durqo.",
  alternates: { canonical: "https://www.durqo.com/" },
  robots: { index: true, follow: true, "max-image-preview": "large" },
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "Durqo - Buy and Sell Digital Businesses",
    description: "Discover reviewed websites, SaaS products, apps, e-commerce stores and other digital businesses for sale.",
    url: "https://www.durqo.com/",
    images: [
      {
        url: "/og/durqo-home.jpg",
        width: 1200,
        height: 630,
        alt: "Durqo marketplace for buying and selling digital businesses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Durqo - Buy and Sell Digital Businesses",
    description: "Discover reviewed digital businesses or list your business for sale on Durqo.",
    images: ["/og/durqo-home.jpg"],
  },
};

// Organization + WebSite JSON-LD (Section 13) — server-rendered on the
// homepage only, using only information that's already publicly visible
// elsewhere on the site: the support email appears on /contact, and the
// Facebook/Instagram links are the same official, already-live ones in the
// site footer. No private data, no invented fields. SearchAction points at
// /buy?q=..., which is a real, stable, crawlable URL
// (src/lib/marketplace-filters.ts reads the `q` param).
//
// Sep 14, 2026 (SEO fix): deliberately no `address` field. Durqo is an
// online marketplace with no physical storefront — declaring a
// schema.org PostalAddress here is exactly the kind of signal Google can
// use to auto-generate an unwanted "local business" Knowledge Panel /
// Business Profile entry (this is what produced the stray "Durqo Limited"
// / "Durqo Marketplace Inc." Google Maps listings that had to be manually
// removed). The correspondence address still appears as plain text on
// /contact — that's fine; it's the structured-data declaration of a
// physical place that caused the problem, not the address being visible
// on the page.
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Durqo",
  url: "https://www.durqo.com",
  logo: "https://www.durqo.com/android-chrome-512x512.png",
  email: "support@durqo.com",
  sameAs: ["https://www.facebook.com/Durqo", "https://www.instagram.com/durqomarketplace/"],
};

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Durqo",
  url: "https://www.durqo.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://www.durqo.com/buy?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

// Small dash-prefixed eyebrow used throughout this redesign (Sep 6 2026),
// distinct from the shared pill-style `.eyebrow` class (globals.css) that
// SectionHeader still renders elsewhere in the app (e.g. /about) — kept as
// a local, page-scoped helper rather than changing that shared component/
// class, so no other page's heading style shifts as a side effect.
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

// Compact "$1.4M" style formatter for the stats bar — deliberately without
// a trailing "+" (unlike the design reference): rounding to one decimal
// already makes this an approximation, and adding "+" on top would imply
// "at least this much" when a listed value can just as easily round down.
function fmtCompactUSD(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return fmtUSD(n);
}

// A small number of hand-written, honest excerpts for specific listings
// whose full overview reads awkwardly once cut to two lines — keyed by
// title, and only ever used as an override of the real overview text, never
// invented content. Anything not in this map falls back to `excerpt()`
// below, which trims the listing's own real overview to a clean word
// boundary (with CSS line-clamp-2 kept as a defensive fallback in the JSX
// in case a browser renders the trimmed text wider than expected).
const SPOTLIGHT_EXCERPTS: Record<string, string> = {
  "PixelMind AI Design Studio": "AI-powered platform for creating on-brand marketing and social media assets.",
};

function excerpt(text: string, maxChars = 108): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

// The hero's review-process summary — one honest line describing Durqo's
// marketplace-wide policy (see CONFIDENCE below), rendered as a single
// nowrap line on wider screens and as an intentional 2-column grid (never
// a lone wrapped item) below that, per the Sep 6 2026 refinement pass.
const REVIEW_ITEMS = ["Listing reviewed", "Performance checked", "Seller verification available"];

// Sep 13, 2026: "Complete the transfer" now names the real Asset Transfer
// Room system (live for every payment channel — see
// claude/asset-transfer-room-feasibility-addendum.md) instead of the vague
// "move assets through our secure process" placeholder, so this homepage
// summary stays consistent with /how-to-buy, /how-to-sell, /payments and
// /terms.
const STEPS = [
  { icon: Search, title: "Explore or list", body: "Browse reviewed listings by category, or submit your own business for review." },
  { icon: LineChart, title: "Review and connect", body: "Evaluate performance data, ask questions and connect directly with the seller." },
  { icon: CheckCircle2, title: "Complete the transfer", body: "Once payment is made, buyer and seller move through a shared Transfer Room, where each asset is handed over, confirmed, and approved before ownership changes hands." },
];

// Oct 5, 2026 copy revision (mockup-matched redesign): titles/bodies
// rewritten to match the approved mockup. Every claim stays hedged to a
// real, available process rather than a completed-status guarantee —
// "Supported listings can display..." (not every listing has analytics
// connected; see the real GA-connect flow at
// /dashboard/seller/listings/ga-connect), and "Identity and payout
// verification help protect..." describes the real KYC + payout
// name-match checks (see /dashboard/seller/verification) without implying
// every seller has completed them.
const CONFIDENCE = [
  { icon: ShieldCheck, title: "Listing review", body: "Listings are reviewed for completeness, clarity and compliance before publication." },
  { icon: UserCheck, title: "Seller verification", body: "Identity and payout verification help protect seller accounts and withdrawals." },
  { icon: LineChart, title: "Connected performance data", body: "Supported listings can display data verified through connected analytics sources." },
  { icon: MessageSquare, title: "Private communication", body: "Buyers and sellers can ask questions and keep important deal discussions connected to Durqo." },
];

// The assurance panel's bottom row deliberately says "Identity verification"
// (the available process) rather than "Seller verified" (a completed-status
// claim) — this is a general marketing panel, not scoped to any one logged-in
// seller's actual verification status, so it must never imply every seller
// on the marketplace already carries a Verified badge.
const REVIEW_STANDARD_ITEMS = ["Listings reviewed", "Identity verification", "Connected data"];

// Sep 2026: the stats bar (Active listings / Listed value / Sellers & Buyers)
// and the featured spotlight below were silently going stale — `next build`
// was prerendering "/" as a fully static route (no `searchParams`/other
// dynamic API forced it dynamic the way `/buy` and `/listing/[slug]` already
// are), so every visitor saw whatever numbers existed at the last deploy
// until one of the handful of `revalidatePath("/")` calls elsewhere in the
// app happened to fire. Forcing this route dynamic makes it recompute from
// the live database on every request instead, matching `/buy` and
// `/listing/[slug]`'s existing behavior — the safer fix than trying to find
// and patch every mutation path that can change these counts.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [listings, sellerAndBuyerCount] = await Promise.all([getPublishedListings(), getSellerAndBuyerCount()]);

  // "Businesses gaining attention" — Sep 16 2026 change ("jei gulor price or
  // profit sob theke beshi": show the listings whose price or profit is
  // highest, not just whichever 3 were published most recently). Ranked by
  // monthly profit first, since that's the stronger buyer-attention signal,
  // falling back to price when profit is tied or unrecorded (e.g. a bare
  // Domains listing) — same profit formula ListingCard/the hero spotlight
  // already use, so "Profit/mo" on these cards matches this ranking.
  const featuredProfit = (l: (typeof listings)[number]) => {
    const revenue = l.quickStats.monthly_income as number | undefined;
    if (revenue === undefined) return undefined;
    const expenseTotal = l.monthlyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return l.monthlyExpenses.length > 0 ? revenue - expenseTotal : revenue;
  };
  const featured = [...listings]
    .sort((a, b) => {
      const profitDiff = (featuredProfit(b) ?? -1) - (featuredProfit(a) ?? -1);
      if (profitDiff !== 0) return profitDiff;
      return (b.discountedPrice ?? b.price) - (a.discountedPrice ?? a.price);
    })
    .slice(0, 3);

  // getPublishedListings() intentionally includes sold listings too (so
  // Sold badges/social proof can render on cards/tables sitewide — see that
  // function's own comment). But every stats-bar number below is meant to
  // describe the catalog a visitor can actually buy from right now, which
  // is exactly what /buy's default "Available" filter shows (Sep 2026: a
  // seller reported the homepage's "14 Active listings" not matching /buy's
  // "11 listings" — the gap was these 3 already-sold rows). So every count
  // and sum below is computed from `activeListings`, not the raw fetch —
  // "Active listings," per-category tallies, listed value, and verified
  // sellers all stay consistent with what /buy itself shows.
  const activeListings = listings.filter((l) => l.status !== "sold");

  // Real per-category counts, computed from the same active set as the
  // stats bar — no placeholder numbers, per the design brief, and no
  // "3 listings" tile that turns into 2 the moment you click through to
  // /buy's (published-only-by-default) category view.
  const categoryCounts = new Map<string, number>();
  for (const l of activeListings) {
    categoryCounts.set(l.categoryId, (categoryCounts.get(l.categoryId) ?? 0) + 1);
  }
  const totalListedValue = activeListings.reduce((sum, l) => sum + (l.discountedPrice ?? l.price), 0);

  // Categories sorted by how much real inventory they carry — both the
  // "Find your kind of opportunity" row (top 6) and the swap-in stat below
  // lean on this real ordering rather than a fixed/declared order.
  const categoriesByActivity = [...CATEGORIES].sort(
    (a, b) => (categoryCounts.get(b.id) ?? 0) - (categoryCounts.get(a.id) ?? 0)
  );
  const topCategories = categoriesByActivity.slice(0, 6);
  const activeCategoryCount = categoriesByActivity.filter((c) => (categoryCounts.get(c.id) ?? 0) > 0).length;

  // Stats-bar 4th slot: Sep 17 2026 change ("Eita hobe Active Sellers and
  // eitar value hobe marketplace e total seller er soman" — this tile
  // should read "Active Sellers" and its value should equal the
  // marketplace's total seller count). Replaced the old "Verified
  // sellers" tile (which only counted `is_verified = true` profiles, often
  // 0 since verification is opt-in) with a platform-wide registered-user
  // count, regardless of verification status or whether they have a live
  // listing yet — shown as-is, with no zero-count fallback, since it's now
  // an honest headline number rather than a rare-to-be-zero trust stat.
  //
  // Sep 21 2026 follow-up ("eitar name change kore Sellers & Buyers diba.
  // eita total buyer and seller er soman hobe" — rename the tile to
  // "Sellers & Buyers" and its value should equal the combined total of
  // buyers and sellers): swapped the seller-only count for
  // `sellerAndBuyerCount` (`getSellerAndBuyerCount()`, profiles.role in
  // ("buyer","seller")) and dropped the singular "Active Seller" form —
  // the combined total realistically never lands on exactly 1.
  const activeSellersStat = {
    value: String(sellerAndBuyerCount),
    label: "Sellers & Buyers",
  };

  // Featured opportunity (hero spotlight): Sep 16 2026 change ("emon list
  // dekhabe jeitar revenue growth sob theke beshi but not sold, or income
  // sob theke beshi but not sold" — never spotlight a listing that's
  // already sold; among the live ones, prefer whichever is growing
  // fastest, using the same real percentage from a listing's own recorded
  // monthly income history that the trend badge below computes). Falls
  // back to highest recorded income when no live listing has enough
  // monthly history yet to compute a growth trend, and to price only as a
  // last tiebreak so the pick stays deterministic.
  const liveListings = listings.filter((l) => l.status !== "sold");
  const spotlightGrowth = (l: (typeof listings)[number]) => {
    const series = l.monthlyStats.map((m) => m.income).filter((v): v is number => typeof v === "number");
    return series.length >= 2 && series[0] > 0 ? (series[series.length - 1] - series[0]) / series[0] : undefined;
  };
  const spotlightIncome = (l: (typeof listings)[number]) => {
    const income = l.quickStats.monthly_income;
    return typeof income === "number" && income > 0 ? income : undefined;
  };
  const spotlightPool = liveListings.length > 0 ? liveListings : listings;
  const spotlight = [...spotlightPool].sort((a, b) => {
    const growthDiff = (spotlightGrowth(b) ?? -Infinity) - (spotlightGrowth(a) ?? -Infinity);
    if (growthDiff !== 0) return growthDiff;
    const incomeDiff = (spotlightIncome(b) ?? -Infinity) - (spotlightIncome(a) ?? -Infinity);
    if (incomeDiff !== 0) return incomeDiff;
    return (b.discountedPrice ?? b.price) - (a.discountedPrice ?? a.price);
  })[0];

  const spotlightRevenue = (spotlight?.quickStats.monthly_income as number | undefined) ?? 0;
  const spotlightExpenseTotal = spotlight
    ? spotlight.monthlyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    : 0;
  const spotlightProfit =
    spotlight && spotlight.monthlyExpenses.length > 0 ? spotlightRevenue - spotlightExpenseTotal : spotlightRevenue;

  // Revenue-trend badge: a real percentage computed from the spotlight
  // listing's own monthly stats (first vs. most recent data point) — never
  // shown when there isn't enough real data to compute it honestly.
  const spotlightSeries = (spotlight?.monthlyStats ?? [])
    .map((m) => m.income)
    .filter((v): v is number => typeof v === "number");
  const spotlightTrendPercent =
    spotlightSeries.length >= 2 && spotlightSeries[0] > 0
      ? Math.round(((spotlightSeries[spotlightSeries.length - 1] - spotlightSeries[0]) / spotlightSeries[0]) * 100)
      : null;
  const sparkPoints = spotlightSeries.slice(-8);
  const sparkMax = sparkPoints.length ? Math.max(...sparkPoints, 1) : 1;
  // Proof of Income is entered as a 12-month series across this project's
  // seller forms, so "Last 12 months" is accurate for a normal listing —
  // but if a listing has a shorter recorded history for any reason, say so
  // honestly instead of claiming a span that isn't really there.
  const spotlightPeriodLabel = spotlightSeries.length >= 10 ? "Last 12 months" : "Recorded history";

  // Sep 6 2026: "Business types" used to be CATEGORIES.length (every category
  // the app supports in code, currently 16) regardless of whether any of
  // them actually had real listings — which read as inflated/misleading on
  // a catalog where only Websites and E-commerce have real inventory so far.
  // Switched to activeCategoryCount (computed above, same real per-category
  // tallies the "Find your kind of opportunity" row already uses), so this
  // number honestly reflects how many categories a visitor can actually buy
  // from right now, and grows on its own as more categories get listings.
  const statsBar = [
    { icon: Package, value: String(activeListings.length), label: "Active listings" },
    { icon: Coins, value: fmtCompactUSD(totalListedValue), label: "Listed value" },
    { icon: LayoutGrid, value: String(activeCategoryCount), label: "Business types" },
    { icon: Users, value: activeSellersStat.value, label: activeSellersStat.label },
  ];

  const spotlightDescription = spotlight
    ? SPOTLIGHT_EXCERPTS[spotlight.title] ?? excerpt(spotlight.overview || "Not disclosed")
    : "";

  return (
    <main>
      {/* Structured data only — no visible output. See Section 13. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
      />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-rule bg-paper-sunk py-14 sm:py-20">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
          aria-hidden
        />
        <Container className="relative">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div>
              <DashEyebrow>The marketplace for digital businesses</DashEyebrow>

              <h1 className="text-4xl leading-[1.1] sm:text-5xl">
                Buy what&rsquo;s next.
                <br />
                <span className="text-brand">Sell what you&rsquo;ve built.</span>
              </h1>

              <p className="mt-5 max-w-[50ch] text-lg leading-relaxed text-ink-soft">
                Discover reviewed websites, SaaS products, apps and digital brands with the performance data you need
                to move confidently.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/buy" size="lg">
                  Explore businesses
                  <ArrowRight size={16} />
                </Button>
                <Button href="/sell" variant="secondary" size="lg">
                  Sell your business
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 border-t border-rule pt-6">
                {["Verified Listings", "Clear performance data", "Guided deal process"].map((label) => (
                  <span key={label} className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                    <CheckCircle2 size={14} className="text-brand" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Featured opportunity — loaded live from the same fetch as
                the rest of the page; the two small badges below are real
                data too (a computed revenue trend, and this marketplace's
                actual review/verification process) rather than decorative
                marketing numbers. */}
            <div className="relative">
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-brand/10 blur-3xl sm:h-72 sm:w-72"
                aria-hidden
              />
              <svg
                className="pointer-events-none absolute -right-6 -top-6 hidden h-40 w-40 text-brand/20 sm:block"
                viewBox="0 0 100 100"
                fill="none"
                aria-hidden
              >
                <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
              </svg>

              {spotlight ? (
                <div className="relative lg:pr-5 lg:pt-4">
                  <div className="rounded-2xl border border-rule bg-paper-raised p-5 shadow-[0_28px_56px_-30px_rgba(11,19,36,0.3)] sm:p-6 lg:mr-8">
                    <span className="eyebrow mb-4">Featured opportunity</span>
                    <div className="flex items-start gap-3">
                      <span className="mono grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand text-base font-bold text-white">
                        {spotlight.title.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-ink">{spotlight.title}</h3>
                        <p className="mono text-xs uppercase tracking-wide text-ink-faint">
                          {CATEGORY_MAP[spotlight.categoryId]?.name ?? spotlight.categoryId}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                      {spotlightDescription}
                    </p>

                    <div className="mono mt-4 grid grid-cols-3 gap-3 border-t border-rule pt-4 text-sm">
                      <div>
                        <span className="block text-[0.62rem] uppercase tracking-wide text-ink-faint">Revenue/mo</span>
                        {fmtUSD(spotlightRevenue)}
                      </div>
                      <div>
                        <span className="block text-[0.62rem] uppercase tracking-wide text-ink-faint">Profit/mo</span>
                        {fmtUSD(spotlightProfit)}
                      </div>
                      <div>
                        <span className="block text-[0.62rem] uppercase tracking-wide text-ink-faint">Age</span>
                        {spotlight.businessAgeYears
                          ? `${spotlight.businessAgeYears} ${spotlight.businessAgeYears <= 1 ? "Year" : "Years"}`
                          : "New"}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-rule pt-4">
                      <span className="mono text-lg font-bold text-ink">
                        {fmtUSD(spotlight.discountedPrice ?? spotlight.price)}
                      </span>
                      <div className="flex items-center gap-2">
                        <WishlistButton listingId={spotlight.id} />
                        <Link
                          href={`/listing/${spotlight.slug}`}
                          className="flex min-h-11 items-center rounded-lg bg-brand-strong px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-secondary"
                        >
                          View Listing
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Revenue trend — computed from the spotlight listing's
                      own monthly stats. The percentage only ever shows when
                      there are at least two real recorded data points to
                      compare; with a sparkline but no clean comparison, or
                      with no history at all, this falls back to an honest
                      label rather than a fabricated number. */}
                  {(spotlightTrendPercent !== null || sparkPoints.length > 0) && (
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-rule bg-paper-raised px-4 py-3 shadow-[0_16px_32px_-22px_rgba(11,19,36,0.25)] lg:absolute lg:-right-2 lg:-top-2 lg:mt-0">
                      <div>
                        {spotlightTrendPercent !== null ? (
                          <>
                            <p className="mono text-lg font-bold text-brand">
                              {spotlightTrendPercent > 0 ? "+" : ""}
                              {spotlightTrendPercent}%
                            </p>
                            <p className="text-[0.65rem] text-ink-faint">Revenue growth</p>
                            <p className="text-[0.6rem] text-ink-faint">{spotlightPeriodLabel}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-[0.78rem] font-semibold leading-snug text-ink-soft">Revenue history</p>
                            <p className="text-[0.65rem] text-ink-faint">{spotlightPeriodLabel}</p>
                          </>
                        )}
                      </div>
                      {sparkPoints.length > 0 && (
                        <div className="flex h-8 items-end gap-0.5" aria-hidden>
                          {sparkPoints.map((v, i) => (
                            <span
                              key={i}
                              className="w-1 rounded-sm bg-brand"
                              style={{ height: `${Math.max(15, (v / sparkMax) * 100)}%` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Our review process — describes Durqo's actual policy
                      (see "Confidence is built into every step" below), not
                      a claim that this specific listing has completed every
                      check, per the no-fake-verification brief. Renders as a
                      single balanced line on lg+ screens (where the card has
                      room) and as an intentional 2-column grid below that —
                      never a lone item left to wrap by itself, per the
                      Sep 6 2026 refinement pass. */}
                  <div className="mt-4 rounded-xl border border-rule bg-paper-raised px-4 py-3 shadow-[0_16px_32px_-22px_rgba(11,19,36,0.25)] lg:mr-8">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                      <ShieldCheck size={14} className="shrink-0 text-brand" />
                      Our review process
                    </p>
                    <div className="mt-2.5 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:mt-2 lg:flex lg:flex-nowrap lg:items-center lg:gap-0">
                      {REVIEW_ITEMS.map((t, i) => (
                        <span
                          key={t}
                          className={`flex items-center gap-1.5 whitespace-nowrap text-[0.8rem] font-medium text-ink ${
                            i === 2 ? "sm:col-span-2 lg:col-span-1" : ""
                          }`}
                        >
                          <CheckCircle2 size={12} className="shrink-0 text-brand lg:hidden" aria-hidden />
                          {i > 0 && (
                            <span className="hidden text-ink-soft lg:mx-2.5 lg:inline" aria-hidden>
                              ·
                            </span>
                          )}
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl border border-dashed border-rule-strong bg-paper-raised p-10 text-center text-sm text-ink-faint">
                  New listings are on their way. Check back soon.
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* STATS BAR */}
      <section className="bg-brand-strong py-7 sm:py-9">
        <Container>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {statsBar.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white/10 text-brand">
                  <Icon size={19} />
                </span>
                <div className="min-w-0">
                  <div className="mono truncate text-xl font-bold text-white sm:text-2xl">{value}</div>
                  <div className="text-xs leading-snug text-white/60">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CATEGORIES */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <DashEyebrow>Explore</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Find your kind of opportunity</h2>
            </div>
            <Link href="/buy" className="flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-hover">
              View all categories
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {topCategories.map((c, i) => {
              const Icon = CATEGORY_ICONS[c.id];
              const count = categoryCounts.get(c.id) ?? 0;
              // Every tile shares the same default appearance now — the
              // green border/background only ever appears on hover or
              // keyboard focus. The leading tile is real inventory's most
              // active category (topCategories is sorted by live listing
              // count), so it earns a "Popular" label instead of looking
              // pre-selected by default — and only when it genuinely has
              // listings, never on an empty catalog.
              const isPopular = i === 0 && count > 0;
              return (
                <Link
                  key={c.id}
                  href={`/buy/${c.id}`}
                  data-reveal
                  className="group relative flex flex-col items-center gap-2.5 rounded-xl border border-rule bg-paper-raised p-5 text-center transition hover:-translate-y-0.5 hover:border-brand hover:bg-brand-soft/40 hover:shadow-[0_16px_32px_-22px_rgba(15,23,41,0.25)] focus-visible:-translate-y-0.5 focus-visible:border-brand focus-visible:bg-brand-soft/40 focus-visible:shadow-[0_16px_32px_-22px_rgba(15,23,41,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                >
                  {isPopular && (
                    <span className="absolute -top-2 right-3 rounded-full bg-brand px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-white">
                      Popular
                    </span>
                  )}
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-paper-sunk text-brand-strong transition group-hover:bg-brand group-hover:text-white group-focus-visible:bg-brand group-focus-visible:text-white">
                    <Icon size={19} />
                  </span>
                  <span className="text-sm font-semibold text-ink">{c.name}</span>
                  <span className={`mono text-xs ${count > 0 ? "text-brand-hover" : "text-ink-faint"}`}>
                    {count > 0 ? `${count} listing${count === 1 ? "" : "s"}` : "Coming soon"}
                  </span>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* BUSINESSES GAINING ATTENTION */}
      <section className="border-b border-rule py-14 sm:py-16">
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <DashEyebrow>Featured listings</DashEyebrow>
              <h2 className="text-2xl sm:text-3xl">Businesses gaining attention</h2>
              <p className="mt-2 max-w-[60ch] text-[0.95rem] leading-relaxed text-ink-soft">
                A selection of opportunities currently drawing buyer interest.
              </p>
            </div>
            <Button href="/buy" variant="secondary" className="min-h-11">
              View all listings
              <ArrowRight size={15} />
            </Button>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((l) => (
                <div key={l.id} data-reveal>
                  <ListingCard listing={l} />
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-rule-strong py-16 text-center text-sm text-ink-faint">
              No listings are published yet.
            </p>
          )}
        </Container>
      </section>

      {/* FOR BUYERS / FOR SELLERS — kept compact and balanced (Sep 6 2026
          refinement pass): both panels now carry the same content density
          (a headline, one line of copy, a CTA, and a 3-4 line checklist),
          rather than the buyer panel alone also carrying a decorative
          chart card. The seller panel's checklist states Durqo's real,
          published fee policy (see /sell and /terms — Success Fee section)
          rather than a generic reassurance line. */}
      <section className="py-12 sm:py-16">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-2xl bg-brand-strong p-6 sm:p-8">
              <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-brand/10 blur-3xl" aria-hidden />
              <div className="relative">
                <DashEyebrow onDark>For buyers</DashEyebrow>
                <h3 className="text-3xl text-white">Acquire with a clearer picture.</h3>
                <p className="mt-3 max-w-[42ch] text-white/70">
                  Make smarter decisions with reviewed listings, transparent data and direct seller communication.
                </p>
                <Button href="/buy" size="lg" className="mt-6">
                  Browse opportunities
                  <ArrowRight size={16} />
                </Button>
                <div className="mt-6 flex flex-col gap-2.5">
                  {["Reviewed listings", "Performance data", "Direct seller communication"].map((t) => (
                    <span key={t} className="flex items-center gap-2 text-sm text-white/80">
                      <CheckCircle2 size={15} className="text-brand" />
                      {t}
                    </span>
                  ))}
                </div>

                <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[0.7rem] uppercase tracking-wide text-white/50">Better data. Smarter acquisitions.</p>
                  <svg viewBox="0 0 200 56" className="mt-3 h-12 w-full text-brand" fill="none" aria-hidden>
                    <polyline
                      points="0,44 28,38 56,40 84,26 112,30 140,14 168,18 200,4"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-brand-soft p-6 sm:p-8">
              <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-brand/15 blur-3xl" aria-hidden />
              <div className="pointer-events-none absolute -left-8 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-brand/10 blur-2xl" aria-hidden />
              <div className="relative">
                <DashEyebrow>For sellers</DashEyebrow>
                <h3 className="text-3xl text-ink">Turn your business into an opportunity.</h3>
                <p className="mt-3 max-w-[42ch] text-ink-soft">
                  Reach qualified buyers and get a fair valuation for your digital business.
                </p>
                <Button href="/valuation" size="lg" className="mt-6">
                  Get a free valuation
                  <ArrowRight size={16} />
                </Button>
                <div className="mt-6 flex flex-col gap-2.5">
                  {[
                    "Free valuation",
                    "No upfront listing fee",
                    // Sourced from src/lib/fees.ts (the top tier is always
                    // the highest Success Fee rate) rather than a hardcoded
                    // "10%" literal, so this line can't drift from /sell,
                    // /terms, and /contact if the schedule ever changes.
                    `Success fee starting at ${fmtRate(SUCCESS_FEE_TIERS[0].rate)}, only when sold`,
                    "Professional support from listing to close",
                  ].map((t) => (
                    <span key={t} className="flex items-center gap-2 text-sm text-ink-soft">
                      <CheckCircle2 size={15} className="shrink-0 text-brand" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="scroll-mt-20 border-b border-rule py-14 sm:py-16">
        <Container>
          <div className="mb-10 text-center">
            <DashEyebrow center>How it works</DashEyebrow>
            <h2 className="text-2xl sm:text-3xl">A clearer path from discovery to transfer</h2>
          </div>
          <div className="relative grid gap-8 sm:grid-cols-3">
            <div className="pointer-events-none absolute left-[8%] right-[8%] top-6 hidden h-px bg-rule sm:block" aria-hidden />
            {STEPS.map(({ title, body }, i) => (
              <div key={title} data-reveal className="relative flex flex-col items-start">
                <span className="mono relative z-10 mb-4 grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand-strong ring-8 ring-paper">
                  0{i + 1}
                </span>
                <h4 className="text-base font-semibold text-ink">{title}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CONFIDENCE / TRUST — Oct 5, 2026 rebuild to match an exact
          user-supplied mockup: a dotted grid + arc decoration on the dark
          navy background, a document-stack illustration (replacing the
          prior concentric-ring shield badge) in "The Durqo Review
          Standard" panel, and the four right-column items as a 2x2 card
          grid (replacing the previous single-column stacked rows) with
          bordered/outlined icon badges (replacing the solid-fill badges
          from the two prior passes, both rejected on feedback). Desktop
          keeps the established 42/58 split (fr units, not percent, so the
          column gap doesn't push past 100% width); mobile stacks to one
          column, with the card grid dropping to a single column below the
          `sm` breakpoint so nothing feels cramped. */}
      <section className="relative overflow-hidden bg-brand-strong py-14 sm:py-16 lg:py-20">
        {/* Decorative background — purely cosmetic, kept at very low
            opacity so it never competes with the real content above it. */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <svg className="absolute left-0 top-0 h-40 w-40 text-white/10" aria-hidden>
            <pattern id="confidence-dots" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#confidence-dots)" />
          </svg>
          <svg
            className="absolute -right-10 -top-10 h-56 w-56 text-white/10 sm:h-64 sm:w-64"
            viewBox="0 0 200 200"
            fill="none"
          >
            <path d="M200 100A100 100 0 0 1 100 0" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="absolute right-16 top-6 h-1.5 w-1.5 rounded-full bg-brand sm:right-20 sm:top-8" />
          <span className="absolute bottom-10 left-6 h-1 w-1 rounded-full bg-white/20" />
          <span className="absolute bottom-24 left-16 h-1 w-1 rounded-full bg-white/15" />
        </div>

        <Container className="relative">
          <div className="mx-auto max-w-[1240px]">
            <div className="grid items-start gap-10 md:grid-cols-2 md:gap-x-10 lg:grid-cols-[0.42fr_0.58fr] lg:gap-x-16">
              <div>
                <DashEyebrow onDark>Our commitment</DashEyebrow>
                <h2 className="text-4xl font-extrabold leading-[1.1] text-white sm:text-[2.75rem]">
                  Confidence at every step.
                </h2>
                <p className="mt-4 max-w-[46ch] text-[0.95rem] leading-relaxed text-white/65">
                  Clear review steps, verified signals and a tracked deal process help buyers and sellers make
                  informed decisions.
                </p>

                {/* Assurance panel — describes Durqo's real, available review
                    process (see CONFIDENCE below for the fuller writeups),
                    never a guarantee that every listing/seller has already
                    completed every check. */}
                <div className="relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <p className="mono text-[0.68rem] font-semibold uppercase tracking-wider text-white/50">
                    The Durqo review standard
                  </p>

                  <div className="mt-6 flex items-center gap-6">
                    {/* Document-stack illustration — two offset "listing"
                        cards with a checkmark badge overlapping the front
                        one, standing in for a reviewed/approved document. */}
                    <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
                      <div
                        className="absolute left-0 top-3 h-16 w-14 -rotate-6 rounded-lg border border-white/15 bg-white/[0.04] sm:h-20 sm:w-16"
                        aria-hidden
                      />
                      <div className="absolute left-3 top-0 h-16 w-14 rounded-lg border border-white/15 bg-white/[0.07] p-2.5 sm:h-20 sm:w-16">
                        <span className="block h-1 w-7 rounded-full bg-white/25 sm:w-8" />
                        <span className="mt-1.5 block h-1 w-9 rounded-full bg-white/25 sm:w-10" />
                        <span className="mt-1.5 block h-1 w-5 rounded-full bg-white/25 sm:w-6" />
                      </div>
                      <span className="absolute left-2 top-1 h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                      <span className="absolute -bottom-1 right-0 grid h-8 w-8 place-items-center rounded-full bg-brand text-white shadow-[0_8px_16px_-6px_rgba(16,185,129,0.65)] sm:h-9 sm:w-9">
                        <Check size={16} strokeWidth={2.5} />
                      </span>
                    </div>

                    <div className="h-16 w-px shrink-0 bg-white/10 sm:h-20" aria-hidden />

                    <div className="min-w-0 flex-1">
                      {REVIEW_STANDARD_ITEMS.map((t, i) => (
                        <div
                          key={t}
                          className={`flex items-center gap-2.5 py-2 ${
                            i < REVIEW_STANDARD_ITEMS.length - 1 ? "border-b border-white/10" : ""
                          }`}
                        >
                          <CheckCircle2 size={16} className="shrink-0 text-brand" />
                          <span className="text-sm font-medium text-white/80">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {CONFIDENCE.map(({ icon: Icon, title, body }) => (
                  <div
                    key={title}
                    data-reveal
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand">
                      <Icon size={20} strokeWidth={1.75} />
                    </span>
                    <h4 className="mt-4 text-base font-bold text-white">{title}</h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/60">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FINAL CTA — trimmed to a compact ~280-320px band on desktop
          (Sep 6 2026 refinement pass); content and both buttons unchanged. */}
      <section className="relative overflow-hidden py-10 sm:py-11">
        <div className="pointer-events-none absolute -bottom-20 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-brand/5 blur-3xl" aria-hidden />
        <Container className="relative">
          <div className="mx-auto max-w-[620px] text-center">
            <span className="eyebrow mx-auto">Digital businesses. Real opportunities.</span>
            <h2 className="mt-4 text-3xl sm:text-4xl">Ready to find your next opportunity?</h2>
            <p className="mt-3 text-ink-soft">
              Browse reviewed listings, or get a free valuation on the business you&rsquo;re ready to sell.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button href="/buy" size="lg">
                Explore businesses
                <ArrowRight size={16} />
              </Button>
              <Button href="/valuation" variant="secondary" size="lg">
                Get a free valuation
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
