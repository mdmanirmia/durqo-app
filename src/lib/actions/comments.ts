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
// answer. That's enforced here instead, at the application layer, the same
// "defense in depth, never trust the client" pattern used by
// requireEditAccess() in listing-edit.ts and requireAdmin() elsewhere.
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

  if (parentId) {
    // A reply is the seller answering a buyer's question — restricted to
    // the listing's own seller only (no admin override here: unlike the
    // admin listing-edit form, there's no admin UI for this yet, and
    // impersonating a seller's answer isn't something to add casually).
    if (user.id !== listing.seller_id) {
      return { error: "Only the seller can reply to a question." };
    }
    const { data: parent } = await supabase
      .from("comments")
      .select("id, listing_id, parent_id")
      .eq("id", parentId)
      .maybeSingle();
    if (!parent || parent.listing_id !== listingId) return { error: "That question no longer exists." };
    if (parent.parent_id) return { error: "Can't reply to a reply." };
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

  // Notify the seller only for a brand-new question, not their own reply,
  // and not when a seller happens to be commenting on their own listing.
  if (!parentId && user.id !== listing.seller_id) {
    const admin = createAdminClient();
    if (admin) {
      try {
        const [emails, { data: asker }] = await Promise.all([
          getUserEmails(admin, [listing.seller_id]),
          supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        ]);
        const sellerEmail = emails[listing.seller_id];
        if (sellerEmail) {
          await sendEmail(
            sellerEmail,
            `New question on "${listing.title}"`,
            `<p><strong>${asker?.full_name ?? "A buyer"}</strong> asked a question on your listing <strong>${listing.title}</strong>:</p>
             <p style="white-space:pre-wrap">${text}</p>
             <p><a href="https://www.durqo.com/dashboard/seller/questions">Reply on Durqo</a></p>`
          );
        }
      } catch (err) {
        // Never let a notification failure undo an already-saved comment.
        console.warn("[comments] seller notification email failed:", err);
      }
    }
  }

  return {};
}
