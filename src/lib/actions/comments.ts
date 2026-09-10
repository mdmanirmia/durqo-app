"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { getUserEmails } from "@/lib/notifications";

// Sep 9, 2026 build: the listing page's "FAQ with Seller" section previously
// had no real way to actually post a question or an answer at all — the
// separate "Comments" card next to it just displayed whatever real rows
// happened to already be in the `comments` table (seeded by hand during
// earlier sessions) behind a dead "Log in to leave a comment" link that went
// nowhere. Per the user's explicit request ("FAQ with Seller er majhei
// comment and seller answer korar sujog thakbe. Comments ta delete kore
// dao." — the ability to comment and for the seller to answer should live
// inside FAQ with Seller itself; delete the separate Comments section), this
// is the one write path both a buyer's new question (parentId null) and a
// seller's reply (parentId set) go through, called directly from the
// merged-in CommentsPanel client component (src/components/CommentsPanel.tsx)
// the same way listing-edit.ts's Server Actions are already called from the
// client ListingEditForm.
//
// RLS (`comments_insert_own`, schema.sql) already only lets a caller insert
// a row with their own `auth.uid()` as author_id — that alone stops someone
// from posting *as* another user, but doesn't stop any logged-in buyer from
// posting a *reply* (a `parent_id`-set row) pretending to be the seller's
// answer, or jumping into someone else's question thread. That's enforced
// here instead, at the application layer, the same "defense in depth, never
// trust the client" pattern used by requireEditAccess() in listing-edit.ts
// and requireAdmin() elsewhere.
//
// Sep 10, 2026 follow-up: a reply is no longer seller-only. The listing's
// seller AND the original asker can both post into a question's `replies`
// (still exactly one level deep — "Can't reply to a reply" below is
// unchanged), so a thread reads as a flat, chronological back-and-forth
// ("buyer asks -> seller answers -> buyer follows up -> ...") instead of
// always exactly one seller answer. Anyone else is still refused.
export async function postComment(
  listingId: string,
  body: string,
  parentId: string | null
): Promise<{ error?: string }> {
  const text = body.trim();
  if (!text) return { error: "Write something before sending." };
  if (text.length > 2000) return { error: "That message is too long." };

  const supabase = await createClient();
  if (!supabase) return { error: "Backend isn't connected yet." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in to comment." };

  const { data: listing } = await supabase
    .from("listings")
    .select("id, seller_id, title")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing) return { error: "Listing not found." };

  let parent: { id: string; listing_id: string; parent_id: string | null; author_id: string } | null = null;
  if (parentId) {
    const { data } = await supabase
      .from("comments")
      .select("id, listing_id, parent_id, author_id")
      .eq("id", parentId)
      .maybeSingle();
    parent = data;
    if (!parent || parent.listing_id !== listingId) return { error: "That question no longer exists." };
    if (parent.parent_id) return { error: "Can't reply to a reply." };
    if (user.id !== listing.seller_id && user.id !== parent.author_id) {
      return { error: "Only the seller or the person who asked can reply here." };
    }
  }

  const { error: insertError } = await supabase.from("comments").insert({
    listing_id: listingId,
    author_id: user.id,
    parent_id: parentId,
    body: text,
  });
  if (insertError) return { error: "Couldn't post your comment. Please try again." };

  revalidatePath(`/listing/${listingId}`);
  revalidatePath("/dashboard/seller/questions");
  revalidatePath("/dashboard/buyer/comments");

  // Email whichever side of the conversation didn't just post — never the
  // poster themselves, and never when seller and asker are the same person
  // (a seller asking on their own listing, an edge case but easy to hit
  // while testing).
  const notifyUserId = !parentId
    ? listing.seller_id // brand-new question -> tell the seller
    : user.id === listing.seller_id
      ? parent!.author_id // seller replied -> tell the original asker
      : listing.seller_id; // asker followed up -> tell the seller
  if (notifyUserId !== user.id) {
    const admin = createAdminClient();
    if (admin) {
      try {
        const [emails, { data: poster }] = await Promise.all([
          getUserEmails(admin, [notifyUserId]),
          supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        ]);
        const toEmail = emails[notifyUserId];
        if (toEmail) {
          const posterName = poster?.full_name ?? "A Durqo user";
          const isNewQuestion = !parentId;
          const sellerReplying = !!parentId && user.id === listing.seller_id;
          const subject = isNewQuestion
            ? `New question on "${listing.title}"`
            : sellerReplying
              ? `Your question on "${listing.title}" has been answered`
              : `New reply on "${listing.title}"`;
          const replyHref = notifyUserId === listing.seller_id ? "/dashboard/seller/questions" : "/dashboard/buyer/comments";
          await sendEmail(
            toEmail,
            subject,
            `<p><strong>${posterName}</strong> ${isNewQuestion ? "asked a question" : "replied"} on <strong>${listing.title}</strong>:</p>
             <p style="white-space:pre-wrap">${text}</p>
             <p><a href="https://www.durqo.com${replyHref}">View on Durqo</a></p>`
          );
        }
      } catch (err) {
        // Never let a notification failure undo an already-saved comment.
        console.warn("[comments] notification email failed:", err);
      }
    }
  }

  return {};
}
