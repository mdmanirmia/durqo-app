"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ArrowLeftRight } from "lucide-react";
import Container from "@/components/ui/Container";
import { COUNTS_CHANGED_EVENT } from "@/lib/count-events";
import { getSellerUnansweredCommentsCount } from "@/lib/data/comments.client";

export interface DashboardNavItem {
  href: string;
  label: string;
  badge?: number;
}

// The one nav item whose badge is a live count rather than the still-static
// placeholders on the other items (My Listings, Orders — see the seller nav
// definition in src/lib/dashboard-nav.ts) — per the Sep 10, 2026 request,
// this should always reflect how many questions are actually waiting for a
// reply, not a hardcoded number.
const SELLER_COMMENTS_HREF = "/dashboard/seller/questions";

export default function DashboardShell({
  title,
  nav,
  switchHref,
  switchLabel,
  children,
}: {
  title: string;
  nav: DashboardNavItem[];
  switchHref: string;
  switchLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hasSellerCommentsNav = nav.some((item) => item.href === SELLER_COMMENTS_HREF);
  const [commentsBadge, setCommentsBadge] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!hasSellerCommentsNav) return;
    let cancelled = false;
    async function refetch() {
      const count = await getSellerUnansweredCommentsCount();
      if (!cancelled) setCommentsBadge(count > 0 ? count : undefined);
    }
    refetch();
    window.addEventListener(COUNTS_CHANGED_EVENT, refetch);
    return () => {
      cancelled = true;
      window.removeEventListener(COUNTS_CHANGED_EVENT, refetch);
    };
    // Re-check on every dashboard navigation too, not just mount — a seller
    // clicking from "Comments" to another tab right after replying should
    // still see the badge drop.
  }, [hasSellerCommentsNav, pathname]);

  return (
    <main className="py-10">
      <Container>
        <p className="mono mb-1 text-xs uppercase tracking-wider text-ink-faint">Dashboard</p>
        <h1 className="mb-8 text-3xl">{title}</h1>

        <div className="grid gap-8 md:grid-cols-[220px_1fr]">
          <aside className="flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {nav.map((item) => {
              const active = pathname === item.href;
              const badge = item.href === SELLER_COMMENTS_HREF ? commentsBadge : item.badge;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex shrink-0 items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm font-medium",
                    active ? "bg-brand-strong text-white" : "text-ink-soft hover:bg-paper-raised"
                  )}
                >
                  {item.label}
                  {typeof badge === "number" && (
                    <span className={clsx("mono rounded-full px-1.5 py-0.5 text-[0.65rem]", active ? "bg-white/20" : "bg-brand-soft text-brand-strong")}>
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <Link href={switchHref} className="mt-3 flex shrink-0 items-center gap-2 rounded-md border border-rule-strong px-3 py-2.5 text-sm font-medium text-ink-soft hover:border-brand-strong md:mt-4">
              <ArrowLeftRight size={14} /> {switchLabel}
            </Link>
          </aside>

          <div>{children}</div>
        </div>
      </Container>
    </main>
  );
}
