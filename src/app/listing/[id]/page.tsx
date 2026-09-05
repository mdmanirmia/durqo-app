import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ChevronRight, Lock, ExternalLink, Eye, ThumbsUp, Clock, Calendar } from "lucide-react";
import { getListingById } from "@/lib/data/listings.server";
import { CATEGORY_MAP, QUICK_STAT_LABELS, QuickStatKey } from "@/lib/categories";
import { NICHE_MAP } from "@/lib/niches";
import { MONETIZATION_MAP } from "@/lib/monetization-types";
import { fmtUSD, fmtNumber, fmtDisplayUrl, toHref, youtubeThumbnailUrl } from "@/lib/format";
import IncomeHistoryPanel from "@/components/IncomeHistoryPanel";
import GoogleAnalyticsLivePanel from "@/components/GoogleAnalyticsLivePanel";
import FaqAccordion from "@/components/FaqAccordion";
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

function StatTile({ label, value }: { label: string; value: string | number | undefined }) {
  if (value === undefined || value === "") return null;
  return (
    <div className="rounded-lg border border-rule bg-paper-raised p-4">
      <div className="mono text-lg font-semibold text-ink">{typeof value === "number" ? fmtNumber(value) : value}</div>
      <div className="mono text-[0.65rem] uppercase tracking-wide text-ink-faint">{label}</div>
    </div>
  );
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
  const quickStatLabelOverrides: Partial<Record<QuickStatKey, string>> =
    listing.categoryId === "websites"
      ? { monthly_income: "Avg. Monthly Income", monthly_views: "Avg. Monthly Views", age: "Website Age" }
      : listing.categoryId === "e-commerce"
      ? { monthly_income: "Avg. Monthly Income", monthly_views: "Avg. Monthly Views" }
      : listing.categoryId === "youtube-channels"
        ? { location: "Channel Location", monthly_income: "Avg. Monthly Income", subscribers: "Total Subscribers" }
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
  // fetchYoutubeChannelOverview() in src/lib/youtube.ts). Renders whenever
  // a sync has completed at least once; the plain manual Channel
  // Statistics tiles in Quick Statistics above still show even without
  // this, same fallback reasoning as the Google Analytics section.
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

  return (
    <main className="py-8 sm:py-10">
      <Container>
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
          <Link href="/" className="hover:text-ink">Home</Link>
          <ChevronRight size={12} />
          <Link href="/buy" className="hover:text-ink">Marketplace</Link>
          <ChevronRight size={12} />
          <Link href={`/buy?category=${listing.categoryId}`} className="hover:text-ink">{category?.name ?? listing.categoryId}</Link>
          <ChevronRight size={12} />
          <span className="text-ink-soft">{listing.title}</span>
        </nav>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{category?.name ?? listing.categoryId}</Badge>
          {listing.isVerified && <Badge tone="brand">Verified</Badge>}
          {listing.gaVerified && <Badge tone="brand">Google Analytics Verified</Badge>}
          {listing.status === "sold" && <StatusBadge status="sold" />}
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
        <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
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
          <div className="min-w-0 flex flex-col gap-12">
            <div>
              <h1 className="mb-2 text-3xl sm:text-4xl">{listing.title}</h1>
              {listing.businessUrl && (
                <a
                  href={toHref(listing.businessUrl)}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="mono inline-flex items-center gap-1 text-sm text-brand-strong hover:underline"
                >
                  {fmtDisplayUrl(listing.businessUrl)}
                  <ExternalLink size={13} className="shrink-0" />
                </a>
              )}
            </div>

            {/* Quick Stats */}
            <section>
              <h2 className="mb-4 text-xl">Quick Statistics</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {quickStatDisplayKeys.map((key: QuickStatKey) => (
                  <StatTile key={key} label={quickStatLabelOverrides[key] ?? QUICK_STAT_LABELS[key]} value={listing.quickStats[key]} />
                ))}
                {listing.niches.length > 0 && (
                  <StatTile label="Niche" value={listing.niches.map((id) => NICHE_MAP[id] ?? id).join(", ")} />
                )}
                <StatTile label="Asking Price" value={fmtUSD(price)} />
              </div>
            </section>

            {/* Overview */}
            <section>
              <h2 className="mb-3 text-xl">{listing.categoryId === "youtube-channels" ? "Overview of the Channel" : listing.categoryId === "websites" ? "Overview of the Website" : "Overview of the Business"}</h2>
              <p className="max-w-[70ch] text-ink-soft">{listing.overview}</p>
              {category?.note && (
                <p className="mt-3 rounded-lg border border-gold/40 bg-gold-soft px-4 py-3 text-sm text-ink-soft">{category.note}</p>
              )}
            </section>

            {/* Channel Analytics (formerly "YouTube Channel Overview") —
                YouTube Channels only, auto-filled from the Channel URL (Sep
                4 2026). Styled to Durqo's own navy/emerald tokens, not the
                dark reference theme it was speced from. Moved to right
                after "Overview of the Channel" and renamed to "Channel
                Analytics" per the user's follow-up request. The ShieldCheck
                tick next to the "Channel Analytics" heading itself renders
                unconditionally for every YouTube Channels listing (Sep 5
                2026 follow-up — previously gated on listing.gaVerified,
                same as the "Reviewed by Durqo" pill on the Google Analytics
                Data section below, but the user asked for it to always show
                here regardless of GA-verification status). A native `title`
                attribute (same-day follow-up) shows a "Verified" tooltip on
                hover/focus, since the icon otherwise carries no visible
                label of its own. */}
            {listing.categoryId === "youtube-channels" && channelOverview && (
              <section className="rounded-xl border border-rule bg-paper-raised p-5 sm:p-6">
                <h2 className="mb-4 flex items-center gap-2 text-xl">
                  Channel Analytics
                  <span title="Verified">
                    <ShieldCheck size={18} className="shrink-0 text-brand-hover" aria-label="Verified" />
                  </span>
                </h2>
                <div className="mb-5 flex flex-wrap items-center gap-3">
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
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatTile label="Subscribers" value={listing.quickStats.subscribers} />
                  <StatTile label="Total Views" value={listing.quickStats.total_views} />
                  <StatTile label="Videos" value={listing.quickStats.total_videos} />
                  <StatTile label="Avg Views/Video" value={channelOverview.avgViewsPerVideo} />
                  <StatTile label="Recent Avg Views" value={channelOverview.recentAvgViews} />
                  <StatTile label="Engagement Rate" value={channelOverview.engagementRatePercent !== undefined ? `${channelOverview.engagementRatePercent}%` : undefined} />
                  <StatTile label="Avg Likes" value={channelOverview.recentAvgLikes} />
                </div>
                {channelLastUpdated && <p className="mt-4 text-xs text-ink-faint">This data was updated on {channelLastUpdated}.</p>}
              </section>
            )}

            {/* Proof of Income */}
            {incomeSeries.some((s) => s.income) && (
              <section>
                <h2 className="mb-1 text-xl">Proof of Income</h2>
                <p className="mb-4 text-sm text-ink-faint">Monthly income, last 12 months</p>
                <IncomeHistoryPanel data={incomeSeries} />
                <ProofGalleryButton label="Proof of Income" images={incomeImageUrls} count={4} />
              </section>
            )}

            {/* Monthly Expenses */}
            {listing.monthlyExpenses.length > 0 && (
              <section>
                <h2 className="mb-3 text-xl">Monthly Expenses</h2>
                <div className="flex flex-col rounded-lg border border-rule bg-paper-raised">
                  {listing.monthlyExpenses.map((e) => (
                    <div key={e.label} className="mono flex justify-between border-b border-rule px-4 py-2.5 text-sm last:border-b-0">
                      <span className="text-ink-soft">{e.label}</span>
                      <span className="text-ink">{fmtUSD(e.amount)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Monetization Methods */}
            {listing.monetizationTypeIds.length > 0 && (
              <section>
                <h2 className="mb-3 text-xl">Monetization Methods</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.monetizationTypeIds.map((id) => (
                    <span key={id} className="rounded-md border border-rule-strong px-3 py-1 text-sm text-ink-soft">
                      {MONETIZATION_MAP[id] ?? id}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Copyright Notes — YouTube Channels only (Design & Development
                New.pdf, Sep 4 2026). Renders whenever there's a note or a
                proof screenshot, same "don't gate on one field alone"
                reasoning as the GA/GSC/SEMrush/Ahrefs sections below. */}
            {listing.categoryId === "youtube-channels" && (copyrightNoteLines.length > 0 || copyrightImageUrls.length > 0) && (
              <section>
                <h2 className="mb-1 text-xl">Copyright Notes</h2>
                {listing.copyrightNotes?.updatedOn && (
                  <p className="mb-4 text-sm text-ink-faint">
                    This data was updated on{" "}
                    {new Date(`${listing.copyrightNotes.updatedOn}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                )}
                {copyrightNoteLines.length > 0 && (
                  <ul className="mb-4 list-disc space-y-1.5 pl-5 text-sm text-ink-soft">
                    {copyrightNoteLines.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                )}
                {copyrightImageUrls.length > 0 && <ProofGalleryButton label="Copyright Notes" images={copyrightImageUrls} />}
              </section>
            )}

            {/* Top Performing Videos — YouTube Channels only. Thumbnails are
                derived client-side from each video URL (see
                youtubeThumbnailUrl in src/lib/format.ts), not uploaded. */}
            {listing.categoryId === "youtube-channels" && topVideos.length > 0 && (
              <section className="min-w-0">
                <h2 className="mb-4 text-xl">All-Time Top Performing Videos</h2>
                <div className="flex min-w-0 flex-col gap-2">
                  {topVideos.map((v, i) => {
                    const thumb = youtubeThumbnailUrl(v.videoUrl);
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
                      <a key={i} href={v.videoUrl} target="_blank" rel="noopener noreferrer nofollow" className="flex min-w-0 items-center gap-3 rounded-lg border border-rule bg-paper-raised p-3 hover:border-brand-strong">
                        {content}
                      </a>
                    ) : (
                      <div key={i} className="flex min-w-0 items-center gap-3 rounded-lg border border-rule bg-paper-raised p-3">
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
                thing. A seller who hasn't connected live GA gets the
                manual data + screenshots instead. */}
            {category?.hasSeoData && hasGaData && (
              <section>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <h2 className="text-xl">Google Analytics Data</h2>
                  {!listing.gaLiveStats && listing.gaVerified && (
                    <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-hover">
                      <ShieldCheck size={12} /> Reviewed by Durqo
                    </span>
                  )}
                </div>

                {listing.gaLiveStats ? (
                  <GoogleAnalyticsLivePanel listingId={listing.id} initialStats={listing.gaLiveStats} />
                ) : (
                  <>
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <StatTile label="Total Users" value={listing.seo?.gaTotalUsers} />
                      <StatTile label="New Users" value={listing.seo?.gaNewUsers} />
                      <StatTile label="Total Page Views" value={listing.seo?.gaTotalPageViews} />
                      <StatTile
                        label="Avg. Engagement Time"
                        value={listing.seo?.gaAvgEngagementSeconds ? `${Math.floor(listing.seo.gaAvgEngagementSeconds / 60)}m ${listing.seo.gaAvgEngagementSeconds % 60}s` : undefined}
                      />
                    </div>
                    <ProofGalleryButton label="Google Analytics Data" images={gaImageUrls} count={3} />
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
                <h2 className="mb-1 text-xl">Google Search Console Data</h2>
                <p className="mb-4 text-sm text-ink-faint">Engagement statistics, last 12 months</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <StatTile label="Total Clicks" value={listing.seo?.gscTotalClicks} />
                  <StatTile label="Total Impressions" value={listing.seo?.gscTotalImpressions} />
                  <StatTile label="Indexed Pages" value={listing.seo?.gscIndexedPages} />
                  <StatTile label="Non-Indexed Pages" value={listing.seo?.gscNonIndexedPages} />
                  <StatTile label="Average CTR" value={listing.seo?.gscAvgCtr ? `${listing.seo.gscAvgCtr}%` : undefined} />
                </div>
                <ProofGalleryButton label="Google Search Console Data" images={gscImageUrls} count={2} />
              </section>
            )}

            {category?.hasSeoData && hasSemrushData && (
              <section>
                <h2 className="mb-4 text-xl">SEMrush Data</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <StatTile label="Authority Score" value={listing.seo?.semrushAuthorityScore} />
                  <StatTile label="Total Traffic" value={listing.seo?.semrushTotalTraffic} />
                  <StatTile label="Total Keywords" value={listing.seo?.semrushTotalKeywords} />
                  <StatTile label="Top 10 Keywords" value={listing.seo?.semrushTop10Keywords} />
                  <StatTile label="Total Backlinks" value={listing.seo?.semrushTotalBacklinks} />
                </div>
                <ProofGalleryButton label="SEMrush Data" images={semrushImageUrls} count={2} />
              </section>
            )}

            {category?.hasSeoData && hasAhrefsData && (
              <section>
                <h2 className="mb-4 text-xl">Ahrefs Data</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <StatTile label="DR Rating" value={listing.seo?.ahrefsDr} />
                  <StatTile label="UR Rating" value={listing.seo?.ahrefsUr} />
                  <StatTile label="Referring Domains" value={listing.seo?.ahrefsReferringDomains} />
                  <StatTile label="Total Keywords" value={listing.seo?.ahrefsTotalKeywords} />
                  <StatTile label="Total Backlinks" value={listing.seo?.ahrefsTotalBacklinks} />
                </div>
                <ProofGalleryButton label="Ahrefs Data" images={ahrefsImageUrls} count={2} />
              </section>
            )}

            {/* Social Media */}
            {listing.socialStats.length > 0 && (
              <section>
                <h2 className="mb-3 text-xl">Social Media Accounts</h2>
                <div className="flex flex-wrap gap-3">
                  {listing.socialStats.map((s) => (
                    <div key={s.platform} className="rounded-lg border border-rule bg-paper-raised px-4 py-3">
                      <div className="mono text-base font-semibold text-ink">{fmtNumber(s.followers)}</div>
                      <div className="text-xs text-ink-faint">{s.platform}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sales Includes */}
            <section>
              <h2 className="mb-3 text-xl">Sale Includes</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-rule bg-paper-raised p-4">
                  <h5 className="mono mb-1 text-xs uppercase tracking-wide text-ink-faint">Assets</h5>
                  <p className="text-sm text-ink-soft">{listing.saleIncludesAssets}</p>
                </div>
                <div className="rounded-lg border border-rule bg-paper-raised p-4">
                  <h5 className="mono mb-1 text-xs uppercase tracking-wide text-ink-faint">Post-sale support</h5>
                  <p className="text-sm text-ink-soft">{listing.saleIncludesSupport}</p>
                </div>
              </div>
            </section>

            {/* Payment Terms */}
            <section>
              <h2 className="mb-3 text-xl">Payment Terms</h2>
              <div className="rounded-xl border border-rule bg-paper-raised p-5">
                <p className="max-w-[65ch] text-justify text-sm leading-relaxed text-ink-soft">
                  {price > 2000
                    ? "To purchase this business, we require a payment of $2,000 via the website, followed by the remainder via wire transfer/credit card/debit card."
                    : "To purchase this business, we require full payment via the website."}
                </p>
              </div>
            </section>
          </div>

          {/* SIDEBAR — acquisition panel + seller details, sticky. Placed here
              (between MAIN CONTENT TOP and MAIN CONTENT BOTTOM) so mobile's
              single-column stacking reads Payment Terms → price/action card →
              seller details → FAQ → Comments; lg:row-span-2 keeps it spanning
              both main-content rows on desktop so it still sticks through the
              full page height, not just the "top" chunk's height. */}
          <aside className="min-w-0 flex h-max flex-col gap-4 lg:sticky lg:top-24 lg:row-span-2">
            <div className="rounded-xl border border-rule bg-paper-raised p-5">
              {listing.discountedPrice != null && listing.discountedPrice < listing.price && (
                <div className="mono text-center text-sm text-ink-faint line-through">{fmtUSD(listing.price)}</div>
              )}
              <div className="mono mb-4 text-center text-2xl font-bold text-ink">{fmtUSD(price)}</div>
              <div className="flex flex-col gap-2">
                <BuyNowButton listingId={listing.id} sold={listing.status === "sold"} />
                <CartButton listingId={listing.id} sold={listing.status === "sold"} />
                <ChatWithSellerButton sellerId={listing.seller.id} listingId={listing.id} />
                <WishlistButton listingId={listing.id} variant="full" />
              </div>
              <p className="mt-4 flex items-start gap-1.5 text-xs leading-relaxed text-ink-faint">
                <Lock size={12} className="mt-0.5 shrink-0" />
                Your identity and message stay confidential to the seller until you choose to share more.
              </p>
            </div>

            <div className="rounded-xl border border-rule bg-paper-raised p-5">
              <h5 className="mono mb-3 text-xs uppercase tracking-wide text-ink-faint">Seller</h5>
              <div className="mb-1 font-semibold text-ink">{listing.seller.name}</div>
              {listing.seller.location && <div className="mb-2 text-sm text-ink-soft">{listing.seller.location}</div>}
              {listing.seller.isVerified ? (
                <div className="mb-2 flex items-center gap-1.5 text-sm text-brand-hover">
                  <ShieldCheck size={15} />
                  Verified {listing.seller.verificationMethod?.replace("_", " ")}
                </div>
              ) : (
                <div className="mb-2 text-sm text-ink-faint">Identity not yet verified</div>
              )}
              <div className="mono text-sm text-ink-soft">{listing.seller.totalSales} completed sale{listing.seller.totalSales === 1 ? "" : "s"}</div>
              <div className="text-xs text-ink-faint">Member since {listing.seller.memberSince}</div>
            </div>
          </aside>

          {/* MAIN CONTENT — BOTTOM (FAQ + Comments). min-w-0 for the same
              grid-overflow-guard reason as MAIN CONTENT TOP above. */}
          <div className="min-w-0 flex flex-col gap-12">
            {/* FAQ */}
            <section>
              <h2 className="mb-2 text-xl">FAQ with Seller</h2>
              <FaqAccordion items={listing.faqs} />
            </section>

            {/* Comments */}
            <section>
              <h2 className="mb-4 text-xl">Comments</h2>
              <div className="flex flex-col gap-5">
                {listing.comments.length === 0 && <p className="text-sm text-ink-faint">No comments yet — be the first to ask a question.</p>}
                {listing.comments.map((c) => (
                  <div key={c.id} className="rounded-lg border border-rule bg-paper-raised p-4">
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-ink">{c.author}</span>
                      <span className="text-xs text-ink-faint">{c.createdAt}</span>
                    </div>
                    <p className="text-sm text-ink-soft">{c.body}</p>
                    {c.replies?.map((r) => (
                      <div key={r.id} className="mt-3 ml-4 border-l-2 border-rule pl-4">
                        <div className="mb-1 flex items-baseline justify-between">
                          <span className="text-sm font-semibold text-ink">{r.author}</span>
                          <span className="text-xs text-ink-faint">{r.createdAt}</span>
                        </div>
                        <p className="text-sm text-ink-soft">{r.body}</p>
                      </div>
                    ))}
                  </div>
                ))}
                <Link href="/login" className="text-sm font-semibold text-brand-hover">
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
