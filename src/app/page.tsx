import Link from "next/link";
import {
  ShieldCheck,
  LineChart,
  UserCheck,
  MessageSquare,
  ArrowRight,
  Lock,
  BadgeCheck,
  CheckCircle2,
  Search,
  Layers,
  Wallet,
} from "lucide-react";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { getPublishedListings } from "@/lib/data/listings.server";
import ListingCard from "@/components/ListingCard";
import TrendChart from "@/components/charts/TrendChart";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { fmtUSD, formatQuickStat } from "@/lib/format";

const TRUST_STRIP = [
  { icon: Lock, label: "Escrow-protected payments" },
  { icon: UserCheck, label: "Verified-seller badges" },
  { icon: ShieldCheck, label: "Financials independently checked" },
];

const STEPS = [
  { icon: Search, title: "Sign up & get verified", body: "Create an account and confirm your identity so both sides of every deal are accountable." },
  { icon: LineChart, title: "Browse or list", body: "Search vetted listings by category, income and price — or submit your own business for review." },
  { icon: CheckCircle2, title: "Close with escrow", body: "Funds and assets move through our escrow partner, released only once transfer is confirmed." },
];

const WHY = [
  { icon: ShieldCheck, title: "Escrow-protected payments", body: "Every transaction runs through a licensed escrow partner — funds release only after assets transfer." },
  { icon: LineChart, title: "Independent financial verification", body: "Revenue, traffic and SEO figures are checked against Google Analytics, Search Console, SEMrush and Ahrefs before a listing goes live." },
  { icon: UserCheck, title: "Vetted sellers, real history", body: "Sellers can complete identity verification and earn a Verified badge — and their listings and outcomes stay attached to their profile either way." },
  { icon: MessageSquare, title: "Direct, recorded messaging", body: "Negotiate buyer to seller inside Durqo — nothing moves to unrecorded channels." },
];

