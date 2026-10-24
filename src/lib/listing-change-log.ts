import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, ADMIN_EMAIL } from "@/lib/email";
import { getUserEmails } from "@/lib/notifications";
import { CATEGORY_MAP } from "@/lib/categories";
import { MONETIZATION_MAP } from "@/lib/monetization-types";
import { NICHE_MAP } from "@/lib/niches";
import { BUSINESS_PLATFORM_MAP } from "@/lib/business-platforms";

// Oct 24, 2026 ("List submit korar por admin/seller jekono data update
// korle oitar email notification admin er kache asbe (support@durqo.com)
// ... publish howar age and por jekono somoi ... ki ki update koreche and
// previous ki ki silo ei gulor details o email e thakbe"):
//
// Every change to a submitted listing, by its seller or by an admin, before
// or after it's published, emails support@durqo.com with a field-by-field
// "Previous -> New" table. The listing (and every related table the edit
// form writes) is snapshotted into flat, human-readable label -> value
// pairs before and after the write; the diff of the two is the email.
// Best-effort like every other notification here: nothing in this module
// ever throws back into the save that triggered it.

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;
export type ListingSnapshot = Record<string, string>;
export type ListingChange = { field: string; before: string; after: string };

const EMPTY = "(empty)";
const MAX_VALUE_CHARS = 4000;

// Columns that aren't user-edited data (bookkeeping/counters) or that are
// already covered by a more readable related-table entry below.
const IGNORED_COLUMNS = new Set([
  "id",
  "seller_id",
  "created_at",
  "updated_at",
  "views",
  "slug",
  "assets_confirmed_at",
  // Derived from the structured asset list, which is diffed on its own.
  "sale_includes_assets",
]);

const COLUMN_LABELS: Record<string, string> = {
  category_id: "Category",
  title: "Business name",
  business_url: "Business URL",
  location: "Location",
  price: "Asking price",
  discounted_price: "Discounted price",
  business_age_years: "Business age (years)",
  overview: "Overview",
  monthly_expenses: "Monthly expenses",
  monetization_type_ids: "Monetization",
  sale_includes_support: "Post-sale support",
  monthly_income: "Monthly income",
  monthly_visitors: "Monthly visitors",
  domain_authority: "Authority score",
  articles_posted: "Articles posted",
  subscribers: "Subscribers",
  open_rate: "Open rate",
  click_through_rate: "Click-through rate",
  unsubscribe_rate: "Unsubscribe rate",
  channel_age_years: "Channel age (years)",
  total_videos: "Total videos",
  total_downloads: "Total downloads",
  total_reviews: "Total reviews",
  rating: "Rating",
  active_clients: "Active clients",
  domain_expires: "Domain expires",
  domain_registrar: "Domain registrar",
  status: "Listing status",
  is_verified: "Verified",
  monthly_views: "Monthly views",
  total_posts: "Total posts",
  likes_per_post: "Likes per post",
  views_per_post: "Views per post",
  followers: "Followers",
  domain_age: "Domain age",
  ga_access_confirmed: "Google Analytics access granted",
  gsc_access_confirmed: "Search Console access granted",
  ga_verified: "Google Analytics verified (admin)",
  loom_video_url: "Loom video URL",
  niches: "Niche / industry",
  total_views: "Total views",
  business_type: "Business type",
  account_type: "Account type",
  active_subscribers: "Active subscribers",
  store_price: "Store price",
  platform: "Platform",
  funding_stage: "Funding stage",
  funding_raised: "Funding raised",
  team_size: "Team size",
  business_platform: "Built on (platform)",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending review (not published yet)",
  published: "Published (live)",
  sold: "Sold",
  archived: "Archived",
};

const MONEY_COLUMNS = new Set(["price", "discounted_price", "monthly_income", "store_price", "funding_raised"]);

const IMAGE_KIND_LABELS: Record<string, string> = {
  proof_of_income: "Proof of Income",
  google_analytics: "Google Analytics",
  search_console: "Google Search Console",
  semrush: "SEMrush",
  ahrefs: "Ahrefs",
  copyright_notes: "Copyright Notes",
};

export function imageKindLabel(kind: string) {
  return IMAGE_KIND_LABELS[kind] ?? humanize(kind);
}

export function statusLabel(status: string | null | undefined) {
  if (!status) return EMPTY;
  return STATUS_LABELS[status] ?? humanize(status);
}

