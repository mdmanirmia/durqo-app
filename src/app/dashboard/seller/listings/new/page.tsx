"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SELLER_NAV } from "@/lib/dashboard-nav";
import { CATEGORIES, CATEGORY_MAP, QUICK_STAT_LABELS, QuickStatKey } from "@/lib/categories";
import { MONETIZATION_TYPES } from "@/lib/monetization-types";
import { createClient } from "@/lib/supabase/client";
import { QUICK_STAT_COLUMNS } from "@/lib/data/map-listing";

const MONTHS = ["Sep 2025","Oct 2025","Nov 2025","Dec 2025","Jan 2026","Feb 2026","Mar 2026","Apr 2026","May 2026","Jun 2026","Jul 2026","Aug 2026"];
const MONTH_KEYS = ["2025-09-01","2025-10-01","2025-11-01","2025-12-01","2026-01-01","2026-02-01","2026-03-01","2026-04-01","2026-05-01","2026-06-01","2026-07-01","2026-08-01"];

// Which quick-stat columns are text/date vs numeric, so form values get
// converted to the right type before hitting Postgres.
const TEXT_QUICK_STAT_KEYS = new Set<QuickStatKey>(["location", "domain_age", "domain_registrar"]);
const DATE_QUICK_STAT_KEYS = new Set<QuickStatKey>(["domain_expires"]);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// For the Websites category, Monthly Income, Monthly Views and Authority
// Score are computed automatically (from Proof of Income, Google Analytics
// and SEMrush data collected further down this form) rather than typed in
// here — see mapListing() in map-listing.ts. Hide them from the generic
// Quick Statistics inputs so sellers aren't asked to enter values that are
// ignored.
const WEBSITES_COMPUTED_QUICK_STAT_KEYS = new Set<QuickStatKey>(["monthly_income", "monthly_views", "authority_score"]);

// Public bucket sellers' verification screenshots are uploaded to — buyers
// can view these directly (see the "View Images" lightbox on listing pages),
// so this must be a public bucket, not a private/signed-URL one.
const STORAGE_BUCKET = "listing-proofs";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-rule pt-8">
      <h2 className="text-xl">{title}</h2>
      {hint && <p className="mb-4 mt-1 text-sm text-ink-faint">{hint}</p>}
      <div className={hint ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-ink-soft">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "rounded-md border border-rule-strong bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand-strong focus:outline-none";

function NamedValueRows({
  rows,
  setRows,
  nameLabel,
  valueLabel,
}: {
  rows: { name: string; value: string }[];
  setRows: (rows: { name: string; value: string }[]) => void;
  nameLabel: string;
  valueLabel: string;
}) {
  function update(i: number, key: "name" | "value", v: string) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
  }
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <input placeholder={nameLabel} value={r.name} onChange={(e) => update(i, "name", e.target.value)} className={`${inputCls} flex-grow`} />
          <input placeholder={valueLabel} value={r.value} onChange={(e) => update(i, "value", e.target.value)} className={`${inputCls} w-32`} />
          <button type="button" onClick={() => setRows(rows.filter((_, idx) => idx !== i))} className="grid w-9 shrink-0 place-items-center rounded-md border border-rule-strong text-ink-faint hover:border-danger hover:text-danger">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => setRows([...rows, { name: "", value: "" }])} className="flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-strong">
        <Plus size={14} /> Add row
      </button>
    </div>
  );
}

// Mirrors the "___ Images" gallery fields on the live durqo.com listing form —
// one small dedicated upload gallery per data type, placed right under that
// type's numbers, instead of one generic multi-purpose upload list.
function ImageGallery({
  label,
  hint,
  files,
  setFiles,
}: {
  label: string;
  hint?: string;
  files: File[];
  setFiles: (files: File[]) => void;
}) {
  return (
    <div className="mt-5 rounded-xl border border-rule bg-paper-raised p-4">
      <h5 className="text-sm font-semibold text-ink">{label}</h5>
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}

      {files.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <span key={i} className="flex items-center gap-1.5 rounded-md border border-rule-strong bg-paper px-3 py-1 text-xs text-ink-soft">
              {f.name}
              <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-ink-faint hover:text-danger">
                <Trash2 size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 rounded-md border border-dashed border-rule-strong px-3 py-2 text-sm text-ink-soft hover:border-brand-strong">
        <Upload size={14} className="shrink-0 text-ink-faint" />
        Add to gallery
        <input
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])])}
        />
      </label>
    </div>
  );
}

