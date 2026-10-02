import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SELLER_NAV } from "@/lib/dashboard-nav";
import { createClient } from "@/lib/supabase/server";
import { getSellerQuestions } from "@/lib/data/seller-questions.server";
import { HelpCircle } from "lucide-react";
import SellerQuestionReply from "@/components/SellerQuestionReply";

// The "seller er dashboard e notification jabe" half of the Sep 9, 2026
// FAQ/Comments merge — see src/components/CommentsPanel.tsx (the listing
// page's own live Q&A feed) and src/lib/actions/comments.ts (the shared
// postComment() Server Action both this page and that panel call). A new
// question also emails the seller (same file); this page is where they
// actually come to answer it.
export default async function SellerQuestionsPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <DashboardShell title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
        <p className="text-sm text-danger">Backend isn&rsquo;t connected yet.</p>
      </DashboardShell>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const questions = await getSellerQuestions(user.id);
  const unanswered = questions.filter((q) => !q.hasSellerReply);
  const answered = questions.filter((q) => q.hasSellerReply);

  return (
    <DashboardShell title="Seller Dashboard" icon="helpCircle" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <div className="mb-1 flex items-center gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-hover">
          <HelpCircle size={15} />
        </div>
        <h2 className="text-xl">Comments</h2>
      </div>
      <p className="mb-4 text-sm text-ink-faint">
        {unanswered.length === 0
          ? "You're all caught up - no open questions."
          : `${unanswered.length} question${unanswered.length === 1 ? "" : "s"} waiting for your reply.`}
      </p>

      {questions.length === 0 ? (
        <p className="text-sm text-ink-faint">
          No questions yet - buyers can ask questions on your listings under &ldquo;Comments.&rdquo;
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {unanswered.map((q) => (
            <div key={q.id} className="rounded-2xl border border-rule bg-paper-raised p-5 shadow-[var(--shadow-card)]">
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <Link href={`/listing/${q.listingSlug}`} className="text-sm font-semibold text-brand-hover hover:underline">
                  {q.listingTitle}
                </Link>
                <span className="text-xs text-ink-faint">{q.createdAt}</span>
              </div>
              <div className="mb-2 text-sm font-semibold text-ink">{q.author}</div>
              <p className="mb-3 text-sm text-ink-soft">{q.body}</p>
              {/* A buyer can follow up on their own question before the seller
                  ever answers it (postComment() allows the original asker to
                  reply too, Sep 10, 2026) — show those here so an "unanswered"
                  question with extra buyer context isn't silently hidden. */}
              {q.replies.map((r, i) => (
                <div key={i} className="mb-3 ml-4 border-l-2 border-rule pl-4">
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-ink">{r.author}</span>
                    <span className="text-xs text-ink-faint">{r.createdAt}</span>
                  </div>
                  <p className="text-sm text-ink-soft">{r.body}</p>
                </div>
              ))}
              <SellerQuestionReply questionId={q.id} listingId={q.listingId} />
            </div>
          ))}

          {answered.length > 0 && (
            <>
              <h3 className="mt-2 text-sm font-semibold text-ink-faint">Already answered</h3>
              {answered.map((q) => (
                <div key={q.id} className="rounded-2xl border border-rule bg-paper-raised p-5 shadow-[var(--shadow-card)] opacity-80">
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <Link href={`/listing/${q.listingSlug}`} className="text-sm font-semibold text-brand-hover hover:underline">
                      {q.listingTitle}
                    </Link>
                    <span className="text-xs text-ink-faint">{q.createdAt}</span>
                  </div>
                  <div className="mb-2 text-sm font-semibold text-ink">{q.author}</div>
                  <p className="mb-3 text-sm text-ink-soft">{q.body}</p>
                  {/* Sep 10, 2026: the buyer can keep replying after being
                      answered, so this is the full flat thread (chronological),
                      not just the one seller reply it used to always be. */}
                  {q.replies.map((r, i) => (
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
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
