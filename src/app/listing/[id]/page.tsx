import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import {
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Eye,
  ThumbsUp,
  Clock,
  Calendar,
  MailCheck,
  Store,
  BarChart3,
  Info,
  LineChart,
  TrendingUp,
  Coins,
  Layers,
  Copyright as CopyrightIcon,
  PlayCircle,
  Search,
  Radar,
  Link2,
  Users,
  Package,
  CreditCard,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getListingById } from "@/lib/data/listings.server";
import { CATEGORY_MAP, QUICK_STAT_LABELS, QuickStatKey } from "@/lib/categories";
import { NICHE_MAP } from "@/lib/niches";
import { INDUSTRY_MAP } from "@/lib/industries";
import { INDUSTRY_ID_SPACE_CATEGORIES } from "@/lib/categories";
import { APP_NICHE_MAP } from "@/lib/app-niches";
import { MONETIZATION_MAP } from "@/lib/monetization-types";
import { fmtUSD, fmtNumber, fmtDisplayUrl, toHref, youtubeThumbnailUrl } from "@/lib/format";
import { ONLINE_DEPOSIT_CAP } from "@/lib/payment-terms";
import IncomeHistoryPanel from "@/components/IncomeHistoryPanel";
import GoogleAnalyticsLivePanel from "@/components/GoogleAnalyticsLivePanel";
import FaqAccordion from "@/components/FaqAccordion";
import CommentsPanel from "@/components/CommentsPanel";
import ProofGalleryButton from "@/components/ProofGalleryButton";
import CartButton from "@/components/CartButton";
import BuyNowButton from "@/components/BuyNowButton";
import WishlistButton from "@/components/WishlistButton";
import ChatWithSellerButton from "@/components/ChatWithSellerButton";
import Container from "@/components/ui/Container";
import { Badge, StatusBadge } from "@/components/ui/Badge";

// Listings are now real, changing data from Supabase (with a mock-data
// fallback baked into getListingById) rather than a fixed set known at
// build time, so this page renders per-request instead of being statically
// generated for a hardcoded list of mock IDs.
export const dynamic = "force-dynamic";

// Sep 8, 2026 technical-SEO pass (Section 8/9/12): dynamic per-listing
// metadata built only from real, already-public Supabase fields — no
// hardcoded copy, no invented data. `getListingById` returns a row
// regardless of status (drafts/pending/archived included — that's existing,
// pre-SEO-pass behavior this task doesn't change), so `robots` is forced to
// noindex,nofollow for anything that isn't actually public yet (Section 10).
// The OG image is always the site default: this data model has no
// public-facing marketing photo (the only per-listing images are proof-of-
// income/GA/GSC/SEMrush/Ahrefs verification screenshots — evidence, not
// something to publish via a social-share preview, per Section 25).
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) return {};

  const category = CATEGORY_MAP[listing.categoryId];
  const categoryName = category?.name ?? listing.categoryId;
  const canonical = `https://www.durqo.com/listing/${listing.id}`;
  const isPublic = listing.status === "published" || listing.status === "sold";

  const longTitle = `${listing.title} - ${categoryName} for Sale | Durqo`;
  const title = longTitle.length > 65 ? `${listing.title} for Sale | Durqo` : longTitle;

  const askingPrice = listing.discountedPrice ?? listing.price;
  const description =
    askingPrice != null
      ? `${listing.title} is a ${categoryName} listed for sale on Durqo. Review its available business information and asking price of ${fmtUSD(askingPrice)}.`
      : `${listing.title} is a ${categoryName} listed for sale on Durqo. Review its available business information and asking price.`;

  return {
    title,
    description,
    robots: isPublic ? { index: true, follow: true } : { index: false, follow: false },
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: "Durqo",
      title,
      description,
      url: canonical,
      images: [{ url: "/og/durqo-home.jpg", width: 1200, height: 630, alt: "Durqo marketplace for buying and selling digital businesses" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og/durqo-home.jpg"],
    },
  };
}

// ---------------------------------------------------------------------------
// Premium card design system (Sep 2026 redesign, v2) — every section on this
// page is exactly one card: an icon + heading (+ optional subtitle/action)
// header, then all of that section's data inside the same card body. This
// is deliberately more restrained than the first attempt at this redesign
// (reverted): no borrowed reference-mockup colors, just Durqo's own
// paper/ink/brand tokens (globals.css) pushed further with soft elevation,
// generous spacing and a divided-grid pattern for stats so numbers read like
// one cohesive data table rather than a scatter of floating boxes. Scoped
// entirely to this page and the handful of components exclusive to it, so
// nothing here touches the shared design tokens or any other route.
// ---------------------------------------------------------------------------

/** Section-card chrome: icon badge + title (+ subtitle/action) header, one
 *  bordered/elevated container per section. `bodyClassName` lets a section
 *  opt out of the default padding when its content (a StatGrid) wants to
 *  bleed edge-to-edge with its own internal divider lines. */
function SectionCard({
  title,
  icon: Icon,
  subtitle,
  action,
  bodyClassName,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  subtitle?: string;
  action?: React.ReactNode;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-hover">
              <Icon size={17} />
            </span>
          )}
          <div>
            <h2 className="text-base font-semibold text-ink sm:text-lg">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-ink-faint">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className={bodyClassName ?? "p-5 sm:p-6"}>{children}</div>
    </section>
  );
}

/** A plain green-dot + text "Connected" indicator — lighter-weight than a
 *  solid pill badge, used consistently for every live-data connection
 *  (Google Analytics, Channel Analytics) per earlier design feedback. */
function ConnectedIndicator() {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
      <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Connected
    </span>
  );
}

type StatItem = { label: string; value: string | number | undefined };

/** The core "all this section's data in one place" primitive: a gapped grid
 *  of individually-boxed stat tiles (value on top, label below) — per user
 *  feedback (Sep 8 2026) on the divided-line grid this replaced, each stat
 *  reads better sitting in its own bordered rectangle than as a cell in one
 *  continuous ruled table. Cells with an undefined/empty value are dropped. */
