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

  // Oct 22, 2026 ("card er dekhte aro sundor kore and premium koro"):
  // premium redesign. Same data and honesty rules as before; layout changes
  // only: category tile instead of the grey header band, metrics in a soft
  // panel, an "Asking price" footer, and the whole card is clickable
  // (stretched title link) while the wishlist button stays separately
  // clickable above it.
  return (
    <div
      style={{ "--acc": accent } as React.CSSProperties}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-[0_1px_2px_rgba(11,19,36,0.04)] transition duration-300 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--acc)_45%,transparent)] hover:shadow-[0_28px_56px_-30px_color-mix(in_srgb,var(--acc)_55%,transparent)]"
    >
      {/* Tinted category header with a dotted texture and a large faded
          icon watermark. */}
      <div
        className="relative overflow-hidden px-5 pb-4 pt-5"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--acc) 16%, #fff) 0%, color-mix(in srgb, var(--acc) 5%, #fff) 70%)",
        }}
      >
        <span
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(color-mix(in_srgb,var(--acc)_35%,transparent)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(110deg,transparent_35%,#000)]"
          aria-hidden
        />
        <Icon
          size={92}
          strokeWidth={1.25}
          className="pointer-events-none absolute -bottom-5 right-14 opacity-[0.09] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
          style={{ color: accent }}
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white shadow-[0_6px_14px_-6px_color-mix(in_srgb,var(--acc)_60%,transparent)] ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105"
              style={{ color: accent }}
            >
              <Icon size={20} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[0.68rem] font-bold uppercase tracking-wider" style={{ color: accent }}>
                {category?.name ?? listing.categoryId}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {listing.isVerified && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[0.65rem] font-semibold text-brand-hover ring-1 ring-brand/20"
                    aria-label="Listing verified by Durqo"
                  >
                    <BadgeCheck size={11} /> Verified
                  </span>
                )}
                {isSold && (
                  <span className="rounded-full bg-brand-strong px-2 py-0.5 text-[0.65rem] font-semibold text-white">Sold</span>
                )}
              </div>
            </div>
          </div>
          <div className="relative z-10 rounded-full bg-white/90">
            <WishlistButton listingId={listing.id} size="lg" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h4 className="line-clamp-2 text-[1.05rem] font-semibold leading-snug text-ink">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {listing.title}
          </Link>
        </h4>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-soft">{listing.overview || "Not disclosed"}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {location}
          </span>
          {listing.businessAgeYears != null && (
            <span className="flex items-center gap-1">
              <CalendarClock size={12} /> {fmtAgeOrNA(listing.businessAgeYears)}
            </span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium"
                style={{ color: accent, backgroundColor: `color-mix(in srgb, ${accent} 9%, #fff)` }}
              >
                {t}
              </span>
            ))}
            {extraTagCount > 0 && (
              <span className="rounded-full bg-paper-sunk px-2.5 py-0.5 text-[0.68rem] font-medium text-ink-faint">+{extraTagCount}</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Revenue/mo", value: revenue },
              { label: "Profit/mo", value: profit },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-rule bg-paper-sunk/50 px-3.5 py-2.5">
                <span className="block text-[0.6rem] font-semibold uppercase tracking-wider text-ink-faint">{label}</span>
                <span
                  className={`mono mt-0.5 block text-[0.95rem] font-semibold ${
                    value === undefined ? "text-ink-faint" : label === "Profit/mo" && value > 0 ? "text-brand-hover" : "text-ink"
                  }`}
                >
                  {fmtUSDOrNA(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 border-t border-dashed border-rule bg-paper-sunk/40 px-5 py-4">
        <div className="min-w-0">
          <span className="block text-[0.6rem] font-semibold uppercase tracking-wider text-ink-faint">Asking price</span>
          <div className="mono flex flex-wrap items-baseline gap-x-2">
            <span className="text-xl font-bold text-ink">{fmtUSD(listing.discountedPrice ?? listing.price)}</span>
            {hasDiscount && (
              <>
                <span className="text-xs text-ink-faint line-through">{fmtUSD(listing.price)}</span>
                {discountPct > 0 && (
                  <span className="rounded-full bg-[#FEE2E2] px-1.5 py-0.5 text-[0.62rem] font-bold text-[#B91C1C]">-{discountPct}%</span>
                )}
              </>
            )}
          </div>
        </div>
        <span
          className="flex shrink-0 items-center gap-1 rounded-xl bg-brand-strong px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(11,19,36,0.6)] transition-colors duration-300 group-hover:bg-brand"
          aria-hidden
        >
          View Listing
          <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  );
}
