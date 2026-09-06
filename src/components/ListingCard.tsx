import Link from "next/link";
import { BadgeCheck, MapPin, Globe } from "lucide-react";
import { Listing } from "@/lib/types";
import { CATEGORY_MAP } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { MONETIZATION_MAP } from "@/lib/monetization-types";
import { fmtUSD, fmtUSDOrNA, fmtAgeOrNA } from "@/lib/format";
import { Badge } from "./ui/Badge";
import WishlistButton from "./WishlistButton";

// The one card used everywhere a listing is shown — homepage, /buy grid,
// dashboards. /buy's Table view is a different component (ListingsTable).
//
// Card-data honesty rules (buy-page redesign, Section 9): every field shows
// real data only. Revenue/Profit/Age show "N/A" when nobody recorded a
// value and "$0"/"New" only when that's the actual stored value — missing
// is never silently treated as zero (a change from this card's earlier
// always-"$0"-for-missing-income behavior).
export default function ListingCard({ listing }: { listing: Listing }) {
  const category = CATEGORY_MAP[listing.categoryId];
  // Compact category metadata only (Section 9) — a small line icon, not a
  // visual anchor, so it can never grow the card.
  const Icon = CATEGORY_ICONS[listing.categoryId] ?? Globe;

  const revenue = listing.quickStats.monthly_income as number | undefined;
  const expenseTotal = listing.monthlyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const profit = revenue !== undefined ? (listing.monthlyExpenses.length > 0 ? revenue - expenseTotal : revenue) : undefined;
  const location = (listing.quickStats.location as string | undefined) ?? listing.location ?? undefined;

  const allTags = (listing.monetizationTypeIds ?? []).map((id) => MONETIZATION_MAP[id]).filter(Boolean);
  const tags = allTags.slice(0, 2);
  const extraTagCount = allTags.length - tags.length;

  const hasDiscount = listing.discountedPrice != null && listing.discountedPrice < listing.price;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-rule bg-paper-raised transition hover:-translate-y-0.5 hover:border-rule-strong hover:shadow-[0_16px_32px_-20px_rgba(15,23,41,0.2)]">
      <div className="relative flex items-center justify-between border-b border-rule bg-paper-sunk px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
          <Icon size={20} className="shrink-0 text-ink-soft" aria-hidden />
          {category?.name ?? listing.categoryId}
        </span>
        <div className="flex items-center gap-1.5">
          {listing.isVerified && (
            <Badge tone="brand" icon={BadgeCheck} aria-label="Listing verified by Durqo">
              Verified
            </Badge>
          )}
          {listing.status === "sold" && <Badge tone="dark">Sold</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          {location ? (
            <span className="flex items-center gap-1 text-xs text-ink-faint">
              <MapPin size={11} />
              {location}
            </span>
          ) : (
            <span />
          )}
          <WishlistButton listingId={listing.id} size="lg" />
        </div>

        <div>
          <h4 className="text-base font-semibold leading-snug text-ink">{listing.title}</h4>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-soft">{listing.overview || "Not disclosed"}</p>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="rounded-md border border-rule bg-paper-sunk px-2 py-0.5 text-[0.68rem] text-ink-soft">
                {t}
              </span>
            ))}
            {extraTagCount > 0 && (
              <span className="rounded-md border border-rule bg-paper-sunk px-2 py-0.5 text-[0.68rem] text-ink-faint">+{extraTagCount}</span>
            )}
          </div>
        )}

        <div className="mono mt-auto grid grid-cols-3 gap-3 border-t border-rule pt-3 text-sm">
          <div>
            <span className="block text-[0.62rem] uppercase tracking-wide text-ink-faint">Revenue/mo</span>
            {fmtUSDOrNA(revenue)}
          </div>
          <div>
            <span className="block text-[0.62rem] uppercase tracking-wide text-ink-faint">Profit/mo</span>
            {fmtUSDOrNA(profit)}
          </div>
          <div>
            <span className="block text-[0.62rem] uppercase tracking-wide text-ink-faint">Age</span>
            {fmtAgeOrNA(listing.businessAgeYears)}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-rule pt-3.5">
          <div className="mono">
            {hasDiscount && <span className="block text-xs text-ink-faint line-through">{fmtUSD(listing.price)}</span>}
            <span className="text-lg font-bold text-ink">{fmtUSD(listing.discountedPrice ?? listing.price)}</span>
          </div>
          <Link
            href={`/listing/${listing.id}`}
            className="rounded-lg bg-brand-strong px-3.5 py-2 text-sm font-semibold text-white hover:bg-navy-secondary"
          >
            View Listing
          </Link>
        </div>
      </div>
    </div>
  );
}
