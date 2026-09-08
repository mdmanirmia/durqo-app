import { notFound } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { ShieldCheck, ChevronRight, Lock, ExternalLink, Eye, ThumbsUp, Clock, Calendar, MailCheck, Store } from "lucide-react";
import { getListingById } from "@/lib/data/listings.server";
import { CATEGORY_MAP, QUICK_STAT_LABELS, QuickStatKey } from "@/lib/categories";
import { NICHE_MAP } from "@/lib/niches";
import { INDUSTRY_MAP } from "@/lib/industries";
import { INDUSTRY_ID_SPACE_CATEGORIES } from "@/lib/categories";
import { APP_NICHE_MAP } from "@/lib/app-niches";
import { MONETIZATION_MAP } from "@/lib/monetization-types";
import { fmtUSD, fmtNumber, fmtDisplayUrl, toHref, youtubeThumbnailUrl } from "@/lib/format";
import IncomeHistoryPanel from "@/components/IncomeHistoryPanel";
import GoogleAnalyticsLivePanel from "@/components/GoogleAnalyticsLivePanel";
import ListingFaqAccordion from "./ListingFaqAccordion";
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

// ---------------------------------------------------------------------------
// Sep 2026 visual redesign — design-system helpers
//
// Scoped entirely to this file (plus the handful of components only this
// page renders — see IncomeHistoryPanel/GoogleAnalyticsLivePanel/
// ProofGalleryButton/CartButton/BuyNowButton/ChatWithSellerButton/
// WishlistButton's "full" variant/ListingFaqAccordion). This is a visual
// pass only: every data field, computed value, and category-conditional
// branch below is unchanged from the pre-redesign version of this file —
// only markup/className/component-boundary changed. New colors are applied
// as literal Tailwind arbitrary values (bg-[#...]) rather than by editing
// the sitewide tokens in globals.css, since those tokens are shared by
// every other page (header, footer, homepage, dashboards) and this request
// is scoped to the listing-detail page alone.
// ---------------------------------------------------------------------------

type StatItem = { label: string; value: string | number | undefined };

// Quick Statistics (and every other data-source grid on this page — Channel
// Analytics, the manual Google Analytics fallback, Search Console, SEMrush,
// Ahrefs) render as ONE bordered panel with internal dividers between cells,
// not a grid of individually-bordered mini-cards. The grid is 4 columns at
// lg: (1024px+) and 2 columns below that (covering both the "tablet" and
// "mobile" cases the redesign spec calls out, since both want 2 columns).
// Dividers are computed per-item from its position in the VISIBLE (already
// null-filtered) list, separately for the 2-col and 4-col layouts, since
// which cells sit in the last row/column differs between them.
function dividerClasses(index: number, total: number): string {
  const mobileCols = 2;
  const desktopCols = 4;
  const mobileLastCol = (index + 1) % mobileCols === 0 || index === total - 1;
  const mobileLastRow = Math.floor(index / mobileCols) === Math.ceil(total / mobileCols) - 1;
  const desktopLastCol = (index + 1) % desktopCols === 0 || index === total - 1;
  const desktopLastRow = Math.floor(index / desktopCols) === Math.ceil(total / desktopCols) - 1;
  return clsx(
    !mobileLastCol && "border-r",
    !mobileLastRow && "border-b",
    desktopLastCol ? "lg:border-r-0" : "lg:border-r",
    desktopLastRow ? "lg:border-b-0" : "lg:border-b"
  );
}

