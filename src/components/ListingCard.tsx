import Link from "next/link";
import { BadgeCheck, MapPin, Globe } from "lucide-react";
import { Listing } from "@/lib/types";
import { CATEGORY_MAP } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { MONETIZATION_MAP } from "@/lib/monetization-types";
import { fmtUSD, formatQuickStat } from "@/lib/format";
import { Badge } from "./ui/Badge";
import WishlistButton from "./WishlistButton";

// The one card used everywhere a listing is shown — homepage, /buy grid,
// /buy table isn't this component, but every card surface (homepage,
// marketplace, dashboards) renders the same shape so a listing never reads
// differently in two places. Every field falls back to "Not disclosed" /
// an em dash rather than leaving blank space or guessing a value — except
// Revenue/mo and Profit/mo specifically, which show "$0" when a listing has
// no income data at all (e.g. Domains, which has no Proof of Income section
// to derive monthly_income from), per user request Sep 5, 2026.
export default function ListingCard({ listing }: { listing: Listing }) {
  const category = CATEGORY_MAP[listing.categoryId];
  const Icon = CATEGORY_ICONS[listing.categoryId] ?? Globe;

  const revenue = listing.quickStats.monthly_income as number | undefined;
  const expenseTotal = listing.monthlyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const profit = revenue !== undefined ? (listing.monthlyExpenses.length > 0 ? revenue - expenseTotal : revenue) : undefined;
  const multiple = listing.quickStats.income_multiple as number | undefined;
  const location = (listing.quickStats.location as string | undefined) ?? listing.location ?? undefined;

  const tags = (listing.monetizationTypeIds ?? [])
    .map((id) => MONETIZATION_MAP[id])
    .filter(Boolean)
    .slice(0, 3);

  const hasDiscount = listing.discountedPrice != null && listing.discountedPrice < listing.price;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-rule bg-paper-raised transition hover:-translate-y-0.5 hover:border-rule-strong hover:shadow-[0_16px_32px_-20px_rgba(15,23,41,0.2)]">
      <div className="relative flex h-16 items-center justify-between border-b border-rule bg-paper-sunk px-4">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-paper-raised text-brand-strong">
          <Icon size={17} />
        </span>
        <div className="flex items-center gap-1.5">
          {listing.isVerified && <Badge tone="brand" icon={BadgeCheck}>Verified</Badge>}
          {listing.status === "sold" && <Badge tone="dark">Sold</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2 text-xs text-ink-faint">
          <span className="mono uppercase tracking-wide">{category?.name ?? listing.categoryId}</span>
          {location && (
            <>
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1"><MapPin size={11} />{location}</span>
            </>
          )}
        </div>

        <div>
          <h4 className="text-base font-semibold leading-snug text-ink">{listing.title}</h4>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-soft">{listing.overview || "Not disclosed"}</p>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="rounded-md border border-rule bg-paper-sunk px-2 py-0.5 text-[0.68rem] text-ink-soft">{t}</span>
            ))}
          </div>
        )}

        <div className="mono mt-auto grid grid-cols-3 gap-3 border-t border-rule pt-3 text-sm">
          <div>
            <span className="block text-[0.62rem] uppercase tracking-wide text-ink-faint">Revenue/mo</span>
            {fmtUSD(revenue ?? 0)}
          </div>
          <div>
            <span className="block text-[0.62rem] uppercase tracking-wide text-ink-faint">Profit/mo</span>
            {fmtUSD(profit ?? 0)}
          </div>
          <div>
            <span className="block text-[0.62rem] uppercase tracking-wide text-ink-faint">Age</span>
            {listing.businessAgeYears ? `${listing.businessAgeYears} yrs` : "New"}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-rule pt-3.5">
          <div className="mono">
            {hasDiscount && <span className="block text-xs text-ink-faint line-through">{fmtUSD(listing.price)}</span>}
            <span className="text-lg font-bold text-ink">{fmtUSD(listing.discountedPrice ?? listing.price)}</span>
            {multiple !== undefined && <span className="ml-1.5 text-xs text-ink-faint">({formatQuickStat("income_multiple", multiple)})</span>}
          </div>
          <div className="flex items-center gap-2">
            <WishlistButton listingId={listing.id} />
            <Link
              href={`/listing/${listing.id}`}
              className="rounded-lg bg-brand-strong px-3.5 py-2 text-sm font-semibold text-white hover:bg-navy-secondary"
            >
              View Listing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
