import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Listing } from "@/lib/types";
import { CATEGORY_MAP, QUICK_STAT_LABELS, QuickStatKey } from "@/lib/categories";
import { fmtUSD, formatQuickStat } from "@/lib/format";
import Sparkline from "./Sparkline";
import WishlistButton from "./WishlistButton";

export default function ListingCard({ listing }: { listing: Listing }) {
  const category = CATEGORY_MAP[listing.categoryId];
  const trend = listing.monthlyStats.map((m) => m.income ?? 0).filter((v) => v > 0);

  // Show the first 2 quick stats that are actually meaningful for THIS
  // listing's category (e.g. Domains shows Domain Age / Expires, YouTube
  // shows Monthly Income / Monthly Views) rather than a fixed pair —
  // "location" is skipped here since it's text, not a compact stat.
  const cardStats = (category?.quickStats ?? [])
    .filter((key: QuickStatKey) => key !== "location" && listing.quickStats[key] !== undefined)
    .slice(0, 2);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-rule bg-paper-raised p-5 shadow-[0_1px_2px_rgba(15,23,41,0.04)] transition hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_12px_24px_-12px_rgba(15,23,41,0.18)]">
      <div className="flex items-start justify-between">
        <span className="mono rounded-full bg-brand-soft px-2.5 py-1 text-[0.65rem] uppercase tracking-wide text-brand">
          {category?.name ?? listing.categoryId}
        </span>
        {listing.isVerified && (
          <span className="flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-white">
            <BadgeCheck size={13} /> Verified
          </span>
        )}
      </div>

      <h4 className="text-lg font-semibold">{listing.title}</h4>
      <p className="line-clamp-2 flex-grow text-sm text-ink-soft">{listing.overview}</p>

      {trend.length > 1 && <Sparkline values={trend} />}

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

      <div className="flex items-center justify-between border-t border-rule pt-3">
        <span className="mono text-base font-bold text-brand">{fmtUSD(listing.discountedPrice ?? listing.price)}</span>
        <div className="flex gap-2">
          <WishlistButton listingId={listing.id} />
          <Link href={`/listing/${listing.id}`} className="rounded-full bg-brand px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-brand/90">
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
