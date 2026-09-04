import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ChevronRight, Lock, ExternalLink } from "lucide-react";
import { getListingById } from "@/lib/data/listings.server";
import { CATEGORY_MAP, QUICK_STAT_LABELS, QuickStatKey } from "@/lib/categories";
import { NICHE_MAP } from "@/lib/niches";
import { MONETIZATION_MAP } from "@/lib/monetization-types";
import { fmtUSD, fmtNumber, fmtDisplayUrl, toHref } from "@/lib/format";
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
  const quickStatLabelOverrides: Partial<Record<QuickStatKey, string>> =
    listing.categoryId === "websites" || listing.categoryId === "e-commerce"
      ? { monthly_income: "Avg. Monthly Income", monthly_views: "Avg. Monthly Views" }
      : {};

  // Real uploaded verification screenshots, grouped by which data section
  // they belong to — empty when this listing predates real Storage uploads
  // (ProofGalleryButton falls back to a placeholder in that case).
  const imagesByKind = (kind: string) => (listing.images ?? []).filter((img) => img.kind === kind).map((img) => img.url);
  const incomeImageUrls = imagesByKind("proof_of_income");
  const gaImageUrls = imagesByKind("google_analytics");
  const gscImageUrls = imagesByKind("search_console");
  const semrushImageUrls = imagesByKind("semrush");
  const ahrefsImageUrls = imagesByKind("ahrefs");

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

        <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
          {/* MAIN CONTENT */}
          <div className="flex flex-col gap-12">
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
                {category?.quickStats.map((key: QuickStatKey) => (
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
              <h2 className="mb-3 text-xl">Overview of the Business</h2>
              <p className="max-w-[70ch] text-ink-soft">{listing.overview}</p>
              {category?.note && (
                <p className="mt-3 rounded-lg border border-gold/40 bg-gold-soft px-4 py-3 text-sm text-ink-soft">{category.note}</p>
              )}
            </section>

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

          {/* SIDEBAR — acquisition panel, sticky */}
          <aside className="flex h-max flex-col gap-4 lg:sticky lg:top-24">
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
        </div>
      </Container>
    </main>
  );
}
