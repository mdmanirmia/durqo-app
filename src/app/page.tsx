import Link from "next/link";
import { ShieldCheck, LineChart, UserCheck, MessageSquare } from "lucide-react";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";
import { getPublishedListings } from "@/lib/data/listings.server";
import ListingCard from "@/components/ListingCard";
import Sparkline from "@/components/Sparkline";
import { fmtUSD, formatQuickStat } from "@/lib/format";

const WHY = [
  { icon: ShieldCheck, title: "Escrow-protected payments", body: "Every transaction runs through a licensed escrow partner — funds release only after assets transfer." },
  { icon: LineChart, title: "Independent financial verification", body: "Revenue, traffic and SEO figures are checked against Google Analytics, Search Console, SEMrush and Ahrefs before a listing goes live." },
  { icon: UserCheck, title: "Vetted sellers, real history", body: "Sellers are identity-checked, and prior listings and outcomes stay attached to their profile." },
  { icon: MessageSquare, title: "Direct, recorded messaging", body: "Negotiate buyer to seller inside Durqo — nothing moves to unrecorded channels." },
];

export default async function Home() {
  const featured = await getPublishedListings(3);
  const spotlight = featured[0];

  return (
    <main>
      {/* HERO */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-7 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div>
            <p className="mono mb-3 text-xs uppercase tracking-wider text-ink-faint">Online business marketplace</p>
            <h1 className="text-[2.2rem] leading-[1.1] sm:text-5xl">The ultimate hub for <span className="text-brand">digital assets</span>.</h1>
            <p className="mt-5 max-w-[46ch] text-lg text-ink-soft">
              Durqo lists verified websites, SaaS products, domains, YouTube channels, social accounts and newsletters for sale — every listing checked, every deal escrowed.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/buy" className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand/90">
                Explore Marketplace
              </Link>
              <Link href="/sell" className="rounded-full bg-brand-strong px-6 py-3 text-sm font-semibold text-white hover:bg-brand-strong/90">
                Sell your Business
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-8 border-t border-rule pt-6">
              {[["$18.4M", "Transacted to date"], ["640+", "Verified listings"], ["11 days", "Avg. time to close"], ["4.8 / 5", "Buyer satisfaction"]].map(([n, l]) => (
                <div key={l}>
                  <div className="mono text-xl font-semibold text-brand-strong">{n}</div>
                  <div className="text-xs text-ink-faint">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* spotlight card */}
          {spotlight && (
            <div className="relative rounded-2xl border border-rule bg-paper-raised p-7 shadow-[0_24px_48px_-24px_rgba(15,23,41,0.28)]">
              <div className="flex items-start justify-between">
                <span className="mono rounded-full bg-brand-soft px-2.5 py-1 text-[0.65rem] uppercase tracking-wide text-brand">Listing No. {spotlight.id}</span>
                {spotlight.isVerified && (
                  <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-brand text-center text-[0.58rem] font-semibold uppercase leading-tight tracking-wide text-brand">
                    Verified
                  </div>
                )}
              </div>
              <h3 className="mt-4 text-2xl font-bold">{spotlight.title}</h3>
              <p className="mb-4 text-sm text-ink-soft">
                {CATEGORY_MAP[spotlight.categoryId]?.name ?? spotlight.categoryId}
                {spotlight.businessAgeYears ? ` · ${spotlight.businessAgeYears} yrs old` : ""}
              </p>
              <div className="mb-4 flex gap-6">
                <div>
                  <div className="mono text-lg font-semibold">{fmtUSD(spotlight.quickStats.monthly_income as number)}</div>
                  <div className="text-[0.62rem] uppercase tracking-wide text-ink-faint">Monthly profit</div>
                </div>
                <div>
                  <div className="mono text-lg font-semibold">{formatQuickStat("income_multiple", spotlight.quickStats.income_multiple)}</div>
                  <div className="text-[0.62rem] uppercase tracking-wide text-ink-faint">Multiple</div>
                </div>
              </div>
              <Sparkline values={spotlight.monthlyStats.map((m) => m.income ?? 0)} height={44} />
              <div className="mt-4 flex items-center justify-between border-t border-rule pt-4">
                <span className="mono text-2xl font-bold text-brand">{fmtUSD(spotlight.price)}</span>
                <Link href={`/listing/${spotlight.id}`} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90">
                  View listing
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-t border-rule py-14">
        <div className="mx-auto max-w-6xl px-5 sm:px-7">
          <p className="mono mb-2 text-xs uppercase tracking-wider text-ink-faint">Categories</p>
          <h2 className="mb-8 text-3xl">Fourteen kinds of digital assets, one trusted marketplace</h2>
          <div className="grid grid-cols-1 gap-px border border-rule bg-rule sm:grid-cols-2 md:grid-cols-3">
            {CATEGORIES.map((c) => (
              <Link key={c.id} href={`/buy?category=${c.id}`} className="flex flex-col gap-2 bg-paper-raised p-6 transition hover:bg-brand-soft">
                <span className="text-lg font-semibold">{c.name}</span>
                <span className="text-sm text-ink-soft">{c.description}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* LATEST LISTINGS */}
      <section className="border-t border-rule py-14">
        <div className="mx-auto max-w-6xl px-5 sm:px-7">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mono mb-2 text-xs uppercase tracking-wider text-ink-faint">Latest listings</p>
              <h2 className="text-3xl">On the market this week</h2>
            </div>
            <Link href="/buy" className="rounded-full border border-rule-strong px-4 py-2 text-sm font-semibold hover:border-brand hover:text-brand">
              View all listings &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-rule py-14">
        <div className="mx-auto max-w-6xl px-5 sm:px-7">
          <p className="mono mb-2 text-xs uppercase tracking-wider text-ink-faint">How it works</p>
          <h2 className="mb-8 text-3xl">From browsing to close, in three steps</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              ["01", "Sign up & get verified", "Create an account and confirm your identity so both sides of every deal are accountable."],
              ["02", "Browse or list", "Search vetted listings by category, income and price — or submit your own business for review."],
              ["03", "Close with escrow", "Funds and assets move through our escrow partner, released only once transfer is confirmed."],
            ].map(([n, t, b]) => (
              <div key={n}>
                <div className="mono text-3xl font-bold text-brand">{n}</div>
                <h4 className="mt-2 text-lg">{t}</h4>
                <p className="mt-1 text-sm text-ink-soft">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY DURQO */}
      <section className="border-t border-rule py-14">
        <div className="mx-auto max-w-6xl px-5 sm:px-7">
          <p className="mono mb-2 text-xs uppercase tracking-wider text-ink-faint">Why Durqo</p>
          <h2 className="mb-6 text-3xl">Built for people who read the fine print</h2>
          <div className="flex flex-col">
            {WHY.map(({ icon: Icon, title, body }) => (
              <div key={title} className="grid grid-cols-[28px_1fr] gap-4 border-t border-rule py-5 last:border-b">
                <Icon className="mt-0.5 text-brand-strong" size={22} />
                <div>
                  <h4 className="text-base">{title}</h4>
                  <p className="max-w-[60ch] text-sm text-ink-soft">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-rule py-14">
        <div className="mx-auto max-w-6xl px-5 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-brand-strong p-10 text-white">
            <div>
              <h2 className="text-2xl text-white">Ready to make your first deal?</h2>
              <p className="mt-1 max-w-[44ch] text-white/75">
                Browse hundreds of verified listings, or get a free valuation on the business you&rsquo;re ready to sell.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/buy" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-strong hover:bg-white/90">Browse listings</Link>
              <Link href="/sell" className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:border-white">Get a valuation</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
