"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { MONETIZATION_TYPES } from "@/lib/monetization-types";
import { fetchPublishedListings } from "@/lib/data/listings.client";
import type { Listing } from "@/lib/types";
import ListingCard from "@/components/ListingCard";

function BuyContent() {
  const params = useSearchParams();
  const initialCategory = params.get("category");

  const [listings, setListings] = useState<Listing[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchPublishedListings().then((data) => {
      if (!cancelled) setListings(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const [keyword, setKeyword] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>(initialCategory ? [initialCategory] : []);
  const [incomeGenerating, setIncomeGenerating] = useState<"" | "yes" | "no">("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [monetizationId, setMonetizationId] = useState("");
  const [sort, setSort] = useState("featured");

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  const results = useMemo(() => {
    let list = (listings ?? []).filter((l) => l.status === "published");

    if (keyword.trim()) {
      const k = keyword.toLowerCase();
      list = list.filter((l) => l.title.toLowerCase().includes(k) || l.overview.toLowerCase().includes(k));
    }
    if (categoryIds.length) list = list.filter((l) => categoryIds.includes(l.categoryId));
    if (incomeGenerating === "yes") list = list.filter((l) => (l.quickStats.monthly_income as number) > 0);
    if (incomeGenerating === "no") list = list.filter((l) => !((l.quickStats.monthly_income as number) > 0));
    if (priceMin) list = list.filter((l) => l.price >= Number(priceMin));
    if (priceMax) list = list.filter((l) => l.price <= Number(priceMax));
    if (ageMin) list = list.filter((l) => (l.businessAgeYears ?? 0) >= Number(ageMin));
    if (ageMax) list = list.filter((l) => (l.businessAgeYears ?? 0) <= Number(ageMax));
    if (verifiedOnly) list = list.filter((l) => l.isVerified);
    if (monetizationId) list = list.filter((l) => l.monetizationTypeIds.includes(monetizationId));

    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "income-desc")
      list = [...list].sort((a, b) => ((b.quickStats.monthly_income as number) || 0) - ((a.quickStats.monthly_income as number) || 0));

    return list;
  }, [listings, keyword, categoryIds, incomeGenerating, priceMin, priceMax, ageMin, ageMax, verifiedOnly, monetizationId, sort]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-7">
      <p className="mono mb-2 text-xs uppercase tracking-wider text-ink-faint">Marketplace</p>
      <h1 className="mb-3 text-3xl">Buy an online business</h1>
      <p className="mb-8 max-w-[60ch] text-ink-soft">
        Every listing below has passed identity and income verification. Filter by category, price, age or income to find your next acquisition.
      </p>

      <div className="grid gap-9 md:grid-cols-[260px_1fr]">
        <aside className="flex h-max flex-col gap-6 rounded-lg border border-rule bg-paper-raised p-5 md:sticky md:top-24">
          <div>
            <h4 className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Keyword</h4>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search listings…"
              className="w-full rounded-lg border border-rule-strong bg-paper px-3 py-2 text-sm"
            />
          </div>

          <div>
            <h4 className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Income generating</h4>
            {(["", "yes", "no"] as const).map((v) => (
              <label key={v || "any"} className="flex items-center gap-2 py-1 text-sm">
                <input type="radio" name="incomeGen" checked={incomeGenerating === v} onChange={() => setIncomeGenerating(v)} className="accent-brand-strong" />
                {v === "" ? "Any" : v === "yes" ? "Yes" : "No"}
              </label>
            ))}
          </div>

          <div>
            <h4 className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Asset types</h4>
            <div className="flex max-h-56 flex-col gap-1 overflow-y-auto pr-1">
              {CATEGORIES.map((c) => (
                <label key={c.id} className="flex items-center gap-2 py-0.5 text-sm">
                  <input type="checkbox" checked={categoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} className="accent-brand-strong" />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Asking price</h4>
            <div className="flex gap-2">
              <input value={priceMin} onChange={(e) => setPriceMin(e.target.value)} type="number" placeholder="Min" className="w-full rounded-lg border border-rule-strong bg-paper px-2 py-1.5 text-sm" />
              <input value={priceMax} onChange={(e) => setPriceMax(e.target.value)} type="number" placeholder="Max" className="w-full rounded-lg border border-rule-strong bg-paper px-2 py-1.5 text-sm" />
            </div>
          </div>

          <div>
            <h4 className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Business age (years)</h4>
            <div className="flex gap-2">
              <input value={ageMin} onChange={(e) => setAgeMin(e.target.value)} type="number" placeholder="Min" className="w-full rounded-lg border border-rule-strong bg-paper px-2 py-1.5 text-sm" />
              <input value={ageMax} onChange={(e) => setAgeMax(e.target.value)} type="number" placeholder="Max" className="w-full rounded-lg border border-rule-strong bg-paper px-2 py-1.5 text-sm" />
            </div>
          </div>

          <div>
            <h4 className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Monetization type</h4>
            <select value={monetizationId} onChange={(e) => setMonetizationId(e.target.value)} className="w-full rounded-lg border border-rule-strong bg-paper px-2 py-1.5 text-sm">
              <option value="">Any</option>
              {MONETIZATION_TYPES.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="accent-brand-strong" />
            Verified listings only
          </label>

          <button
            onClick={() => {
              setKeyword(""); setCategoryIds([]); setIncomeGenerating(""); setPriceMin(""); setPriceMax(""); setAgeMin(""); setAgeMax(""); setVerifiedOnly(false); setMonetizationId("");
            }}
            className="rounded-lg border border-rule-strong py-2 text-sm font-semibold hover:border-brand-strong"
          >
            Clear filters
          </button>
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">{results.length} listing{results.length === 1 ? "" : "s"}</p>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-rule-strong bg-paper-raised px-3 py-2 text-sm">
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="income-desc">Income: high to low</option>
            </select>
          </div>

          {listings === null ? (
            <p className="py-16 text-center text-ink-faint">Loading listings…</p>
          ) : results.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          ) : (
            <p className="py-16 text-center text-ink-faint">No listings match those filters.</p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function BuyPage() {
  return (
    <Suspense fallback={null}>
      <BuyContent />
    </Suspense>
  );
}
