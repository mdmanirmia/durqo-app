"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { CATEGORIES, CATEGORY_MAP, QUICK_STAT_LABELS, QuickStatKey, INDUSTRY_ID_SPACE_CATEGORIES } from "@/lib/categories";
import { MONETIZATION_TYPES, SOCIAL_MEDIA_MONETIZATION_IDS, SAAS_MONETIZATION_IDS, AI_APPS_TOOLS_MONETIZATION_IDS, ANDROID_IOS_APPS_MONETIZATION_IDS, STARTUP_BUSINESS_MONETIZATION_IDS } from "@/lib/monetization-types";
import { BUSINESS_TYPES } from "@/lib/business-types";
import { AI_BUSINESS_TYPES } from "@/lib/ai-business-types";
import { STARTUP_BUSINESS_MODELS } from "@/lib/startup-business-models";
import { FUNDING_STAGES } from "@/lib/funding-stages";
import { ACCOUNT_TYPES } from "@/lib/account-types";
import { NICHES } from "@/lib/niches";
import { INDUSTRIES } from "@/lib/industries";
import { APP_NICHES } from "@/lib/app-niches";
import { APP_PLATFORMS } from "@/lib/app-platforms";
import { QUICK_STAT_COLUMNS } from "@/lib/data/map-listing";
import { parseDurationToSeconds, formatEngagementSeconds } from "@/lib/format";
import { updateListingFull, addListingImages, deleteListingImage, type ListingFullEditFields } from "@/lib/actions/listing-edit";
import { setListingStatus } from "@/app/dashboard/admin/actions";

// Same 12-month proof-of-income window as the seller "new listing" form
// (dashboard/seller/listings/new/page.tsx) — deliberately duplicated rather
// than imported, so this edit form can't accidentally change behavior on
// the already-working create flow.
const MONTHS = ["Sep 2025","Oct 2025","Nov 2025","Dec 2025","Jan 2026","Feb 2026","Mar 2026","Apr 2026","May 2026","Jun 2026","Jul 2026","Aug 2026"];
const MONTH_KEYS = ["2025-09-01","2025-10-01","2025-11-01","2025-12-01","2026-01-01","2026-02-01","2026-03-01","2026-04-01","2026-05-01","2026-06-01","2026-07-01","2026-08-01"];

// "business_type" (E-commerce only) is a comma-separated string of ids
// built by the checkbox grid below, not a single typed value — see the
// matching comment in the seller "new listing" form.
const TEXT_QUICK_STAT_KEYS = new Set<QuickStatKey>(["location", "domain_age", "domain_registrar", "business_type", "account_type", "platform", "funding_stage"]);
const DATE_QUICK_STAT_KEYS = new Set<QuickStatKey>(["domain_expires"]);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const NO_AUTO_QUICK_STAT_CATEGORY = "domains";

const inputCls = "rounded-md border border-rule-strong bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand-strong focus:outline-none";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-rule pt-8">
      <h2 className="text-xl">{title}</h2>
      {hint && <p className="mb-4 mt-1 text-sm text-ink-faint">{hint}</p>}
      <div className={hint ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label className="text-sm font-semibold text-ink-soft">{label}</label>
      {children}
    </div>
  );
}

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

