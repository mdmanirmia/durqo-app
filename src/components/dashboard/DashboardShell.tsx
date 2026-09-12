"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  ArrowLeftRight,
  ChevronDown,
  MoreHorizontal,
  Home,
  ClipboardList,
  Heart,
  MessageCircle,
  HelpCircle,
  User,
  PlusCircle,
  ShieldCheck,
  Wallet,
  Tag,
  Users,
} from "lucide-react";
import Container from "@/components/ui/Container";
import { COUNTS_CHANGED_EVENT } from "@/lib/count-events";
import { getSellerUnansweredCommentsCount } from "@/lib/data/comments.client";
import { createClient } from "@/lib/supabase/client";
import { getUnreadMessageCount } from "@/lib/data/messages.client";
import { getUnreadTransferMessagesCount } from "@/lib/data/transfer-messages.client";
import { playNotificationSound } from "@/lib/notification-sound";

// Nav items are defined in src/lib/dashboard-nav.ts, which several
// dashboard pages import from Server Components — a lucide-react icon is a
// function/component reference, and Next.js refuses to pass functions as
// props from a Server Component to a Client Component like this one (build
// error: "Functions cannot be passed directly to Client Components"). So
// dashboard-nav.ts stores a plain string key instead, and only this client
// file (which is allowed to hold component references) maps it to the
// actual icon.
const ICONS = {
  home: Home,
  clipboardList: ClipboardList,
  heart: Heart,
  messageCircle: MessageCircle,
  helpCircle: HelpCircle,
  user: User,
  plusCircle: PlusCircle,
  shieldCheck: ShieldCheck,
  wallet: Wallet,
  tag: Tag,
  users: Users,
  arrowLeftRight: ArrowLeftRight,
} as const;

export type DashboardIconName = keyof typeof ICONS;

export interface DashboardNavItem {
  href: string;
  label: string;
  badge?: number;
  icon?: DashboardIconName;
}

// Looking icon components up in a variable and rendering that variable as a
// JSX tag (`const Icon = ICONS[name]; <Icon />`) trips the
// react-hooks/static-components lint rule, which assumes any such pattern
// inside a render body is a component being freshly created on every render
// (resetting its state) — untrue here since ICONS is a fixed, stable map,
// but the rule can't tell the difference. Routing every icon through this
// one statically-declared component instead sidesteps the false positive:
// NavIcon itself never changes identity, no matter how many different icons
// it's asked to render.
function NavIcon({ name, size, className }: { name?: DashboardIconName; size: number; className?: string }) {
  if (!name) return null;
  const Icon = ICONS[name];
  return <Icon size={size} className={className} />;
}

// The one nav item whose badge is a live count rather than the still-static
// placeholders on the other items (My Listings, Orders — see the seller nav
// definition in src/lib/dashboard-nav.ts) — per the Sep 10, 2026 request,
// this should always reflect how many questions are actually waiting for a
// reply, not a hardcoded number.
const SELLER_COMMENTS_HREF = "/dashboard/seller/questions";

// Two more live badges (2026-09-12 request: real-time messages + unread
// counts + a notification sound, for both the general Messages inbox and a
// Transfer Room's Deal Messages). Both buyer and seller nav have their own
// href per feature, so each is checked as a set of two rather than one
// constant like SELLER_COMMENTS_HREF above (which only ever exists on the
// seller side).
const MESSAGES_HREFS = ["/dashboard/buyer/messages", "/dashboard/seller/messages"];
const TRANSFERS_HREFS = ["/dashboard/buyer/transfers", "/dashboard/seller/transfers"];

