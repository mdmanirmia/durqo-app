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
  { icon: UserCheck, label: "Identity-verified sellers" },
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
  { icon: UserCheck, title: "Vetted sellers, real history", body: "Sellers are identity-checked, and prior listings and outcomes stay attached to their profile." },
  { icon: MessageSquare, title: "Direct, recorded messaging", body: "Negotiate buyer to seller inside Durqo — nothing moves to unrecorded channels." },
];

export default async function Home() {
  const listings = await getPublishedListings();
  const featured = listings.slice(0, 3);
  const spotlight = featured[0];

  // Real per-category counts, computed from the same fetch used for the
  // featured strip above — no placeholder numbers.
  const categoryCounts = new Map<string, number>();
  for (const l of listings) {
    categoryCounts.set(l.categoryId, (categoryCounts.get(l.categoryId) ?? 0) + 1);
  }
  const verifiedCount = listings.filter((l) => l.isVerified).length;

  const spotlightChart = spotlight
    ? spotlight.monthlyStats.map((m) => ({ month: m.month, income: m.income }))
    : [];

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
                from the listings just fetched, not a marketing placeholder. */}
            <div className="rounded-xl border border-rule bg-paper-raised">
              <div className="flex items-center justify-between border-b border-rule bg-brand-strong px-6 py-3.5">
                <span className="text-sm font-semibold text-white">Marketplace snapshot</span>
                <BadgeCheck size={16} className="text-brand" />
              </div>
              <div className="grid grid-cols-2 divide-x divide-rule border-b border-rule">
                <div className="p-5">
                  <div className="mono text-2xl font-bold text-ink">{listings.length}</div>
                  <div className="mt-1 text-xs text-ink-faint">Active listings</div>
                </div>
                <div className="p-5">
                  <div className="mono text-2xl font-bold text-ink">{verifiedCount}</div>
                  <div className="mt-1 text-xs text-ink-faint">Seller-verified</div>
                </div>
              </div>
              <div className="flex flex-col gap-4 p-5">
                {WHY.slice(0, 3).map(({ icon: Icon, title, body }) => (
                  <div key={title} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                      <Icon size={15} />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-ink">{title}</div>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-faint">{body}</p>
                    </div>
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
            <div className="grid gap-8 rounded-xl border border-rule bg-paper-raised p-6 lg:grid-cols-[1fr_1fr] lg:p-8">
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
            title="Fourteen kinds of digital assets, one marketplace"
            subtitle="Every category ships with its own quick-stats and, where relevant, independently checked financials and traffic."
            className="mb-10"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICONS[c.id];
              const count = categoryCounts.get(c.id) ?? 0;
              return (
                <Link
                  key={c.id}
                  href={`/buy?category=${c.id}`}
                  className="group flex flex-col gap-3 rounded-xl border border-rule bg-paper-raised p-5 transition hover:border-brand"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-paper-sunk text-brand-strong transition group-hover:bg-brand group-hover:text-white">
                      <Icon size={18} />
                    </span>
                    <span className="mono text-xs text-ink-faint">
                      {count} listing{count === 1 ? "" : "s"}
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
                <ListingCard key={l.id} listing={l} />
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
              <div key={title} className="rounded-xl border border-white/10 bg-white/[0.04] p-6">
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
              <div key={title} className="flex gap-4 rounded-xl border border-rule bg-paper-raised p-5">
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
