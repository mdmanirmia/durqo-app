"use server";

import { headers } from "next/headers";
import { sendEmail, ADMIN_EMAIL } from "@/lib/email";
import { getUserEmails } from "@/lib/notifications";
import { requireEditAccess } from "@/lib/actions/listing-edit";

// Fired from the "new listing" page (dashboard/seller/listings/new/page.tsx)
// right after a brand-new listing's insert (and all its dependent rows)
// succeeds — 2026-09-19 request: the seller who just submitted gets a
// "submitted for review" confirmation email, and admin gets notified with a
// direct link into the admin edit page so the listing can be reviewed and
// published without hunting for it in the table.
//
// Best-effort like every other notification in this codebase (see
// listing-edit.ts's own email block): wrapped in one try/catch so any
// failure — including requireEditAccess's own auth/lookup errors, or a
// Resend outage — never surfaces to the seller, whose listing was already
// successfully created before this is called.
export async function notifyListingSubmitted(listingId: string) {
  try {
    const { admin, sellerId } = await requireEditAccess(listingId);

    const [{ data: listing }, { data: sellerProfile }, emails] = await Promise.all([
      admin.from("listings").select("title").eq("id", listingId).single(),
      admin.from("profiles").select("full_name").eq("id", sellerId).single(),
      getUserEmails(admin, [sellerId]),
    ]);
    if (!listing) return;

    const sellerName = sellerProfile?.full_name || "A seller";
    const sellerEmail = emails[sellerId];

    const hdrs = await headers();
    const host = hdrs.get("host");
    const origin = host ? `${host.includes("localhost") ? "http" : "https"}://${host}` : "https://www.durqo.com";
    const adminReviewUrl = `${origin}/dashboard/admin/listings/${listingId}/edit`;

    await sendEmail(
      ADMIN_EMAIL,
      `New listing submitted for review — ${listing.title}`,
      `<p>${sellerName}${sellerEmail ? ` (${sellerEmail})` : ""} just submitted a new business listing, "${listing.title}", for review.</p>
       <p><a href="${adminReviewUrl}">Review the listing</a>.</p>`
    );

    if (sellerEmail) {
      await sendEmail(
        sellerEmail,
        `"${listing.title}" has been submitted for review`,
        `<p>Hi ${sellerName},</p>
         <p>Your business, <strong>${listing.title}</strong>, has been submitted successfully and is now under review.</p>
         <p>The Durqo team will review it and publish it. This process may take 1-3 business days.</p>
         <p>We'll email you as soon as it's live.</p>`
      );
    }
  } catch (err) {
    console.error("[listing submitted email] failed:", err);
  }
}
