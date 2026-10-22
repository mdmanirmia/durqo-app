"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import WishlistButton from "@/components/WishlistButton";
import { fmtUSD } from "@/lib/format";
import { Globe } from "lucide-react";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { CATEGORY_ACCENTS } from "@/lib/category-accents";

// Oct 19, 2026 ("ARO KI PHOTO OR VIDEO OR MOTION ... premium and
// professional" — "TUMI E SOB KISU KORBA"): the hero's single featured card
// became a small live showcase that rotates through the top few real
// listings (same ranking the old single spotlight used: revenue growth, then
// income, then price). Every slide is a real published, unsold listing; the
// trend badge is computed per listing from its own recorded monthly income
// and only shows a percentage when there are at least two real data points.
// Auto-advances every 3.6s (sped up from 5s on request), pauses on hover/focus, never auto-advances for
// prefers-reduced-motion (dots still work).
export interface ShowcaseSlide {
  id: string;
  slug: string;
  title: string;
  categoryId?: string;
  categoryName: string;
  description: string;
  revenue: number;
  profit: number;
  ageLabel: string;
  price: number;
  trendPercent: number | null;
  periodLabel: string;
  sparkPoints: number[];
}

const INTERVAL_MS = 2600;

export default function HeroShowcase({ slides }: { slides: ShowcaseSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % count),
      INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [count, paused]);

  if (count === 0) return null;
  const active = slides[index];
  const sparkMax = active.sparkPoints.length
    ? Math.max(...active.sparkPoints, 1)
    : 1;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Card + its deck share their own box, so the deck never reaches the
          trend badge that sits below the card on mobile. */}
      <div className="relative">
        {/* Two offset "deck" cards peeking out behind the active one. */}
        {count > 1 && (
          <>
            <div
              className="pointer-events-none absolute inset-x-5 -bottom-2.5 top-5 rounded-2xl border border-rule bg-paper-raised/80 lg:mr-8"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-10 -bottom-5 top-10 rounded-2xl border border-rule bg-paper-raised/50 lg:mr-8"
              aria-hidden
            />
          </>
        )}

        <div className="dq-float relative lg:mr-8">
          <div className="dq-border relative rounded-2xl border border-rule bg-paper-raised p-5 shadow-[0_1px_2px_rgba(11,19,36,0.05),0_8px_20px_-14px_rgba(11,19,36,0.18)] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <span className="eyebrow">Featured opportunity</span>
              {count > 1 && (
                <span className="mono rounded-full bg-paper-sunk px-2 py-0.5 text-[0.66rem] font-semibold text-ink-soft lg:invisible" aria-live="polite">
                  {index + 1} / {count}
                </span>
              )}
            </div>

            {/* All slides share one grid cell so the card keeps the height of
                the tallest slide. The outgoing slide fades out quickly before
                the incoming one fades in, so two listings never overlap. */}
            <div className="grid">
              {slides.map((s, i) => {
                const isActive = i === index;
                const accent = (s.categoryId && CATEGORY_ACCENTS[s.categoryId]) || "#10B981";
                const Icon = (s.categoryId && CATEGORY_ICONS[s.categoryId]) || Globe;
                return (
                  <div
                    key={s.id}
                    aria-hidden={!isActive}
                    className={`[grid-area:1/1] transition-[opacity,transform] ease-out ${
                      isActive
                        ? "translate-y-0 opacity-100 delay-100 duration-200"
                        : "pointer-events-none translate-y-1 opacity-0 delay-0 duration-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                        style={{ color: accent, backgroundColor: `color-mix(in srgb, ${accent} 12%, #fff)` }}
                        aria-hidden
                      >
                        <Icon size={20} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-[1.05rem] font-semibold tracking-tight text-ink">{s.title}</h3>
                        <p className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                          {s.categoryName}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed text-ink-soft">{s.description}</p>

                    <dl className="mt-4 grid grid-cols-3 divide-x divide-rule rounded-xl border border-rule">
                      {[
                        { label: "Revenue/mo", value: fmtUSD(s.revenue) },
                        { label: "Profit/mo", value: fmtUSD(s.profit), good: s.profit > 0 },
                        { label: "Age", value: s.ageLabel },
                      ].map(({ label, value, good }) => (
                        <div key={label} className="min-w-0 px-3 py-2.5">
                          <dt className="whitespace-nowrap text-[0.6rem] font-semibold uppercase tracking-[0.06em] text-ink-faint">{label}</dt>
                          <dd className={`mono mt-0.5 truncate text-[0.92rem] font-semibold ${good ? "text-brand-hover" : "text-ink"}`}>{value}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="mono text-[1.35rem] font-bold tracking-tight text-ink">{fmtUSD(s.price)}</span>
                      <div className="flex items-center gap-2">
                        <WishlistButton listingId={s.id} />
                        <Link
                          href={`/listing/${s.slug}`}
                          tabIndex={isActive ? undefined : -1}
                          className="flex min-h-11 items-center rounded-xl bg-brand-strong px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand"
                        >
                          View Listing
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {count > 1 && (
              <div className="mt-5 flex items-center gap-2 border-t border-rule pt-4" role="tablist" aria-label="Featured listings">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`Show ${s.title}`}
                    onClick={() => setIndex(i)}
                    className="group grid h-6 flex-1 place-items-center"
                  >
                    <span className="relative block h-1 w-full overflow-hidden rounded-full bg-rule transition-colors group-hover:bg-rule-strong">
                      {i === index && (
                        <span
                          key={`${index}-${paused}`}
                          className={`absolute inset-y-0 left-0 rounded-full bg-brand ${paused ? "w-full" : "dq-progress"}`}
                          style={{ animationDuration: `${INTERVAL_MS}ms` }}
                        />
                      )}
                      {i < index && <span className="absolute inset-0 rounded-full bg-brand/40" />}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue trend for the active slide. Keyed by slide so the bars
          replay their grow-in each time the showcase advances. */}
      {(active.trendPercent !== null || active.sparkPoints.length > 0) && (
        <div
          key={active.id}
          className="dq-pop relative z-10 mt-9 flex items-center gap-4 rounded-xl border border-rule bg-paper-raised px-4 py-3 shadow-[0_1px_2px_rgba(11,19,36,0.05),0_6px_14px_-10px_rgba(11,19,36,0.18)] lg:absolute lg:-right-3 lg:-top-7 lg:mt-0"
        >
          <div>
            {active.trendPercent !== null ? (
              <>
                <p className="mono text-lg font-bold text-brand">
                  {active.trendPercent > 0 ? "+" : ""}
                  {active.trendPercent}%
                </p>
                <p className="text-[0.65rem] text-ink-faint">Revenue growth</p>
                <p className="text-[0.6rem] text-ink-faint">
                  {active.periodLabel}
                </p>
              </>
            ) : (
              <>
                <p className="text-[0.78rem] font-semibold leading-snug text-ink-soft">
                  Revenue history
                </p>
                <p className="text-[0.65rem] text-ink-faint">
                  {active.periodLabel}
                </p>
              </>
            )}
          </div>
          {active.sparkPoints.length > 0 && (
            <div className="flex h-8 items-end gap-0.5" aria-hidden>
              {active.sparkPoints.map((v, i) => (
                <span
                  key={i}
                  className="dq-bar w-1.5 rounded-sm bg-brand"
                  style={
                    {
                      height: `${Math.max(15, (v / sparkMax) * 100)}%`,
                      "--d": `${40 + i * 25}ms`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
