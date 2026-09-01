"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CATEGORIES, CATEGORY_MAP, QUICK_STAT_LABELS, QuickStatKey } from "@/lib/categories";
import { QUICK_STAT_COLUMNS } from "@/lib/data/map-listing";
import { updateListing, setListingStatus } from "../../../actions";

// Same text/date-vs-numeric split as the seller "new listing" form
// (dashboard/seller/listings/new/page.tsx) — kept in sync deliberately so a
// value typed here round-trips through the same column the create flow
// writes to.
const TEXT_QUICK_STAT_KEYS = new Set<QuickStatKey>(["location", "domain_age", "domain_registrar"]);
const DATE_QUICK_STAT_KEYS = new Set<QuickStatKey>(["domain_expires"]);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const WEBSITES_COMPUTED_QUICK_STAT_KEYS = new Set<QuickStatKey>(["monthly_income", "monthly_views", "authority_score"]);

const inputCls = "rounded-md border border-rule-strong bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand-strong focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-ink-soft">{label}</label>
      {children}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ListingRow = Record<string, any>;

export default function EditListingForm({ listing }: { listing: ListingRow }) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState<string>(listing.category_id);
  const category = CATEGORY_MAP[categoryId] ?? CATEGORIES[0];

  const [title, setTitle] = useState(listing.title ?? "");
  const [businessUrl, setBusinessUrl] = useState(listing.business_url ?? "");
  const [location, setLocation] = useState(listing.location ?? "");
  const [price, setPrice] = useState(String(listing.price ?? ""));
  const [discountedPrice, setDiscountedPrice] = useState(listing.discounted_price != null ? String(listing.discounted_price) : "");
  const [overview, setOverview] = useState(listing.overview ?? "");
  const [saleIncludesAssets, setSaleIncludesAssets] = useState(listing.sale_includes_assets ?? "");
  const [saleIncludesSupport, setSaleIncludesSupport] = useState(listing.sale_includes_support ?? "");

  const initialQuickStats: Record<string, string> = {};
  for (const key of category.quickStats) {
    const column = QUICK_STAT_COLUMNS[key];
    const v = listing[column];
    if (v !== null && v !== undefined) initialQuickStats[key] = String(v);
  }
  const [quickStats, setQuickStats] = useState<Record<string, string>>(initialQuickStats);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState<string>(listing.status);

  function handleCategoryChange(id: string) {
    setCategoryId(id);
    const next: Record<string, string> = {};
    const cfg = CATEGORY_MAP[id];
    for (const key of cfg.quickStats) {
      const column = QUICK_STAT_COLUMNS[key];
      const v = listing[column];
      if (v !== null && v !== undefined) next[key] = String(v);
    }
    setQuickStats(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const quickStatColumns: Record<string, unknown> = {};
      for (const key of category.quickStats) {
        const raw = quickStats[key];
        if (raw === undefined || raw === "") continue;
        const column = QUICK_STAT_COLUMNS[key];
        if (DATE_QUICK_STAT_KEYS.has(key)) {
          if (ISO_DATE_RE.test(raw)) quickStatColumns[column] = raw;
        } else if (TEXT_QUICK_STAT_KEYS.has(key)) {
          quickStatColumns[column] = raw;
        } else {
          const n = Number(raw);
          if (!Number.isNaN(n)) quickStatColumns[column] = n;
        }
      }

      await updateListing(listing.id, {
        title,
        categoryId,
        businessUrl: businessUrl || null,
        location: location || null,
        price: Number(price),
        discountedPrice: discountedPrice ? Number(discountedPrice) : null,
        overview,
        saleIncludesAssets,
        saleIncludesSupport,
        quickStatColumns,
      });
      setSaved(true);
      setTimeout(() => router.push("/dashboard/admin/listings"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong saving the listing.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setError(null);
    setPublishing(true);
    try {
      await setListingStatus(listing.id, "published" as never);
      setStatus("published");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't publish this listing.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-xl">Edit Listing</h2>
          <p className="text-sm text-ink-faint">
            Core details only —{" "}
            <Link href={`/listing/${listing.id}`} className="text-brand-strong hover:underline">
              view the full public listing
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business title">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Category">
          <select value={categoryId} onChange={(e) => handleCategoryChange(e.target.value)} className={inputCls}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business URL">
          <input type="url" value={businessUrl} onChange={(e) => setBusinessUrl(e.target.value)} placeholder="https://" className={inputCls} />
        </Field>
        <Field label="Business location">
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country (or Remote)" className={inputCls} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Asking price (USD)">
          <input required type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Discounted price (USD, optional)">
          <input type="number" min="0" value={discountedPrice} onChange={(e) => setDiscountedPrice(e.target.value)} className={inputCls} />
        </Field>
      </div>

      <section className="border-t border-rule pt-8">
        <h3 className="text-lg">Quick Statistics</h3>
        <p className="mb-4 mt-1 text-sm text-ink-faint">Fields shown are specific to {category.name}.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {category.quickStats
            .filter((key: QuickStatKey) => !(categoryId === "websites" && WEBSITES_COMPUTED_QUICK_STAT_KEYS.has(key)))
            .map((key: QuickStatKey) => (
              <Field key={key} label={QUICK_STAT_LABELS[key]}>
                <input
                  value={quickStats[key] ?? ""}
                  onChange={(e) => setQuickStats((prev) => ({ ...prev, [key]: e.target.value }))}
                  className={inputCls}
                />
              </Field>
            ))}
        </div>
        {categoryId === "websites" && (
          <p className="mt-3 text-xs text-ink-faint">
            Monthly Income, Monthly Views and Authority Score are computed automatically from the seller&rsquo;s Proof of Income / Google Analytics / SEMrush data and aren&rsquo;t editable here.
          </p>
        )}
      </section>

      <section className="border-t border-rule pt-8">
        <h3 className="text-lg">Overview of the Business</h3>
        <textarea required rows={5} value={overview} onChange={(e) => setOverview(e.target.value)} className={`${inputCls} mt-4 w-full`} />
      </section>

      <section className="border-t border-rule pt-8">
        <h3 className="text-lg">Sale Includes</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Assets included">
            <textarea rows={3} value={saleIncludesAssets} onChange={(e) => setSaleIncludesAssets(e.target.value)} className={`${inputCls} w-full`} />
          </Field>
          <Field label="Post-sale support">
            <textarea rows={3} value={saleIncludesSupport} onChange={(e) => setSaleIncludesSupport(e.target.value)} className={`${inputCls} w-full`} />
          </Field>
        </div>
      </section>

      <div className="flex items-center gap-4 border-t border-rule pt-8">
        <button type="submit" disabled={saving} className="rounded-md bg-brand px-8 py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60">
          {saving ? "Saving…" : "Save Changes"}
        </button>
        {(status === "draft" || status === "pending_review") && (
          <button
            type="button"
            disabled={publishing}
            onClick={handlePublish}
            className="rounded-md border border-rule-strong px-6 py-3 text-sm font-semibold text-ink-soft hover:border-brand-strong hover:text-brand-strong disabled:opacity-60"
          >
            {publishing ? "Publishing…" : "Publish"}
          </button>
        )}
        <Link href="/dashboard/admin/listings" className="text-sm font-semibold text-ink-soft hover:text-ink">
          Cancel
        </Link>
      </div>
      {status === "published" && <p className="text-sm text-brand-strong">This listing is live and published.</p>}
      {saved && <p className="text-sm text-brand-strong">Saved — redirecting…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