// Shows the listing's already-uploaded images for this kind (each removable
// on its own) plus the same "add more" control the create form has, for
// files staged locally and uploaded once the form is saved.
function EditableImageGallery({
  label,
  hint,
  existing,
  onDeleteExisting,
  deletingId,
  newFiles,
  setNewFiles,
}: {
  label: string;
  hint?: string;
  existing: { id: string; url: string }[];
  onDeleteExisting: (id: string) => void;
  deletingId: string | null;
  newFiles: File[];
  setNewFiles: (files: File[]) => void;
}) {
  return (
    <div className="mt-5 rounded-xl border border-rule bg-paper-raised p-4">
      <h5 className="text-sm font-semibold text-ink">{label}</h5>
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}

      {existing.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {existing.map((img) => (
            <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="group relative block h-16 w-16 overflow-hidden rounded-md border border-rule-strong">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                disabled={deletingId === img.id}
                onClick={(e) => {
                  e.preventDefault();
                  onDeleteExisting(img.id);
                }}
                className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-ink/70 text-white opacity-0 group-hover:opacity-100 disabled:opacity-60"
              >
                <X size={12} />
              </button>
            </a>
          ))}
        </div>
      )}

      {newFiles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {newFiles.map((f, i) => (
            <span key={i} className="flex items-center gap-1.5 rounded-md border border-rule-strong bg-paper px-3 py-1 text-xs text-ink-soft">
              {f.name}
              <button type="button" onClick={() => setNewFiles(newFiles.filter((_, idx) => idx !== i))} className="text-ink-faint hover:text-danger">
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
          onChange={(e) => setNewFiles([...newFiles, ...Array.from(e.target.files ?? [])])}
        />
      </label>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export default function ListingEditForm({
  mode,
  listing,
  seo,
  monthlyStats,
  images,
  socialStats,
  copyrightNotes,
  topVideos,
  channelOverview,
}: {
  mode: "admin" | "seller";
  listing: Row;
  seo: Row | null;
  monthlyStats: Row[];
  images: Row[];
  socialStats: Row[];
  copyrightNotes?: Row | null;
  topVideos?: Row[];
  channelOverview?: Row | null;
}) {
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

  const [niches, setNiches] = useState<string[]>(Array.isArray(listing.niches) ? listing.niches : []);
  const [loomVideoUrl, setLoomVideoUrl] = useState(listing.loom_video_url ?? "");
  const [expenses, setExpenses] = useState<{ label: string; amount: string }[]>(
    Array.isArray(listing.monthly_expenses) && listing.monthly_expenses.length > 0
      ? listing.monthly_expenses.map((e: Row) => ({ label: e.label ?? "", amount: e.amount != null ? String(e.amount) : "" }))
      : [{ label: "", amount: "" }]
  );
  const [monetization, setMonetization] = useState<string[]>(Array.isArray(listing.monetization_type_ids) ? listing.monetization_type_ids : []);

  function initialQuickStats(catId: string): Record<string, string> {
    const cfg = CATEGORY_MAP[catId];
    const next: Record<string, string> = {};
    for (const key of cfg.quickStats) {
      const column = QUICK_STAT_COLUMNS[key];
      const v = listing[column];
      if (v !== null && v !== undefined) next[key] = String(v);
    }
    return next;
  }
  const [quickStats, setQuickStats] = useState<Record<string, string>>(initialQuickStats(categoryId));

  const monthlyByKey = new Map(monthlyStats.map((r) => [String(r.month).slice(0, 10), r.income]));
  const [monthlyIncome, setMonthlyIncome] = useState<string[]>(
    MONTH_KEYS.map((key) => {
      const v = monthlyByKey.get(key);
      return v !== undefined && v !== null ? String(v) : "";
    })
  );

  const [gaAccessConfirmed, setGaAccessConfirmed] = useState(!!listing.ga_access_confirmed);
  const [gaTotalUsers, setGaTotalUsers] = useState(seo?.ga_total_users != null ? String(seo.ga_total_users) : "");
  const [gaNewUsers, setGaNewUsers] = useState(seo?.ga_new_users != null ? String(seo.ga_new_users) : "");
  const [gaPageViews, setGaPageViews] = useState(seo?.ga_total_page_views != null ? String(seo.ga_total_page_views) : "");
  const [gaEngagementTime, setGaEngagementTime] = useState(formatEngagementSeconds(seo?.ga_avg_engagement_seconds));

  const [gscClicks, setGscClicks] = useState(seo?.gsc_total_clicks != null ? String(seo.gsc_total_clicks) : "");
  const [gscImpressions, setGscImpressions] = useState(seo?.gsc_total_impressions != null ? String(seo.gsc_total_impressions) : "");
  const [gscIndexed, setGscIndexed] = useState(seo?.gsc_indexed_pages != null ? String(seo.gsc_indexed_pages) : "");
  const [gscNonIndexed, setGscNonIndexed] = useState(seo?.gsc_non_indexed_pages != null ? String(seo.gsc_non_indexed_pages) : "");
  const [gscCtr, setGscCtr] = useState(seo?.gsc_avg_ctr != null ? String(seo.gsc_avg_ctr) : "");

  const [semrush, setSemrush] = useState({
    authority: seo?.semrush_authority_score != null ? String(seo.semrush_authority_score) : "",
    traffic: seo?.semrush_total_traffic != null ? String(seo.semrush_total_traffic) : "",
    keywords: seo?.semrush_total_keywords != null ? String(seo.semrush_total_keywords) : "",
    top10: seo?.semrush_top10_keywords != null ? String(seo.semrush_top10_keywords) : "",
    backlinks: seo?.semrush_total_backlinks != null ? String(seo.semrush_total_backlinks) : "",
  });
  const [ahrefs, setAhrefs] = useState({
    dr: seo?.ahrefs_dr != null ? String(seo.ahrefs_dr) : "",
    ur: seo?.ahrefs_ur != null ? String(seo.ahrefs_ur) : "",
    refDomains: seo?.ahrefs_referring_domains != null ? String(seo.ahrefs_referring_domains) : "",
    keywords: seo?.ahrefs_total_keywords != null ? String(seo.ahrefs_total_keywords) : "",
    backlinks: seo?.ahrefs_total_backlinks != null ? String(seo.ahrefs_total_backlinks) : "",
  });

  const [socialStatRows, setSocialStatRows] = useState<{ name: string; value: string }[]>(
    socialStats.length > 0 ? socialStats.map((r) => ({ name: r.platform ?? "", value: r.followers != null ? String(r.followers) : "" })) : [{ name: "", value: "" }]
  );

  // YouTube Channels category only (Design & Development New.pdf, Sep 4
  // 2026) — pre-filled from the listing's existing rows, if any.
  const [copyrightNotesText, setCopyrightNotesText] = useState(copyrightNotes?.notes ?? "");
  const [topVideoRows, setTopVideoRows] = useState(() => {
    const sorted = (topVideos ?? []).slice().sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
    return Array.from({ length: 5 }, (_, i) => {
      const v = sorted[i];
      return {
        title: v?.title ?? "",
        videoUrl: v?.video_url ?? "",
        views: v?.views != null ? String(v.views) : "",
        likes: v?.likes != null ? String(v.likes) : "",
        duration: v?.duration ?? "",
        publishedOn: v?.published_on ? String(v.published_on).slice(0, 10) : "",
      };
    });
  });
  // Per-row auto-fill status for the Video URL → /api/youtube/video-info
  // lookup below (Sep 4, 2026 follow-up, same endpoint/behavior as the
  // seller "new listing" form): "loading" while fetching, "done"/"error"
  // after.
  const [videoLookup, setVideoLookup] = useState<Record<number, "loading" | "done" | "error">>({});

  // YouTube Channel Overview (Sep 4 2026 follow-up) — pre-filled from the
  // listing's existing row, if any; re-fetched wholesale from the Channel
  // URL field's onBlur, same pattern as fetchVideoInfo below.
  const [channelOverviewState, setChannelOverviewState] = useState<{
    channelTitle: string;
    channelHandle: string | null;
    channelAvatarUrl: string | null;
    channelCreatedOn: string | null;
    avgViewsPerVideo: number | null;
    recentAvgViews: number | null;
    recentAvgLikes: number | null;
    engagementRatePercent: number | null;
  } | null>(
    channelOverview
      ? {
          channelTitle: channelOverview.channel_title ?? "",
          channelHandle: channelOverview.channel_handle ?? null,
          channelAvatarUrl: channelOverview.channel_avatar_url ?? null,
          channelCreatedOn: channelOverview.channel_created_on ? String(channelOverview.channel_created_on).slice(0, 10) : null,
          avgViewsPerVideo: channelOverview.avg_views_per_video ?? null,
          recentAvgViews: channelOverview.recent_avg_views ?? null,
          recentAvgLikes: channelOverview.recent_avg_likes ?? null,
          engagementRatePercent: channelOverview.engagement_rate_percent ?? null,
        }
      : null
  );
  const [channelLookup, setChannelLookup] = useState<"loading" | "done" | "error" | null>(null);

  async function fetchChannelInfo(url: string) {
    if (!url.trim() || categoryId !== "youtube-channels") return;
    setChannelLookup("loading");
    try {
      const res = await fetch(`/api/youtube/channel-info?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("lookup failed");
      const info = await res.json();
      setQuickStats((prev) => ({
        ...prev,
        ...(info.subscribers !== null && info.subscribers !== undefined ? { subscribers: String(info.subscribers) } : {}),
        ...(info.totalViews !== null && info.totalViews !== undefined ? { total_views: String(info.totalViews) } : {}),
        ...(info.totalVideos !== null && info.totalVideos !== undefined ? { total_videos: String(info.totalVideos) } : {}),
        ...(info.channelAgeYears !== null && info.channelAgeYears !== undefined ? { channel_age: String(info.channelAgeYears) } : {}),
      }));
      setChannelOverviewState({
        channelTitle: info.channelTitle || "",
        channelHandle: info.channelHandle ?? null,
        channelAvatarUrl: info.channelAvatarUrl ?? null,
        channelCreatedOn: info.channelCreatedOn || null,
        avgViewsPerVideo: info.avgViewsPerVideo ?? null,
        recentAvgViews: info.recentAvgViews ?? null,
        recentAvgLikes: info.recentAvgLikes ?? null,
        engagementRatePercent: info.engagementRatePercent ?? null,
      });
      setChannelLookup("done");
    } catch {
      setChannelLookup("error");
    }
  }

  async function fetchVideoInfo(i: number, url: string) {
    if (!url.trim()) return;
    setVideoLookup((prev) => ({ ...prev, [i]: "loading" }));
    try {
      const res = await fetch(`/api/youtube/video-info?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("lookup failed");
      const info = await res.json();
      setTopVideoRows((prev) =>
        prev.map((row, idx) =>
          idx === i
            ? {
                ...row,
                title: info.title || row.title,
                views: info.views !== null && info.views !== undefined ? String(info.views) : row.views,
                likes: info.likes !== null && info.likes !== undefined ? String(info.likes) : row.likes,
                duration: info.duration || row.duration,
                publishedOn: info.publishedOn || row.publishedOn,
              }
            : row
        )
      );
      setVideoLookup((prev) => ({ ...prev, [i]: "done" }));
    } catch {
      setVideoLookup((prev) => ({ ...prev, [i]: "error" }));
    }
  }

  function imagesOfKind(kind: string) {
    return images.filter((img) => img.kind === kind).map((img) => ({ id: img.id as string, url: img.url as string }));
  }
  const [existingImages, setExistingImages] = useState({
    proof_of_income: imagesOfKind("proof_of_income"),
    google_analytics: imagesOfKind("google_analytics"),
    search_console: imagesOfKind("search_console"),
    semrush: imagesOfKind("semrush"),
    ahrefs: imagesOfKind("ahrefs"),
    copyright_notes: imagesOfKind("copyright_notes"),
  });
  const [incomeImages, setIncomeImages] = useState<File[]>([]);
  const [gaImages, setGaImages] = useState<File[]>([]);
  const [gscImages, setGscImages] = useState<File[]>([]);
  const [semrushImages, setSemrushImages] = useState<File[]>([]);
  const [ahrefsImages, setAhrefsImages] = useState<File[]>([]);
  const [copyrightImages, setCopyrightImages] = useState<File[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState<string>(listing.status);
  const [, startTransition] = useTransition();

  function handleCategoryChange(id: string) {
    setCategoryId(id);
    setQuickStats(initialQuickStats(id));
    // See the matching comment in the seller "new listing" form: SaaS has
    // its own "Industry" option list that doesn't overlap with the shared
    // NICHES list every other category uses, so a selection has to be
    // cleared when crossing into or out of SaaS. (AI Apps & Tools forces
    // niches to [] unconditionally on save instead — see updateListingFull
    // call below — since it has no Niche/Industry section at all.) Android &
    // iOS Apps has its own curated Niche list too (src/lib/app-niches.ts) —
    // same id-space-mismatch reasoning applies.
    if (INDUSTRY_ID_SPACE_CATEGORIES.has(id) !== INDUSTRY_ID_SPACE_CATEGORIES.has(categoryId) || (id === "apps-tools") !== (categoryId === "apps-tools"))
      setNiches([]);
    if (id !== "youtube-channels") {
      setCopyrightNotesText("");
      setTopVideoRows(Array.from({ length: 5 }, () => ({ title: "", videoUrl: "", views: "", likes: "", duration: "", publishedOn: "" })));
      setChannelOverviewState(null);
      setChannelLookup(null);
    }
  }

  async function handleDeleteExistingImage(kind: keyof typeof existingImages, imageId: string) {
    setDeletingImageId(imageId);
    try {
      await deleteListingImage(listing.id, imageId);
      setExistingImages((prev) => ({ ...prev, [kind]: prev[kind].filter((img) => img.id !== imageId) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove that image.");
    } finally {
      setDeletingImageId(null);
    }
  }

  async function uploadNewImages(kind: string, files: File[]) {
    if (files.length === 0) return;
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    await addListingImages(listing.id, kind, fd);
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

      let seoFields: ListingFullEditFields["seo"];
      if (category.hasSeoData) {
        seoFields = {
          ga_total_users: gaTotalUsers ? Number(gaTotalUsers) : null,
          ga_new_users: gaNewUsers ? Number(gaNewUsers) : null,
          ga_total_page_views: gaPageViews ? Number(gaPageViews) : null,
          ga_avg_engagement_seconds: gaEngagementTime ? parseDurationToSeconds(gaEngagementTime) : null,
          gsc_total_clicks: gscClicks ? Number(gscClicks) : null,
          gsc_total_impressions: gscImpressions ? Number(gscImpressions) : null,
          gsc_indexed_pages: gscIndexed ? Number(gscIndexed) : null,
          gsc_non_indexed_pages: gscNonIndexed ? Number(gscNonIndexed) : null,
          gsc_avg_ctr: gscCtr ? Number(gscCtr) : null,
          semrush_authority_score: semrush.authority ? Number(semrush.authority) : null,
          semrush_total_traffic: semrush.traffic ? Number(semrush.traffic) : null,
          semrush_total_keywords: semrush.keywords ? Number(semrush.keywords) : null,
          semrush_top10_keywords: semrush.top10 ? Number(semrush.top10) : null,
          semrush_total_backlinks: semrush.backlinks ? Number(semrush.backlinks) : null,
          ahrefs_dr: ahrefs.dr ? Number(ahrefs.dr) : null,
          ahrefs_ur: ahrefs.ur ? Number(ahrefs.ur) : null,
          ahrefs_referring_domains: ahrefs.refDomains ? Number(ahrefs.refDomains) : null,
          ahrefs_total_keywords: ahrefs.keywords ? Number(ahrefs.keywords) : null,
          ahrefs_total_backlinks: ahrefs.backlinks ? Number(ahrefs.backlinks) : null,
        };
      }

      await updateListingFull(listing.id, {
        title,
        categoryId,
        businessUrl: businessUrl || null,
        location: categoryId === "websites" ? null : location || null,
        price: Number(price),
        discountedPrice: discountedPrice ? Number(discountedPrice) : null,
        overview,
        saleIncludesAssets,
        saleIncludesSupport,
        quickStatColumns,
        // AI Apps & Tools dropped Industry entirely (Sep 5, 2026 follow-up
        // to Design & Development New.pdf) — the Niche/Industry section is
        // hidden below for this category, so never save a stale selection
        // left over from before this change, or from switching categories.
        niches: categoryId === "ai-apps-tools" ? [] : niches,
        loomVideoUrl: loomVideoUrl || null,
        monetizationTypeIds: monetization,
        monthlyExpenses: expenses.filter((r) => r.label && r.amount).map((r) => ({ label: r.label, amount: Number(r.amount) })),
        monthlyIncome: MONTH_KEYS.map((key, i) => ({ month: key, income: monthlyIncome[i] === "" ? null : Number(monthlyIncome[i]) })),
        gaAccessConfirmed: category.hasSeoData ? gaAccessConfirmed : null,
        seo: seoFields,
        socialStats: socialStatRows.filter((r) => r.name && r.value).map((r) => ({ platform: r.name, followers: Number(r.value) })),
        copyrightNotes: categoryId === "youtube-channels" ? copyrightNotesText : undefined,
        topVideos:
          categoryId === "youtube-channels"
            ? topVideoRows.map((v) => ({
                title: v.title,
                videoUrl: v.videoUrl,
                views: v.views ? Number(v.views) : null,
                likes: v.likes ? Number(v.likes) : null,
                duration: v.duration,
                publishedOn: v.publishedOn || null,
              }))
            : undefined,
        channelOverview:
          categoryId === "youtube-channels"
            ? channelOverviewState
              ? {
                  channelTitle: channelOverviewState.channelTitle,
                  channelHandle: channelOverviewState.channelHandle,
                  channelAvatarUrl: channelOverviewState.channelAvatarUrl,
                  channelCreatedOn: channelOverviewState.channelCreatedOn,
                  avgViewsPerVideo: channelOverviewState.avgViewsPerVideo,
                  recentAvgViews: channelOverviewState.recentAvgViews,
                  recentAvgLikes: channelOverviewState.recentAvgLikes,
                  engagementRatePercent: channelOverviewState.engagementRatePercent,
                }
              : null
            : undefined,
      });

      await Promise.all([
        uploadNewImages("proof_of_income", incomeImages),
        uploadNewImages("google_analytics", gaImages),
        uploadNewImages("search_console", gscImages),
        uploadNewImages("semrush", semrushImages),
        uploadNewImages("ahrefs", ahrefsImages),
        uploadNewImages("copyright_notes", copyrightImages),
      ]);

      setSaved(true);
      const dest = mode === "admin" ? "/dashboard/admin/listings" : "/dashboard/seller";
      setTimeout(() => router.push(dest), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong saving the listing.");
    } finally {
      setSaving(false);
    }
  }

  function handlePublish() {
    setError(null);
    setPublishing(true);
    startTransition(async () => {
      try {
        await setListingStatus(listing.id, "published" as never);
        setStatus("published");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't publish this listing.");
      } finally {
        setPublishing(false);
      }
    });
  }

  const cancelHref = mode === "admin" ? "/dashboard/admin/listings" : "/dashboard/seller";

  return (
    <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-xl">Edit Listing</h2>
          <p className="text-sm text-ink-faint">
            <Link href={`/listing/${listing.id}`} className="text-brand-strong hover:underline">
              View the full public listing
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={categoryId === "youtube-channels" ? "Channel Name" : categoryId === "websites" ? "Website title" : categoryId === "social-media-accounts" ? "Account Name" : categoryId === "apps-tools" ? "App Name" : categoryId === "domains" ? "Domain Name" : "Business title"}>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Category">
          <select value={categoryId} onChange={(e) => handleCategoryChange(e.target.value)} className={inputCls}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={categoryId === "youtube-channels" ? "Channel URL" : categoryId === "websites" ? "Website URL" : categoryId === "social-media-accounts" ? "Account URL" : categoryId === "apps-tools" ? "App URL" : categoryId === "domains" ? "Domain URL" : "Business URL"} className={categoryId === "websites" ? "sm:col-span-2" : undefined}>
          <input
            type="url"
            value={businessUrl}
            onChange={(e) => setBusinessUrl(e.target.value)}
            onBlur={(e) => categoryId === "youtube-channels" && fetchChannelInfo(e.target.value)}
            placeholder="https://"
            className={inputCls}
          />
          {categoryId === "youtube-channels" && channelLookup === "loading" && <p className="mt-1 text-xs text-ink-faint">Fetching channel details from YouTube…</p>}
          {categoryId === "youtube-channels" && channelLookup === "done" && <p className="mt-1 text-xs text-brand-strong">Channel details fetched — Total Subscribers, Total Views, Total Videos, and Channel Age are filled in automatically from YouTube.</p>}
          {categoryId === "youtube-channels" && channelLookup === "error" && <p className="mt-1 text-xs text-danger">Couldn&apos;t fetch channel details from YouTube — double-check the Channel URL and click away from the field again to retry.</p>}
        </Field>
        {categoryId !== "websites" && categoryId !== "domains" && (
          <Field label={categoryId === "youtube-channels" ? "Channel location" : categoryId === "social-media-accounts" ? "Account location" : categoryId === "apps-tools" ? "App location" : "Business location"}>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country (or Remote)" className={inputCls} />
          </Field>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Asking price (USD)">
          <input required type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Discounted price (USD, optional)">
          <input type="number" min="0" value={discountedPrice} onChange={(e) => setDiscountedPrice(e.target.value)} className={inputCls} />
        </Field>
      </div>

      {categoryId === NO_AUTO_QUICK_STAT_CATEGORY ? (
        <Section title="Quick Statistics" hint={`Fields shown are specific to ${category.name}.`}>
          <div className="grid gap-4 sm:grid-cols-2">
            {category.quickStats.map((key: QuickStatKey) => (
              <Field key={key} label={QUICK_STAT_LABELS[key]}>
                <input
                  value={quickStats[key] ?? ""}
                  onChange={(e) => setQuickStats((prev) => ({ ...prev, [key]: e.target.value }))}
                  className={inputCls}
                />
              </Field>
            ))}
          </div>
        </Section>
      ) : categoryId === "youtube-channels" ? (
        // Sep 4 2026 follow-up: dropped the manual "Channel Statistics"
        // section (Total Subscribers/Total Views/Total Videos/Channel Age)
        // — all four are fully covered by fetchChannelInfo() firing on the
        // Channel URL field's onBlur above, so the user asked to remove the
        // redundant manual inputs here too, matching the create form.
        // quickStats.subscribers/.total_views/.total_videos/.channel_age
        // are still set by that lookup (including re-initialized from the
        // listing's saved values when this form loads) and still get saved
        // on submit — there's just no visible input for them anymore.
        null
      ) : (
        category.quickStats.includes("age") && (
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={categoryId === "websites" ? "Website Age (years)" : categoryId === "social-media-accounts" ? "Account Age (years)" : categoryId === "apps-tools" ? "App Age (years)" : "Business Age (years)"}>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={quickStats.age ?? ""}
                  onChange={(e) => setQuickStats((prev) => ({ ...prev, age: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              {category.quickStats.includes("articles_posted") && (
                <Field label="Articles Posted">
                  <input
                    type="number"
                    min="0"
                    value={quickStats.articles_posted ?? ""}
                    onChange={(e) => setQuickStats((prev) => ({ ...prev, articles_posted: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
              )}
              {/* Active Subscribers — SaaS only, mirrors the seller "new
                  listing" form: replaces "Articles Posted" for this
                  category (Design & Development New 1.pdf, Sep 5, 2026). */}
              {category.quickStats.includes("active_subscribers") && (
                <Field label="Active Subscribers">
                  <input
                    type="number"
                    min="0"
                    value={quickStats.active_subscribers ?? ""}
                    onChange={(e) => setQuickStats((prev) => ({ ...prev, active_subscribers: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
              )}
              {/* Total Followers — Social Media Accounts only, mirrors the
                  seller "new listing" form: a plain manual input, not
                  computed from Social Stats (see the carve-out for this
                  category in computeAutoQuickStats() in map-listing.ts). */}
              {categoryId === "social-media-accounts" && (
                <Field label="Total Followers">
                  <input
                    type="number"
                    min="0"
                    value={quickStats.followers ?? ""}
                    onChange={(e) => setQuickStats((prev) => ({ ...prev, followers: e.target.value }))}
                    className={inputCls}
                  />
                </Field>
              )}
            </div>
          </div>
        )
      )}

      {/* App Statistics — Android & iOS Apps only, mirrors the seller "new
          listing" form: replaces the generic "Quick Statistics" heading for
          this category with Rating/Reviews/Downloads-Installs/Store Price.
          step="any" deliberately (see the matching comment in the seller
          form) — a mismatched decimal under a fixed step silently blocks
          native HTML5 submission with no console error or network request. */}
      {categoryId === "apps-tools" && (
        <Section title="App Statistics" hint="Shown on the published listing instead of Quick Statistics.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rating">
              <input
                type="number"
                min="0"
                max="5"
                step="any"
                value={quickStats.rating ?? ""}
                onChange={(e) => setQuickStats((prev) => ({ ...prev, rating: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="Reviews">
              <input
                type="number"
                min="0"
                step="any"
                value={quickStats.total_reviews ?? ""}
                onChange={(e) => setQuickStats((prev) => ({ ...prev, total_reviews: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="Downloads/Installs">
              <input
                type="number"
                min="0"
                step="any"
                value={quickStats.total_downloads ?? ""}
                onChange={(e) => setQuickStats((prev) => ({ ...prev, total_downloads: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="Store Price (USD)">
              <input
                type="number"
                min="0"
                step="any"
                value={quickStats.store_price ?? ""}
                onChange={(e) => setQuickStats((prev) => ({ ...prev, store_price: e.target.value }))}
                className={inputCls}
              />
            </Field>
          </div>
        </Section>
      )}

      {/* Platform — Android & iOS Apps only, mirrors the seller "new
          listing" form: a multi-select checkbox grid (Sep 5, 2026 follow-up
          — a seller can list an app as available on both iOS and Android)
          storing a comma-separated string of ids in quickStats.platform. */}
      {categoryId === "apps-tools" && (
        <Section title="Platform" hint="Select every platform this app is available on — shown as a Quick Stat on the published listing.">
          <div className="grid max-h-64 grid-cols-2 gap-x-4 gap-y-1 overflow-y-auto rounded-xl border border-rule bg-paper-raised p-4 sm:grid-cols-3">
            {APP_PLATFORMS.map((p) => {
              const selected = (quickStats.platform ?? "").split(",").filter(Boolean);
              return (
                <label key={p.id} className="flex items-center gap-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={() => {
                      const next = selected.includes(p.id) ? selected.filter((id) => id !== p.id) : [...selected, p.id];
                      setQuickStats((prev) => ({ ...prev, platform: next.join(",") }));
                    }}
                    className="accent-brand-strong"
                  />
                  {p.name}
                </label>
              );
            })}
          </div>
        </Section>
      )}

      {/* Startup Details — Startup Business only, mirrors the seller "new
          listing" form: Funding Stage (single-select, stored as a single
          plain-text id in quickStats.funding_stage, see TEXT_QUICK_STAT_KEYS
          above) plus Funding Raised/Team Size (plain manual numeric
          inputs). */}
      {categoryId === "startup-business" && (
        <Section title="Startup Details" hint="Shown as Quick Stats on the published listing.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Funding Stage">
              <select
                value={quickStats.funding_stage ?? ""}
                onChange={(e) => setQuickStats((prev) => ({ ...prev, funding_stage: e.target.value }))}
                className={inputCls}
              >
                <option value="">Select a stage</option>
                {FUNDING_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Funding Raised (USD)">
              <input
                type="number"
                min="0"
                step="any"
                value={quickStats.funding_raised ?? ""}
                onChange={(e) => setQuickStats((prev) => ({ ...prev, funding_raised: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="Team Size">
              <input
                type="number"
                min="0"
                step="any"
                value={quickStats.team_size ?? ""}
                onChange={(e) => setQuickStats((prev) => ({ ...prev, team_size: e.target.value }))}
                className={inputCls}
              />
            </Field>
          </div>
        </Section>
      )}

      {/* Business Type — E-commerce, AI Apps & Tools and Startup Business,
          mirrors the seller "new listing" form: a comma-separated string of
          ids in quickStats.business_type (see TEXT_QUICK_STAT_KEYS above),
          pre-filled from the listing's saved value by initialQuickStats()
          above like every other text Quick Stat. AI Apps & Tools shows its
          own curated option list (src/lib/ai-business-types.ts) and Startup
          Business shows its own list (src/lib/startup-business-models.ts,
          labeled "Business Model" on the public listing page) instead of
          E-commerce's business-model list. */}
      {(categoryId === "e-commerce" || categoryId === "ai-apps-tools" || categoryId === "startup-business") && (
        <Section
          title={categoryId === "startup-business" ? "Business Model" : "Business Type"}
          hint={
            categoryId === "ai-apps-tools"
              ? "Select every AI model this app or tool is built on — shown as a Quick Stat on the published listing."
              : categoryId === "startup-business"
                ? "Select every business model this startup runs on — shown as a Quick Stat on the published listing."
                : "Select every business model this store uses — shown as a Quick Stat on the published listing."
          }
        >
          <div className="grid max-h-64 grid-cols-2 gap-x-4 gap-y-1 overflow-y-auto rounded-xl border border-rule bg-paper-raised p-4 sm:grid-cols-3">
            {(categoryId === "ai-apps-tools" ? AI_BUSINESS_TYPES : categoryId === "startup-business" ? STARTUP_BUSINESS_MODELS : BUSINESS_TYPES).map((t) => {
              const selected = (quickStats.business_type ?? "").split(",").filter(Boolean);
              return (
                <label key={t.id} className="flex items-center gap-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(t.id)}
                    onChange={() => {
                      const next = selected.includes(t.id) ? selected.filter((id) => id !== t.id) : [...selected, t.id];
                      setQuickStats((prev) => ({ ...prev, business_type: next.join(",") }));
                    }}
                    className="accent-brand-strong"
                  />
                  {t.name}
                </label>
              );
            })}
          </div>
        </Section>
      )}

      {/* Account Type — Social Media Accounts only, mirrors the seller "new
          listing" form's checkbox grid and quickStats.account_type storage
          (see TEXT_QUICK_STAT_KEYS above), pre-filled from the listing's
          saved value by initialQuickStats() above like every other text
          Quick Stat. */}
      {categoryId === "social-media-accounts" && (
        <Section title="Account Type" hint="Select every platform this account is on — shown as a Quick Stat on the published listing.">
          <div className="grid max-h-64 grid-cols-2 gap-x-4 gap-y-1 overflow-y-auto rounded-xl border border-rule bg-paper-raised p-4 sm:grid-cols-3">
            {ACCOUNT_TYPES.map((t) => {
              const selected = (quickStats.account_type ?? "").split(",").filter(Boolean);
              return (
                <label key={t.id} className="flex items-center gap-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(t.id)}
                    onChange={() => {
                      const next = selected.includes(t.id) ? selected.filter((id) => id !== t.id) : [...selected, t.id];
                      setQuickStats((prev) => ({ ...prev, account_type: next.join(",") }));
                    }}
                    className="accent-brand-strong"
                  />
                  {t.name}
                </label>
              );
            })}
          </div>
        </Section>
      )}

      {/* "Industry" is SaaS's own name for this same Niche selector, mirrors
          the seller "new listing" form (Design & Development New 1.pdf,
          Sep 5, 2026) — see src/lib/industries.ts. AI Apps & Tools briefly
          shared this same mechanism (Design & Development New.pdf) but the
          user asked, same day, to drop Industry from that category
          entirely — so the whole section is skipped for it, same as the
          create form. */}
      {categoryId !== "ai-apps-tools" && (
        <Section
          title={INDUSTRY_ID_SPACE_CATEGORIES.has(categoryId) ? "Industry" : "Niche"}
          hint={INDUSTRY_ID_SPACE_CATEGORIES.has(categoryId) ? "Select every industry this business fits — shown on the published listing." : "Select every niche this business fits — shown on the published listing."}
        >
          <div className="grid max-h-64 grid-cols-2 gap-x-4 gap-y-1 overflow-y-auto rounded-xl border border-rule bg-paper-raised p-4 sm:grid-cols-3">
            {/* Android & iOS Apps has its own curated Niche list (src/lib/
                app-niches.ts), mirrors the create form. */}
            {(INDUSTRY_ID_SPACE_CATEGORIES.has(categoryId) ? INDUSTRIES : categoryId === "apps-tools" ? APP_NICHES : NICHES).map((n) => (
              <label key={n.id} className="flex items-center gap-2 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={niches.includes(n.id)}
                  onChange={() => setNiches((prev) => (prev.includes(n.id) ? prev.filter((id) => id !== n.id) : [...prev, n.id]))}
                  className="accent-brand-strong"
                />
                {n.name}
              </label>
            ))}
          </div>
        </Section>
      )}

      <Section title={categoryId === "youtube-channels" ? "Overview of the Channel" : categoryId === "websites" ? "Overview of the Website" : categoryId === "social-media-accounts" ? "Overview of the Account" : categoryId === "apps-tools" ? "Overview of the App" : categoryId === "domains" ? "Overview of the Domain" : "Overview of the Business"}>
        <textarea required rows={5} value={overview} onChange={(e) => setOverview(e.target.value)} className={`${inputCls} w-full`} />
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
        <EditableImageGallery
          label="Proof of Income Images"
          hint="Bank statements, payment processor dashboards, etc. — shown publicly on the listing so buyers can verify income."
          existing={existingImages.proof_of_income}
          onDeleteExisting={(id) => handleDeleteExistingImage("proof_of_income", id)}
          deletingId={deletingImageId}
          newFiles={incomeImages}
          setNewFiles={setIncomeImages}
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
            {/* Social Media Accounts, SaaS, AI Apps & Tools and Android &
                iOS Apps each see their own curated subset — see the
                matching comment in the seller "new listing" form. */}
            {(categoryId === "social-media-accounts"
              ? MONETIZATION_TYPES.filter((m) => SOCIAL_MEDIA_MONETIZATION_IDS.includes(m.id))
              : categoryId === "saas"
                ? MONETIZATION_TYPES.filter((m) => SAAS_MONETIZATION_IDS.includes(m.id))
                : categoryId === "ai-apps-tools"
                  ? MONETIZATION_TYPES.filter((m) => AI_APPS_TOOLS_MONETIZATION_IDS.includes(m.id))
                  : categoryId === "apps-tools"
                    ? MONETIZATION_TYPES.filter((m) => ANDROID_IOS_APPS_MONETIZATION_IDS.includes(m.id))
                    : categoryId === "startup-business"
                      ? MONETIZATION_TYPES.filter((m) => STARTUP_BUSINESS_MONETIZATION_IDS.includes(m.id))
                      : MONETIZATION_TYPES
            ).map((m) => (
              <label key={m.id} className="flex items-center gap-2 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={monetization.includes(m.id)}
                  onChange={() => setMonetization((prev) => (prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]))}
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
            </div>
            <EditableImageGallery
              label="Google Analytics Images"
              hint="support@durqo.com should have Viewer access on the GA account."
              existing={existingImages.google_analytics}
              onDeleteExisting={(id) => handleDeleteExistingImage("google_analytics", id)}
              deletingId={deletingImageId}
              newFiles={gaImages}
              setNewFiles={setGaImages}
            />
            <label className="mt-4 flex items-start gap-2.5 rounded-md border border-rule-strong bg-paper p-3 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={gaAccessConfirmed}
                onChange={(e) => setGaAccessConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
              />
              <span>
                <span className="mono text-ink">support@durqo.com</span> has been added as a Viewer on this site&rsquo;s Google Analytics 4 property.
              </span>
            </label>
          </Section>

          <Section title="Google Search Console Data" hint="Engagement statistics, last 12 months.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Total Clicks"><input value={gscClicks} onChange={(e) => setGscClicks(e.target.value)} className={inputCls} /></Field>
              <Field label="Total Impressions"><input value={gscImpressions} onChange={(e) => setGscImpressions(e.target.value)} className={inputCls} /></Field>
              <Field label="Indexed Pages"><input value={gscIndexed} onChange={(e) => setGscIndexed(e.target.value)} className={inputCls} /></Field>
              <Field label="Non-Indexed Pages"><input value={gscNonIndexed} onChange={(e) => setGscNonIndexed(e.target.value)} className={inputCls} /></Field>
              <Field label="Average CTR (%)"><input value={gscCtr} onChange={(e) => setGscCtr(e.target.value)} className={inputCls} /></Field>
            </div>
            <EditableImageGallery
              label="Google Search Console Images"
              existing={existingImages.search_console}
              onDeleteExisting={(id) => handleDeleteExistingImage("search_console", id)}
              deletingId={deletingImageId}
              newFiles={gscImages}
              setNewFiles={setGscImages}
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
            <EditableImageGallery
              label="SEMrush Data Images"
              existing={existingImages.semrush}
              onDeleteExisting={(id) => handleDeleteExistingImage("semrush", id)}
              deletingId={deletingImageId}
              newFiles={semrushImages}
              setNewFiles={setSemrushImages}
            />
          </Section>

          <Section title="Ahrefs Data">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="DR Rating"><input value={ahrefs.dr} onChange={(e) => setAhrefs({ ...ahrefs, dr: e.target.value })} className={inputCls} /></Field>
              <Field label="UR Rating"><input value={ahrefs.ur} onChange={(e) => setAhrefs({ ...ahrefs, ur: e.target.value })} className={inputCls} /></Field>
              <Field label="Referring Domains"><input value={ahrefs.refDomains} onChange={(e) => setAhrefs({ ...ahrefs, refDomains: e.target.value })} className={inputCls} /></Field>
              <Field label="Total Keywords"><input value={ahrefs.keywords} onChange={(e) => setAhrefs({ ...ahrefs, keywords: e.target.value })} className={inputCls} /></Field>
              <Field label="Total Backlinks"><input value={ahrefs.backlinks} onChange={(e) => setAhrefs({ ...ahrefs, backlinks: e.target.value })} className={inputCls} /></Field>
            </div>
            <EditableImageGallery
              label="Ahrefs Data Images"
              existing={existingImages.ahrefs}
              onDeleteExisting={(id) => handleDeleteExistingImage("ahrefs", id)}
              deletingId={deletingImageId}
              newFiles={ahrefsImages}
              setNewFiles={setAhrefsImages}
            />
          </Section>
        </>
      )}

      {categoryId === "youtube-channels" && (
        <Section title="Copyright Notes" hint="Any copyright claims/strikes on your videos or shorts, and how they affect monetization.">
          <textarea
            rows={4}
            value={copyrightNotesText}
            onChange={(e) => setCopyrightNotesText(e.target.value)}
            className={`${inputCls} w-full`}
          />
          <p className="mt-1.5 text-xs text-ink-faint">One note per line — shown as a list on the published listing. Saving updates the &ldquo;last updated&rdquo; date shown there to today.</p>
          <EditableImageGallery
            label="Proof of Copyright Notes"
            hint="Screenshot(s) of the Copyright Notices page in YouTube Studio."
            existing={existingImages.copyright_notes}
            onDeleteExisting={(id) => handleDeleteExistingImage("copyright_notes", id)}
            deletingId={deletingImageId}
            newFiles={copyrightImages}
            setNewFiles={setCopyrightImages}
          />
        </Section>
      )}

      {categoryId === "youtube-channels" && (
        <Section title="Top Performing Videos" hint="Up to 5 of your channel's best-performing videos — shown publicly with a thumbnail pulled from each video URL.">
          <div className="flex flex-col gap-4">
            {topVideoRows.map((v, i) => (
              <div key={i} className="rounded-xl border border-rule bg-paper-raised p-4">
                <h5 className="mb-3 text-sm font-semibold text-ink-soft">Video {i + 1}</h5>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Video URL" className="sm:col-span-2">
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={v.videoUrl}
                      onChange={(e) => setTopVideoRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, videoUrl: e.target.value } : row)))}
                      onBlur={(e) => fetchVideoInfo(i, e.target.value)}
                      className={inputCls}
                    />
                    {videoLookup[i] === "loading" && <p className="mt-1 text-xs text-ink-faint">Fetching details from YouTube…</p>}
                    {videoLookup[i] === "done" && <p className="mt-1 text-xs text-brand-strong">Auto-filled from YouTube — edit any field if needed.</p>}
                    {videoLookup[i] === "error" && <p className="mt-1 text-xs text-danger">Couldn&apos;t fetch details automatically — enter them manually below.</p>}
                  </Field>
                  <Field label="Title" className="sm:col-span-2">
                    <input value={v.title} onChange={(e) => setTopVideoRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, title: e.target.value } : row)))} className={inputCls} />
                  </Field>
                  <Field label="Views">
                    <input type="number" min="0" value={v.views} onChange={(e) => setTopVideoRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, views: e.target.value } : row)))} className={inputCls} />
                  </Field>
                  <Field label="Likes">
                    <input type="number" min="0" value={v.likes} onChange={(e) => setTopVideoRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, likes: e.target.value } : row)))} className={inputCls} />
                  </Field>
                  <Field label="Duration">
                    <input placeholder="12:18" value={v.duration} onChange={(e) => setTopVideoRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, duration: e.target.value } : row)))} className={inputCls} />
                  </Field>
                  <Field label="Upload date">
                    <input type="date" value={v.publishedOn} onChange={(e) => setTopVideoRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, publishedOn: e.target.value } : row)))} className={inputCls} />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {category.hasSocialStats && (
        <Section title="Social Media Accounts">
          <NamedValueRows rows={socialStatRows} setRows={setSocialStatRows} nameLabel="Platform (e.g. Instagram)" valueLabel="Followers" />
        </Section>
      )}

      <Section title="Sale Includes">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Assets included">
            <textarea rows={3} value={saleIncludesAssets} onChange={(e) => setSaleIncludesAssets(e.target.value)} className={`${inputCls} w-full`} />
          </Field>
          <Field label="Post-sale support">
            <textarea rows={3} value={saleIncludesSupport} onChange={(e) => setSaleIncludesSupport(e.target.value)} className={`${inputCls} w-full`} />
          </Field>
        </div>
      </Section>

      <div className="flex items-center gap-4 border-t border-rule pt-8">
        <button type="submit" disabled={saving} className="rounded-md bg-brand px-8 py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60">
          {saving ? "Saving…" : "Save Changes"}
        </button>
        {mode === "admin" && (status === "draft" || status === "pending_review") && (
          <button
            type="button"
            disabled={publishing}
            onClick={handlePublish}
            className="rounded-md border border-rule-strong px-6 py-3 text-sm font-semibold text-ink-soft hover:border-brand-strong hover:text-brand-strong disabled:opacity-60"
          >
            {publishing ? "Publishing…" : "Publish"}
          </button>
        )}
        <Link href={cancelHref} className="text-sm font-semibold text-ink-soft hover:text-ink">
          Cancel
        </Link>
      </div>
      {mode === "admin" && status === "published" && <p className="text-sm text-brand-strong">This listing is live and published.</p>}
      {saved && <p className="text-sm text-brand-strong">Saved — redirecting…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
