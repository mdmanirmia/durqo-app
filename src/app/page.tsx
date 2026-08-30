import Link from "next/link";
import {
  ShieldCheck,
  LineChart,
  UserCheck,
  MessageSquare,
  ArrowRight,
  Search,
  CheckCircle2,
  Globe,
  ShoppingBag,
  PlaySquare,
  Users,
  Mail,
  Layers,
  Package,
  Puzzle,
  Smartphone,
  Gamepad2,
  Bitcoin,
  Briefcase,
  Handshake,
  Link2,
  Lock,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
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

const TRUST_CHIPS = [
  { icon: Lock, label: "Escrow protected" },
  { icon: UserCheck, label: "Identity-verified sellers" },
  { icon: ShieldCheck, label: "Financials independently checked" },
];

const STEPS = [
  { icon: Search, title: "Sign up & get verified", body: "Create an account and confirm your identity so both sides of every deal are accountable." },
  { icon: LineChart, title: "Browse or list", body: "Search vetted listings by category, income and price — or submit your own business for review." },
  { icon: CheckCircle2, title: "Close with escrow", body: "Funds and assets move through our escrow partner, released only once transfer is confirmed." },
];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  websites: Globe,
  "e-commerce": ShoppingBag,
  "youtube-channels": PlaySquare,
  "social-media-accounts": Users,
  newsletters: Mail,
  saas: Layers,
  "amazon-stores-kdp": Package,
  "plugins-themes-extensions": Puzzle,
  "apps-tools": Smartphone,
  games: Gamepad2,
  "crypto-blockchain": Bitcoin,
  "digital-agencies": Briefcase,
  "service-business": Handshake,
  domains: Link2,
};

const STATS: [string, string][] = [
  ["$18.4M", "Transacted to date"],
  ["640+", "Verified listings"],
  ["11 days", "Avg. time to close"],
  ["4.8 / 5", "Buyer satisfaction"],
];

