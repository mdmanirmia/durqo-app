import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SELLER_NAV } from "@/lib/dashboard-nav";
import { createClient } from "@/lib/supabase/server";
import { getSellerQuestions } from "@/lib/data/seller-questions.server";
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
  const unanswered = questions.filter((q) => !q.reply);
  const answered = questions.filter((q) => q.reply);

  return (
    <DashboardShell title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <h2 className="mb-1 text-xl">Questions</h2>
      <p className="mb-4 text-sm text-ink-faint">
        {unanswered.length === 0
          ? "You're all caught up — no open questions."
          : `${unanswered.length} question${unanswered.length === 1 ? "" : "s"} waiting for your reply.`}
      </p>

      {questions.length === 0 ? (
        <p className="text-sm text-ink-faint">
          No questions yet — buyers can ask questions on your listings under &ldquo;FAQ with Seller.&rdquo;
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {unanswered.map((q) => (
            <div key={q.id} className="rounded-xl border border-rule bg-paper-raised p-5">
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <Link href={`/listing/${q.listingId}`} className="text-sm font-semibold text-brand-hover hover:underline">
                  {q.listingTitle}
                </Link>
                <span className="text-xs text-ink-faint">{q.createdAt}</span>
              </div>
              <div className="mb-2 text-sm font-semibold text-ink">{q.author}</div>
              <p className="mb-3 text-sm text-ink-soft">{q.body}</p>
              <SellerQuestionReply questionId={q.id} listingId={q.listingId} />
            </div>
          ))}

          {answered.length > 0 && (
            <>
              <h3 className="mt-2 text-sm font-semibold text-ink-faint">Already answered</h3>
              {answered.map((q) => (
                <div key={q.id} className="rounded-xl border border-rule bg-paper-raised p-5 opacity-80">
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <Link href={`/listing/${q.listingId}`} className="text-sm font-semibold text-brand-hover hover:underline">
                      {q.listingTitle}
                    </Link>
                    <span className="text-xs text-ink-faint">{q.createdAt}</span>
                  </div>
                  <div className="mb-2 text-sm font-semibold text-ink">{q.author}</div>
                  <p className="mb-3 text-sm text-ink-soft">{q.body}</p>
                  {q.reply && (
                    <div className="ml-4 border-l-2 border-rule pl-4">
                      <div className="mb-1 flex items-baseline justify-between">
                        <span className="text-sm font-semibold text-ink">{q.reply.author}</span>
                        <span className="text-xs text-ink-faint">{q.reply.createdAt}</span>
                      </div>
                      <p className="text-sm text-ink-soft">{q.reply.body}</p>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