// Returns null (renders nothing) when every item in the group is
// undefined/empty — same "don't create empty metric boxes" behavior the
// previous per-tile StatTile had, just applied to the whole panel instead
// of one tile at a time, since tiles no longer carry their own border/
// background to disappear independently.
//
// `gallery`, when given, renders the section's "View ... Images" trigger
// inside this SAME card (below the stat grid, separated by the same
// internal-divider treatment used elsewhere) rather than as a separate
// floating button underneath — matching the reference mockup, where every
// data-source panel's screenshot trigger lives inside that panel's own
// card.
function StatPanel({ items, gallery }: { items: StatItem[]; gallery?: { label: string; images?: string[]; count?: number } }) {
  const visible = items.filter((i) => i.value !== undefined && i.value !== "");
  // A section can have proof screenshots with no numeric fields filled in
  // (see hasGaData/hasGscData/etc.'s "don't gate on one field alone"
  // reasoning above) — in that case there's nothing to grid, but the
  // gallery trigger must still render, just without an empty grid above it.
  if (visible.length === 0 && !gallery) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E7E4] bg-white">
      {visible.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {visible.map((item, i) => (
            <div key={item.label} className={clsx("border-[#E2E7E4] p-4 sm:p-5", dividerClasses(i, visible.length))}>
              <div className="mono break-words text-[18px] font-bold text-[#0C1830] sm:text-[19px]">
                {typeof item.value === "number" ? fmtNumber(item.value) : item.value}
              </div>
              <div className="mt-1 break-words text-[11px] font-medium uppercase tracking-wide text-[#98A2B3] sm:text-xs">{item.label}</div>
            </div>
          ))}
        </div>
      )}
      {gallery && (
        <div className={clsx("p-4 sm:p-5", visible.length > 0 && "border-t border-[#E2E7E4]")}>
          <ProofGalleryButton label={gallery.label} images={gallery.images} count={gallery.count} />
        </div>
      )}
    </div>
  );
}

// Monetization Methods (and any other short list of plain text labels)
// renders as one bordered panel with internal dividers between cells,
// matching the reference mockup's "Amazon Affiliates | Affiliate Sales |
// MediaVine" treatment — not separate pill chips with gaps between them.
function LabelPanel({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E7E4] bg-white">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {labels.map((label, i) => (
          <div key={label} className={clsx("border-[#E2E7E4] p-4 text-center text-sm text-[#667085] sm:p-5", dividerClasses(i, labels.length))}>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// Shared section heading — 20-22px desktop / 18-20px mobile per the
// redesign spec's typography scale, H2 for every major section (SEO/
// accessibility requirement: one H1 — the listing title — H2 per section,
// H3 only inside a section).
function SectionHeading({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <div className={subtitle ? "mb-4" : "mb-4"}>
      <h2 className="text-[19px] font-bold text-[#101828] sm:text-[21px]">{children}</h2>
      {subtitle && <p className="mt-1 text-sm text-[#98A2B3]">{subtitle}</p>}
    </div>
  );
}

// Generic white content card used for every section that isn't a StatPanel
// (Overview, Sale Includes, Payment Terms, Monthly Expenses, etc).
function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("rounded-2xl border border-[#E2E7E4] bg-white p-5 sm:p-6", className)}>{children}</div>;
}