export default async function Home() {
  const featured = await getPublishedListings(3);
  const spotlight = featured[0];

  return (
    <main className="overflow-x-hidden">
      {/* HERO */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-brand/20 blur-[110px]" />
          <div className="absolute -right-24 top-10 h-[26rem] w-[26rem] rounded-full bg-brand-strong/15 blur-[110px]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-rule to-transparent" />
        </div>

        <div className="mx-auto grid max-w-6xl gap-14 px-5 sm:px-7 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div>
            <span className="mono inline-flex items-center gap-2 rounded-full border border-rule-strong bg-paper-raised px-3.5 py-1.5 text-[0.68rem] uppercase tracking-wider text-ink-soft shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Online business marketplace
            </span>

            <h1 className="mt-5 text-[2.5rem] leading-[1.08] font-semibold sm:text-6xl">
              The ultimate hub for{" "}
              <span className="bg-gradient-to-r from-brand to-brand-strong bg-clip-text text-transparent">
                digital assets
              </span>
              .
            </h1>

            <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-ink-soft">
              Durqo lists verified websites, SaaS products, domains, YouTube channels, social accounts and newsletters for sale — every listing checked, every deal escrowed.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/buy"
                className="group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_32px_-14px_rgba(79,175,131,0.65)] transition hover:-translate-y-0.5 hover:bg-brand/90"
              >
                Explore Marketplace
                <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/sell"
                className="inline-flex items-center gap-2 rounded-full bg-brand-strong px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_32px_-14px_rgba(28,36,84,0.55)] transition hover:-translate-y-0.5 hover:bg-brand-strong/90"
              >
                Sell your Business
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
              {TRUST_CHIPS.map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-xs font-medium text-ink-faint">
                  <Icon size={14} className="text-brand" />
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-rule pt-7 sm:flex sm:flex-wrap">
              {STATS.map(([n, l]) => (
                <div key={l}>
                  <div className="mono text-2xl font-bold text-brand-strong">{n}</div>
                  <div className="mt-0.5 text-xs text-ink-faint">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* spotlight card */}
          {spotlight && (
            <div className="relative">
              <div className="relative rounded-[1.75rem] border border-rule bg-paper-raised p-7 shadow-[0_32px_64px_-28px_rgba(15,23,41,0.32)] ring-1 ring-black/[0.02]">
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
                  <Link href={`/listing/${spotlight.id}`} className="group inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90">
                    View listing
                    <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>

              <div className="absolute -right-4 -top-4 hidden items-center gap-2 rounded-2xl border border-rule bg-paper-raised px-4 py-2.5 shadow-[0_18px_36px_-18px_rgba(15,23,41,0.35)] sm:flex">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-brand">
                  <ShieldCheck size={16} />
                </span>
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-ink">Escrow Active</div>
                  <div className="text-[0.65rem] text-ink-faint">Funds secured</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-t border-rule py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-7">
          <p className="mono mb-2 text-xs uppercase tracking-wider text-ink-faint">Categories</p>
          <h2 className="mb-9 text-3xl sm:text-4xl">Fourteen kinds of digital assets, one trusted marketplace</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICONS[c.id] ?? Globe;
              return (
                <Link
                  key={c.id}
                  href={`/buy?category=${c.id}`}
                  className="group flex flex-col gap-3 rounded-2xl border border-rule bg-paper-raised p-6 shadow-[0_1px_2px_rgba(15,23,41,0.04)] transition hover:-translate-y-1 hover:border-brand hover:shadow-[0_20px_40px_-20px_rgba(15,23,41,0.25)]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand-strong transition group-hover:bg-brand group-hover:text-white">
                    <Icon size={20} />
                  </span>
                  <span className="text-lg font-semibold">{c.name}</span>
                  <span className="text-sm text-ink-soft">{c.description}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* LATEST LISTINGS */}
      <section className="border-t border-rule py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-7">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mono mb-2 text-xs uppercase tracking-wider text-ink-faint">Latest listings</p>
              <h2 className="text-3xl sm:text-4xl">On the market this week</h2>
            </div>
            <Link href="/buy" className="group inline-flex items-center gap-1.5 rounded-full border border-rule-strong px-5 py-2.5 text-sm font-semibold hover:border-brand hover:text-brand">
              View all listings
              <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
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
      <section className="relative overflow-hidden border-t border-rule bg-brand-soft/50 py-16 sm:py-20">
        <div aria-hidden className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-brand/15 blur-[100px]" />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-7">
          <p className="mono mb-2 text-xs uppercase tracking-wider text-ink-faint">How it works</p>
          <h2 className="mb-9 text-3xl sm:text-4xl">
            From browsing to close, in{" "}
            <span className="bg-gradient-to-r from-brand to-brand-strong bg-clip-text text-transparent">three steps</span>
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="relative rounded-2xl border border-rule bg-paper-raised p-7 pt-9 shadow-[0_1px_2px_rgba(15,23,41,0.04)] transition hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(15,23,41,0.25)]">
                <span className="mono absolute -top-4 left-6 grid h-9 w-9 place-items-center rounded-xl bg-brand text-sm font-bold text-white shadow-[0_10px_20px_-8px_rgba(79,175,131,0.7)]">
                  0{i + 1}
                </span>
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand-strong">
                  <Icon size={20} />
                </span>
                <h4 className="text-lg font-semibold">{title}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY DURQO */}
      <section className="border-t border-rule py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 sm:px-7 md:grid-cols-2 md:items-center">
          <div>
            <p className="mono mb-2 text-xs uppercase tracking-wider text-ink-faint">Why Durqo</p>
            <h2 className="mb-8 text-3xl sm:text-4xl">Built for people who read the fine print</h2>
            <div className="flex flex-col gap-6">
              {WHY.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-4">
                  <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-strong">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h4 className="text-base font-semibold">{title}</h4>
                    <p className="mt-1 max-w-[56ch] text-sm leading-relaxed text-ink-soft">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* decorative premium panel */}
          <div className="relative hidden md:block">
            <div aria-hidden className="pointer-events-none absolute -inset-8 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-soft to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-rule bg-gradient-to-br from-paper-raised to-brand-soft/40 p-6 shadow-[0_32px_64px_-28px_rgba(15,23,41,0.28)]">
              <div className="mb-5 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-gold/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-brand/60" />
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-5">
                <div className="space-y-3">
                  <div className="h-3 w-2/3 rounded-full bg-rule-strong/70" />
                  <div className="h-24 rounded-xl bg-paper-raised/80 shadow-inner" />
                  <div className="h-3 w-1/2 rounded-full bg-rule-strong/70" />
                  <div className="flex items-end gap-1.5 pt-1">
                    {[40, 65, 50, 80, 60, 95].map((h, i) => (
                      <div key={i} className="w-4 rounded-t-sm bg-brand/70" style={{ height: `${h * 0.5}px` }} />
                    ))}
                  </div>
                </div>
                <div className="grid h-24 w-24 shrink-0 place-items-center self-center rounded-full border-[6px] border-brand/25">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-brand text-white">
                    <Sparkles size={22} />
                  </span>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 rounded-2xl border border-rule bg-paper-raised px-4 py-3 shadow-sm">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-brand">
                  <ShieldCheck size={16} />
                </span>
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-ink">Escrow Active</div>
                  <div className="text-[0.65rem] text-ink-faint">Secured Node #429</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-rule py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-7">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-strong to-[#0f1638] p-10 text-white sm:p-14">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand/25 blur-[100px]" />
            <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10 blur-[100px]" />
            <div className="relative flex flex-wrap items-center justify-between gap-8">
              <div>
                <span className="mono inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[0.68rem] uppercase tracking-wider text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  Start today
                </span>
                <h2 className="mt-4 max-w-[24ch] text-2xl text-white sm:text-3xl">Ready to make your first deal?</h2>
                <p className="mt-2 max-w-[44ch] text-white/75">
                  Browse hundreds of verified listings, or get a free valuation on the business you&rsquo;re ready to sell.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/buy" className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-brand-strong shadow-lg transition hover:-translate-y-0.5 hover:bg-white/90">
                  Browse listings
                  <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                </Link>
                <Link href="/sell" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white">
                  Get a valuation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
