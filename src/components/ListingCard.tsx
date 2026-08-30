import Link from "next/link";
import { BadgeCheck, ArrowUpRight } from "lucide-react";
import { Listing } from "@/lib/types";
import { CATEGORIES, CATEGORY_MAP, QUICK_STAT_LABELS, QuickStatKey } from "@/lib/categories";
import { categoryIcon } from "@/lib/category-icons";
import { fmtUSD, formatQuickStat } from "@/lib/format";
import Sparkline from "./Sparkline";
import WishlistButton from "./WishlistButton";

// A handful of premium-feeling gradient tints, cycled by category so cards
// have visual variety even though most listings don't have an uploaded
// cover photo — a colored banner + big category icon reads far less "empty
// placeholder" than a flat white header.
const BANNER_TINTS = [
  "from-brand/25 via-brand-soft to-transparent",
  "from-brand-strong/20 via-gold-soft to-transparent",
  "from-gold/25 via-brand-soft to-transparent",
];

export default function ListingCard({ listing }: { listing: Listing }) {
  const category = CATEGORY_MAP[listing.categoryId];
  const trend = listing.monthlyStats.map((m) => m.income ?? 0).filter((v) => v > 0);
  const isWebsites = listing.categoryId === "websites";
  const catIndex = Math.max(0, CATEGORIES.findIndex((c) => c.id === listing.categoryId));
  const tint = BANNER_TINTS[catIndex % BANNER_TINTS.length];
  const hasDiscount = listing.discountedPrice != null && listing.discountedPrice < listing.price;

  // Show the first 2 quick stats that are actually meaningful for THIS
  // listing's category (e.g. Domains shows Domain Age / Expires, YouTube
  // shows Monthly Income / Monthly Views) rather than a fixed pair —
  // "location" is skipped here since it's text, not a compact stat.
  // Websites listings don't show this row at all — they get a dedicated
  // Business Age / Articles Posted row below the price instead.
  const cardStats = isWebsites
    ? []
    : (category?.quickStats ?? [])
        .filter((key: QuickStatKey) => key !== "location" && listing.quickStats[key] !== undefined)
        .slice(0, 2);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-[0_1px_2px_rgba(15,23,41,0.04)] transition hover:-translate-y-1 hover:border-brand hover:shadow-[0_24px_48px_-24px_rgba(15,23,41,0.25)]">
      <div className={`relative flex h-24 items-center justify-between bg-gradient-to-br ${tint} px-5`}>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-paper-raised/90 text-brand-strong shadow-sm backdrop-blur transition group-hover:scale-105">
          {[listing.categoryId].map((cid) => {
            const Icon = categoryIcon(cid);
            return <Icon key={cid} size={20} />;
          })}
        </span>
        <span className="mono rounded-full border border-rule-strong/60 bg-paper-raised/90 px-2.5 py-1 text-[0.65rem] uppercase tracking-wide text-ink-soft backdrop-blur">
          {category?.name ?? listing.categoryId}
        </span>
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          {listing.isVerified && (
            <span className="flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-white shadow-sm">
              <BadgeCheck size={13} /> Verified
            </span>
          )}
          {listing.status === "sold" && (
            <span className="rounded-full bg-ink px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-paper-raised shadow-sm">Sold</span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h4 className="text-lg font-semibold">{listing.title}</h4>
        <p className="line-clamp-2 flex-grow text-sm text-ink-soft">{listing.overview}</p>

        {trend.length > 1 && <Sparkline values={trend} />}

        {!isWebsites && (
          <div className="mono flex gap-4 text-sm">
            {cardStats.length > 0 ? (
              cardStats.map((key) => (
                <div key={key}>
                  <span className="block text-[0.62rem] uppercase tracking-wide text-ink-faint">{QUICK_STAT_LABELS[key]}</span>
                  {formatQuickStat(key, listing.quickStats[key])}
                </div>
              ))
            ) : (
              <div>
                <span className="block text-[0.62rem] uppercase tracking-wide text-ink-faint">Business Age</span>
                {listing.businessAgeYears ? `${listing.businessAgeYears} yrs` : "New"}
              </div>
            )}
          </div>
        )}

        {isWebsites && (
          <div className="mono flex gap-4 text-sm">
            <div>
              <span className="block text-[0.62rem] uppercase tracking-wide text-ink-faint">Business Age</span>
              {listing.businessAgeYears ? `${listing.businessAgeYears} yrs` : "New"}
            </div>
            <div>
              <span className="block text-[0.62rem] uppercase tracking-wide text-ink-faint">Articles Posted</span>
              {formatQuickStat("articles_posted", listing.quickStats.articles_posted)}
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-rule pt-3.5">
          <div>
            {hasDiscount && <span className="mono block text-xs text-ink-faint line-through">{fmtUSD(listing.price)}</span>}
            <span className="mono text-lg font-bold text-brand">{fmtUSD(listing.discountedPrice ?? listing.price)}</span>
          </div>
          <div className="flex gap-2">
            <WishlistButton listingId={listing.id} />
            <Link
              href={`/listing/${listing.id}`}
              className="group/btn inline-flex items-center gap-1 rounded-full bg-brand px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-brand/90"
            >
              View
              <ArrowUpRight size={14} className="transition group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
