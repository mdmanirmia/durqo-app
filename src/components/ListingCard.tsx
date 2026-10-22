import Link from "next/link";
import { BadgeCheck, MapPin, Globe, ArrowUpRight, CalendarClock } from "lucide-react";
import { Listing } from "@/lib/types";
import { CATEGORY_MAP } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { MONETIZATION_MAP } from "@/lib/monetization-types";
import { fmtUSD, fmtUSDOrNA, fmtAgeOrNA } from "@/lib/format";
import WishlistButton from "./WishlistButton";

// The one card used everywhere a listing is shown — homepage, /buy grid,
// dashboards. /buy's Table view is a different component (ListingsTable).
//
// Card-data honesty rules (buy-page redesign, Section 9): every field shows
// real data only. Revenue/Profit/Age show "N/A" when nobody recorded a
// value and "$0"/"New" only when that's the actual stored value — missing
// is never silently treated as zero (a change from this card's earlier
// always-"$0"-for-missing-income behavior).
// Oct 22, 2026 (card coloring pass): one accent color per category, used for
// the card's tinted header, icon and hover border so the grid reads at a
// glance. Unknown categories fall back to the brand green.
const CATEGORY_ACCENTS: Record<string, string> = {
  websites: "#2563EB",
  "e-commerce": "#D97706",
  "youtube-channels": "#DC2626",
  "social-media-accounts": "#DB2777",
  saas: "#7C3AED",
  "ai-apps-tools": "#0D9488",
  "apps-tools": "#0284C7",
  "startup-business": "#EA580C",
  "plugins-themes-extensions": "#4F46E5",
  domains: "#0891B2",
  "amazon-stores-kdp": "#CA8A04",
  "service-business": "#059669",
  "digital-agencies": "#9333EA",
  games: "#E11D48",
  newsletters: "#C2410C",
  "crypto-blockchain": "#6D28D9",
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const category = CATEGORY_MAP[listing.categoryId];
  // Compact category metadata only (Section 9) — a small line icon, not a
  // visual anchor, so it can never grow the card.
  const Icon = CATEGORY_ICONS[listing.categoryId] ?? Globe;

  const revenue = listing.quickStats.monthly_income as number | undefined;
  const expenseTotal = listing.monthlyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const profit = revenue !== undefined ? (listing.monthlyExpenses.length > 0 ? revenue - expenseTotal : revenue) : undefined;
  // Sep 8 2026 ("jei sob listing er location thakbena, oi sob listing er
  // card e location Remote deya thakbe" — a listing with no location set
  // should show "Remote" on its card instead of leaving the spot blank):
  // `||` (not `??`) so an empty-string value falls back too, same as the
  // truthiness check this used to gate on below.
  const location = (listing.quickStats.location as string | undefined) || listing.location || "Remote";

  const allTags = (listing.monetizationTypeIds ?? []).map((id) => MONETIZATION_MAP[id]).filter(Boolean);
  const tags = allTags.slice(0, 2);
  const extraTagCount = allTags.length - tags.length;

  const hasDiscount = listing.discountedPrice != null && listing.discountedPrice < listing.price;
  // Real, computed percentage off the original asking price (never rounded
  // up into a bigger claim than the actual discount).
  const discountPct = hasDiscount ? Math.floor((1 - (listing.discountedPrice as number) / listing.price) * 100) : 0;
  const isSold = listing.status === "sold";
  const href = `/listing/${listing.slug}`;
  const accent = CATEGORY_ACCENTS[listing.categoryId] ?? "#10B981";

  // Valuation multiple a buyer would compute themselves: asking price over
  // annual profit. Only shown when there's real, positive recorded profit.
  const askPrice = listing.discountedPrice ?? listing.price;
  const multiple = profit !== undefined && profit > 0 ? askPrice / (profit * 12) : undefined;

  // Oct 22, 2026 ("card er dekhte aro sundor kore and premium koro", then
  // "aro premium and professional koro"): premium redesign. Same data and
  // honesty rules as before. Each category gets a quiet accent color (thin
  // top rule, soft header tint, icon); everything else stays neutral so the
  // card reads as professional rather than colorful. Whole card is
  // clickable via the stretched title link; wishlist stays its own button.
  return (
    <div
      style={{ "--acc": accent } as React.CSSProperties}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-[0_1px_2px_rgba(11,19,36,0.04),0_8px_24px_-18px_rgba(11,19,36,0.18)] transition duration-300 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--acc)_35%,transparent)] hover:shadow-[0_30px_60px_-34px_rgba(11,19,36,0.38)]"
    >
      <span className="h-[3px] w-full" style={{ backgroundColor: accent }} aria-hidden />

      {/* Soft category header. */}
      <div
        className="flex items-center justify-between gap-3 border-b px-5 py-3.5"
        style={{
          background: "linear-gradient(180deg, color-mix(in srgb, var(--acc) 8%, #fff), color-mix(in srgb, var(--acc) 2%, #fff))",
          borderColor: "color-mix(in srgb, var(--acc) 14%, #E2E8F0)",
        }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white ring-1 ring-black/[0.06] transition-transform duration-300 group-hover:scale-105"
            style={{ color: accent }}
          >
            <Icon size={18} aria-hidden />
          </span>
          <span className="truncate text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
            {category?.name ?? listing.categoryId}
          </span>
        </div>
        <div className="relative z-10 flex shrink-0 items-center gap-2">
          {isSold && <span className="rounded-full bg-brand-strong px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-wide text-white">Sold</span>}
          <span className="rounded-full bg-white">
            <WishlistButton listingId={listing.id} size="lg" />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h4 className="line-clamp-2 text-[1.08rem] font-semibold leading-snug tracking-tight text-ink">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {listing.title}
          </Link>
          {listing.isVerified && (
            <BadgeCheck
              size={17}
              className="relative -top-px ml-1.5 inline-block text-brand"
              aria-label="Listing verified by Durqo"
            />
          )}
        </h4>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-soft">{listing.overview || "Not disclosed"}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-faint">
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {location}
          </span>
          {listing.businessAgeYears != null && (
            <span className="flex items-center gap-1">
              <CalendarClock size={12} /> {fmtAgeOrNA(listing.businessAgeYears)}
            </span>
          )}
          {listing.isVerified && <span className="font-medium text-brand-hover">Verified by Durqo</span>}
        </div>

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="rounded-md bg-paper-sunk px-2 py-1 text-[0.68rem] font-medium text-ink-soft">
                {t}
              </span>
            ))}
            {extraTagCount > 0 && (
              <span className="rounded-md bg-paper-sunk px-2 py-1 text-[0.68rem] font-medium text-ink-faint">+{extraTagCount}</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-4">
          <dl className="grid grid-cols-3 divide-x divide-rule rounded-xl border border-rule">
            {[
              { label: "Revenue/mo", value: fmtUSDOrNA(revenue), missing: revenue === undefined, good: false },
              { label: "Profit/mo", value: fmtUSDOrNA(profit), missing: profit === undefined, good: profit !== undefined && profit > 0 },
              {
                label: "Multiple",
                value: multiple !== undefined ? `${multiple.toFixed(1)}x` : "N/A",
                missing: multiple === undefined,
                good: false,
              },
            ].map(({ label, value, missing, good }) => (
              <div key={label} className="min-w-0 px-2.5 py-2.5">
                <dt className="whitespace-nowrap text-[0.56rem] font-semibold uppercase tracking-[0.02em] text-ink-faint">{label}</dt>
                <dd className={`mono mt-0.5 truncate text-[0.9rem] font-semibold ${missing ? "text-ink-faint" : good ? "text-brand-hover" : "text-ink"}`}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-rule px-5 py-4">
        <div className="min-w-0">
          <span className="block text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-ink-faint">Asking price</span>
          <div className="mono flex flex-wrap items-baseline gap-x-2">
            <span className="text-[1.3rem] font-bold tracking-tight text-ink">{fmtUSD(askPrice)}</span>
            {hasDiscount && (
              <>
                <span className="text-xs text-ink-faint line-through">{fmtUSD(listing.price)}</span>
                {discountPct > 0 && (
                  <span className="rounded-md bg-[#FEF2F2] px-1.5 py-0.5 text-[0.62rem] font-bold text-[#B91C1C]">-{discountPct}%</span>
                )}
              </>
            )}
          </div>
        </div>
        <span
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-strong px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 group-hover:gap-2 group-hover:bg-brand"
          aria-hidden
        >
          View Listing
          <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  );
}
