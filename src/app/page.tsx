import Link from "next/link";
import {
  ShieldCheck,
  LineChart,
  UserCheck,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Search,
  Package,
  Coins,
  LayoutGrid,
} from "lucide-react";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { getPublishedListings } from "@/lib/data/listings.server";
import { SUCCESS_FEE_TIERS, fmtRate } from "@/lib/fees";
import ListingCard from "@/components/ListingCard";
import WishlistButton from "@/components/WishlistButton";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { fmtUSD } from "@/lib/format";

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

const STEPS = [
  { icon: Search, title: "Explore or list", body: "Browse reviewed listings by category, or submit your own business for review." },
  { icon: LineChart, title: "Review and connect", body: "Evaluate performance data, ask questions and connect directly with the seller." },
  { icon: CheckCircle2, title: "Complete the transfer", body: "Agree on terms, move assets through our secure process, and take ownership with confidence." },
];

const CONFIDENCE = [
  { icon: ShieldCheck, title: "Listing review", body: "Every listing is manually reviewed for accuracy, completeness and legitimacy before it goes live." },
  { icon: UserCheck, title: "Seller verification", body: "Sellers can complete identity verification and earn a Verified badge on their profile." },
  { icon: LineChart, title: "Performance data", body: "Revenue, traffic and SEO figures can be independently checked against Google Analytics, Search Console, SEMrush and Ahrefs." },
  { icon: MessageSquare, title: "Secure communication", body: "Negotiate and share information directly through Durqo's private messaging — nothing moves to unrecorded channels." },
];

// The assurance panel's bottom row deliberately says "Identity verification"
// (the available process) rather than "Seller verified" (a completed-status
// claim) — this is a general marketing panel, not scoped to any one logged-in
// seller's actual verification status, so it must never imply every seller
// on the marketplace already carries a Verified badge.
const REVIEW_STANDARD_ITEMS = ["Listing reviewed", "Identity verification", "Data checked"];