function humanize(key: string) {
  const s = key.replace(/_/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function money(n: unknown) {
  const v = Number(n);
  return Number.isFinite(v) ? `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : String(n);
}

function isBlank(v: unknown) {
  return v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
}

function plain(v: unknown): string {
  if (isBlank(v)) return EMPTY;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function formatColumn(key: string, v: unknown): string {
  if (isBlank(v)) return EMPTY;
  switch (key) {
    case "category_id":
      return CATEGORY_MAP[String(v)]?.name ?? String(v);
    case "status":
      return statusLabel(String(v));
    case "monetization_type_ids":
      return (v as string[]).map((id) => MONETIZATION_MAP[id] ?? id).join(", ");
    case "niches":
      return (v as string[]).map((id) => NICHE_MAP[id] ?? id).join(", ");
    case "business_platform":
      return BUSINESS_PLATFORM_MAP[String(v)] ?? String(v);
    case "monthly_expenses": {
      const rows = (v as { label?: string; amount?: number }[]) ?? [];
      return rows.length ? rows.map((r) => `${r.label ?? "Expense"}: ${money(r.amount)}`).join("\n") : EMPTY;
    }
  }
  if (MONEY_COLUMNS.has(key)) return money(v);
  return plain(v);
}

function monthLabel(month: string) {
  const d = new Date(`${month.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? month : d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

// Flat, human-readable picture of everything the listing edit form can
// change. Keys are the labels shown in the email.
export async function snapshotListing(admin: AdminClient, listingId: string): Promise<ListingSnapshot> {
  const [listing, monthly, seo, social, assets, faqs, copyright, videos, channel] = await Promise.all([
    admin.from("listings").select("*").eq("id", listingId).maybeSingle(),
    admin.from("listing_monthly_stats").select("month, income").eq("listing_id", listingId).order("month", { ascending: true }),
    admin.from("listing_seo_data").select("*").eq("listing_id", listingId).maybeSingle(),
    admin.from("listing_social_stats").select("platform, followers, url").eq("listing_id", listingId),
    admin.from("listing_assets").select("name, buyer_receives, transfer_method, note").eq("listing_id", listingId).order("position", { ascending: true }),
    admin.from("listing_faqs").select("question, answer").eq("listing_id", listingId).order("sort_order", { ascending: true }),
    admin.from("listing_copyright_notes").select("notes").eq("listing_id", listingId).maybeSingle(),
    admin.from("listing_top_videos").select("title, video_url, views, likes, duration, published_on").eq("listing_id", listingId).order("rank", { ascending: true }),
    admin.from("listing_youtube_channel_overview").select("*").eq("listing_id", listingId).maybeSingle(),
  ]);

  const snap: ListingSnapshot = {};

  const row = (listing.data ?? {}) as Record<string, unknown>;
  for (const [key, value] of Object.entries(row)) {
    if (IGNORED_COLUMNS.has(key)) continue;
    snap[COLUMN_LABELS[key] ?? humanize(key)] = formatColumn(key, value);
  }

  for (const m of monthly.data ?? []) {
    if (m.income === null || m.income === undefined) continue;
    snap[`Proof of income: ${monthLabel(String(m.month))}`] = money(m.income);
  }

  const seoRow = (seo.data ?? {}) as Record<string, unknown>;
  for (const [key, value] of Object.entries(seoRow)) {
    if (key === "listing_id") continue;
    snap[`Traffic & SEO: ${humanize(key).replace(/^Ga /, "GA ").replace(/^Gsc /, "GSC ").replace(/^Semrush /, "SEMrush ").replace(/^Ahrefs /, "Ahrefs ")}`] = plain(value);
  }

  const socialRows = social.data ?? [];
  snap["Social media stats"] = socialRows.length
    ? socialRows
        .map((s) => `${s.platform}: ${Number(s.followers).toLocaleString("en-US")} followers${s.url ? ` (${s.url})` : ""}`)
        .sort()
        .join("\n")
    : EMPTY;

  const assetRows = assets.data ?? [];
  snap["Sale includes (assets)"] = assetRows.length
    ? assetRows
        .map((a, i) =>
          [`${i + 1}. ${a.name}`, a.buyer_receives && `buyer receives: ${a.buyer_receives}`, a.transfer_method && `transfer: ${a.transfer_method}`, a.note && `note: ${a.note}`]
            .filter(Boolean)
            .join(" | ")
        )
        .join("\n")
    : EMPTY;

  const faqRows = faqs.data ?? [];
  snap["Questions & Answers"] = faqRows.length ? faqRows.map((f, i) => `Q${i + 1}: ${f.question}\nA${i + 1}: ${f.answer}`).join("\n\n") : EMPTY;

  if (copyright.data) snap["Copyright notes"] = plain(copyright.data.notes);

  const videoRows = videos.data ?? [];
  if (videoRows.length) {
    snap["Top performing videos"] = videoRows
      .map((v, i) =>
        [`${i + 1}. ${v.title}`, v.video_url, v.views != null && `${Number(v.views).toLocaleString("en-US")} views`, v.likes != null && `${Number(v.likes).toLocaleString("en-US")} likes`, v.duration, v.published_on]
          .filter(Boolean)
          .join(" | ")
      )
      .join("\n");
  }

  const ch = (channel.data ?? null) as Record<string, unknown> | null;
  if (ch) {
    for (const [key, value] of Object.entries(ch)) {
      if (key === "listing_id" || key === "last_synced_at") continue;
      snap[`YouTube channel: ${humanize(key.replace(/^channel_/, ""))}`] = plain(value);
    }
  }

  return snap;
}

export function diffSnapshots(before: ListingSnapshot, after: ListingSnapshot): ListingChange[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes: ListingChange[] = [];
  for (const key of keys) {
    const b = before[key] ?? EMPTY;
    const a = after[key] ?? EMPTY;
    if (b !== a) changes.push({ field: key, before: b, after: a });
  }
  return changes;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function clip(s: string) {
  return s.length > MAX_VALUE_CHARS ? `${s.slice(0, MAX_VALUE_CHARS)}… (${s.length - MAX_VALUE_CHARS} more characters)` : s;
}

// Sends the "listing updated" email to support@durqo.com. `changes` are the
// field-level diffs; `notes` are extra plain-text lines (image uploads or
// removals, which aren't part of the snapshot). Skips sending when there's
// nothing to report, so a "Save" with no real edits doesn't email anyone.
export async function sendListingChangeEmail(opts: {
  admin: AdminClient;
  listingId: string;
  actorId: string;
  actorIsAdmin: boolean;
  origin: string;
  changes: ListingChange[];
  notes?: string[];
  headline?: string;
  // Test hook: build and return the email instead of sending it.
  dryRun?: boolean;
}): Promise<{ subject: string; html: string } | void> {
  try {
    const { admin, listingId, actorId, actorIsAdmin, origin, changes } = opts;
    const notes = opts.notes ?? [];
    if (changes.length === 0 && notes.length === 0) return;

    const { data: listing } = await admin.from("listings").select("title, slug, status, seller_id").eq("id", listingId).maybeSingle();
    if (!listing) return;
    const sellerId = listing.seller_id as string;

    const ids = Array.from(new Set([actorId, sellerId]));
    const [{ data: profiles }, emails] = await Promise.all([
      admin.from("profiles").select("id, full_name").in("id", ids),
      getUserEmails(admin, ids),
    ]);
    const nameOf = (id: string) => profiles?.find((p) => p.id === id)?.full_name || "Unknown";

    const title = (listing.title as string) || "Untitled listing";
    const role = actorIsAdmin ? "Admin" : "Seller";
    const when = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";
    const count = changes.length + notes.length;
    const subject = `Listing updated by ${role.toLowerCase()} - ${title} (${count} change${count === 1 ? "" : "s"})`;

    const cell = "padding:8px 10px;border:1px solid #E2E8F0;vertical-align:top;font-size:13px;line-height:1.45;";
    const rows = changes
      .map(
        (c) => `<tr>
          <td style="${cell}font-weight:600;color:#111827;background:#F8FAFC;width:22%">${esc(c.field)}</td>
          <td style="${cell}color:#991B1B;background:#FEF2F2;white-space:pre-wrap;width:39%">${esc(clip(c.before))}</td>
          <td style="${cell}color:#065F46;background:#ECFDF5;white-space:pre-wrap;width:39%">${esc(clip(c.after))}</td>
        </tr>`
      )
      .join("");

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111827;max-width:760px">
        <p style="margin:0 0 12px">${esc(opts.headline ?? `"${title}" was updated. Details are below.`)}</p>
        <table style="border-collapse:collapse;margin:0 0 16px;font-size:13px">
          <tr><td style="padding:3px 12px 3px 0;color:#64748B">Listing</td><td style="padding:3px 0"><strong>${esc(title)}</strong></td></tr>
          <tr><td style="padding:3px 12px 3px 0;color:#64748B">Status</td><td style="padding:3px 0">${esc(statusLabel(listing.status as string))}</td></tr>
          <tr><td style="padding:3px 12px 3px 0;color:#64748B">Updated by</td><td style="padding:3px 0">${esc(nameOf(actorId))} (${role})${emails[actorId] ? ` - ${esc(emails[actorId])}` : ""}</td></tr>
          ${actorIsAdmin && sellerId !== actorId ? `<tr><td style="padding:3px 12px 3px 0;color:#64748B">Seller</td><td style="padding:3px 0">${esc(nameOf(sellerId))}${emails[sellerId] ? ` - ${esc(emails[sellerId])}` : ""}</td></tr>` : ""}
          <tr><td style="padding:3px 12px 3px 0;color:#64748B">Time</td><td style="padding:3px 0">${esc(when)}</td></tr>
        </table>
        ${
          changes.length
            ? `<table style="border-collapse:collapse;width:100%;margin:0 0 16px">
                <tr>
                  <th style="${cell}text-align:left;background:#0B1324;color:#fff">Field</th>
                  <th style="${cell}text-align:left;background:#0B1324;color:#fff">Previous</th>
                  <th style="${cell}text-align:left;background:#0B1324;color:#fff">New</th>
                </tr>
                ${rows}
              </table>`
            : ""
        }
        ${notes.length ? `<ul style="margin:0 0 16px;padding-left:18px;font-size:13px">${notes.map((n) => `<li style="margin:0 0 4px">${esc(n)}</li>`).join("")}</ul>` : ""}
        <p style="margin:0;font-size:13px">
          <a href="${origin}/dashboard/admin/listings/${listingId}/edit">Open in admin</a>
          &nbsp;·&nbsp;
          <a href="${origin}/listing/${esc(String(listing.slug ?? listingId))}">View listing page</a>
        </p>
      </div>`;

    if (opts.dryRun) return { subject, html };
    await sendEmail(ADMIN_EMAIL, subject, html);
  } catch (err) {
    console.error("[listing-change-log] change email failed:", err);
  }
}