// Mobile-width redesign (Sep 11, 2026): the desktop sidebar below is
// untouched. Below md, it's replaced by two pieces that read the same `nav`
// array — a section-switcher dropdown under the title (so every nav item
// stays reachable without the old horizontal-scroll pill row overflowing
// off-screen) and a fixed bottom tab bar showing the first 3 items plus a
// "More" button that opens the same dropdown. Nothing here is per-role: the
// seller/buyer/admin dashboards all render this one shell, so this one file
// is what fixed mobile nav across all three at once.
const MOBILE_BOTTOM_SLOTS = 3;

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
  const hasMessagesNav = nav.some((item) => MESSAGES_HREFS.includes(item.href));
  const hasTransfersNav = nav.some((item) => TRANSFERS_HREFS.includes(item.href));
  const [commentsBadge, setCommentsBadge] = useState<number | undefined>(undefined);
  const [messagesBadge, setMessagesBadge] = useState<number | undefined>(undefined);
  const [transfersBadge, setTransfersBadge] = useState<number | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

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

  // Who's signed in — needed to scope both realtime subscriptions below to
  // this user's own rows. Resolved once; both effects wait for it.
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setUserId(data.user?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Live "Messages" badge + notification sound (2026-09-12 request). This
  // is the ONE place the sound plays for the general Messages inbox — even
  // on the Messages page itself, MessagesPanel only updates its own
  // conversation list/thread from its realtime subscription and never
  // plays a sound itself, since DashboardShell is mounted underneath it
  // there too and would otherwise double it up. Requires `messages` to be
  // in the `supabase_realtime` publication (migration 040).
  useEffect(() => {
    if (!hasMessagesNav || !userId) return;
    let cancelled = false;
    async function refetch() {
      const count = await getUnreadMessageCount();
      if (!cancelled) setMessagesBadge(count > 0 ? count : undefined);
    }
    refetch();
    const supabase = createClient();
    if (!supabase) return;
    const channel = supabase
      .channel(`dashboard-messages-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${userId}` },
        () => {
          playNotificationSound();
          refetch();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `recipient_id=eq.${userId}` },
        refetch
      )
      .subscribe();
    window.addEventListener(COUNTS_CHANGED_EVENT, refetch);
    return () => {
      cancelled = true;
      window.removeEventListener(COUNTS_CHANGED_EVENT, refetch);
      supabase.removeChannel(channel);
    };
  }, [hasMessagesNav, userId, pathname]);

  // Live "Asset Transfers" badge + notification sound for Deal Messages.
  // Realtime can't filter on a joined column (a message row only carries
  // room_id, not the room's buyer_id/seller_id), so this subscribes to the
  // whole table with no `filter` — asset_transfer_messages_select's RLS
  // policy is what actually restricts delivery to rooms this user is a
  // party to, the same way Realtime authorizes every other subscription in
  // this app. TransferRoomView.tsx runs its own separate subscription (for
  // the open room's own Deal Messages panel) and neither one double-plays
  // the other's sound: this one only fires on pages other than that room's
  // own (TransferRoomView isn't wrapped in DashboardShell), and both check
  // sender_id against `userId` before playing anything.
  useEffect(() => {
    if (!hasTransfersNav || !userId) return;
    let cancelled = false;
    async function refetch() {
      const count = await getUnreadTransferMessagesCount();
      if (!cancelled) setTransfersBadge(count > 0 ? count : undefined);
    }
    refetch();
    const supabase = createClient();
    if (!supabase) return;
    const channel = supabase
      .channel(`dashboard-transfer-messages-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "asset_transfer_messages" },
        (payload) => {
          const row = payload.new as { sender_id?: string };
          if (row.sender_id && row.sender_id !== userId) playNotificationSound();
          refetch();
        }
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "asset_transfer_messages" }, refetch)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [hasTransfersNav, userId, pathname]);

  // No separate "close on route change" effect is needed: every dashboard
  // page renders its own <DashboardShell> directly rather than sharing one
  // through a layout, so navigating to another page unmounts this instance
  // entirely — menuOpen starts back at false on the next page regardless.

  // Close on outside click / Escape. The menu itself is a fixed bottom sheet
  // rather than something anchored under the switcher button, so this needs
  // to work regardless of scroll position (it also opens from the bottom
  // tab bar's "More" button, far from the switcher).
  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(e: MouseEvent) {
      const sheet = document.getElementById("dashboard-mobile-sheet");
      if (sheet && sheet.contains(e.target as Node)) return;
      if (switcherRef.current && switcherRef.current.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  function badgeFor(item: DashboardNavItem) {
    if (item.href === SELLER_COMMENTS_HREF) return commentsBadge;
    if (MESSAGES_HREFS.includes(item.href)) return messagesBadge;
    if (TRANSFERS_HREFS.includes(item.href)) return transfersBadge;
    return item.badge;
  }

  const activeItem = nav.find((item) => item.href === pathname);
  const bottomItems = nav.slice(0, MOBILE_BOTTOM_SLOTS);
  const hasMore = nav.length > bottomItems.length;

  return (
    <main className="py-6 pb-24 md:py-10 md:pb-10">
      <Container>
        <p className="mono mb-1 text-xs uppercase tracking-wider text-ink-faint">Dashboard</p>
        <h1 className="mb-4 text-3xl md:mb-8">{title}</h1>

        {/* Mobile-only section switcher — replaces the pill row below md */}
        <div className="relative mb-6 md:hidden" ref={switcherRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-rule-strong bg-paper px-4 py-3 text-left text-sm font-semibold text-ink"
          >
            <span className="flex items-center gap-2">
              <NavIcon name={activeItem?.icon} size={16} className="text-ink-faint" />
              {activeItem?.label ?? title}
            </span>
            <ChevronDown size={16} className={clsx("shrink-0 text-ink-faint transition-transform", menuOpen && "rotate-180")} />
          </button>
        </div>

        <div className="grid gap-8 md:grid-cols-[220px_1fr]">
          <aside className="hidden md:flex md:flex-col md:gap-1">
            {nav.map((item) => {
              const active = pathname === item.href;
              const badge = badgeFor(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex shrink-0 items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm font-medium",
                    active ? "bg-brand-strong text-white" : "text-ink-soft hover:bg-paper-raised"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <NavIcon name={item.icon} size={15} />
                    {item.label}
                  </span>
                  {typeof badge === "number" && (
                    <span className={clsx("mono rounded-full px-1.5 py-0.5 text-[0.65rem]", active ? "bg-white/20" : "bg-brand-soft text-brand-strong")}>
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <Link href={switchHref} className="mt-4 flex shrink-0 items-center gap-2 rounded-md border border-rule-strong px-3 py-2.5 text-sm font-medium text-ink-soft hover:border-brand-strong">
              <ArrowLeftRight size={14} /> {switchLabel}
            </Link>
          </aside>

          {/* min-w-0: without it, this grid item's default min-width:auto
              lets any unbreakable content deep inside (e.g. a long unbroken
              listing title, before its own truncate/min-w-0 chain fully
              resolves) force this column — and with it the whole page —
              wider than the viewport, since a grid item's box can grow to
              fit its content's min-content by default. Site owner report,
              Sep 11 2026: exactly this, on a listing with a long unbroken
              title on /dashboard/seller. */}
          <div className="min-w-0">{children}</div>
        </div>
      </Container>

      {/* Mobile-only bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-rule bg-paper md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {bottomItems.map((item) => {
          const active = pathname === item.href;
          const badge = badgeFor(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx("flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[0.65rem] font-medium", active ? "text-brand-strong" : "text-ink-faint")}
            >
              <span className="relative inline-flex">
                <NavIcon name={item.icon} size={20} />
                {typeof badge === "number" && (
                  <span className="mono absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-strong px-1 text-[0.6rem] font-bold text-white">
                    {badge}
                  </span>
                )}
              </span>
              <span className="max-w-[4.5rem] truncate">{item.label}</span>
            </Link>
          );
        })}
        {hasMore && (
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            className={clsx("flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[0.65rem] font-medium", menuOpen ? "text-brand-strong" : "text-ink-faint")}
          >
            <MoreHorizontal size={20} />
            <span>More</span>
          </button>
        )}
      </nav>

      {/* Mobile-only backdrop + bottom sheet — the full nav list, opened by
          either the switcher button or the tab bar's "More" button. Anchored
          to the viewport (not the switcher) so it works no matter which of
          the two triggered it or how far the page has scrolled. */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/30" aria-hidden onClick={() => setMenuOpen(false)} />
          <div
            id="dashboard-mobile-sheet"
            role="menu"
            className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-rule bg-paper pb-[env(safe-area-inset-bottom)] shadow-2xl"
          >
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-rule-strong" />
            <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">{title}</p>
            {nav.map((item) => {
              const active = item.href === pathname;
              const badge = badgeFor(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={clsx(
                    "flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium",
                    active ? "bg-brand-soft text-brand-strong" : "text-ink-soft"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <NavIcon name={item.icon} size={17} />
                    {item.label}
                  </span>
                  {typeof badge === "number" && (
                    <span className={clsx("mono rounded-full px-1.5 py-0.5 text-[0.65rem]", active ? "bg-white text-brand-strong" : "bg-brand-soft text-brand-strong")}>
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <Link
              href={switchHref}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 border-t border-rule px-4 py-3 text-sm font-medium text-ink-soft"
            >
              <ArrowLeftRight size={16} /> {switchLabel}
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