export default async function Home() {
  const listings = await getPublishedListings();
  // "Latest listings" — the 3 most recently published, in the order
  // getPublishedListings() already returns (newest first). This is
  // deliberately separate from the spotlight pick below: "on the market
  // this week" should mean newest, full stop.
  const featured = listings.slice(0, 3);

  // Real per-category counts, computed from the same fetch used for the
  // featured strip above — no placeholder numbers.
  const categoryCounts = new Map<string, number>();
  for (const l of listings) {
    categoryCounts.set(l.categoryId, (categoryCounts.get(l.categoryId) ?? 0) + 1);
  }
  const verifiedCount = listings.filter((l) => l.isVerified).length;
  const totalListedValue = listings.reduce((sum, l) => sum + (l.discountedPrice ?? l.price), 0);

  // Categories sorted by how much real inventory they carry, so the grid
  // leads with what a visitor can actually browse today rather than
  // whatever order the category list happens to be defined in.
  const categoriesByActivity = [...CATEGORIES].sort(
    (a, b) => (categoryCounts.get(b.id) ?? 0) - (categoryCounts.get(a.id) ?? 0)
  );

  // Sep 6 2026 fix: the "Featured listing" spotlight used to just be
  // listings[0] (whichever listing was created most recently) — fine most
  // of the time, but it meant a listing with no revenue at all (e.g. a bare
  // Domains listing, which has no Proof of Income section to begin with)
  // could end up as the marketplace's own homepage showcase, showing
  // "Revenue/mo —" and "Multiple —" right at the top of the site. Pick the
  // highest-priced listing that actually has real computed monthly income
  // instead — a much better flagship — and only fall back to "just the
  // newest" when nothing in the catalog has income data yet.
  const withRevenue = listings.filter((l) => {
    const income = l.quickStats.monthly_income;
    return typeof income === "number" && income > 0;
  });
  const spotlightPool = withRevenue.length > 0 ? withRevenue : listings;
  const spotlight = [...spotlightPool].sort(
    (a, b) => (b.discountedPrice ?? b.price) - (a.discountedPrice ?? a.price)
  )[0];

  const spotlightChart = spotlight
    ? spotlight.monthlyStats.map((m) => ({ month: m.month, income: m.income }))
    : [];

  // Third hero stat: once real sellers start getting Verified badges this
  // automatically switches to that (a more meaningful trust signal) instead
  // of silently showing "0" — until then, the combined asking price across
  // the live catalog is a real, non-zero number worth leading with.
  const heroThirdStat =
    verifiedCount > 0
      ? { value: String(verifiedCount), label: "Seller-verified" }
      : { value: fmtUSD(totalListedValue), label: "Combined asking price" };

  return (
    <main>
      {/* HERO */}
      <section className="border-b border-rule bg-paper-sunk py-16 sm:py-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <span className="eyebrow">
                <ShieldCheck size={13} />
                Verified digital business marketplace
              </span>

              <h1 className="mt-5 text-4xl leading-[1.1] sm:text-5xl">
                Buy and sell online businesses with confidence
              </h1>

              <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-ink-soft">
                Websites, SaaS products, e-commerce brands, domains and other digital businesses — every listing
                checked, every deal held in escrow until assets transfer.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/buy" size="lg">
                  Browse the marketplace
                  <ArrowRight size={16} />
                </Button>
                <Button href="/sell" variant="secondary" size="lg">
                  Get a free valuation
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 border-t border-rule pt-6">
                {TRUST_STRIP.map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                    <Icon size={14} className="text-brand" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Real verification summary — every number here is computed
                from the listings just fetched, not a marketing placeholder.
                Three stats instead of two (Sep 6 2026 fix): the third slot
                is "Seller-verified" once that count is real and non-zero,
                and the catalog's combined asking price until then — a
                zero-looking trust stat is worse than a true, non-zero one. */}
            <div className="rounded-xl border border-rule bg-paper-raised shadow-[0_24px_48px_-28px_rgba(11,19,36,0.25)]">
              <div className="flex items-center justify-between border-b border-rule bg-brand-strong px-6 py-3.5">
                <span className="text-sm font-semibold text-white">Marketplace snapshot</span>
                <BadgeCheck size={16} className="text-brand" />
              </div>
              <div className="grid grid-cols-3 divide-x divide-rule border-b border-rule">
                <div className="p-4 sm:p-5">
                  <div className="mono text-xl font-bold text-ink sm:text-2xl">{listings.length}</div>
                  <div className="mt-1 text-[0.7rem] leading-tight text-ink-faint">Active listings</div>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="mono text-xl font-bold text-ink sm:text-2xl">{CATEGORIES.length}</div>
                  <div className="mt-1 text-[0.7rem] leading-tight text-ink-faint">Categories</div>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="mono text-xl font-bold text-ink sm:text-2xl">{heroThirdStat.value}</div>
                  <div className="mt-1 text-[0.7rem] leading-tight text-ink-faint">{heroThirdStat.label}</div>
                </div>
              </div>
              <div className="flex flex-col gap-3.5 p-5">
                {[
                  { icon: ShieldCheck, text: "Every listing checked before it goes live" },
                  { icon: Wallet, text: "Funds held in escrow until assets transfer" },
                  { icon: Layers, text: `${CATEGORIES.length} kinds of digital businesses to browse` },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                      <Icon size={15} />
                    </span>
                    <p className="text-sm text-ink-soft">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FEATURED LISTING (spotlight) */}
      {spotlight && (
        <section className="border-b border-rule py-16 sm:py-20">
          <Container>
            <SectionHeader eyebrow="Featured listing" title={spotlight.title} className="mb-8" />
            <div data-reveal className="grid gap-8 rounded-xl border border-rule bg-paper-raised p-6 shadow-[0_24px_48px_-30px_rgba(11,19,36,0.2)] lg:grid-cols-[1fr_1fr] lg:p-8">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                  <span className="mono uppercase tracking-wide">
                    {CATEGORY_MAP[spotlight.categoryId]?.name ?? spotlight.categoryId}
                  </span>
                  {spotlight.businessAgeYears ? <span>· {spotlight.businessAgeYears} yrs old</span> : null}
                  {spotlight.isVerified && (
                    <Badge tone="brand" icon={BadgeCheck}>
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="mt-3 max-w-[56ch] text-sm leading-relaxed text-ink-soft">{spotlight.overview || "Not disclosed"}</p>

                <div className="mono mt-6 grid grid-cols-3 gap-4 border-t border-rule pt-5 text-sm">
                  <div>
                    <span className="block text-[0.62rem] uppercase tracking-wide text-ink-faint">Revenue/mo</span>
                    {fmtUSD(spotlight.quickStats.monthly_income as number | undefined)}
                  </div>
                  <div>
                    <span className="block text-[0.62rem] uppercase tracking-wide text-ink-faint">Multiple</span>
                    {formatQuickStat("income_multiple", spotlight.quickStats.income_multiple)}
                  </div>
                  <div>
                    <span className="block text-[0.62rem] uppercase tracking-wide text-ink-faint">Price</span>
                    {fmtUSD(spotlight.discountedPrice ?? spotlight.price)}
                  </div>
                </div>

                <Button href={`/listing/${spotlight.id}`} className="mt-6">
                  View listing
                  <ArrowRight size={15} />
                </Button>
              </div>

              <div className="rounded-lg border border-rule bg-paper-sunk p-4">
                <p className="mono mb-2 text-[0.65rem] uppercase tracking-wide text-ink-faint">Revenue, last 12 months</p>
                {spotlightChart.length > 0 ? (
                  <TrendChart data={spotlightChart} dataKey="income" color="#10B981" format="usd" />
                ) : (
                  <p className="py-12 text-center text-sm text-ink-faint">Not disclosed</p>
                )}
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* CATEGORIES */}
      <section className="border-b border-rule py-16 sm:py-20">
        <Container>
          <SectionHeader
            eyebrow="Categories"
            title={`${CATEGORIES.length} kinds of digital assets, one marketplace`}
            subtitle="Every category ships with its own quick-stats and, where relevant, independently checked financials and traffic."
            className="mb-10"
          />
          {/* Sep 6 2026 fix: this heading used to say "Fourteen" — a number
              typed by hand when the category list had 14 entries. It's grown
              to 16 since (Startup Business, AI Apps & Tools, Android & iOS
              Apps) without the heading being updated, so it now reads
              CATEGORIES.length directly and can't go stale again. Cards are
              also sorted by real listing count (categoriesByActivity, above)
              so the categories with actual inventory lead the grid instead
              of whatever order they happen to be declared in. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoriesByActivity.map((c) => {
              const Icon = CATEGORY_ICONS[c.id];
              const count = categoryCounts.get(c.id) ?? 0;
              return (
                <Link
                  key={c.id}
                  href={`/buy?category=${c.id}`}
                  data-reveal
                  className="group flex flex-col gap-3 rounded-xl border border-rule bg-paper-raised p-5 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_16px_32px_-22px_rgba(15,23,41,0.25)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-paper-sunk text-brand-strong transition group-hover:bg-brand group-hover:text-white">
                      <Icon size={18} />
                    </span>
                    <span className={`mono text-xs ${count > 0 ? "text-brand-hover" : "text-ink-faint"}`}>
                      {count > 0 ? `${count} listing${count === 1 ? "" : "s"}` : "Coming soon"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-ink">{c.name}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">{c.description}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* LATEST LISTINGS */}
      <section className="border-b border-rule py-16 sm:py-20">
        <Container>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <SectionHeader eyebrow="Latest listings" title="On the market this week" />
            <Button href="/buy" variant="secondary">
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

      {/* HOW IT WORKS — the one deliberately dark, full-bleed section, used
          once as a contrast beat rather than as a recurring pattern. */}
      <section id="how-it-works" className="bg-brand-strong py-16 sm:py-20">
        <Container>
          <SectionHeader
            eyebrow="How it works"
            title="From browsing to close, in three steps"
            onDark
            className="mb-10"
          />
          <div className="grid gap-5 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <div key={title} data-reveal className="rounded-xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-white/20 hover:bg-white/[0.06]">
                <span className="mono mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-semibold text-white">
                  0{i + 1}
                </span>
                <span className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-brand">
                  <Icon size={17} />
                </span>
                <h4 className="text-base font-semibold text-white">{title}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* WHY DURQO */}
      <section className="border-b border-rule py-16 sm:py-20">
        <Container>
          <SectionHeader eyebrow="Why Durqo" title="Built for people who read the fine print" className="mb-10" />
          <div className="grid gap-6 sm:grid-cols-2">
            {WHY.map(({ icon: Icon, title, body }) => (
              <div key={title} data-reveal className="flex gap-4 rounded-xl border border-rule bg-paper-raised p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-24px_rgba(15,23,41,0.25)]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                  <Icon size={18} />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-ink">{title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-brand-strong py-16 sm:py-20">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-8">
            <div>
              <h2 className="max-w-[26ch] text-3xl text-white">Ready to make your first deal?</h2>
              <p className="mt-2 max-w-[46ch] text-white/70">
                Browse verified listings, or get a free valuation on the business you&rsquo;re ready to sell.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button href="/buy" variant="on-dark" size="lg" className="!border-white !bg-white !text-brand-strong hover:!bg-white/90">
                Browse listings
              </Button>
              <Button href="/sell" variant="on-dark" size="lg">
                Get a valuation
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
