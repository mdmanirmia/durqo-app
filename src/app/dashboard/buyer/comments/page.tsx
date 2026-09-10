import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/dashboard-nav";
import { createClient } from "@/lib/supabase/server";
import { getBuyerComments } from "@/lib/data/buyer-comments.server";
import BuyerCommentReply from "@/components/BuyerCommentReply";

// Sep 10, 2026 request: "Buyer er dashboard e o comments section rakho...
// buyer kono comments korle and answer pele dashboard e dekhte pabe and
// reply korte parbe" — every question this buyer has asked, across any
// listing, plus whatever the seller replied (and any of the buyer's own
// follow-ups), all in one place, with a way to keep the conversation going
// without having to find the original listing again. Mirrors
// /dashboard/seller/questions (see that page and
// src/lib/data/seller-questions.server.ts) but from the asker's side.
export default async function BuyerCommentsPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <DashboardShell title="Buyer Dashboard" nav={BUYER_NAV} switchHref="/dashboard/seller" switchLabel="Go to Seller Dashboard">
        <p className="text-sm text-danger">Backend isn&rsquo;t connected yet.</p>
      </DashboardShell>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const questions = await getBuyerComments(user.id);

  return (
    <DashboardShell title="Buyer Dashboard" nav={BUYER_NAV} switchHref="/dashboard/seller" switchLabel="Go to Seller Dashboard">
      <h2 className="mb-1 text-xl">Comments</h2>
      <p className="mb-4 text-sm text-ink-faint">Questions you&rsquo;ve asked sellers, and their replies.</p>

      {questions.length === 0 ? (
        <p className="text-sm text-ink-faint">
          You haven&rsquo;t asked a question yet — look for &ldquo;FAQ with Seller&rdquo; on any listing page.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {questions.map((q) => (
            <div key={q.id} className="rounded-xl border border-rule bg-paper-raised p-5">
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <Link href={`/listing/${q.listingId}`} className="text-sm font-semibold text-brand-hover hover:underline">
                  {q.listingTitle}
                </Link>
                <span className="text-xs text-ink-faint">{q.createdAt}</span>
              </div>
              <p className="mb-3 text-sm text-ink-soft">{q.body}</p>

              {q.replies.length === 0 ? (
                <p className="text-xs text-ink-faint">Waiting for the seller to reply.</p>
              ) : (
                q.replies.map((r, i) => (
                  <div key={i} className="mb-3 ml-4 border-l-2 border-rule pl-4">
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-ink">
                        {r.author}
                        {r.isSeller && <span className="font-normal text-ink-faint"> (Seller)</span>}
                      </span>
                      <span className="text-xs text-ink-faint">{r.createdAt}</span>
                    </div>
                    <p className="text-sm text-ink-soft">{r.body}</p>
                  </div>
                ))
              )}

              {/* Only worth showing once the seller has actually said
                  something back — replying before that just means editing
                  the original question, which isn't supported here. */}
              {q.replies.some((r) => r.isSeller) && (
                <div className="ml-4">
                  <BuyerCommentReply questionId={q.id} listingId={q.listingId} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
