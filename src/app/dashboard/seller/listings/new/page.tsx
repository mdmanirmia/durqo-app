"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, CheckCircle2, Plus, Trash2, Upload } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SELLER_NAV } from "@/lib/dashboard-nav";
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
import { createClient } from "@/lib/supabase/client";
import { QUICK_STAT_COLUMNS } from "@/lib/data/map-listing";
import { parseDurationToSeconds } from "@/lib/format";

const MONTHS = ["Sep 2025","Oct 2025","Nov 2025","Dec 2025","Jan 2026","Feb 2026","Mar 2026","Apr 2026","May 2026","Jun 2026","Jul 2026","Aug 2026"];
const MONTH_KEYS = ["2025-09-01","2025-10-01","2025-11-01","2025-12-01","2026-01-01","2026-02-01","2026-03-01","2026-04-01","2026-05-01","2026-06-01","2026-07-01","2026-08-01"];

// Which quick-stat columns are text/date vs numeric, so form values get
// converted to the right type before hitting Postgres. "business_type"
// (E-commerce only) is a comma-separated string of ids built by the
// checkbox grid below, not a single typed value — it belongs here, not in
// the numeric branch, for the same reason "location" does.
const TEXT_QUICK_STAT_KEYS = new Set<QuickStatKey>(["location", "domain_age", "domain_registrar", "business_type", "account_type", "platform", "funding_stage"]);
const DATE_QUICK_STAT_KEYS = new Set<QuickStatKey>(["domain_expires"]);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Every category's Quick Statistics (income, traffic, authority score,
// follower counts, income multiple, etc.) are computed automatically after
// publish from data collected elsewhere on this form — see
// computeAutoQuickStats() in map-listing.ts — so sellers are never asked to
// type them in directly here. "Domains" is the one exception: its three
// stats (domain age/expiry/registrar) are facts about the domain itself
// with no other data collected anywhere on this form, so it keeps a plain
// manual Quick Statistics section, same as before this change.
const NO_AUTO_QUICK_STAT_CATEGORY = "domains";

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

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
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
  const [niches, setNiches] = useState<string[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<string[]>(Array(12).fill(""));
  const [loomVideoUrl, setLoomVideoUrl] = useState("");
  const [expenses, setExpenses] = useState([{ label: "", amount: "" }]);
  const [monetization, setMonetization] = useState<string[]>([]);

  const [gaAccessConfirmed, setGaAccessConfirmed] = useState(false);
  const [gaTotalUsers, setGaTotalUsers] = useState("");
  const [gaNewUsers, setGaNewUsers] = useState("");
  const [gaPageViews, setGaPageViews] = useState("");
  const [gaEngagementTime, setGaEngagementTime] = useState("");

  const [gscClicks, setGscClicks] = useState("");
  const [gscImpressions, setGscImpressions] = useState("");
  const [gscIndexed, setGscIndexed] = useState("");
  const [gscNonIndexed, setGscNonIndexed] = useState("");
  const [gscCtr, setGscCtr] = useState("");

  const [semrush, setSemrush] = useState({ authority: "", traffic: "", keywords: "", top10: "", backlinks: "" });
  const [ahrefs, setAhrefs] = useState({ dr: "", ur: "", refDomains: "", keywords: "", backlinks: "" });

  const [socialStats, setSocialStats] = useState([{ name: "", value: "" }]);

  // YouTube Channels category only (Design & Development New.pdf, Sep 4
  // 2026) — Copyright Notes (free text + proof screenshots) and up to 5
  // Top Performing Videos.
  const [copyrightNotes, setCopyrightNotes] = useState("");
  const [copyrightImages, setCopyrightImages] = useState<File[]>([]);
  const [topVideos, setTopVideos] = useState(
    Array.from({ length: 5 }, () => ({ title: "", videoUrl: "", views: "", likes: "", duration: "", publishedOn: "" }))
  );
  // Per-row auto-fill status for the Video URL → /api/youtube/video-info
  // lookup below (Sep 4, 2026 follow-up): "loading" while fetching,
  // "done"/"error" after, so each row can show its own inline status
  // without a page-wide spinner.
  const [videoLookup, setVideoLookup] = useState<Record<number, "loading" | "done" | "error">>({});

  // YouTube Channel Overview (Sep 4 2026 follow-up): auto-fills the 4
  // Channel Statistics fields above from the Channel URL, and separately
  // stashes the extra fields the public overview panel needs (identity +
  // the 3 "recent" stats) that don't have a manual form field of their own.
  const [channelOverview, setChannelOverview] = useState<{
    channelTitle: string;
    channelHandle: string | null;
    channelAvatarUrl: string | null;
    channelCreatedOn: string | null;
    avgViewsPerVideo: number | null;
    recentAvgViews: number | null;
    recentAvgLikes: number | null;
    engagementRatePercent: number | null;
  } | null>(null);
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
      setChannelOverview({
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
      setTopVideos((prev) =>
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

  const [incomeImages, setIncomeImages] = useState<File[]>([]);
  const [gaImages, setGaImages] = useState<File[]>([]);
  const [gscImages, setGscImages] = useState<File[]>([]);
  const [semrushImages, setSemrushImages] = useState<File[]>([]);
  const [ahrefsImages, setAhrefsImages] = useState<File[]>([]);

  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  // Set once the listing insert below succeeds, for categories that carry
  // Google Analytics data — swaps the form for a one-time "connect GA live
  // now?" screen instead of redirecting straight to the dashboard, since
  // OAuth connect needs a real listing id that only exists post-insert.
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCategoryChange(id: string) {
    setCategoryId(id);
    setQuickStats({});
    // SaaS has its own "Industry" option list (src/lib/industries.ts)
    // rather than the shared NICHES list every other category draws from
    // (Design & Development New 1.pdf, Sep 5, 2026) — the two id spaces
    // don't overlap, so a niches/industries selection made under one has to
    // be cleared when crossing into or out of SaaS, or it'd carry over ids
    // the new list (and INDUSTRY_MAP/NICHE_MAP) can't resolve. Every other
    // category-to-category switch still shares one id space, so the
    // selection is intentionally preserved there. (AI Apps & Tools forces
    // niches to [] unconditionally at submit time instead — see the insert
    // payload below — since it has no Niche/Industry section at all.)
    // Android & iOS Apps has its own curated Niche list too (src/lib/app-
    // niches.ts) — same id-space-mismatch reasoning applies when crossing
    // into or out of it.
    if (INDUSTRY_ID_SPACE_CATEGORIES.has(id) !== INDUSTRY_ID_SPACE_CATEGORIES.has(categoryId) || (id === "apps-tools") !== (categoryId === "apps-tools"))
      setNiches([]);
    setCopyrightNotes("");
    setCopyrightImages([]);
    setTopVideos(Array.from({ length: 5 }, () => ({ title: "", videoUrl: "", views: "", likes: "", duration: "", publishedOn: "" })));
    setChannelOverview(null);
    setChannelLookup(null);
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
          // Websites doesn't collect location (field is hidden above), so
          // never submit a stale value left over from switching categories.
          location: categoryId === "websites" ? null : location || null,
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
          // AI Apps & Tools dropped Industry entirely (Sep 5, 2026 follow-up
          // to Design & Development New.pdf) — the Niche/Industry section is
          // hidden above for this category, so never submit a stale
          // selection left over from switching categories.
          niches: categoryId === "ai-apps-tools" ? [] : niches,
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
        if (gaEngagementTime) {
          const secs = parseDurationToSeconds(gaEngagementTime);
          if (secs !== null) seo.ga_avg_engagement_seconds = secs;
        }
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

      // Copyright Notes + Top Performing Videos — YouTube Channels only.
      if (categoryId === "youtube-channels") {
        if (copyrightNotes.trim()) {
          const { error } = await supabase
            .from("listing_copyright_notes")
            .insert({ listing_id: listingId, notes: copyrightNotes, updated_on: new Date().toISOString().slice(0, 10) });
          if (error) throw new Error(`Saving Copyright Notes failed: ${error.message}`);
        }
        const videoRows = topVideos
          .filter((v) => v.title)
          .map((v, i) => ({
            listing_id: listingId,
            rank: i + 1,
            title: v.title,
            video_url: v.videoUrl || null,
            views: v.views ? Number(v.views) : null,
            likes: v.likes ? Number(v.likes) : null,
            duration: v.duration || null,
            published_on: v.publishedOn || null,
          }));
        if (videoRows.length) {
          const { error } = await supabase.from("listing_top_videos").insert(videoRows);
          if (error) throw new Error(`Saving Top Performing Videos failed: ${error.message}`);
        }
        if (channelOverview) {
          const { error } = await supabase.from("listing_youtube_channel_overview").insert({
            listing_id: listingId,
            channel_title: channelOverview.channelTitle,
            channel_handle: channelOverview.channelHandle,
            channel_avatar_url: channelOverview.channelAvatarUrl,
            channel_created_on: channelOverview.channelCreatedOn,
            avg_views_per_video: channelOverview.avgViewsPerVideo,
            recent_avg_views: channelOverview.recentAvgViews,
            recent_avg_likes: channelOverview.recentAvgLikes,
            engagement_rate_percent: channelOverview.engagementRatePercent,
          });
          if (error) throw new Error(`Saving Channel Overview failed: ${error.message}`);
        }
      }

      await uploadGallery(supabase, sellerId, listingId, incomeImages, "proof_of_income");
      await uploadGallery(supabase, sellerId, listingId, gaImages, "google_analytics");
      await uploadGallery(supabase, sellerId, listingId, gscImages, "search_console");
      await uploadGallery(supabase, sellerId, listingId, semrushImages, "semrush");
      await uploadGallery(supabase, sellerId, listingId, ahrefsImages, "ahrefs");
      if (categoryId === "youtube-channels") {
        await uploadGallery(supabase, sellerId, listingId, copyrightImages, "copyright_notes");
      }

      setSubmitted(true);
      if (category.hasSeoData) {
        setCreatedListingId(listingId);
      } else {
        setTimeout(() => router.push("/dashboard/seller"), 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong creating the listing.");
    } finally {
      setSaving(false);
    }
  }

  // Shown once instead of the form, right after a successful submit, for
  // categories that carry Google Analytics data — a one-time chance to
  // connect the live OAuth panel (see GoogleAnalyticsLivePanel.tsx) in the
  // same flow as listing creation, rather than making the seller find the
  // Connect button on the dashboard's listings table afterward.
  if (createdListingId) {
    return (
      <DashboardShell title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
        <div className="mx-auto max-w-lg rounded-xl border border-rule bg-paper-raised p-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand-hover">
            <CheckCircle2 size={24} />
          </span>
          <h2 className="mb-2 text-xl text-ink">Listing submitted for review</h2>
          <p className="mb-6 text-sm text-ink-faint">
            A Durqo team member verifies every listing before it goes live. While you wait, want to connect Google
            Analytics now so live stats are ready as soon as it&rsquo;s approved?
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href={`/api/google-analytics/connect?listingId=${createdListingId}`}
              className="flex items-center gap-1.5 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              <BarChart3 size={15} /> Connect Google Analytics now
            </a>
            <button
              type="button"
              onClick={() => router.push("/dashboard/seller")}
              className="rounded-md border border-rule-strong px-5 py-2.5 text-sm font-semibold text-ink-soft hover:border-brand-strong hover:text-brand-strong"
            >
              Skip, do it later
            </button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-8">
        <div>
          <h2 className="mb-1 text-xl">Add New Business</h2>
          <p className="text-sm text-ink-faint">Every submission is reviewed and income-verified before it goes live.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={categoryId === "youtube-channels" ? "Channel Name" : categoryId === "websites" ? "Website title" : categoryId === "social-media-accounts" ? "Account Name" : categoryId === "apps-tools" ? "App Name" : "Business title"}>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Southbound Coffee Co." className={inputCls} />
          </Field>
          <Field label="Category">
            <select value={categoryId} onChange={(e) => handleCategoryChange(e.target.value)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>

        {/* Business Location: not collected for Websites (Sep 2026 revision —
            the user asked for it to be dropped from this category, unlike
            E-commerce and every other category where it's still shown and
            still feeds the "Business Location" Quick Stat). Labels below
            switch to "Channel Name/URL/Location" for YouTube Channels
            (Design & Development New.pdf, Sep 4 2026) — same underlying
            fields/columns, just different copy for that category. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={categoryId === "youtube-channels" ? "Channel URL" : categoryId === "websites" ? "Website URL" : categoryId === "social-media-accounts" ? "Account URL" : categoryId === "apps-tools" ? "App URL" : "Business URL"} className={categoryId === "websites" ? "sm:col-span-2" : undefined}>
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
          {categoryId !== "websites" && (
            <Field label={categoryId === "youtube-channels" ? "Channel location" : categoryId === "social-media-accounts" ? "Account location" : categoryId === "apps-tools" ? "App location" : "Business location"}>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country (or Remote)" className={inputCls} />
            </Field>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Asking price (USD)">
            <input required type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="75000" className={inputCls} />
          </Field>
          <Field label="Discounted price (USD, optional)">
            <input type="number" min="0" value={discountedPrice} onChange={(e) => setDiscountedPrice(e.target.value)} placeholder="" className={inputCls} />
          </Field>
        </div>

        {/* Quick Statistics: computed automatically after publish for every
            category except Domains (see NO_AUTO_QUICK_STAT_CATEGORY above) —
            so there's no manual "Quick Statistics" block here for those.
            Business Age has no other source anywhere on this form, so it
            stays a plain input (not grouped under a Quick Statistics
            heading); Articles Posted is the same for Websites specifically. */}
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
          // Sep 4 2026 follow-up: this used to be a manual "Channel
          // Statistics" section (Total Subscribers/Total Views/Total
          // Videos/Channel Age), but all four are now fully covered by
          // fetchChannelInfo() firing on the Channel URL field's onBlur
          // above — the user asked to drop the redundant manual inputs
          // entirely ("list korar somoi eita input deyar dorkar nei karon
          // other sob data theke ei gulo peye jasse") since sellers were
          // being asked to type numbers the app already fetches itself.
          // quickStats.subscribers/.total_views/.total_videos/.channel_age
          // are still set — just silently, by that lookup — and still get
          // submitted below; there's simply no visible input for them
          // anymore, on this form or on ListingEditForm.
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
                {/* Active Subscribers — SaaS only (Design & Development New
                    1.pdf, Sep 5, 2026), replacing "Articles Posted" for this
                    category. Same plain manual input mechanism as Articles
                    Posted, just a distinct QuickStatKey/column so that
                    field stays untouched for Websites/E-commerce. */}
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
                {/* Total Followers — Social Media Accounts only (Design &
                    Development New.pdf, Sep 5, 2026). A plain manual input,
                    not computed from Social Stats — see the carve-out for
                    this category in computeAutoQuickStats() in
                    map-listing.ts. */}
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

        {/* App Statistics — Android & iOS Apps only (Design & Development
            New.pdf, "Update the Apps & Tools category to Android & iOS
            Apps" revision, Sep 5, 2026): replaces the generic "Quick
            Statistics" heading for this category with Rating/Reviews/
            Downloads-Installs/Store Price. Plain manual number inputs
            (rating/total_reviews/total_downloads columns already existed in
            the schema from day one; store_price is new, migration 020) —
            step="any" deliberately, not a fixed step like "0.5" or "0.1":
            a mismatched decimal value under a fixed step silently blocks
            native HTML5 form submission with no console error or network
            request (see the PixelMind AI Design Studio submit-button bug,
            same day) — step="any" keeps the numeric input/keyboard without
            that risk. */}
        {categoryId === "apps-tools" && (
          <Section title="App Statistics" hint="Shown on your published listing instead of Quick Statistics.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Rating">
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="any"
                  value={quickStats.rating ?? ""}
                  onChange={(e) => setQuickStats((prev) => ({ ...prev, rating: e.target.value }))}
                  placeholder="4.5"
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
                  placeholder="1200"
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
                  placeholder="50000"
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
                  placeholder="0 for free"
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>
        )}

        {/* Platform — Android & iOS Apps only (Design & Development New.pdf,
            same revision). Originally a single-select; changed to a
            multi-select checkbox grid (Sep 5, 2026 follow-up — a seller can
            list an app as available on both iOS and Android) storing a
            comma-separated string of ids in quickStats.platform (see
            TEXT_QUICK_STAT_KEYS above), same mechanism as Business
            Type/Account Type below. */}
        {categoryId === "apps-tools" && (
          <Section title="Platform" hint="Select every platform this app is available on — shown as a Quick Stat on your published listing.">
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

        {/* Startup Details — Startup Business only (user request, Sep 5,
            2026): Funding Stage (single-select — a startup is only ever at
            one stage, so a plain <select> rather than the checkbox-grid
            multi-select mechanism the rest of this form uses, stored as a
            single plain-text id in quickStats.funding_stage, see
            TEXT_QUICK_STAT_KEYS above) plus Funding Raised/Team Size (plain
            manual numeric inputs, same treatment as Android & iOS Apps'
            Store Price/Rating/etc). */}
        {categoryId === "startup-business" && (
          <Section title="Startup Details" hint="Shown as Quick Stats on your published listing.">
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
                  placeholder="0 if bootstrapped"
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
                  placeholder="5"
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>
        )}

        {/* Business Type — E-commerce, AI Apps & Tools and Startup Business
            (Sep 5, 2026 requests). Stored as a comma-separated string of
            ids in quickStats.business_type (see TEXT_QUICK_STAT_KEYS
            above), the same free-text-like column shape "location" already
            uses, so it needs no dedicated state or submit-path changes —
            just this checkbox grid toggling that one string. AI Apps &
            Tools shows its own curated option list (src/lib/ai-business-
            types.ts — which major AI model the app is built on) and
            Startup Business shows its own list (src/lib/startup-business-
            models.ts — B2B/B2C/Marketplace/etc, labeled "Business Model" on
            the public listing page) instead of E-commerce's business-model
            list, same column/mechanism, picked by category the same way
            the Niche/Industry section below
            switches lists. buildQuickStats() in map-listing.ts joins the
            ids into display names (using the right map for the category)
            before the public listing page's Quick Statistics grid renders
            it. */}
        {(categoryId === "e-commerce" || categoryId === "ai-apps-tools" || categoryId === "startup-business") && (
          <Section
            title={categoryId === "startup-business" ? "Business Model" : "Business Type"}
            hint={
              categoryId === "ai-apps-tools"
                ? "Select every AI model this app or tool is built on — shown as a Quick Stat on your published listing."
                : categoryId === "startup-business"
                  ? "Select every business model this startup runs on — shown as a Quick Stat on your published listing."
                  : "Select every business model this store uses — shown as a Quick Stat on your published listing."
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

        {/* Account Type — Social Media Accounts only (Design & Development
            New.pdf, Sep 5, 2026). Same mechanism as Business Type above:
            a comma-separated string of ids in quickStats.account_type (see
            TEXT_QUICK_STAT_KEYS above), joined into display names by
            buildQuickStats() in map-listing.ts before the public listing
            page's Quick Statistics grid renders it. */}
        {categoryId === "social-media-accounts" && (
          <Section title="Account Type" hint="Select every platform this account is on — shown as a Quick Stat on your published listing.">
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

        {/* "Industry" is SaaS's own name for this same Niche selector
            (Design & Development New 1.pdf, Sep 5, 2026) — a shared curated
            option list (src/lib/industries.ts), but stored in the same
            `niches` state/column as every other category, same treatment as
            "Account Location" being just `location` under a different label
            for Social Media Accounts. AI Apps & Tools originally shared this
            same Industry mechanism (Design & Development New.pdf) but the
            user asked (Sep 5, 2026 follow-up) to drop Industry from this
            category entirely — not just hide it from Quick Statistics, but
            remove the selector from the form too — so the whole section is
            skipped for ai-apps-tools rather than falling back to a generic
            "Niche" section. */}
        {categoryId !== "ai-apps-tools" && (
          <Section
            title={INDUSTRY_ID_SPACE_CATEGORIES.has(categoryId) ? "Industry" : "Niche"}
            hint={INDUSTRY_ID_SPACE_CATEGORIES.has(categoryId) ? "Select every industry this business fits — shown on your published listing." : "Select every niche this business fits — shown on your published listing."}
          >
            <div className="grid max-h-64 grid-cols-2 gap-x-4 gap-y-1 overflow-y-auto rounded-xl border border-rule bg-paper-raised p-4 sm:grid-cols-3">
              {/* Android & iOS Apps has its own curated Niche list (src/lib/
                  app-niches.ts, Design & Development New.pdf, Sep 5, 2026) —
                  same "Niche" label as the generic case, just a different
                  option list, same treatment as SaaS's Industry swap above. */}
              {(INDUSTRY_ID_SPACE_CATEGORIES.has(categoryId) ? INDUSTRIES : categoryId === "apps-tools" ? APP_NICHES : NICHES).map((n) => (
                <label key={n.id} className="flex items-center gap-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={niches.includes(n.id)}
                    onChange={() =>
                      setNiches((prev) => (prev.includes(n.id) ? prev.filter((id) => id !== n.id) : [...prev, n.id]))
                    }
                    className="accent-brand-strong"
                  />
                  {n.name}
                </label>
              ))}
            </div>
          </Section>
        )}

        <Section title={categoryId === "youtube-channels" ? "Overview of the Channel" : categoryId === "websites" ? "Overview of the Website" : categoryId === "social-media-accounts" ? "Overview of the Account" : categoryId === "apps-tools" ? "Overview of the App" : "Overview of the Business"}>
          <textarea
            required
            rows={5}
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            placeholder={
              categoryId === "websites"
                ? "What does the website do, how is it monetized, and why are you selling?"
                : categoryId === "social-media-accounts"
                  ? "What is the account about, how is it monetized, and why are you selling?"
                  : "What does the business do, how is it monetized, and why are you selling?"
            }
            className={`${inputCls} w-full`}
          />
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
              {/* Social Media Accounts, SaaS, AI Apps & Tools and Android &
                  iOS Apps each see their own curated subset of the shared
                  monetization list (Design & Development New.pdf / New
                  1.pdf / New.pdf / New.pdf, Sep 5, 2026) — see
                  SOCIAL_MEDIA_MONETIZATION_IDS / SAAS_MONETIZATION_IDS /
                  AI_APPS_TOOLS_MONETIZATION_IDS / ANDROID_IOS_APPS_
                  MONETIZATION_IDS in monetization-types.ts. Every other
                  category keeps seeing the full generic list, unchanged. */}
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

            <Section title="Google Search Console Data" hint="Engagement statistics, last 12 months.">
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

        {categoryId === "youtube-channels" && (
          <Section title="Copyright Notes" hint="Any copyright claims/strikes on your videos or shorts, and how they affect monetization.">
            <textarea
              rows={4}
              value={copyrightNotes}
              onChange={(e) => setCopyrightNotes(e.target.value)}
              placeholder={"e.g. 2 copyright notes found on videos\n1 video is tagged as \"This video is ineligible to earn...\"\nNo copyright notes found on shorts"}
              className={`${inputCls} w-full`}
            />
            <p className="mt-1.5 text-xs text-ink-faint">One note per line — shown as a list on your published listing, with today&rsquo;s date as the &ldquo;last updated&rdquo; stamp.</p>
            <ImageGallery
              label="Proof of Copyright Notes"
              hint="Screenshot(s) of the Copyright Notices page in YouTube Studio."
              files={copyrightImages}
              setFiles={setCopyrightImages}
            />
          </Section>
        )}

        {categoryId === "youtube-channels" && (
          <Section title="Top Performing Videos" hint="Up to 5 of your channel's best-performing videos — shown publicly with a thumbnail pulled from each video URL.">
            <div className="flex flex-col gap-4">
              {topVideos.map((v, i) => (
                <div key={i} className="rounded-xl border border-rule bg-paper-raised p-4">
                  <h5 className="mb-3 text-sm font-semibold text-ink-soft">Video {i + 1}</h5>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Video URL" className="sm:col-span-2">
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={v.videoUrl}
                        onChange={(e) => setTopVideos((prev) => prev.map((row, idx) => (idx === i ? { ...row, videoUrl: e.target.value } : row)))}
                        onBlur={(e) => fetchVideoInfo(i, e.target.value)}
                        className={inputCls}
                      />
                      {videoLookup[i] === "loading" && <p className="mt-1 text-xs text-ink-faint">Fetching details from YouTube…</p>}
                      {videoLookup[i] === "done" && <p className="mt-1 text-xs text-brand-strong">Auto-filled from YouTube — edit any field if needed.</p>}
                      {videoLookup[i] === "error" && <p className="mt-1 text-xs text-danger">Couldn&apos;t fetch details automatically — enter them manually below.</p>}
                    </Field>
                    <Field label="Title" className="sm:col-span-2">
                      <input value={v.title} onChange={(e) => setTopVideos((prev) => prev.map((row, idx) => (idx === i ? { ...row, title: e.target.value } : row)))} className={inputCls} />
                    </Field>
                    <Field label="Views">
                      <input type="number" min="0" value={v.views} onChange={(e) => setTopVideos((prev) => prev.map((row, idx) => (idx === i ? { ...row, views: e.target.value } : row)))} className={inputCls} />
                    </Field>
                    <Field label="Likes">
                      <input type="number" min="0" value={v.likes} onChange={(e) => setTopVideos((prev) => prev.map((row, idx) => (idx === i ? { ...row, likes: e.target.value } : row)))} className={inputCls} />
                    </Field>
                    <Field label="Duration">
                      <input placeholder="12:18" value={v.duration} onChange={(e) => setTopVideos((prev) => prev.map((row, idx) => (idx === i ? { ...row, duration: e.target.value } : row)))} className={inputCls} />
                    </Field>
                    <Field label="Upload date">
                      <input type="date" value={v.publishedOn} onChange={(e) => setTopVideos((prev) => prev.map((row, idx) => (idx === i ? { ...row, publishedOn: e.target.value } : row)))} className={inputCls} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {category.hasSocialStats && (
          <Section title="Social Media Accounts">
            <NamedValueRows rows={socialStats} setRows={setSocialStats} nameLabel="Platform (e.g. Instagram)" valueLabel="Followers" />
          </Section>
        )}

        <Section title="Sale Includes">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Assets included">
              <textarea
                rows={3}
                value={saleIncludesAssets}
                onChange={(e) => setSaleIncludesAssets(e.target.value)}
                placeholder={
                  categoryId === "social-media-accounts"
                    ? "Social media account, unique content, unique design, email lists…"
                    : categoryId === "saas"
                      ? "Domain, website files, brand assets, content, email lists…"
                      : "Domain, codebase, social accounts, email list…"
                }
                className={`${inputCls} w-full`}
              />
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
