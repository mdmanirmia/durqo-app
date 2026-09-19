import Link from "next/link";
import { Lock } from "lucide-react";

// 2026-09-19 request ("Business Overview porjonto account e log in kora
// chara dekhte parbe... Full listing dekhte hole log in korte hobe" — a
// visitor can see up through the Quick Statistics + Overview section
// without an account; everything past that on the public listing page is
// gated behind login/register, to drive marketplace signups): a
// Flippa-style blur-and-overlay gate. The real content is still rendered
// server-side (so search engines still index the full listing — nothing
// here is hidden from crawlers, only visually blurred and made
// non-interactive for a signed-out human visitor), it's just visually
// blurred with a floating "sign up to see this" card on top for anyone
// without a session.
//
// A signed-in visitor (`locked={false}`) gets the children back completely
// unwrapped — no extra DOM, no risk of disturbing the sidebar's already
// carefully-tuned sticky/overflow layout (see the listing page's own
// comments on that) for the common case.
export default function GatedContent({
  locked,
  next,
  heading,
  body,
  gapClassName = "gap-6",
  children,
}: {
  locked: boolean;
  /** Where to send the visitor back to once they've logged in or registered
   *  — a root-relative path only (e.g. `/listing/some-business`), validated
   *  again on the receiving end (see src/lib/safe-redirect.ts). */
  next: string;
  heading: string;
  body: string;
  /** Matches the vertical gap of whichever flex column this gate sits
   *  inside, so the blurred stack of cards keeps the same rhythm as the
   *  unlocked layout (main content uses `gap-6`, the sidebar `gap-4`). */
  gapClassName?: string;
  children: React.ReactNode;
}) {
  if (!locked) return <>{children}</>;

  const nextParam = encodeURIComponent(next);

  return (
    <div className="relative">
      <div aria-hidden className={`pointer-events-none flex select-none flex-col ${gapClassName} blur-sm`}>
        {children}
      </div>
      <div className="absolute inset-0 flex justify-center px-4 pt-6 sm:pt-10">
        <div className="h-max w-full max-w-sm rounded-2xl border border-rule-strong bg-paper-raised p-6 text-center shadow-[0_16px_32px_-8px_rgba(15,23,42,0.18)]">
          <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand-hover">
            <Lock size={18} />
          </span>
          <h3 className="mb-1.5 text-base font-semibold text-ink">{heading}</h3>
          <p className="mb-4 text-sm leading-relaxed text-ink-soft">{body}</p>
          <Link
            href={`/register?next=${nextParam}`}
            className="mb-2 block rounded-md bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Register Free
          </Link>
          <Link href={`/login?next=${nextParam}`} className="text-xs font-medium text-ink-faint hover:text-ink">
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
