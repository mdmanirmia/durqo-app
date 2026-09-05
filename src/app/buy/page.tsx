"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { LayoutGrid, List, BadgeCheck, SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/categories";
import { MONETIZATION_TYPES } from "@/lib/monetization-types";
import { fetchPublishedListings } from "@/lib/data/listings.client";
import type { Listing } from "@/lib/types";
import { fmtUSD } from "@/lib/format";
import ListingCard from "@/components/ListingCard";
import Container from "@/components/ui/Container";

function FilterPanel({
  keyword, setKeyword,
  incomeGenerating, setIncomeGenerating,
  categoryIds, toggleCategory,
  priceMin, setPriceMin, priceMax, setPriceMax,
  ageMin, setAgeMin, ageMax, setAgeMax,
  verifiedOnly, setVerifiedOnly,
  monetizationId, setMonetizationId,
  onClear,
}: {
  keyword: string; setKeyword: (v: string) => void;
  incomeGenerating: "" | "yes" | "no"; setIncomeGenerating: (v: "" | "yes" | "no") => void;
  categoryIds: string[]; toggleCategory: (id: string) => void;
  priceMin: string; setPriceMin: (v: string) => void; priceMax: string; setPriceMax: (v: string) => void;
  ageMin: string; setAgeMin: (v: string) => void; ageMax: string; setAgeMax: (v: string) => void;
  verifiedOnly: boolean; setVerifiedOnly: (v: boolean) => void;
  monetizationId: string; setMonetizationId: (v: string) => void;
  onClear: () => void;
}) {
  const fieldCls = "w-full rounded-md border border-rule-strong bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand-strong focus:outline-none";
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Keyword</h4>
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Search listings…" className={fieldCls} />
      </div>

      <div>
        <h4 className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Income generating</h4>
        {(["", "yes", "no"] as const).map((v) => (
          <label key={v || "any"} className="flex items-center gap-2 py-1 text-sm text-ink">
            <input type="radio" name="incomeGen" checked={incomeGenerating === v} onChange={() => setIncomeGenerating(v)} className="accent-brand" />
            {v === "" ? "Any" : v === "yes" ? "Yes" : "No"}
          </label>
        ))}
      </div>

      <div>
        <h4 className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Asset categories</h4>
        <div className="flex max-h-56 flex-col gap-1 overflow-y-auto pr-1">
          {CATEGORIES.map((c) => (
            <label key={c.id} className="flex items-center gap-2 py-0.5 text-sm text-ink">
              <input type="checkbox" checked={categoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} className="accent-brand" />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Asking price</h4>
        <div className="flex gap-2">
          <input value={priceMin} onChange={(e) => setPriceMin(e.target.value)} type="number" placeholder="Min" className={fieldCls} />
          <input value={priceMax} onChange={(e) => setPriceMax(e.target.value)} type="number" placeholder="Max" className={fieldCls} />
        </div>
      </div>

      <div>
        <h4 className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Business age (years)</h4>
        <div className="flex gap-2">
          <input value={ageMin} onChange={(e) => setAgeMin(e.target.value)} type="number" placeholder="Min" className={fieldCls} />
          <input value={ageMax} onChange={(e) => setAgeMax(e.target.value)} type="number" placeholder="Max" className={fieldCls} />
        </div>
      </div>

      <div>
        <h4 className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Monetization type</h4>
        <select value={monetizationId} onChange={(e) => setMonetizationId(e.target.value)} className={fieldCls}>
          <option value="">Any</option>
          {MONETIZATION_TYPES.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="accent-brand" />
        Verified listings only
      </label>

      <button onClick={onClear} className="rounded-md border border-rule-strong py-2 text-sm font-semibold text-ink hover:border-brand-strong">
        Clear filters
      </button>
    </div>
  );
}

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
  const [view, setView] = useState<"cards" | "table">("cards");
  const [filtersOpen, setFiltersOpen] = useState(false);

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function clearFilters() {
    setKeyword(""); setCategoryIds([]); setIncomeGenerating(""); setPriceMin(""); setPriceMax("");
    setAgeMin(""); setAgeMax(""); setVerifiedOnly(false); setMonetizationId("");
  }

  const results = useMemo(() => {
    // fetchPublishedListings already scopes this to published + sold (sold
    // listings stay visible with a Sold badge instead of vanishing) — no
    // extra status filter needed here.
    let list = listings ?? [];

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

  const filterProps = {
    keyword, setKeyword, incomeGenerating, setIncomeGenerating, categoryIds, toggleCategory,
    priceMin, setPriceMin, priceMax, setPriceMax, ageMin, setAgeMin, ageMax, setAgeMax,
    verifiedOnly, setVerifiedOnly, monetizationId, setMonetizationId, onClear: clearFilters,
  };

  return (
    <main className="border-b border-rule py-10 sm:py-12">
      <Container>
        <p className="mono mb-2 text-xs uppercase tracking-wider text-ink-faint">Marketplace</p>
        <h1 className="mb-3 text-3xl sm:text-4xl">Buy an online business</h1>
        <p className="mb-8 max-w-[60ch] text-ink-soft">
          Every listing below has passed identity and income verification. Filter by category, price, age or income to find your next acquisition.
        </p>

        <div className="grid gap-8 md:grid-cols-[260px_1fr]">
          <aside className="hidden h-max flex-col gap-6 rounded-xl border border-rule bg-paper-raised p-5 md:sticky md:top-24 md:flex">
            <FilterPanel {...filterProps} />
          </aside>

          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-rule-strong px-3 py-2 text-xs font-semibold text-ink md:hidden"
                >
                  <SlidersHorizontal size={13} /> Filters
                </button>
                <p className="text-sm text-ink-soft">{results.length} listing{results.length === 1 ? "" : "s"}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-0.5 rounded-md border border-rule-strong bg-paper-raised p-0.5">
                  <button
                    type="button"
                    onClick={() => setView("cards")}
                    aria-pressed={view === "cards"}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      view === "cards" ? "bg-brand-strong text-white" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    <LayoutGrid size={13} /> Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("table")}
                    aria-pressed={view === "table"}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      view === "table" ? "bg-brand-strong text-white" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    <List size={13} /> Table
                  </button>
                </div>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-md border border-rule-strong bg-paper-raised px-3 py-2 text-sm text-ink focus:border-brand-strong focus:outline-none">
                  <option value="featured">Sort: Featured</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="income-desc">Income: high to low</option>
                </select>
              </div>
            </div>

            {listings === null ? (
              <p className="py-16 text-center text-ink-faint">Loading listings…</p>
            ) : results.length ? view === "cards" ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-rule bg-paper-raised">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead className="bg-paper-sunk">
                    <tr className="border-b border-rule-strong text-left">
                      <th className="px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-wide text-ink-faint">Title</th>
                      <th className="px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-wide text-ink-faint">Category</th>
                      <th className="px-4 py-3 text-right text-[0.68rem] font-semibold uppercase tracking-wide text-ink-faint">Asking price</th>
                      <th className="px-4 py-3 text-right text-[0.68rem] font-semibold uppercase tracking-wide text-ink-faint">Business age</th>
                      <th className="px-4 py-3 text-right text-[0.68rem] font-semibold uppercase tracking-wide text-ink-faint">Monthly income</th>
                      <th className="px-4 py-3 text-center text-[0.68rem] font-semibold uppercase tracking-wide text-ink-faint">Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((l) => {
                      const category = CATEGORY_MAP[l.categoryId];
                      const income = l.quickStats.monthly_income as number | undefined;
                      return (
                        <tr key={l.id} className="border-b border-rule last:border-0 hover:bg-paper-sunk">
                          <td className="px-4 py-3">
                            <Link href={`/listing/${l.id}`} className="font-semibold text-ink hover:text-brand-strong hover:underline">
                              {l.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-ink-soft">{category?.name ?? l.categoryId}</td>
                          <td className="mono px-4 py-3 text-right">{fmtUSD(l.discountedPrice ?? l.price)}</td>
                          <td className="mono px-4 py-3 text-right">{l.businessAgeYears ? `${l.businessAgeYears} yrs` : "New"}</td>
                          <td className="mono px-4 py-3 text-right">{income ? fmtUSD(income) : "—"}</td>
                          <td className="px-4 py-3 text-center">
                            {l.isVerified ? (
                              <BadgeCheck size={16} className="mx-auto text-brand" aria-label="Verified" />
                            ) : (
                              <span className="text-ink-faint">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-rule-strong py-16 text-center text-ink-faint">No listings match those filters.</p>
            )}
          </div>
        </div>
      </Container>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-xs flex-col overflow-y-auto bg-paper-raised p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Filters</h3>
              <button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)} className="grid h-8 w-8 place-items-center rounded-md border border-rule-strong text-ink">
                <X size={16} />
              </button>
            </div>
            <FilterPanel {...filterProps} />
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="mt-6 rounded-md bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              Show {results.length} listing{results.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}
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