export default async function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

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
  // Social Media Accounts label overrides (Design & Development New.pdf, Sep
  // 5, 2026): this category's whole Quick Statistics vocabulary talks about
  // "the account" rather than "the business" — "Business Location" ->
  // "Account Location", "Monthly Income" -> "Avg. Monthly Income" (same
  // averaging as every other category), "Followers" -> "Total Followers",
  // "Business Age" -> "Account Age". "Account Type" already reads correctly
  // from the shared QUICK_STAT_LABELS map, no override needed.
  // AI Apps & Tools (Design & Development New.pdf, Sep 5, 2026 — a brand new
  // category) gets the same "Avg. Monthly Income" treatment as SaaS;
  // "Business Type" already reads correctly from the shared
  // QUICK_STAT_LABELS map, no override needed.
  // Startup Business (user request, Sep 5, 2026 — a brand new category):
  // "Business Location" -> "Company Location", "Monthly Income" -> "Avg.
  // Monthly Income" (same averaging as every other category), "Business
  // Type" -> "Business Model" (this category's own curated list of business
  // models, src/lib/startup-business-models.ts, reusing the shared
  // business_type column). "Funding Stage"/"Funding Raised"/"Team
  // Size"/"Business Age" all already read correctly from the shared
  // QUICK_STAT_LABELS map, no override needed. Niche/Industry labeling is
  // handled generically via INDUSTRY_ID_SPACE_CATEGORIES below
  // (categories.ts) — this category shares SaaS's "Industry" option list/
  // label.
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
  // down the page (renamed/moved from "YouTube Channel Overview", see below)
  // reads those same values directly, so they aren't lost, just no longer
  // duplicated in the Quick Statistics grid below.
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
  // both. Gating solely on `listing.seo` being present hid sections (and the
  // screenshots inside them) whenever only images were uploaded with no
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

  // Quick Statistics items — same keys/labels/values as before, just
  // collected into an array up front so StatPanel can compute divider
  // placement across the final (post-filter) list.
  const quickStatItems: StatItem[] = quickStatDisplayKeys.map((key) => {
    // Age values (App Age, Business Age, Channel Age, Account Age, Website
    // Age) are plain numbers of years in the DB, shown bare here ("2")
    // unlike the marketplace grid/homepage spotlight, which already append
    // " yrs" (see src/lib/format.ts's QUICK_STAT_YEARS / formatQuickStat —
    // not used on this page). Sep 5, 2026 request ("Age Years e dekhabe" —
    // show Age in years): append the same " yrs" suffix here too, only when
    // a value is actually set, so this stays consistent site-wide without
    // disturbing the "skip this tile" behavior for undefined/"".
    const raw = listing.quickStats[key];
    const value = (key === "age" || key === "channel_age") && raw !== undefined && raw !== "" ? `${raw} yrs` : raw;
    return { label: quickStatLabelOverrides[key] ?? QUICK_STAT_LABELS[key], value };
  });
  if (listing.niches.length > 0) {
    // SaaS and AI Apps & Tools call this same field "Industry" with a shared
    // curated option list (src/lib/industries.ts) — Design & Development New
    // 1.pdf / New.pdf, Sep 5, 2026. Android & iOS Apps keeps the plain
    // "Niche" label but has its own curated option list (src/lib/app-niches.ts).
    quickStatItems.push({
      label: INDUSTRY_ID_SPACE_CATEGORIES.has(listing.categoryId) ? "Industry" : "Niche",
      value: listing.niches
        .map((id) =>
          (INDUSTRY_ID_SPACE_CATEGORIES.has(listing.categoryId)
            ? INDUSTRY_MAP[id]
            : listing.categoryId === "apps-tools"
              ? APP_NICHE_MAP[id]
              : NICHE_MAP[id]) ?? id
        )
        .join(", "),
    });
  }
  quickStatItems.push({ label: "Asking Price", value: fmtUSD(price) });

  const h2Cls = "text-[19px] font-bold text-[#101828] sm:text-[21px]";
  const bodyCls = "text-[15px] leading-relaxed text-[#667085] sm:text-[16px]";

  return (
    <main className="bg-[#F6F7F5] py-8 sm:py-10">
      <Container>
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-[#98A2B3]">
          <Link href="/" className="hover:text-[#101828]">Home</Link>
          <ChevronRight size={12} />
          <Link href="/buy" className="hover:text-[#101828]">Marketplace</Link>
          <ChevronRight size={12} />
          <Link href={`/buy?category=${listing.categoryId}`} className="hover:text-[#101828]">{category?.name ?? listing.categoryId}</Link>
          <ChevronRight size={12} />
          <span className="text-[#667085]">{listing.title}</span>
        </nav>

        {/* Listing introduction — one card with a thin emerald accent bar on
            the left (redesign section 4). No cover image, no new
            description/date/location/ID fields — only the existing
            category badge/Verified badge/title/business-URL, unchanged. */}
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-[#E2E7E4] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-6">
          <div className="absolute left-0 top-0 h-full w-1 bg-[#0EAE7A]" aria-hidden />
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{category?.name ?? listing.categoryId}</Badge>
            {listing.isVerified && <Badge tone="brand">Verified</Badge>}
            {listing.gaVerified && <Badge tone="brand">Google Analytics Verified</Badge>}
            {listing.status === "sold" && <StatusBadge status="sold" />}
          </div>
          <h1 className="mb-2 text-[27px] font-bold leading-tight text-[#0C1830] sm:text-[34px]">{listing.title}</h1>
          {listing.businessUrl && (
            <a
              href={toHref(listing.businessUrl)}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mono inline-flex items-center gap-1 text-sm text-[#0EAE7A] hover:underline"
            >
              {fmtDisplayUrl(listing.businessUrl)}
              <ExternalLink size={13} className="shrink-0" />
            </a>
          )}
        </div>

        {/*
          Mobile order (Sep 2026 redesign spec): Quick Statistics, then the
          Purchase card + Seller card, THEN Overview and everything else
          through Payment Terms, then FAQ + Comments. Achieved the same way
          the previous layout achieved a different mobile order: splitting
          MAIN CONTENT into two DOM chunks with the sidebar's DOM position
          between them, so small-screen single-column stacking reads in DOM
          order while desktop's 2-column grid auto-placement still puts both
          main chunks in column 1 (stacked) and the sidebar spanning both
          rows in column 2 (lg:row-span-2), sticky the whole time. Only the
          SPLIT POINT moved (now right after Quick Statistics instead of
          after Payment Terms) — the underlying mechanism is unchanged.
        */}
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-6">
          {/* MAIN CONTENT — TOP: title/URL now live in the intro card above,
              so this chunk is just Quick Statistics. min-w-0 guards against
              the CSS Grid/Flexbox "automatic minimum size" bug (a truncated
              long value forcing the column wider than the viewport) — see
              MAIN CONTENT BOTTOM below for the same guard, kept from the
              pre-redesign version of this page. */}
          <div className="min-w-0 flex flex-col gap-6">
            <section>
              {/* Android & iOS Apps replaces this heading with "App
                  Statistics" (Design & Development New.pdf, "Update the Apps
                  & Tools category to Android & iOS Apps" revision, Sep 5,
                  2026) — the spec explicitly says "No need to show Quick
                  Statistics. Instead of this, it will show App Statistics."
                  Same underlying grid/data, just a different heading for
                  this category. */}
              <SectionHeading>{listing.categoryId === "apps-tools" ? "App Statistics" : "Quick Statistics"}</SectionHeading>
              <StatPanel items={quickStatItems} />
            </section>
          </div>

          {/* SIDEBAR — acquisition panel + seller details, sticky. Placed
              here (between the Quick Statistics chunk and everything else)
              so mobile's single-column stacking reads Quick Statistics →
              price/action card → seller details → Overview → ... →
              Comments; lg:row-span-2 keeps it spanning both main-content
              rows on desktop so it sticks through the full combined height,
              never past the end of the grid (i.e. never overlapping the
              footer, which sits outside this grid entirely). */}
          <aside className="min-w-0 flex h-max flex-col gap-4 lg:sticky lg:top-[88px] lg:row-span-2">
            <div className="rounded-2xl border border-[#E2E7E4] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              {listing.discountedPrice != null && listing.discountedPrice < listing.price && (
                <div className="mono text-center text-sm text-[#98A2B3] line-through">{fmtUSD(listing.price)}</div>
              )}
              <div className="mono mb-4 text-center text-2xl font-bold text-[#0C1830]">{fmtUSD(price)}</div>
              <div className="flex flex-col gap-2">
                <BuyNowButton listingId={listing.id} sold={listing.status === "sold"} />
                <CartButton listingId={listing.id} sold={listing.status === "sold"} />
                <ChatWithSellerButton sellerId={listing.seller.id} listingId={listing.id} />
                <WishlistButton listingId={listing.id} variant="full" />
              </div>
              <p className="mt-4 flex items-start gap-1.5 text-xs leading-relaxed text-[#98A2B3]">
                <Lock size={12} className="mt-0.5 shrink-0" />
                Your identity and message stay confidential to the seller until you choose to share more.
              </p>
            </div>

            {/* SELLER CARD — locked to the pre-redesign markup byte-for-byte
                (classNames, structure, icons, order). Do not restyle. */}
            <div className="rounded-xl border border-rule bg-paper-raised p-5">
              <h5 className="mono mb-3 text-xs uppercase tracking-wide text-ink-faint">Seller</h5>
              <div className="mb-1 font-semibold text-ink">{listing.seller.name}</div>
              {listing.seller.location && <div className="mb-2 text-sm text-ink-soft">{listing.seller.location}</div>}
              {listing.seller.isVerified ? (
                <div className="mb-1.5 flex items-center gap-1.5 text-sm text-brand-hover">
                  <ShieldCheck size={15} />
                  Verified {listing.seller.verificationMethod?.replace("_", " ")}
                </div>
              ) : (
                <div className="mb-1.5 text-sm text-ink-faint">Identity not yet verified</div>
              )}
              {listing.seller.emailVerified ? (
                <div className="mb-2 flex items-center gap-1.5 text-sm text-brand-hover">
                  <MailCheck size={15} />
                  Email verified
                </div>
              ) : (
                <div className="mb-2 text-sm text-ink-faint">Email not yet verified</div>
              )}
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
          </aside>

          {/* MAIN CONTENT — MIDDLE (Overview through Payment Terms). min-w-0
              for the same grid-overflow-guard reason as the top chunk. */}
          <div className="min-w-0 flex flex-col gap-8">
            {/* Overview */}
            <section>
              <SectionHeading>
                {listing.categoryId === "youtube-channels"
                  ? "Overview of the Channel"
                  : listing.categoryId === "websites"
                    ? "Overview of the Website"
                    : listing.categoryId === "social-media-accounts"
                      ? "Overview of the Account"
                      : listing.categoryId === "apps-tools"
                        ? "Overview of the App"
                        : listing.categoryId === "domains"
                          ? "Overview of the Domain"
                          : "Overview of the Business"}
              </SectionHeading>
              <p className={clsx(bodyCls, "max-w-[70ch]")}>{listing.overview}</p>
              {category?.note && (
                <p className="mt-3 rounded-lg border border-gold/40 bg-gold-soft px-4 py-3 text-sm text-ink-soft">{category.note}</p>
              )}
            </section>

            {/* Channel Analytics (formerly "YouTube Channel Overview") —
                YouTube Channels only, auto-filled from the Channel URL (Sep 4
                2026). A plain dot + text "Connected" indicator sits next to
                the heading, matching the same lightweight treatment used for
                a connected Google Analytics account above (reference
                mockup, Sep 2026 pass) — this section only renders at all
                once `channelOverview` has been fetched from the YouTube
                API, so "Connected" is unconditional here. */}
            {listing.categoryId === "youtube-channels" && channelOverview && (
              <section>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <h2 className={h2Cls}>Channel Analytics</h2>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-[#667085]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0EAE7A]" /> Connected
                  </span>
                </div>
                <SectionCard className="mb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {channelOverview.channelAvatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={channelOverview.channelAvatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-full border border-[#E2E7E4] object-cover" />
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[#101828]">{channelOverview.channelTitle || listing.title}</span>
                        {channelSinceYear && <Badge tone="neutral">Since {channelSinceYear}</Badge>}
                      </div>
                      {channelOverview.channelHandle && <p className="mono text-sm text-[#98A2B3]">{channelOverview.channelHandle}</p>}
                    </div>
                  </div>
                  {channelLastUpdated && <p className="mt-4 text-xs text-[#98A2B3]">This data was updated on {channelLastUpdated}.</p>}
                </SectionCard>
                <StatPanel
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
              </section>
            )}

            {/* Proof of Income */}
            {incomeSeries.some((s) => s.income) && (
              <section>
                <SectionHeading subtitle="Monthly income, last 12 months">Proof of Income</SectionHeading>
                <IncomeHistoryPanel data={incomeSeries} images={incomeImageUrls} />
              </section>
            )}

            {/* Monthly Expenses */}
            {listing.monthlyExpenses.length > 0 && (
              <section>
                <SectionHeading>Monthly Expenses</SectionHeading>
                <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E7E4] bg-white">
                  {listing.monthlyExpenses.map((e) => (
                    <div key={e.label} className="mono flex justify-between border-b border-[#E2E7E4] px-4 py-3 text-sm last:border-b-0 sm:px-5">
                      <span className="text-[#667085]">{e.label}</span>
                      <span className="text-[#101828]">{fmtUSD(e.amount)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Monetization Methods */}
            {listing.monetizationTypeIds.length > 0 && (
              <section>
                <SectionHeading>Monetization Methods</SectionHeading>
                <LabelPanel labels={listing.monetizationTypeIds.map((id) => MONETIZATION_MAP[id] ?? id)} />
              </section>
            )}

            {/* Copyright Notes — YouTube Channels only (Design & Development
                New.pdf, Sep 4 2026). Renders whenever there's a note or a
                proof screenshot, same "don't gate on one field alone"
                reasoning as the GA/GSC/SEMrush/Ahrefs sections below. */}
            {listing.categoryId === "youtube-channels" && (copyrightNoteLines.length > 0 || copyrightImageUrls.length > 0) && (
              <section>
                <SectionHeading
                  subtitle={
                    listing.copyrightNotes?.updatedOn
                      ? `This data was updated on ${new Date(`${listing.copyrightNotes.updatedOn}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
                      : undefined
                  }
                >
                  Copyright Notes
                </SectionHeading>
                <SectionCard>
                  {copyrightNoteLines.length > 0 && (
                    <ul className={clsx("list-disc space-y-1.5 pl-5 text-sm text-[#667085]", copyrightImageUrls.length > 0 && "mb-5 border-b border-[#E2E7E4] pb-5")}>
                      {copyrightNoteLines.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  )}
                  {copyrightImageUrls.length > 0 && <ProofGalleryButton label="Copyright Notes" images={copyrightImageUrls} />}
                </SectionCard>
              </section>
            )}

            {/* Top Performing Videos — YouTube Channels only. Thumbnails are
                derived client-side from each video URL (see
                youtubeThumbnailUrl in src/lib/format.ts), not uploaded. */}
            {listing.categoryId === "youtube-channels" && topVideos.length > 0 && (
              <section className="min-w-0">
                <SectionHeading>All-Time Top Performing Videos</SectionHeading>
                <div className="flex min-w-0 flex-col gap-2">
                  {topVideos.map((v, i) => {
                    const thumb = youtubeThumbnailUrl(v.videoUrl);
                    const content = (
                      <>
                        <span className="mono grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#EAF8F3] text-xs font-semibold text-[#0EAE7A]">{i + 1}</span>
                        <span className="h-12 w-20 shrink-0 overflow-hidden rounded-md bg-[#F6F7F5]">
                          {thumb && (
                            // eslint-disable-next-line @next/next/no-img-element -- external YouTube thumbnail URL, not a local /public asset
                            <img src={thumb} alt="" className="h-full w-full object-cover" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-[#101828]">{v.title}</span>
                          <span className="mono mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#98A2B3]">
                            {v.views !== undefined && <span className="flex items-center gap-1"><Eye size={12} /> {fmtNumber(v.views)} views</span>}
                            {v.likes !== undefined && <span className="flex items-center gap-1"><ThumbsUp size={12} /> {fmtNumber(v.likes)} likes</span>}
                            {v.duration && <span className="flex items-center gap-1"><Clock size={12} /> {v.duration}</span>}
                            {v.publishedOn && <span className="flex items-center gap-1"><Calendar size={12} /> {v.publishedOn}</span>}
                          </span>
                        </span>
                      </>
                    );
                    return v.videoUrl ? (
                      <a
                        key={i}
                        href={v.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#E2E7E4] bg-white p-3 hover:border-[#0EAE7A]"
                      >
                        {content}
                      </a>
                    ) : (
                      <div key={i} className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#E2E7E4] bg-white p-3">
                        {content}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Google Analytics Data — one heading covers both cases. A
                seller who has connected their real GA4 account live (see
                src/components/GoogleAnalyticsLivePanel.tsx) gets that live,
                auto-updating panel here; the self-declared manual numbers
                and verification screenshots are hidden in that case so the
                page never shows two different sets of numbers for the same
                thing. A seller who hasn't connected live GA gets the manual
                data + screenshots instead. */}
            {category?.hasSeoData && hasGaData && (
              <section>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <h2 className={h2Cls}>Google Analytics Data</h2>
                  {listing.gaLiveStats ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-[#667085]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0EAE7A]" /> Connected
                    </span>
                  ) : (
                    listing.gaVerified && (
                      <span className="flex items-center gap-1 rounded-full bg-[#EAF8F3] px-2.5 py-0.5 text-xs font-semibold text-[#0EAE7A]">
                        <ShieldCheck size={12} /> Reviewed by Durqo
                      </span>
                    )
                  )}
                </div>

                {listing.gaLiveStats ? (
                  <GoogleAnalyticsLivePanel listingId={listing.id} initialStats={listing.gaLiveStats} />
                ) : (
                  <>
                    <p className="mb-4 text-sm text-[#98A2B3]">Engagement statistics, last 12 months</p>
                    <StatPanel
                      items={[
                        { label: "Total Users", value: listing.seo?.gaTotalUsers },
                        { label: "New Users", value: listing.seo?.gaNewUsers },
                        { label: "Total Page Views", value: listing.seo?.gaTotalPageViews },
                        {
                          label: "Avg. Engagement Time",
                          value: listing.seo?.gaAvgEngagementSeconds ? `${Math.floor(listing.seo.gaAvgEngagementSeconds / 60)}m ${listing.seo.gaAvgEngagementSeconds % 60}s` : undefined,
                        },
                      ]}
                      gallery={{ label: "Google Analytics Data", images: gaImageUrls, count: 3 }}
                    />
                  </>
                )}
              </section>
            )}

            {/* SEO / Analytics data block — each of the three sub-sections
                below is gated on its own hasXData flag (numbers or proof
                screenshots), not on `listing.seo` as a whole, so e.g. an
                Ahrefs-only upload doesn't also require Search Console data
                to exist before its screenshots become visible. */}
            {category?.hasSeoData && hasGscData && (
              <section>
                <SectionHeading subtitle="Engagement statistics, last 12 months">Google Search Console Data</SectionHeading>
                <StatPanel
                  items={[
                    { label: "Total Clicks", value: listing.seo?.gscTotalClicks },
                    { label: "Total Impressions", value: listing.seo?.gscTotalImpressions },
                    { label: "Indexed Pages", value: listing.seo?.gscIndexedPages },
                    { label: "Non-Indexed Pages", value: listing.seo?.gscNonIndexedPages },
                    { label: "Average CTR", value: listing.seo?.gscAvgCtr ? `${listing.seo.gscAvgCtr}%` : undefined },
                  ]}
                  gallery={{ label: "Google Search Console Data", images: gscImageUrls, count: 2 }}
                />
              </section>
            )}

            {category?.hasSeoData && hasSemrushData && (
              <section>
                <SectionHeading>SEMrush Data</SectionHeading>
                <StatPanel
                  items={[
                    { label: "Authority Score", value: listing.seo?.semrushAuthorityScore },
                    { label: "Total Traffic", value: listing.seo?.semrushTotalTraffic },
                    { label: "Total Keywords", value: listing.seo?.semrushTotalKeywords },
                    { label: "Top 10 Keywords", value: listing.seo?.semrushTop10Keywords },
                    { label: "Total Backlinks", value: listing.seo?.semrushTotalBacklinks },
                  ]}
                  gallery={{ label: "SEMrush Data", images: semrushImageUrls, count: 2 }}
                />
              </section>
            )}

            {/* Ahrefs: 43/35 in the reference numbers are DR Rating / UR
                Rating respectively — labels below must not be swapped. */}
            {category?.hasSeoData && hasAhrefsData && (
              <section>
                <SectionHeading>Ahrefs Data</SectionHeading>
                <StatPanel
                  items={[
                    { label: "DR Rating", value: listing.seo?.ahrefsDr },
                    { label: "UR Rating", value: listing.seo?.ahrefsUr },
                    { label: "Referring Domains", value: listing.seo?.ahrefsReferringDomains },
                    { label: "Total Keywords", value: listing.seo?.ahrefsTotalKeywords },
                    { label: "Total Backlinks", value: listing.seo?.ahrefsTotalBacklinks },
                  ]}
                  gallery={{ label: "Ahrefs Data", images: ahrefsImageUrls, count: 2 }}
                />
              </section>
            )}

            {/* Social Media */}
            {listing.socialStats.length > 0 && (
              <section>
                <SectionHeading>Social Media Accounts</SectionHeading>
                <div className="flex flex-wrap gap-3">
                  {listing.socialStats.map((s) => (
                    <div key={s.platform} className="rounded-2xl border border-[#E2E7E4] bg-white px-4 py-3">
                      <div className="mono text-base font-semibold text-[#0C1830]">{fmtNumber(s.followers)}</div>
                      <div className="text-xs text-[#98A2B3]">{s.platform}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sale Includes */}
            <section>
              <SectionHeading>Sale Includes</SectionHeading>
              <div className="grid gap-4 sm:grid-cols-2">
                <SectionCard>
                  <h5 className="mono mb-1 text-xs uppercase tracking-wide text-[#98A2B3]">Assets</h5>
                  <p className="text-sm text-[#667085]">{listing.saleIncludesAssets}</p>
                </SectionCard>
                <SectionCard>
                  <h5 className="mono mb-1 text-xs uppercase tracking-wide text-[#98A2B3]">Post-sale support</h5>
                  <p className="text-sm text-[#667085]">{listing.saleIncludesSupport}</p>
                </SectionCard>
              </div>
            </section>

            {/* Payment Terms */}
            <section>
              <SectionHeading>Payment Terms</SectionHeading>
              <SectionCard>
                <p className="max-w-[65ch] text-justify text-sm leading-relaxed text-[#667085]">
                  {price > 2000
                    ? "To purchase this business, we require a payment of $2,000 via the website, followed by the remainder via wire transfer/credit card/debit card."
                    : "To purchase this business, we require full payment via the website."}
                </p>
              </SectionCard>
            </section>
          </div>

          {/* MAIN CONTENT — BOTTOM (FAQ + Comments). min-w-0 for the same
              grid-overflow-guard reason as the other main-content chunks. */}
          <div className="min-w-0 flex flex-col gap-8">
            {/* FAQ */}
            <section>
              <SectionHeading>FAQ with Seller</SectionHeading>
              <ListingFaqAccordion items={listing.faqs} />
            </section>

            {/* Comments */}
            <section>
              <SectionHeading>Comments</SectionHeading>
              <div className="flex flex-col gap-4">
                {listing.comments.length === 0 && <p className="text-sm text-[#98A2B3]">No comments yet — be the first to ask a question.</p>}
                {listing.comments.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-[#E2E7E4] bg-white p-4">
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-[#101828]">{c.author}</span>
                      <span className="text-xs text-[#98A2B3]">{c.createdAt}</span>
                    </div>
                    <p className="text-sm text-[#667085]">{c.body}</p>
                    {c.replies?.map((r) => (
                      <div key={r.id} className="mt-3 ml-4 border-l-2 border-[#E2E7E4] pl-4">
                        <div className="mb-1 flex items-baseline justify-between">
                          <span className="text-sm font-semibold text-[#101828]">{r.author}</span>
                          <span className="text-xs text-[#98A2B3]">{r.createdAt}</span>
                        </div>
                        <p className="text-sm text-[#667085]">{r.body}</p>
                      </div>
                    ))}
                  </div>
                ))}
                <Link href="/login" className="text-sm font-semibold text-[#0EAE7A]">
                  Log in to leave a comment &rarr;
                </Link>
              </div>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
