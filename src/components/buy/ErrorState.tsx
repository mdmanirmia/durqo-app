"use client";

import { useRouter } from "next/navigation";

// Section 15's error state — shown only when the query itself failed
// (Supabase error, unexpected exception). Never surfaces the underlying
// error message, a stack trace, or any query details.
export default function ErrorState() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-rule-strong py-16 text-center">
      <div>
        <h3 className="text-base font-semibold text-ink">We couldn&apos;t load the marketplace.</h3>
        <p className="mt-1.5 text-sm text-ink-soft">Please try again in a moment.</p>
      </div>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
      >
        Try again
      </button>
    </div>
  );
}