export default async function Home() {
  const listings = await getPublishedListings();
  // "Businesses gaining attention" — the 3 most recently published, in the
  // order getPublishedListings() already returns (newest first).
  const featured = listings.slice(0, 3);

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
  // Distinct sellers, among those with a currently active listing, who have
  // real identity verification (profiles.is_verified, surfaced as
  // SellerInfo.isVerified via mapSeller) — deliberately NOT
  // `listing.isVerified`, which (Sep 2026 /buy fix) now means "this listing
  // is published," true for nearly every listing here and so would inflate
  // this into a near-duplicate of "Active listings" instead of the distinct,
  // opt-in seller-identity signal this stat is meant to show.
  const verifiedCount = new Set(activeListings.filter((l) => l.seller.isVerified).map((l) => l.seller.id)).size;
  const totalListedValue = activeListings.reduce((sum, l) => sum + (l.discountedPrice ?? l.price), 0);

  // Categories sorted by how much real inventory they carry — both the
  // "Find your kind of opportunity" row (top 6) and the swap-in stat below
  // lean on this real ordering rather than a fixed/declared order.
  const categoriesByActivity = [...CATEGORIES].sort(
    (a, b) => (categoryCounts.get(b.id) ?? 0) - (categoryCounts.get(a.id) ?? 0)
  );
  const topCategories = categoriesByActivity.slice(0, 6);
  const activeCategoryCount = categoriesByActivity.filter((c) => (categoryCounts.get(c.id) ?? 0) > 0).length;

  // Stats-bar 4th slot: a real, non-zero stat instead of a "0 Verified
  // seller profiles" trust stat (verification is still opt-in sitewide, so
  // that count is genuinely 0 today for most catalogs) — swaps to the real
  // verified count automatically once sellers start verifying.
  const verifiedStat =
    verifiedCount > 0
      ? { value: String(verifiedCount), label: verifiedCount === 1 ? "Verified seller" : "Verified sellers" }
      : { value: String(activeCategoryCount), label: "Categories with live listings" };

  // Featured opportunity (hero spotlight): prefer the highest-priced listing
  // that actually has real computed monthly income, so the homepage's own
  // showcase never ends up being a listing with no revenue data at all
  // (e.g. a bare Domains listing) — falls back to "just the newest" only
  // when nothing in the catalog has income data yet.
  const withRevenue = listings.filter((l) => {
    const income = l.quickStats.monthly_income;
    return typeof income === "number" && income > 0;
  });
  const spotlightPool = withRevenue.length > 0 ? withRevenue : listings;
  const spotlight = [...spotlightPool].sort(
    (a, b) => (b.discountedPrice ?? b.price) - (a.discountedPrice ?? a.price)
  )[0];

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

  const statsBar = [
    { icon: Package, value: String(activeListings.length), label: "Active listings" },
    { icon: Coins, value: fmtCompactUSD(totalListedValue), label: "Listed value" },
    { icon: LayoutGrid, value: String(CATEGORIES.length), label: "Business types" },
    { icon: ShieldCheck, value: verifiedStat.value, label: verifiedStat.label },
  ];

  const spotlightDescription = spotlight
    ? SPOTLIGHT_EXCERPTS[spotlight.title] ?? excerpt(spotlight.overview || "Not disclosed")
    : "";

  return (
    <main>
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
                Buy what&rsquo;s
                <br />
                <span className="text-brand">already working.</span>
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
                {["Reviewed listings", "Clear performance data", "Guided deal process"].map((label) => (
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
                        {spotlight.businessAgeYears ? `${spotlight.businessAgeYears} yrs` : "New"}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-rule pt-4">
                      <span className="mono text-lg font-bold text-ink">
                        {fmtUSD(spotlight.discountedPrice ?? spotlight.price)}
                      </span>
                      <div className="flex items-center gap-2">
                        <WishlistButton listingId={spotlight.id} />
                        <Link
                          href={`/listing/${spotlight.id}`}
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
                  New listings are on their way — check back soon.
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
                  href={`/buy?category=${c.id}`}
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
                <Button href="/sell" size="lg" className="mt-6">
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
                    `Success fee starting at ${fmtRate(SUCCESS_FEE_TIERS[0].rate)} — only when sold`,
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

      {/* CONFIDENCE / TRUST — left column carries its own visual weight now
          via "The Durqo Review Standard" assurance panel (Sep 6 2026
          refinement pass), instead of leaving a large empty area next to
          the four detailed rows on the right. Desktop uses an explicit
          42/58 split (via fr units, not percent, so the 64px column gap
          doesn't push the two columns past 100% width); tablet drops to an
          even 2-column split with a tighter gap; mobile stacks to one
          column in document order (heading/paragraph, then the panel, then
          the four rows). */}
      <section className="relative overflow-hidden bg-brand-strong py-14 sm:py-16 lg:py-20">
        <Container>
          <div className="mx-auto max-w-[1240px]">
            <div className="grid items-start gap-8 md:grid-cols-2 md:gap-x-8 lg:grid-cols-[0.42fr_0.58fr] lg:gap-x-16">
              <div>
                <DashEyebrow onDark>Our commitment</DashEyebrow>
                <h2 className="text-2xl text-white sm:text-3xl">Confidence is built into every step.</h2>
                <p className="mt-3 max-w-[46ch] text-[0.95rem] leading-relaxed text-white/65">
                  Clear checks, verified signals and secure communication help buyers and sellers make informed
                  decisions.
                </p>

                {/* Assurance panel — describes Durqo's real, available review
                    process (see CONFIDENCE below for the fuller writeups),
                    never a guarantee that every listing/seller has already
                    completed every check. */}
                <div className="relative mt-6 flex h-[240px] flex-col items-center justify-between gap-3 overflow-hidden rounded-xl border border-[rgba(148,163,184,0.25)] bg-white/[0.04] px-6 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-24px_40px_-28px_rgba(0,0,0,0.35)] lg:h-[310px] lg:py-8">
                  <svg
                    className="pointer-events-none absolute -bottom-10 -left-12 h-40 w-60 text-brand/10"
                    viewBox="0 0 220 160"
                    fill="none"
                    aria-hidden
                  >
                    <path d="M-10 138 Q 40 98 90 138 T 230 128" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M-10 154 Q 50 118 100 154 T 230 144" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M-10 108 Q 30 78 80 113 T 230 98" stroke="currentColor" strokeWidth="1.5" />
                  </svg>

                  <p className="mono relative text-[0.68rem] font-semibold uppercase tracking-wider text-white/60">
                    The Durqo review standard
                  </p>

                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center lg:h-28 lg:w-28">
                    <span className="absolute inset-0 rounded-full border border-brand/30" aria-hidden />
                    <span className="absolute inset-2 rounded-full border border-brand/22" aria-hidden />
                    <span className="absolute inset-4 rounded-full border border-brand/16" aria-hidden />
                    <ShieldCheck size={44} className="relative text-brand" />
                  </div>

                  <div className="relative flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                    {REVIEW_STANDARD_ITEMS.map((t) => (
                      <span key={t} className="flex items-center gap-1.5 text-sm font-medium text-white/80">
                        <CheckCircle2 size={13} className="shrink-0 text-brand" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6 lg:gap-9">
                {CONFIDENCE.map(({ icon: Icon, title, body }, i) => (
                  <div
                    key={title}
                    data-reveal
                    className={`flex gap-4 ${i < CONFIDENCE.length - 1 ? "border-b border-white/10 pb-6 lg:pb-11" : ""}`}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/10 text-brand">
                      <Icon size={18} />
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{title}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-white/65">{body}</p>
                    </div>
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
              <Button href="/sell" variant="secondary" size="lg">
                Get a free valuation
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