export default function AddNewBusinessPage() {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState("websites");
  const category = CATEGORY_MAP[categoryId];

  const [title, setTitle] = useState("");
  const [businessUrl, setBusinessUrl] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [overview, setOverview] = useState("");
  const [saleIncludesAssets, setSaleIncludesAssets] = useState("");
  const [saleIncludesSupport, setSaleIncludesSupport] = useState("");

  const [quickStats, setQuickStats] = useState<Record<string, string>>({});
  const [monthlyIncome, setMonthlyIncome] = useState<string[]>(Array(12).fill(""));
  const [loomVideoUrl, setLoomVideoUrl] = useState("");
  const [expenses, setExpenses] = useState([{ label: "", amount: "" }]);
  const [monetization, setMonetization] = useState<string[]>([]);

  const [gaAccessConfirmed, setGaAccessConfirmed] = useState(false);
  const [gaTotalUsers, setGaTotalUsers] = useState("");
  const [gaNewUsers, setGaNewUsers] = useState("");
  const [gaPageViews, setGaPageViews] = useState("");
  const [gaEngagementTime, setGaEngagementTime] = useState("");
  const [gaEngagementRate, setGaEngagementRate] = useState("");
  const [topChannels, setTopChannels] = useState([{ name: "", value: "" }]);
  const [topCountries, setTopCountries] = useState([{ name: "", value: "" }]);
  const [topDevices, setTopDevices] = useState([{ name: "", value: "" }]);

  const [gscClicks, setGscClicks] = useState("");
  const [gscImpressions, setGscImpressions] = useState("");
  const [gscIndexed, setGscIndexed] = useState("");
  const [gscNonIndexed, setGscNonIndexed] = useState("");
  const [gscCtr, setGscCtr] = useState("");

  const [semrush, setSemrush] = useState({ authority: "", traffic: "", keywords: "", top10: "", backlinks: "" });
  const [ahrefs, setAhrefs] = useState({ dr: "", ur: "", refDomains: "", keywords: "", backlinks: "" });

  const [socialStats, setSocialStats] = useState([{ name: "", value: "" }]);

  const [incomeImages, setIncomeImages] = useState<File[]>([]);
  const [gaImages, setGaImages] = useState<File[]>([]);
  const [gscImages, setGscImages] = useState<File[]>([]);
  const [semrushImages, setSemrushImages] = useState<File[]>([]);
  const [ahrefsImages, setAhrefsImages] = useState<File[]>([]);

  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCategoryChange(id: string) {
    setCategoryId(id);
    setQuickStats({});
  }

  async function uploadGallery(supabase: NonNullable<ReturnType<typeof createClient>>, sellerId: string, listingId: string, files: File[], kind: string) {
    for (const file of files) {
      const path = `${sellerId}/${listingId}/${kind}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file);
      if (upErr) throw new Error(`${kind} image upload failed: ${upErr.message}`);
      const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      const { error: imgErr } = await supabase.from("listing_images").insert({ listing_id: listingId, url: pub.publicUrl, kind });
      if (imgErr) throw new Error(`Saving ${kind} image record failed: ${imgErr.message}`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const supabase = createClient();
    if (!supabase) {
      // Backend isn't connected — preview-only submit.
      setSubmitted(true);
      setTimeout(() => router.push("/dashboard/seller"), 1800);
      return;
    }

    setSaving(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("You need to be logged in to create a listing — log in and try again.");
      }
      const sellerId = userData.user.id;

      // Build the category-specific flat quick-stat columns.
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

      const { data: listingRow, error: insertError } = await supabase
        .from("listings")
        .insert({
          seller_id: sellerId,
          category_id: categoryId,
          title,
          business_url: businessUrl || null,
          location: location || null,
          price: Number(price),
          discounted_price: discountedPrice ? Number(discountedPrice) : null,
          overview,
          monthly_expenses: expenses.filter((r) => r.label && r.amount).map((r) => ({ label: r.label, amount: Number(r.amount) })),
          monetization_type_ids: monetization,
          sale_includes_assets: saleIncludesAssets,
          sale_includes_support: saleIncludesSupport,
          status: "pending_review",
          ga_access_confirmed: category.hasSeoData ? gaAccessConfirmed : false,
          loom_video_url: loomVideoUrl || null,
          ...quickStatColumns,
        })
        .select()
        .single();
      if (insertError || !listingRow) throw new Error(insertError?.message ?? "Could not create the listing.");

      const listingId = listingRow.id as string;

      const monthlyRows = monthlyIncome
        .map((val, i) => ({ month: MONTH_KEYS[i], val }))
        .filter((r) => r.val !== "")
        .map((r) => ({ listing_id: listingId, month: r.month, income: Number(r.val) }));
      if (monthlyRows.length) {
        const { error } = await supabase.from("listing_monthly_stats").insert(monthlyRows);
        if (error) throw new Error(`Saving monthly income failed: ${error.message}`);
      }

      if (category.hasSeoData) {
        const seo: Record<string, unknown> = { listing_id: listingId };
        if (gaTotalUsers) seo.ga_total_users = Number(gaTotalUsers);
        if (gaNewUsers) seo.ga_new_users = Number(gaNewUsers);
        if (gaPageViews) seo.ga_total_page_views = Number(gaPageViews);
        if (gaEngagementRate) seo.ga_engagement_rate = Number(gaEngagementRate);
        const namedRows = (rows: { name: string; value: string }[]) =>
          rows.filter((r) => r.name && r.value).map((r) => ({ name: r.name, users: Number(r.value) }));
        if (topChannels.some((r) => r.name)) seo.ga_top_channels = namedRows(topChannels);
        if (topCountries.some((r) => r.name)) seo.ga_top_countries = namedRows(topCountries);
        if (topDevices.some((r) => r.name)) seo.ga_top_devices = namedRows(topDevices);
        if (gscClicks) seo.gsc_total_clicks = Number(gscClicks);
        if (gscImpressions) seo.gsc_total_impressions = Number(gscImpressions);
        if (gscIndexed) seo.gsc_indexed_pages = Number(gscIndexed);
        if (gscNonIndexed) seo.gsc_non_indexed_pages = Number(gscNonIndexed);
        if (gscCtr) seo.gsc_avg_ctr = Number(gscCtr);
        if (semrush.authority) seo.semrush_authority_score = Number(semrush.authority);
        if (semrush.traffic) seo.semrush_total_traffic = Number(semrush.traffic);
        if (semrush.keywords) seo.semrush_total_keywords = Number(semrush.keywords);
        if (semrush.top10) seo.semrush_top10_keywords = Number(semrush.top10);
        if (semrush.backlinks) seo.semrush_total_backlinks = Number(semrush.backlinks);
        if (ahrefs.dr) seo.ahrefs_dr = Number(ahrefs.dr);
        if (ahrefs.ur) seo.ahrefs_ur = Number(ahrefs.ur);
        if (ahrefs.refDomains) seo.ahrefs_referring_domains = Number(ahrefs.refDomains);
        if (ahrefs.keywords) seo.ahrefs_total_keywords = Number(ahrefs.keywords);
        if (ahrefs.backlinks) seo.ahrefs_total_backlinks = Number(ahrefs.backlinks);

        if (Object.keys(seo).length > 1) {
          const { error } = await supabase.from("listing_seo_data").insert(seo);
          if (error) throw new Error(`Saving SEO data failed: ${error.message}`);
        }
      }

      if (category.hasSocialStats) {
        const rows = socialStats
          .filter((r) => r.name && r.value)
          .map((r) => ({ listing_id: listingId, platform: r.name, followers: Number(r.value) }));
        if (rows.length) {
          const { error } = await supabase.from("listing_social_stats").insert(rows);
          if (error) throw new Error(`Saving social stats failed: ${error.message}`);
        }
      }

      await uploadGallery(supabase, sellerId, listingId, incomeImages, "proof_of_income");
      await uploadGallery(supabase, sellerId, listingId, gaImages, "google_analytics");
      await uploadGallery(supabase, sellerId, listingId, gscImages, "search_console");
      await uploadGallery(supabase, sellerId, listingId, semrushImages, "semrush");
      await uploadGallery(supabase, sellerId, listingId, ahrefsImages, "ahrefs");

      setSubmitted(true);
      setTimeout(() => router.push("/dashboard/seller"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong creating the listing.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-8">
        <div>
          <h2 className="mb-1 text-xl">Add New Business</h2>
          <p className="text-sm text-ink-faint">Every submission is reviewed and income-verified before it goes live.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business title">
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Southbound Coffee Co." className={inputCls} />
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
            <input required type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="75000" className={inputCls} />
          </Field>
          <Field label="Discounted price (USD, optional)">
            <input type="number" min="0" value={discountedPrice} onChange={(e) => setDiscountedPrice(e.target.value)} placeholder="" className={inputCls} />
          </Field>
        </div>

        {/* Category-specific quick stats */}
        <Section title="Quick Statistics" hint={`Fields shown are specific to ${category.name}.`}>
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
              Monthly Income, Monthly Views and Authority Score aren&rsquo;t entered here — they&rsquo;re calculated automatically from the Proof of Income, Google Analytics and SEMrush data below.
            </p>
          )}
        </Section>

        <Section title="Overview of the Business">
          <textarea required rows={5} value={overview} onChange={(e) => setOverview(e.target.value)} placeholder="What does the business do, how is it monetized, and why are you selling?" className={`${inputCls} w-full`} />
        </Section>

        <Section title="Proof of Income" hint="Monthly income for the last 12 months. Monthly average is calculated automatically.">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {MONTHS.map((m, i) => (
              <Field key={m} label={m}>
                <input
                  type="number"
                  min="0"
                  value={monthlyIncome[i]}
                  onChange={(e) => setMonthlyIncome((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
                  className={inputCls}
                />
              </Field>
            ))}
          </div>
          <ImageGallery
            label="Proof of Income Images"
            hint="Upload bank statements, payment processor dashboards, etc. These images will be shown publicly on your listing so buyers can verify your income."
            files={incomeImages}
            setFiles={setIncomeImages}
          />
          <div className="mt-5">
            <Field label="Loom video walkthrough (optional)">
              <input
                type="url"
                placeholder="https://www.loom.com/share/..."
                value={loomVideoUrl}
                onChange={(e) => setLoomVideoUrl(e.target.value)}
                className={inputCls}
              />
            </Field>
            <p className="mt-1.5 text-xs text-ink-faint">
              A short screen recording of your live income dashboard (Loom or similar) speeds up review — it&rsquo;s much harder to fake than a static screenshot. Shared with our review team only, not shown publicly.
            </p>
          </div>
        </Section>

        <Section title="Monthly Expenses">
          <div className="flex flex-col gap-2">
            {expenses.map((row, i) => (
              <div key={i} className="flex gap-2">
                <input placeholder="Label (e.g. Hosting)" value={row.label} onChange={(e) => setExpenses(expenses.map((r, idx) => (idx === i ? { ...r, label: e.target.value } : r)))} className={`${inputCls} flex-grow`} />
                <input placeholder="Amount" type="number" value={row.amount} onChange={(e) => setExpenses(expenses.map((r, idx) => (idx === i ? { ...r, amount: e.target.value } : r)))} className={`${inputCls} w-32`} />
                <button type="button" onClick={() => setExpenses(expenses.filter((_, idx) => idx !== i))} className="grid w-9 shrink-0 place-items-center rounded-md border border-rule-strong text-ink-faint hover:border-danger hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setExpenses([...expenses, { label: "", amount: "" }])} className="flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-strong">
              <Plus size={14} /> Add expense
            </button>
          </div>
        </Section>

        {category.hasMonetization && (
          <Section title="Monetization Methods">
            <div className="grid max-h-64 grid-cols-2 gap-x-4 gap-y-1 overflow-y-auto rounded-xl border border-rule bg-paper-raised p-4 sm:grid-cols-3">
              {MONETIZATION_TYPES.map((m) => (
                <label key={m.id} className="flex items-center gap-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={monetization.includes(m.id)}
                    onChange={() =>
                      setMonetization((prev) => (prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]))
                    }
                    className="accent-brand-strong"
                  />
                  {m.name}
                </label>
              ))}
            </div>
          </Section>
        )}

        {category.hasSeoData && (
          <>
            <Section title="Google Analytics Data" hint="Engagement statistics, last 12 months.">
              <div className="mb-5 grid gap-4 sm:grid-cols-3">
                <Field label="Total Users"><input value={gaTotalUsers} onChange={(e) => setGaTotalUsers(e.target.value)} className={inputCls} /></Field>
                <Field label="New Users"><input value={gaNewUsers} onChange={(e) => setGaNewUsers(e.target.value)} className={inputCls} /></Field>
                <Field label="Total Page Views"><input value={gaPageViews} onChange={(e) => setGaPageViews(e.target.value)} className={inputCls} /></Field>
                <Field label="Avg. Engagement Time"><input placeholder="1m 26s" value={gaEngagementTime} onChange={(e) => setGaEngagementTime(e.target.value)} className={inputCls} /></Field>
                <Field label="Engagement Rate (%)"><input value={gaEngagementRate} onChange={(e) => setGaEngagementRate(e.target.value)} className={inputCls} /></Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <h5 className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Top Channels</h5>
                  <NamedValueRows rows={topChannels} setRows={setTopChannels} nameLabel="Channel" valueLabel="Users" />
                </div>
                <div>
                  <h5 className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Top Countries</h5>
                  <NamedValueRows rows={topCountries} setRows={setTopCountries} nameLabel="Country" valueLabel="Users" />
                </div>
                <div>
                  <h5 className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">Device Category</h5>
                  <NamedValueRows rows={topDevices} setRows={setTopDevices} nameLabel="Device" valueLabel="Users" />
                </div>
              </div>
              <ImageGallery
                label="Google Analytics Images"
                hint="Add support@durqo.com as a Viewer on your GA account, and attach screenshots here so we can verify the data."
                files={gaImages}
                setFiles={setGaImages}
              />
              <label className="mt-4 flex items-start gap-2.5 rounded-md border border-rule-strong bg-paper p-3 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={gaAccessConfirmed}
                  onChange={(e) => setGaAccessConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                />
                <span>
                  I&rsquo;ve added <span className="mono text-ink">support@durqo.com</span> as a Viewer on this site&rsquo;s Google Analytics 4 property (Admin &rarr; Property Access Management &rarr; Add users). Our team will check it before publishing — access can be removed once your listing is live.
                </span>
              </label>
            </Section>

            <Section title="Google Search Console Data">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Total Clicks"><input value={gscClicks} onChange={(e) => setGscClicks(e.target.value)} className={inputCls} /></Field>
                <Field label="Total Impressions"><input value={gscImpressions} onChange={(e) => setGscImpressions(e.target.value)} className={inputCls} /></Field>
                <Field label="Indexed Pages"><input value={gscIndexed} onChange={(e) => setGscIndexed(e.target.value)} className={inputCls} /></Field>
                <Field label="Non-Indexed Pages"><input value={gscNonIndexed} onChange={(e) => setGscNonIndexed(e.target.value)} className={inputCls} /></Field>
                <Field label="Average CTR (%)"><input value={gscCtr} onChange={(e) => setGscCtr(e.target.value)} className={inputCls} /></Field>
              </div>
              <ImageGallery
                label="Google Search Console Images"
                hint="Add support@durqo.com with Restricted access to your Search Console account, and attach screenshots here."
                files={gscImages}
                setFiles={setGscImages}
              />
            </Section>

            <Section title="SEMrush Data">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Authority Score"><input value={semrush.authority} onChange={(e) => setSemrush({ ...semrush, authority: e.target.value })} className={inputCls} /></Field>
                <Field label="Total Organic Traffic"><input value={semrush.traffic} onChange={(e) => setSemrush({ ...semrush, traffic: e.target.value })} className={inputCls} /></Field>
                <Field label="Total Organic Keywords"><input value={semrush.keywords} onChange={(e) => setSemrush({ ...semrush, keywords: e.target.value })} className={inputCls} /></Field>
                <Field label="Top 10 Organic Keywords"><input value={semrush.top10} onChange={(e) => setSemrush({ ...semrush, top10: e.target.value })} className={inputCls} /></Field>
                <Field label="Total Backlinks"><input value={semrush.backlinks} onChange={(e) => setSemrush({ ...semrush, backlinks: e.target.value })} className={inputCls} /></Field>
              </div>
              <ImageGallery label="SEMrush Data Images" files={semrushImages} setFiles={setSemrushImages} />
            </Section>

            <Section title="Ahrefs Data">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="DR Rating"><input value={ahrefs.dr} onChange={(e) => setAhrefs({ ...ahrefs, dr: e.target.value })} className={inputCls} /></Field>
                <Field label="UR Rating"><input value={ahrefs.ur} onChange={(e) => setAhrefs({ ...ahrefs, ur: e.target.value })} className={inputCls} /></Field>
                <Field label="Referring Domains"><input value={ahrefs.refDomains} onChange={(e) => setAhrefs({ ...ahrefs, refDomains: e.target.value })} className={inputCls} /></Field>
                <Field label="Total Keywords"><input value={ahrefs.keywords} onChange={(e) => setAhrefs({ ...ahrefs, keywords: e.target.value })} className={inputCls} /></Field>
                <Field label="Total Backlinks"><input value={ahrefs.backlinks} onChange={(e) => setAhrefs({ ...ahrefs, backlinks: e.target.value })} className={inputCls} /></Field>
              </div>
              <ImageGallery label="Ahrefs Data Images" files={ahrefsImages} setFiles={setAhrefsImages} />
            </Section>
          </>
        )}

        {category.hasSocialStats && (
          <Section title="Social Media Accounts">
            <NamedValueRows rows={socialStats} setRows={setSocialStats} nameLabel="Platform (e.g. Instagram)" valueLabel="Followers" />
          </Section>
        )}

        <Section title="Sale Includes">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Assets included">
              <textarea rows={3} value={saleIncludesAssets} onChange={(e) => setSaleIncludesAssets(e.target.value)} placeholder="Domain, codebase, social accounts, email list…" className={`${inputCls} w-full`} />
            </Field>
            <Field label="Post-sale support">
              <textarea rows={3} value={saleIncludesSupport} onChange={(e) => setSaleIncludesSupport(e.target.value)} placeholder="e.g. 30 days of email support" className={`${inputCls} w-full`} />
            </Field>
          </div>
        </Section>

        <div className="border-t border-rule pt-8">
          <button type="submit" disabled={saving} className="rounded-md bg-brand px-8 py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60">
            {saving ? "Creating…" : "Create Business"}
          </button>
          {submitted && <p className="mt-3 text-sm text-brand-strong">Submitted for review — a Durqo team member verifies every listing before it goes live. Redirecting…</p>}
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </div>
      </form>
    </DashboardShell>
  );
}