function StatGrid({ items, colsDesktop = 4 }: { items: StatItem[]; colsDesktop?: 3 | 4 | 5 }) {
  const visible = items.filter((i) => i.value !== undefined && i.value !== "");
  if (!visible.length) return null;
  const desktopColsClass = colsDesktop === 3 ? "sm:grid-cols-3" : colsDesktop === 5 ? "sm:grid-cols-5" : "sm:grid-cols-4";
  return (
    <div className={`grid grid-cols-2 gap-3 ${desktopColsClass}`}>
      {visible.map((item) => (
        <div key={item.label} className="rounded-xl border border-brand/10 bg-brand-soft/25 p-4">
          <div className="mono text-lg font-bold leading-tight tracking-tight text-brand-strong sm:text-xl">{typeof item.value === "number" ? fmtNumber(item.value) : item.value}</div>
          <div className="mono mt-1.5 text-[0.7rem] font-medium uppercase tracking-wider text-brand-hover/60">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

/** Label-only sibling of StatGrid, for a section whose "data" is a set of
 *  short tags (e.g. Monetization Methods) rather than value/label pairs —
 *  same individually-boxed-tile treatment as StatGrid. */
function LabelGrid({ labels, colsDesktop = 3 }: { labels: string[]; colsDesktop?: 3 | 4 }) {
  if (!labels.length) return null;
  const desktopColsClass = colsDesktop === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3";
  return (
    <div className={`grid grid-cols-2 gap-3 ${desktopColsClass}`}>
      {labels.map((label) => (
        <div key={label} className="rounded-xl border border-brand/10 bg-brand-soft/25 px-4 py-3.5 text-sm font-medium text-brand-strong">
          {label}
        </div>
      ))}
    </div>
  );
}

export default async function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  // Sep 9, 2026: who's viewing decides what the merged FAQ/comments section
  // below can do — a logged-in visitor can post a new question, and only
  // the listing's own seller sees the "Reply as seller" control on an
  // unanswered one. See src/components/CommentsPanel.tsx and
  // src/lib/actions/comments.ts for the rest of this feature.
  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const isListingSeller = !!viewer && viewer.id === listing.seller.id;

  const category = CATEGORY_MAP[listing.categoryId];
  const price = listing.discountedPrice ?? listing.price;
  const incomeSeries = listing.monthlyStats.map((m) => ({ month: m.month, income: m.income }));

  // Websites/E-commerce Quick Stat label overrides (Business Page Layout
  // .docx, Sep 1, 2026 revision): "Monthly Income"/"Monthly Views" are
  // computed averages for these two categories (see mapListing), so the
  // label clarifies that — scoped here rather than in the shared
  // QUICK_STAT_LABELS map since every other category still shows a
  // manually-entered value under the plain "Monthly Income"/"Monthly Views"
  // label.
  // YouTube Channels label overrides (Design & Development New.pdf, Sep 4
  // 2026): "Business Location" -> "Channel Location", "Monthly Income" ->
  // "Avg. Monthly Income" (same averaging as Websites/E-commerce, just
  // sourced from this category's own Proof of Income entries), and
  // "Subscribers" -> "Total Subscribers" — scoped to this category only so
  // Newsletters' plain "Subscribers" label is untouched.
  // Social Media Accounts label overrides (Design & Development New.pdf,
  // Sep 5, 2026): this category's whole Quick Statistics vocabulary talks
  // about "the account" rather than "the business" — "Business Location" ->
  // "Account Location", "Monthly Income" -> "Avg. Monthly Income" (same
  // averaging as every other category), "Followers" -> "Total Followers",
  // "Business Age" -> "Account Age". "Account Type" already reads correctly
  // from the shared QUICK_STAT_LABELS map, no override needed.
  // AI Apps & Tools (Design & Development New.pdf, Sep 5, 2026 — a brand
  // new category) gets the same "Avg. Monthly Income" treatment as SaaS;
  // "Business Type" already reads correctly from the shared
  // QUICK_STAT_LABELS map, no override needed.
  // Startup Business (user request, Sep 5, 2026 — a brand new category):
  // "Business Location" -> "Company Location", "Monthly Income" -> "Avg.
  // Monthly Income" (same averaging as every other category), "Business
  // Type" -> "Business Model" (this category's own curated list of
  // business models, src/lib/startup-business-models.ts, reusing the
  // shared business_type column). "Funding Stage"/"Funding Raised"/"Team
  // Size"/"Business Age" all already read correctly from the shared
  // QUICK_STAT_LABELS map, no override needed. Niche/Industry labeling is
  // handled generically via INDUSTRY_ID_SPACE_CATEGORIES below (categories.ts) —
  // this category shares SaaS's "Industry" option list/label.
  const quickStatLabelOverrides: Partial<Record<QuickStatKey, string>> =
    listing.categoryId === "websites"
      ? { monthly_income: "Avg. Monthly Income", monthly_views: "Avg. Monthly Views", age: "Website Age" }
      : listing.categoryId === "e-commerce"
      ? { monthly_income: "Avg. Monthly Income", monthly_views: "Avg. Monthly Views" }
      : listing.categoryId === "youtube-channels"
        ? { location: "Channel Location", monthly_income: "Avg. Monthly Income", subscribers: "Total Subscribers" }
        : listing.categoryId === "social-media-accounts"
          ? { location: "Account Location", monthly_income: "Avg. Monthly Income", followers: "Total Followers", age: "Account Age" }
          : listing.categoryId === "saas" || listing.categoryId === "ai-apps-tools"
            ? { monthly_income: "Avg. Monthly Income" }
            : listing.categoryId === "apps-tools"
              ? { location: "App Location", monthly_income: "Avg. Monthly Income", age: "App Age", total_reviews: "Reviews", total_downloads: "Downloads/Installs" }
              : listing.categoryId === "startup-business"
                ? { location: "Company Location", monthly_income: "Avg. Monthly Income", business_type: "Business Model" }
                : {};

  // YouTube Channels Quick Statistics — trimmed to just Channel Location,
  // Avg. Monthly Income, and Channel Age (Sep 2026 request: only these plus
  // the always-shown Niche/Asking Price belong in Quick Statistics for this
  // category). Subscribers/Total Views/Total Videos stay in
  // category.quickStats (categories.ts) so buildQuickStats() still computes
  // them into listing.quickStats — the "Channel Analytics" panel further
  // down the page (renamed/moved from "YouTube Channel Overview", see
  // below) reads those same values directly, so they aren't lost, just no
  // longer duplicated in the Quick Statistics grid below.
  const quickStatDisplayKeys: QuickStatKey[] =
    listing.categoryId === "youtube-channels"
      ? (category?.quickStats.filter((k) => k === "location" || k === "monthly_income" || k === "channel_age") ?? [])
      : (category?.quickStats ?? []);

  // Real uploaded verification screenshots, grouped by which data section
  // they belong to — empty when this listing predates real Storage uploads
  // (ProofGalleryButton falls back to a placeholder in that case).
  const imagesByKind = (kind: string) => (listing.images ?? []).filter((img) => img.kind === kind).map((img) => img.url);
  const incomeImageUrls = imagesByKind("proof_of_income");
  const gaImageUrls = imagesByKind("google_analytics");
  const gscImageUrls = imagesByKind("search_console");
  const semrushImageUrls = imagesByKind("semrush");
  const ahrefsImageUrls = imagesByKind("ahrefs");
  const copyrightImageUrls = imagesByKind("copyright_notes");
  const copyrightNoteLines = (listing.copyrightNotes?.notes ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const topVideos = (listing.topVideos ?? []).filter((v) => v.title);

  // "Channel Analytics" panel (Sep 4 2026, renamed from "YouTube Channel
  // Overview" and moved to right after "Overview of the Channel" per a
  // same-day follow-up request) — auto-populated from the Channel URL (see
  // fetchYoutubeChannelOverview() in src/lib/youtube.ts). Renders whenever a
  // sync has completed at least once; the plain manual Channel Statistics
  // tiles in Quick Statistics above still show even without this, same
  // fallback reasoning as the Google Analytics section.
  const channelOverview = listing.channelOverview;
  const channelSinceYear = channelOverview?.channelCreatedOn ? new Date(`${channelOverview.channelCreatedOn}T00:00:00`).getFullYear() : undefined;
  const channelLastUpdated = channelOverview?.lastSyncedAt
    ? new Date(`${channelOverview.lastSyncedAt}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : undefined;

  // A section should render whenever there's anything to show for it — the
  // seller may have typed in manual numbers, uploaded proof screenshots, or
  // both. Gating solely on `listing.seo` being present hid sections (and
  // the screenshots inside them) whenever only images were uploaded with no
  // numeric fields filled in, since no listing_seo_data row gets written in
  // that case (see the form's handleSubmit).
  const hasGaData =
    !!listing.gaLiveStats ||
    gaImageUrls.length > 0 ||
    listing.seo?.gaTotalUsers !== undefined ||
    listing.seo?.gaNewUsers !== undefined ||
    listing.seo?.gaTotalPageViews !== undefined ||
    listing.seo?.gaAvgEngagementSeconds !== undefined;
  const hasGscData =
    gscImageUrls.length > 0 ||
    listing.seo?.gscTotalClicks !== undefined ||
    listing.seo?.gscTotalImpressions !== undefined ||
    listing.seo?.gscIndexedPages !== undefined ||
    listing.seo?.gscNonIndexedPages !== undefined ||
    listing.seo?.gscAvgCtr !== undefined;
  const hasSemrushData =
    semrushImageUrls.length > 0 ||
    listing.seo?.semrushAuthorityScore !== undefined ||
    listing.seo?.semrushTotalTraffic !== undefined ||
    listing.seo?.semrushTotalKeywords !== undefined ||
    listing.seo?.semrushTop10Keywords !== undefined ||
    listing.seo?.semrushTotalBacklinks !== undefined;
  const hasAhrefsData =
    ahrefsImageUrls.length > 0 ||
    listing.seo?.ahrefsDr !== undefined ||
    listing.seo?.ahrefsUr !== undefined ||
    listing.seo?.ahrefsReferringDomains !== undefined ||
    listing.seo?.ahrefsTotalKeywords !== undefined ||
    listing.seo?.ahrefsTotalBacklinks !== undefined;

  // Structured data (Section 13) — every field below comes straight from
  // this listing's own already-public data (the same values rendered on
  // the page). No invented SKU, brand, review, aggregate rating, price
  // validity date, inventory or seller identity.
  const listingUrl = `https://www.durqo.com/listing/${listing.id}`;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.durqo.com" },
      { "@type": "ListItem", position: 2, name: "Marketplace", item: "https://www.durqo.com/buy" },
      { "@type": "ListItem", position: 3, name: category?.name ?? listing.categoryId, item: `https://www.durqo.com/buy/${listing.categoryId}` },
      { "@type": "ListItem", position: 4, name: listing.title, item: listingUrl },
    ],
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    category: category?.name ?? listing.categoryId,
    description: listing.overview || undefined,
    url: listingUrl,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "USD",
      url: listingUrl,
      availability: listing.status === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
  };

  // SoftwareApplication — only for the Android & iOS Apps category, and
  // only using rating/review-count fields that are genuinely present in
  // this listing's Quick Statistics (seller-entered, already shown on the
  // page below). Never fabricated when absent.
  const appRating = listing.quickStats.rating;
  const appReviews = listing.quickStats.total_reviews;
  const ratingValue = typeof appRating === "number" ? appRating : typeof appRating === "string" ? Number(appRating) : undefined;
  const reviewCount = typeof appReviews === "number" ? appReviews : typeof appReviews === "string" ? Number(appReviews) : undefined;
  const softwareApplicationJsonLd =
    listing.categoryId === "apps-tools"
      ? {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: listing.title,
          url: listingUrl,
          ...(typeof listing.quickStats.platform === "string" ? { operatingSystem: listing.quickStats.platform } : {}),
          offers: { "@type": "Offer", price, priceCurrency: "USD", url: listingUrl },
          ...(ratingValue && !Number.isNaN(ratingValue) && reviewCount && !Number.isNaN(reviewCount)
            ? { aggregateRating: { "@type": "AggregateRating", ratingValue, reviewCount } }
            : {}),
        }
      : null;

  return (
    <main className="py-8 sm:py-10">
      <Container>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
        {softwareApplicationJsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }} />
        )}

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
          <Link href="/" className="hover:text-ink">Home</Link>
          <ChevronRight size={12} />
          <Link href="/buy" className="hover:text-ink">Marketplace</Link>
          <ChevronRight size={12} />
          <Link href={`/buy/${listing.categoryId}`} className="hover:text-ink">{category?.name ?? listing.categoryId}</Link>
          <ChevronRight size={12} />
          <span className="text-ink-soft">{listing.title}</span>
        </nav>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{category?.name ?? listing.categoryId}</Badge>
          {listing.isVerified && <Badge tone="brand">Verified</Badge>}
          {listing.gaVerified && <Badge tone="brand">Google Analytics Verified</Badge>}
          {listing.status === "sold" && <StatusBadge status="sold" />}
        </div>

        <div className="mb-10">
          <h1 className="mb-2 text-3xl sm:text-4xl">{listing.title}</h1>
          {listing.businessUrl && (
            <a
              href={toHref(listing.businessUrl)}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mono inline-flex items-center gap-1.5 rounded-full border border-rule-strong bg-paper-raised px-3 py-1 text-sm text-ink-soft transition-colors hover:border-brand-strong hover:text-ink"
            >
              {fmtDisplayUrl(listing.businessUrl)}
              <ExternalLink size={13} className="shrink-0" />
            </a>
          )}
        </div>

        {/*
          Mobile order request (Sep 2026): on small screens this grid
          collapses to a single implicit column, so items stack in DOM
          order. Splitting MAIN CONTENT into a "top" chunk (through
          Payment Terms) and a "bottom" chunk (FAQ + Comments), with the
          SIDEBAR in between, gives the desired mobile reading order —
          Payment Terms, then the price/action card + seller details,
          then FAQ, then Comments — while desktop's 2-column layout is
          unchanged: the grid's default row-major auto-placement puts
          MAIN CONTENT TOP and MAIN CONTENT BOTTOM in column 1 (stacked,
          same as before) and SIDEBAR in column 2, spanning both rows
          (lg:row-span-2) so its sticky behavior still tracks scroll
          across the full combined height of both main-content chunks,
          exactly as when it was one single grid row.
        */}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
          {/* MAIN CONTENT — TOP (through Payment Terms). min-w-0 guards
              against the CSS Grid/Flexbox "automatic minimum size" bug: a
              grid/flex item's default min-width is its content's intrinsic
              (unwrapped) width, so one unbreakable/nowrap descendant deep
              inside this column (e.g. a truncated Top Performing Videos
              title) can otherwise force this whole column — and therefore
              the entire mobile single-column layout — wider than the
              viewport. Sep 5 2026: this exact bug shipped with the YouTube
              Channels "All-Time Top Performing Videos" section; fixed at
              the section/row level below, with this as defense-in-depth. */}
          <div className="min-w-0 flex flex-col gap-6">
            {/* Quick Stats */}
            {/* Android & iOS Apps replaces this heading with "App
                Statistics" (Design & Development New.pdf, "Update the Apps
                & Tools category to Android & iOS Apps" revision, Sep 5,
                2026) — the spec explicitly says "No need to show Quick
                Statistics. Instead of this, it will show App Statistics."
                Same underlying grid/data, just a different heading for
                this category. */}
            <SectionCard title={listing.categoryId === "apps-tools" ? "App Statistics" : "Quick Statistics"} icon={BarChart3}>
              <StatGrid
                colsDesktop={3}
                items={[
                  ...quickStatDisplayKeys.map((key: QuickStatKey) => {
                    // Age values (App Age, Business Age, Channel Age,
                    // Account Age, Website Age) are plain numbers of years
                    // in the DB, shown bare here ("2") unlike the
                    // marketplace grid/homepage spotlight, which already
                    // append " yrs" (see src/lib/format.ts's
                    // QUICK_STAT_YEARS / formatQuickStat — not used on this
                    // page). Sep 5, 2026 request ("Age Years e dekhabe" —
                    // show Age in years): append the same " yrs" suffix
                    // here too, only when a value is actually set, so this
                    // stays consistent site-wide without disturbing the
                    // "skip this tile" behavior for undefined/"".
                    const raw = listing.quickStats[key];
                    const value = (key === "age" || key === "channel_age") && raw !== undefined && raw !== "" ? `${raw} yrs` : raw;
                    return { label: quickStatLabelOverrides[key] ?? QUICK_STAT_LABELS[key], value };
                  }),
                  // SaaS and AI Apps & Tools call this same field "Industry"
                  // with a shared curated option list (src/lib/industries.ts)
                  // — Design & Development New 1.pdf / New.pdf, Sep 5, 2026.
                  // Android & iOS Apps keeps the plain "Niche" label but has
                  // its own curated option list (src/lib/app-niches.ts).
                  {
                    label: INDUSTRY_ID_SPACE_CATEGORIES.has(listing.categoryId) ? "Industry" : "Niche",
                    value:
                      listing.niches.length > 0
                        ? listing.niches
                            .map((nid) =>
                              (INDUSTRY_ID_SPACE_CATEGORIES.has(listing.categoryId)
                                ? INDUSTRY_MAP[nid]
                                : listing.categoryId === "apps-tools"
                                  ? APP_NICHE_MAP[nid]
                                  : NICHE_MAP[nid]) ?? nid
                            )
                            .join(", ")
                        : undefined,
                  },
                  { label: "Asking Price", value: fmtUSD(price) },
                ]}
              />
            </SectionCard>

            {/* Overview */}
            <SectionCard
              title={
                listing.categoryId === "youtube-channels"
                  ? "Overview of the Channel"
                  : listing.categoryId === "websites"
                    ? "Overview of the Website"
                    : listing.categoryId === "social-media-accounts"
                      ? "Overview of the Account"
                      : listing.categoryId === "apps-tools"
                        ? "Overview of the App"
                        : listing.categoryId === "domains"
                          ? "Overview of the Domain"
                          : "Overview of the Business"
              }
              icon={Info}
            >
              <p className="max-w-[70ch] leading-relaxed text-ink-soft">{listing.overview}</p>
              {category?.note && (
                <p className="mt-4 rounded-lg border border-gold/40 bg-gold-soft px-4 py-3 text-sm text-ink-soft">{category.note}</p>
              )}
            </SectionCard>

            {/* Channel Analytics (formerly "YouTube Channel Overview") —
                YouTube Channels only, auto-filled from the Channel URL (Sep
                4 2026). Moved to right after "Overview of the Channel" and
                renamed to "Channel Analytics" per the user's follow-up
                request. A plain dot+text "Connected" indicator sits in the
                header — this section only renders at all once
                `channelOverview` has been fetched from the YouTube API, so
                "Connected" is unconditional here. */}
            {listing.categoryId === "youtube-channels" && channelOverview && (
              <SectionCard title="Channel Analytics" icon={LineChart} action={<ConnectedIndicator />} bodyClassName="p-0">
                <div className="flex flex-wrap items-center gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
                  {channelOverview.channelAvatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={channelOverview.channelAvatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-full border border-rule-strong object-cover" />
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{channelOverview.channelTitle || listing.title}</span>
                      {channelSinceYear && <Badge tone="neutral">Since {channelSinceYear}</Badge>}
                    </div>
                    {channelOverview.channelHandle && <p className="mono text-sm text-ink-faint">{channelOverview.channelHandle}</p>}
                  </div>
                </div>
                <div className="mt-5 px-5 pb-5 sm:px-6 sm:pb-6">
                  <StatGrid
                    colsDesktop={4}
                    items={[
                      { label: "Subscribers", value: listing.quickStats.subscribers },
                      { label: "Total Views", value: listing.quickStats.total_views },
                      { label: "Videos", value: listing.quickStats.total_videos },
                      { label: "Avg Views/Video", value: channelOverview.avgViewsPerVideo },
                      { label: "Recent Avg Views", value: channelOverview.recentAvgViews },
                      { label: "Engagement Rate", value: channelOverview.engagementRatePercent !== undefined ? `${channelOverview.engagementRatePercent}%` : undefined },
                      { label: "Avg Likes", value: channelOverview.recentAvgLikes },
                    ]}
                  />
                </div>
                {channelLastUpdated && <p className="px-5 py-4 text-xs text-ink-faint sm:px-6">This data was updated on {channelLastUpdated}.</p>}
              </SectionCard>
            )}

            {/* Proof of Income */}
            {incomeSeries.some((s) => s.income) && (
              <IncomeHistoryPanel data={incomeSeries} images={incomeImageUrls} />
            )}

            {/* Monthly Expenses */}
            {listing.monthlyExpenses.length > 0 && (
              <SectionCard title="Monthly Expenses" icon={Coins} bodyClassName="p-0">
                <div className="flex flex-col">
                  {listing.monthlyExpenses.map((e, i) => (
                    <div
                      key={e.label}
                      className={clsx("mono flex justify-between px-5 py-3 text-sm sm:px-6", i < listing.monthlyExpenses.length - 1 && "border-b border-rule")}
                    >
                      <span className="text-ink-soft">{e.label}</span>
                      <span className="text-ink">{fmtUSD(e.amount)}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Monetization Methods */}
            {listing.monetizationTypeIds.length > 0 && (
              <SectionCard title="Monetization Methods" icon={Layers}>
                <LabelGrid labels={listing.monetizationTypeIds.map((mid) => MONETIZATION_MAP[mid] ?? mid)} />
              </SectionCard>
            )}

            {/* Copyright Notes — YouTube Channels only (Design & Development
                New.pdf, Sep 4 2026). Renders whenever there's a note or a
                proof screenshot, same "don't gate on one field alone"
                reasoning as the GA/GSC/SEMrush/Ahrefs sections below. */}
            {listing.categoryId === "youtube-channels" && (copyrightNoteLines.length > 0 || copyrightImageUrls.length > 0) && (
              <SectionCard
                title="Copyright Notes"
                icon={CopyrightIcon}
                subtitle={
                  listing.copyrightNotes?.updatedOn
                    ? `Updated on ${new Date(`${listing.copyrightNotes.updatedOn}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
                    : undefined
                }
              >
                {copyrightNoteLines.length > 0 && (
                  <ul className="mb-4 list-disc space-y-1.5 pl-5 text-sm text-ink-soft">
                    {copyrightNoteLines.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                )}
                {copyrightImageUrls.length > 0 && <ProofGalleryButton label="Copyright Notes" images={copyrightImageUrls} />}
              </SectionCard>
            )}

            {/* Top Performing Videos — YouTube Channels only. Thumbnails are
                derived client-side from each video URL (see
                youtubeThumbnailUrl in src/lib/format.ts), not uploaded. */}
            {listing.categoryId === "youtube-channels" && topVideos.length > 0 && (
              <SectionCard title="All-Time Top Performing Videos" icon={PlayCircle} bodyClassName="min-w-0 p-0">
                <div className="flex min-w-0 flex-col">
                  {topVideos.map((v, i) => {
                    const thumb = youtubeThumbnailUrl(v.videoUrl);
                    const rowClass = clsx(
                      "flex min-w-0 items-center gap-3 px-5 py-3 transition-colors hover:bg-paper-sunk sm:px-6",
                      i < topVideos.length - 1 && "border-b border-rule"
                    );
                    const content = (
                      <>
                        <span className="mono grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand-hover">{i + 1}</span>
                        <span className="h-12 w-20 shrink-0 overflow-hidden rounded-md bg-paper-sunk">
                          {thumb && (
                            // eslint-disable-next-line @next/next/no-img-element -- external YouTube thumbnail URL, not a local /public asset
                            <img src={thumb} alt="" className="h-full w-full object-cover" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">{v.title}</span>
                          <span className="mono mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-faint">
                            {v.views !== undefined && <span className="flex items-center gap-1"><Eye size={12} /> {fmtNumber(v.views)} views</span>}
                            {v.likes !== undefined && <span className="flex items-center gap-1"><ThumbsUp size={12} /> {fmtNumber(v.likes)} likes</span>}
                            {v.duration && <span className="flex items-center gap-1"><Clock size={12} /> {v.duration}</span>}
                            {v.publishedOn && <span className="flex items-center gap-1"><Calendar size={12} /> {v.publishedOn}</span>}
                          </span>
                        </span>
                      </>
                    );
                    return v.videoUrl ? (
                      <a key={i} href={v.videoUrl} target="_blank" rel="noopener noreferrer nofollow" className={rowClass}>
                        {content}
                      </a>
                    ) : (
                      <div key={i} className={rowClass}>
                        {content}
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {/* Google Analytics Data — one card covers both cases. A seller
                who has connected their real GA4 account live (see
                src/components/GoogleAnalyticsLivePanel.tsx) gets that live,
                auto-updating panel, which is already its own complete card;
                the self-declared manual numbers and verification
                screenshots are hidden in that case so the page never shows
                two different sets of numbers for the same thing. A seller
                who hasn't connected live GA gets the manual data +
                screenshots instead, inside an equivalent card here. */}
            {category?.hasSeoData && hasGaData && (
              listing.gaLiveStats ? (
                <GoogleAnalyticsLivePanel listingId={listing.id} initialStats={listing.gaLiveStats} />
              ) : (
                <SectionCard
                  title="Google Analytics Data"
                  icon={TrendingUp}
                  subtitle="Engagement statistics, last 12 months"
                  action={
                    listing.gaVerified ? (
                      <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-hover">
                        <ShieldCheck size={12} /> Reviewed by Durqo
                      </span>
                    ) : undefined
                  }
                  bodyClassName="p-0"
                >
                  <div className="p-5 sm:p-6">
                    <StatGrid
                      colsDesktop={4}
                      items={[
                        { label: "Total Users", value: listing.seo?.gaTotalUsers },
                        { label: "New Users", value: listing.seo?.gaNewUsers },
                        { label: "Total Page Views", value: listing.seo?.gaTotalPageViews },
                        {
                          label: "Avg. Engagement Time",
                          value: listing.seo?.gaAvgEngagementSeconds ? `${Math.floor(listing.seo.gaAvgEngagementSeconds / 60)}m ${listing.seo.gaAvgEngagementSeconds % 60}s` : undefined,
                        },
                      ]}
                    />
                  </div>
                  <div className="border-t border-rule px-5 py-4 sm:px-6">
                    <ProofGalleryButton label="Google Analytics Data" images={gaImageUrls} count={3} />
                  </div>
                </SectionCard>
              )
            )}

            {/* SEO / Analytics data block — each of the three sub-sections
                below is gated on its own hasXData flag (numbers or proof
                screenshots), not on `listing.seo` as a whole, so e.g. an
                Ahrefs-only upload doesn't also require Search Console data
                to exist before its screenshots become visible. */}
            {category?.hasSeoData && hasGscData && (
              <SectionCard title="Google Search Console Data" icon={Search} subtitle="Engagement statistics, last 12 months" bodyClassName="p-0">
                <div className="p-5 sm:p-6">
                  <StatGrid
                    colsDesktop={3}
                    items={[
                      { label: "Total Clicks", value: listing.seo?.gscTotalClicks },
                      { label: "Total Impressions", value: listing.seo?.gscTotalImpressions },
                      { label: "Indexed Pages", value: listing.seo?.gscIndexedPages },
                      { label: "Non-Indexed Pages", value: listing.seo?.gscNonIndexedPages },
                      { label: "Average CTR", value: listing.seo?.gscAvgCtr ? `${listing.seo.gscAvgCtr}%` : undefined },
                    ]}
                  />
                </div>
                <div className="border-t border-rule px-5 py-4 sm:px-6">
                  <ProofGalleryButton label="Google Search Console Data" images={gscImageUrls} count={2} />
                </div>
              </SectionCard>
            )}

            {category?.hasSeoData && hasSemrushData && (
              <SectionCard title="SEMrush Data" icon={Radar} bodyClassName="p-0">
                <div className="p-5 sm:p-6">
                  <StatGrid
                    colsDesktop={3}
                    items={[
                      { label: "Authority Score", value: listing.seo?.semrushAuthorityScore },
                      { label: "Total Traffic", value: listing.seo?.semrushTotalTraffic },
                      { label: "Total Keywords", value: listing.seo?.semrushTotalKeywords },
                      { label: "Top 10 Keywords", value: listing.seo?.semrushTop10Keywords },
                      { label: "Total Backlinks", value: listing.seo?.semrushTotalBacklinks },
                    ]}
                  />
                </div>
                <div className="border-t border-rule px-5 py-4 sm:px-6">
                  <ProofGalleryButton label="SEMrush Data" images={semrushImageUrls} count={2} />
                </div>
              </SectionCard>
            )}

            {category?.hasSeoData && hasAhrefsData && (
              <SectionCard title="Ahrefs Data" icon={Link2} bodyClassName="p-0">
                <div className="p-5 sm:p-6">
                  <StatGrid
                    colsDesktop={3}
                    items={[
                      { label: "DR Rating", value: listing.seo?.ahrefsDr },
                      { label: "UR Rating", value: listing.seo?.ahrefsUr },
                      { label: "Referring Domains", value: listing.seo?.ahrefsReferringDomains },
                      { label: "Total Keywords", value: listing.seo?.ahrefsTotalKeywords },
                      { label: "Total Backlinks", value: listing.seo?.ahrefsTotalBacklinks },
                    ]}
                  />
                </div>
                <div className="border-t border-rule px-5 py-4 sm:px-6">
                  <ProofGalleryButton label="Ahrefs Data" images={ahrefsImageUrls} count={2} />
                </div>
              </SectionCard>
            )}

            {/* Social Media */}
            {listing.socialStats.length > 0 && (
              <SectionCard title="Social Media Accounts" icon={Users}>
                <StatGrid colsDesktop={3} items={listing.socialStats.map((s) => ({ label: s.platform, value: s.followers }))} />
              </SectionCard>
            )}

            {/* Sales Includes */}
            <SectionCard title="Sale Includes" icon={Package}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-brand/10 bg-brand-soft/25 p-4">
                  <h5 className="mono mb-1.5 text-xs uppercase tracking-wide text-brand-hover/60">Assets</h5>
                  <p className="text-sm text-ink-soft">{listing.saleIncludesAssets}</p>
                </div>
                <div className="rounded-xl border border-brand/10 bg-brand-soft/25 p-4">
                  <h5 className="mono mb-1.5 text-xs uppercase tracking-wide text-brand-hover/60">Post-sale support</h5>
                  <p className="text-sm text-ink-soft">{listing.saleIncludesSupport}</p>
                </div>
              </div>
            </SectionCard>

            {/* Payment Terms — BDT-specific terms only, for Bangladesh-based
                buyers paying via SSLCommerz. Branched on the listing's
                server-side price (never a client-supplied value) against the
                same ONLINE_DEPOSIT_CAP both Stripe and SSLCommerz checkout
                actually charge against (src/lib/payment-terms.ts), so the
                copy can never drift from what checkout actually does. A
                price at exactly the cap takes the "full payment" branch
                (price > cap is false there), matching the same
                onlineChargeAmount() semantics the checkout routes use.
                Sep 9 2026: reworded to the merchant's exact required copy
                for each bracket and to drop "Durqo's conversion margin"
                from buyer-facing text — see SslcommerzConfirmModal.tsx for
                the matching pre-payment confirmation copy. Sep 9 2026
                follow-up: removed the general/Stripe (USD) lead-in sentence
                per the merchant's request ("ei line dorkar nei") — this
                section is BDT/SSLCommerz-only now; Stripe's own checkout
                flow and copy elsewhere on the page are unchanged. Sep 9 2026
                2nd follow-up: with only one paragraph left, the old
                `max-w-[65ch]` line-length cap (sized for when this sat next
                to a second paragraph) left a large empty gap on the right of
                the card ("onek jaiga faka thaktche" — a lot of space stays
                empty). Dropped the cap so the paragraph fills the full card
                width like every other SectionCard's body text, and added
                `text-justify` so the now-wider lines get flush left AND
                right edges ("justify hobe") instead of a ragged right edge. */}
            <SectionCard title="Payment Terms" icon={CreditCard}>
              <p className="text-justify text-sm leading-relaxed text-ink-soft">
                {price > ONLINE_DEPOSIT_CAP
                  ? `Bangladesh-based buyers who choose to pay in BDT must pay the BDT equivalent of USD ${ONLINE_DEPOSIT_CAP.toLocaleString()} through SSLCommerz at checkout. Once the initial payment is confirmed, Durqo will email the buyer with instructions for paying the remaining balance by bank wire transfer, credit card, or debit card. The applicable exchange rate and exact BDT amount will be shown before payment is confirmed, and the purchase will be completed only after the full balance has been received and verified.`
                  : "Bangladesh-based buyers who choose to pay in BDT must pay the full purchase price through SSLCommerz at checkout. The applicable exchange rate and exact BDT amount will be shown before payment is confirmed. The purchase will be completed after the full payment has been received and verified."}
              </p>
            </SectionCard>
          </div>

          {/* SIDEBAR — acquisition panel + seller details, sticky. Placed here
              (between MAIN CONTENT TOP and MAIN CONTENT BOTTOM) so mobile's
              single-column stacking reads Payment Terms → price/action card →
              seller details → FAQ → Comments; lg:row-span-2 keeps it spanning
              both main-content rows on desktop so it still sticks through the
              full page height, not just the "top" chunk's height.

              This card pair has been through three attempts (all Sep 2026)
              because two requirements were in tension: "stay visible while
              scrolling" (the original ask) and "the full text of both cards
              must always be readable" (every follow-up). Attempt 1 (Sep 8)
              and attempt 2 (Sep 9) kept the whole aside sticky behind a
              `max-h`/`overflow-y-auto` safety net sized off a hand-tuned
              `calc(100vh - ...)` budget — reasonable in theory, but the
              budget had to correctly out-guess *every* future content change
              (adding the 3rd "Buy Now — Escrow" button broke it once; a
              *discounted* listing's extra strikethrough-price line — only
              rendered when `discountedPrice` is set, so it wasn't in the
              case that got tested — broke it again) and every real viewport
              height, and even where the net caught the overflow correctly,
              scrolling inside a narrow strip nested inside a sticky element
              is genuinely easy to miss, which is exactly what "scroll korar
              somoi o" (even while scrolling) kept describing both times.

              Attempt 3 made only the acquisition card sticky and let the
              Seller card sit below it as plain in-flow content — no
              `max-h`, so its text could never be *clipped*. But normal-flow
              content directly below a sticky sibling gets scrolled *behind*
              it instead: past a certain scroll position the Seller card
              disappeared under the acquisition card's opaque background for
              the rest of the page, which is worse than clipped — not
              "hard to notice you can reach it," but unreachable without
              scrolling back up. Reverted.

              This 3rd fix keeps both cards sticky together as one unit
              (attempt 1/2's structure) — the only way to keep the Seller
              card on-screen for the entire page scroll — but stops trying to
              win the pixel-budget game: `top-4`/`max-h-[calc(100vh-2rem)]`
              give back the ~50px attempts 1/2 were reserving for a offset/
              margin that isn't load-bearing, so the pair now fits without
              any internal scrolling on most ordinary laptop screens even
              with a discount badge and all 4 buttons. Where a screen is
              short enough that the pair still doesn't fit, `overflow-y-auto`
              still catches it — but this time paired with the new
              `.sidebar-scroll` class (globals.css) that keeps that internal
              scrollbar permanently visible instead of relying on the
              default hidden/overlay OS scrollbar, so a viewer can *see*
              there's a scrollable box there before they ever try to scroll
              it — directly answering the "easy to miss" half of both prior
              reports. `lg:pb-4` still adds breathing room below the last
              line in that fallback case.

              THE ACTUAL BUG, found only after this 3rd fix still failed
              live-testing: `overflow-y-auto` here was never the thing
              failing — it never got the chance to run. This `<aside>` is a
              `flex flex-col`, and each card below is a flex item with its
              own `overflow-hidden` (only there to clip square corners to
              the card's `rounded-2xl`). Per the flexbox spec, a flex item's
              *automatic* minimum size — the floor the flex algorithm won't
              shrink it past — collapses to ~0 the moment the item (or its
              own box) has `overflow` other than `visible`. So once the pair
              was taller than `max-h`, the browser didn't overflow the
              `<aside>` and hand it to the scrollbar at all: it shrank the
              cards themselves — squeezing their box below their content's
              real height — and each card's *own* `overflow-hidden` then
              silently clipped whatever no longer fit, with no scrollbar
              anywhere, on either box. That's the actual mechanism behind
              every "ekhono thik hoini / scroll korle o dekha jasse na" (still
              not fixed / not visible even scrolling) report — there was
              never anything to scroll; the cards were being compressed.
              `shrink-0` on both card divs below is the fix: it stops
              flexbox from ever shrinking them, so once they no longer fit
              in `max-h`, the excess now correctly overflows the `<aside>`
              itself — which is what actually hands it to
              `overflow-y-auto`/`.sidebar-scroll` for the first time. Verified
              directly (not just visually): forcing a short `max-h` and
              scrolling the sidebar's own box now moves the Seller card's
              last line fully back within its bounds — before this, the
              same test left it clipped with the scroll position stuck at 0,
              i.e. nothing to scroll.

              Sep 9 2026 4th fix ("school korle jeno 2 ta card er full
              details e valo kore dekha jai, ekhon price ta dekha jassena" —
              while scrolling, both cards' full details should stay nicely
              visible; now the price isn't visible): once the fix above made
              `overflow-y-auto` genuinely work, scrolling the sidebar's own
              box to read the rest of the Seller card does what any normal
              scroll box does — it scrolls the price/buttons at the top out
              of view along with everything else. That's correct for a
              plain scroll box, but wrong for this one: the price and Buy
              Now buttons are the one thing on this page that should never
              have to be scrolled away to find. Fix: the acquisition card
              itself is now ALSO sticky (`lg:sticky lg:top-0`), nested
              inside the already-sticky/scrollable `<aside>`. `<aside>`'s
              `overflow-y-auto` makes it the acquisition card's nearest
              scrolling ancestor, so this sticky is scoped to *that* box,
              not the page — it only does anything during the internal
              fallback scroll from the fix above, and has zero effect on
              ordinary page scrolling (where `<aside>` isn't scrolling
              internally at all). Net effect: price + all 4 buttons stay
              pinned at the top of the sidebar the whole time, while the
              Seller card scrolls up underneath to reveal its full text —
              both requirements ("full details visible" and "price never
              disappears") satisfied at once, instead of trading one for the
              other. `z-10` keeps it painted above the Seller card as it
              slides past underneath.

              Sep 9 2026 5th fix ("fix hoini... now when i scrol the price is
              not visible" — reported on an ORDINARY page scroll, not the
              internal sidebar fallback the 4th fix targeted): reproduced by
              scrolling the actual page (not the sidebar's own box) past the
              point where `<aside>` becomes stuck. The site header
              (`Header.tsx`) is `sticky top-0 z-40 h-[72px]` — 72px tall. This
              `<aside>` was using `lg:top-4` (16px), so once stuck, its top
              edge sat only 16px from the viewport top: 56px of the
              acquisition card's price section rendered directly *underneath*
              the header, which paints above it (`z-40` vs. this card's
              `z-10`) and visually hid it — not clipped, not scrolled away,
              just covered by opaque header chrome. Every other sticky
              sidebar in this codebase already accounts for the header and
              was never touched by this bug: `DesktopFilterSidebar.tsx`
              (`md:top-24` / `md:max-h-[calc(100vh-7rem)]`) and both
              `TermsToc.tsx`/`PrivacyToc.tsx` (`top-24` /
              `max-h-[calc(100vh-7rem)]`) all clear the 72px header with a
              96px offset. This `<aside>` was the one place that didn't
              follow that convention. Fix: `lg:top-4` → `lg:top-24` and
              `lg:max-h-[calc(100vh-2rem)]` → `lg:max-h-[calc(100vh-7rem)]`,
              matching those three exactly. The inner acquisition card's
              `lg:top-0` is unchanged and still correct — it's relative to
              `<aside>`'s own box, not the viewport, so it just needs
              `<aside>` itself positioned below the header. */}
          <aside className="sidebar-scroll min-w-0 flex h-max flex-col gap-4 lg:sticky lg:top-24 lg:row-span-2 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pb-4">
            <div className="z-10 shrink-0 overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:sticky lg:top-0">
              <div className="border-b border-rule px-5 py-3 text-center sm:px-6">
                {listing.discountedPrice != null && listing.discountedPrice < listing.price && (
                  <div className="mono text-sm text-ink-faint line-through">{fmtUSD(listing.price)}</div>
                )}
                <div className="mono text-3xl font-bold text-ink">{fmtUSD(price)}</div>
              </div>
              <div className="flex flex-col gap-1.5 px-5 py-3 sm:px-6">
                <BuyNowButton listingId={listing.id} sold={listing.status === "sold"} />
                <CartButton listingId={listing.id} sold={listing.status === "sold"} />
                <ChatWithSellerButton sellerId={listing.seller.id} listingId={listing.id} />
                <WishlistButton listingId={listing.id} variant="full" />
              </div>
            </div>

            <div className="shrink-0 overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-2 border-b border-rule px-5 py-3 sm:px-6">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-hover">
                  <Store size={17} />
                </span>
                <h2 className="text-base font-semibold text-ink">Seller</h2>
              </div>
              <div className="px-5 py-3 sm:px-6">
                <div className="mb-1 font-semibold text-ink">{listing.seller.name}</div>
                {listing.seller.location && <div className="mb-3 text-sm text-ink-soft">{listing.seller.location}</div>}
                <div className="flex flex-col gap-1.5">
                  {listing.seller.isVerified ? (
                    <div className="flex items-center gap-1.5 text-sm text-brand-hover">
                      <ShieldCheck size={15} />
                      Verified {listing.seller.verificationMethod?.replace("_", " ")}
                    </div>
                  ) : (
                    <div className="text-sm text-ink-faint">Identity not yet verified</div>
                  )}
                  {listing.seller.emailVerified ? (
                    <div className="flex items-center gap-1.5 text-sm text-brand-hover">
                      <MailCheck size={15} />
                      Email verified
                    </div>
                  ) : (
                    <div className="text-sm text-ink-faint">Email not yet verified</div>
                  )}
                </div>
                <div className="mt-3 border-t border-rule pt-3">
                  <div className="mb-1 flex items-center gap-1.5 text-sm text-ink-soft">
                    <Store size={14} className="shrink-0 text-ink-faint" />
                    {listing.seller.activeListingsCount} active listing{listing.seller.activeListingsCount === 1 ? "" : "s"}
                  </div>
                  <div className="mono text-sm text-ink-soft">
                    {listing.seller.totalSales} completed sale{listing.seller.totalSales === 1 ? "" : "s"}
                    {listing.seller.lifetimeSalesAmount > 0 && <> &middot; {fmtUSD(listing.seller.lifetimeSalesAmount)} lifetime</>}
                  </div>
                  <div className="text-xs text-ink-faint">Member since {listing.seller.memberSince}</div>
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT — BOTTOM (FAQ with Seller, now including the live
              question/answer feed). min-w-0 for the same grid-overflow-guard
              reason as MAIN CONTENT TOP above.

              Sep 9, 2026: this used to be two separate cards — a static,
              read-only "FAQ with Seller" accordion and, right below it, a
              "Comments" card that displayed real `comments` rows behind a
              dead "Log in to leave a comment" link with no actual submit
              path anywhere in the app. Per the user's request ("FAQ with
              Seller er majhei comment and seller answer korar sujog thakbe.
              Comments ta delete kore dao" — the ability to comment, and for
              the seller to answer, should live inside FAQ with Seller
              itself; delete the separate Comments card), they're now one
              card: any seller-authored FAQ pairs (`listing.faqs`, still a
              plain accordion) render first, followed by the live comment
              feed and a real working composer/reply flow
              (CommentsPanel — see src/lib/actions/comments.ts for the new
              postComment() Server Action this calls). Posting a question
              requires login (a dead-end "Log in to leave a comment" link
              otherwise); replying is restricted to the listing's own
              seller, enforced server-side, not just hidden in the UI. A new
              top-level question also emails the seller and shows up on
              their new /dashboard/seller/questions page — see
              dashboard-nav.ts and that page for the "dashboard
              notification" half of the request. */}
          <div className="min-w-0 flex flex-col gap-6">
            <SectionCard title="FAQ with Seller" icon={HelpCircle} bodyClassName="p-0">
              <div className="flex flex-col">
                {listing.faqs.length > 0 && (
                  <div className="border-b border-rule px-5 sm:px-6">
                    <FaqAccordion items={listing.faqs} />
                  </div>
                )}
                <CommentsPanel
                  listingId={listing.id}
                  comments={listing.comments}
                  isSeller={isListingSeller}
                  loggedIn={!!viewer}
                  viewerId={viewer?.id}
                />
              </div>
            </SectionCard>
          </div>
        </div>
      </Container>
    </main>
  );
}
