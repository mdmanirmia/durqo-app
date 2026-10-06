"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Heart,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Store,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { getWishlistCount } from "@/lib/data/wishlist.client";
import { getCartCount } from "@/lib/data/cart.client";
import { COUNTS_CHANGED_EVENT } from "@/lib/count-events";

const NAV = [
  { href: "/buy", label: "Marketplace" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/sell", label: "Sell a Business" },
  { href: "/about", label: "About" },
];

// Oct 5, 2026 ("header er design ta aro premium kora jai kina dekho"):
// visual-only premium pass. Auth, badge-count and menu logic are unchanged.
// - Logo slightly larger and tighter; nav items became soft pills with a
//   brand dot under the active section (active now also matches sub-paths).
// - A hairline divider separates navigation from account actions.
// - "Hi, {name}" became a bordered pill with an initials avatar; its dropdown
//   gained a signed-in header, icons per dashboard, and Log out moved inside
//   it (it was a separate bordered button next to the pill).
// - Wishlist/cart icon buttons are round, 40px, with a softer hover.
// - The bar gains a soft shadow once the page is scrolled. Background is
//   fully opaque (a translucent/blurred version let dark sections show
//   through while scrolling).
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string | null | undefined>(undefined); // undefined = still checking, null = logged out
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  // Sep 16, 2026 ("Drowpdown e Seller Dashboard and Buyer Dashboard diba"):
  // the "Hi, {name}" pill now opens a small dropdown so a seller who's also
  // browsing as a buyer (or vice versa) can jump straight to either
  // dashboard from any page, instead of only ever linking to /dashboard/buyer.
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  // Oct 2, 2026 ("admin email diye login korle header menu te admin
  // dashboard o thakne seller and buyer er sathe. eita only admin er
  // jonno" — the header's Buyer/Seller Dashboard dropdown should also
  // offer Admin Dashboard when signed in as an admin, visible only to
  // admins): read alongside full_name in the same profiles lookup below,
  // so no extra round trip.
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Wishlist/cart badge counts. Refetched on mount, on auth changes, and
  // whenever any component reports a wishlist/cart mutation via the shared
  // COUNTS_CHANGED_EVENT (see src/lib/count-events.ts) — WishlistButton,
  // CartButton, and the /cart page's own remove/checkout actions all fire
  // it, so the header stays in sync no matter where the change happened.
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let cancelled = false;

    async function refreshCounts(signedIn: boolean) {
      if (!signedIn) {
        if (!cancelled) {
          setWishlistCount(0);
          setCartCount(0);
        }
        return;
      }
      const [wishlist, cart] = await Promise.all([getWishlistCount(), getCartCount()]);
      if (!cancelled) {
        setWishlistCount(wishlist);
        setCartCount(cart);
      }
    }

    supabase.auth.getUser().then(({ data }) => refreshCounts(!!data.user));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      refreshCounts(!!session?.user);
    });

    function handleCountsChanged() {
      supabase!.auth.getUser().then(({ data }) => refreshCounts(!!data.user));
    }
    window.addEventListener(COUNTS_CHANGED_EVENT, handleCountsChanged);

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      window.removeEventListener(COUNTS_CHANGED_EVENT, handleCountsChanged);
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function loadName(userId: string, fallback: string) {
      const { data: profile } = await supabase!.from("profiles").select("full_name, role").eq("id", userId).single();
      if (!cancelled) {
        setName(profile?.full_name ?? fallback);
        setIsAdmin(profile?.role === "admin");
      }
    }

    if (!supabase) {
      Promise.resolve().then(() => {
        if (!cancelled) {
          setName(null);
          setIsAdmin(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (data.user) loadName(data.user.id, data.user.email ?? "Account");
      else {
        setName(null);
        setIsAdmin(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadName(session.user.id, session.user.email ?? "Account");
      else {
        setName(null);
        setIsAdmin(false);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Close the user-menu dropdown on outside click, Escape, or navigation —
  // same pattern DashboardShell's mobile section-switcher already uses.
  useEffect(() => {
    if (!userMenuOpen) return;
    function handlePointerDown(e: MouseEvent) {
      if (userMenuRef.current && userMenuRef.current.contains(e.target as Node)) return;
      setUserMenuOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [pathname]);

  // Sep 21, 2026 (mobile menu polish): the mobile dropdown already closes
  // itself on every link's own onClick, but that never fires on a browser
  // back/forward navigation — this catches that case too, same "close on
  // route change" reasoning as userMenuOpen just above. Kept as its own
  // effect (rather than folded into the one above) since eslint's
  // set-state-in-effect rule flags an effect body that calls setState more
  // than once.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogOut() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const menuItemClass =
    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-paper-sunk hover:text-ink";

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 border-b bg-paper-raised transition-[box-shadow,border-color] duration-200",
        scrolled ? "border-rule shadow-[0_2px_10px_-6px_rgba(15,23,42,0.08)]" : "border-rule/70"
      )}
    >
      {/* Fixed height lives on this row, not on <header>, so the mobile
          dropdown below can grow the header (Sep 21, 2026 fix). */}
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-baseline font-display text-[1.45rem] font-bold tracking-tight text-ink"
        >
          durqo<span className="text-brand">.</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-0.5 md:flex">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  active ? "text-ink" : "text-ink-soft hover:bg-paper-sunk hover:text-ink"
                )}
              >
                {item.label}
                {active && (
                  <span
                    className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand"
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <span className="hidden h-6 w-px bg-rule md:block" aria-hidden />

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {name ? (
            <div className="relative hidden sm:block" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                className={clsx(
                  "flex h-10 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-medium text-ink transition-colors",
                  userMenuOpen ? "border-brand-strong bg-paper-sunk" : "border-rule-strong hover:border-brand-strong"
                )}
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
                  {initials(name)}
                </span>
                <span className="max-w-[140px] truncate">{name}</span>
                <ChevronDown
                  size={14}
                  className={clsx("text-ink-faint transition-transform", userMenuOpen && "rotate-180")}
                />
              </button>
              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-rule bg-paper-raised shadow-[0_16px_40px_-12px_rgba(15,23,42,0.25)]"
                >
                  <div className="border-b border-rule px-4 py-3">
                    <p className="text-xs text-ink-faint">Signed in as</p>
                    <p className="truncate text-sm font-semibold text-ink">{name}</p>
                  </div>
                  <div className="p-1.5">
                    {isAdmin && (
                      <Link
                        href="/dashboard/admin"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        className={menuItemClass}
                      >
                        <ShieldCheck size={16} className="text-brand" />
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      href="/dashboard/buyer"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className={menuItemClass}
                    >
                      <LayoutDashboard size={16} className="text-brand" />
                      Buyer Dashboard
                    </Link>
                    <Link
                      href="/dashboard/seller"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className={menuItemClass}
                    >
                      <Store size={16} className="text-brand" />
                      Seller Dashboard
                    </Link>
                  </div>
                  <div className="border-t border-rule p-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogOut}
                      className={clsx(menuItemClass, "w-full")}
                    >
                      <LogOut size={16} className="text-ink-faint" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : name === null ? (
            <>
              <Link
                href="/login"
                className="hidden rounded-full px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-paper-sunk sm:inline-block"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="hidden rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-8px_rgba(16,185,129,0.7)] transition-colors hover:bg-brand-hover sm:inline-block"
              >
                Register
              </Link>
            </>
          ) : null}
          <Link
            href="/dashboard/buyer/wishlist"
            aria-label="Wishlist"
            className="relative grid h-10 w-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-paper-sunk hover:text-ink"
          >
            <Heart size={18} />
            {wishlistCount > 0 && (
              <span className="mono absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-strong px-1 text-[0.62rem] font-semibold leading-none text-white ring-2 ring-paper-raised">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative grid h-10 w-10 place-items-center rounded-full bg-brand text-white shadow-[0_6px_16px_-8px_rgba(16,185,129,0.7)] transition-colors hover:bg-brand-hover"
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="mono absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[0.62rem] font-semibold leading-none text-white ring-2 ring-paper-raised">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
          <button
            aria-label="Menu"
            className="grid h-10 w-10 place-items-center rounded-full border border-rule-strong text-ink md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-rule px-5 pb-4 md:hidden">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-2 py-2 text-sm font-medium text-ink-soft" onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          {name ? (
            <div className="mt-2 flex flex-col gap-2">
              <p className="px-2 text-sm font-semibold text-ink">Hi, {name}</p>
              {isAdmin && (
                <Link href="/dashboard/admin" className="rounded-full border border-rule-strong px-4 py-2 text-center text-sm font-semibold" onClick={() => setOpen(false)}>
                  Admin Dashboard
                </Link>
              )}
              <Link href="/dashboard/buyer" className="rounded-full border border-rule-strong px-4 py-2 text-center text-sm font-semibold" onClick={() => setOpen(false)}>
                Buyer Dashboard
              </Link>
              <Link href="/dashboard/seller" className="rounded-full border border-rule-strong px-4 py-2 text-center text-sm font-semibold" onClick={() => setOpen(false)}>
                Seller Dashboard
              </Link>
              <button type="button" onClick={handleLogOut} className="rounded-full bg-brand px-4 py-2 text-center text-sm font-semibold text-white">
                Log out
              </button>
            </div>
          ) : name === null ? (
            <div className="mt-2 flex gap-2">
              <Link href="/login" className="flex-1 rounded-full border border-rule-strong px-4 py-2 text-center text-sm font-semibold" onClick={() => setOpen(false)}>Log in</Link>
              <Link href="/register" className="flex-1 rounded-full bg-brand px-4 py-2 text-center text-sm font-semibold text-white" onClick={() => setOpen(false)}>Register</Link>
            </div>
          ) : null}
        </nav>
      )}
    </header>
  );
}
