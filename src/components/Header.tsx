"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Heart, ShoppingCart, Menu, X, User, ChevronDown } from "lucide-react";
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
      const { data: profile } = await supabase!.from("profiles").select("full_name").eq("id", userId).single();
      if (!cancelled) setName(profile?.full_name ?? fallback);
    }

    if (!supabase) {
      Promise.resolve().then(() => {
        if (!cancelled) setName(null);
      });
      return () => {
        cancelled = true;
      };
    }

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (data.user) loadName(data.user.id, data.user.email ?? "Account");
      else setName(null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadName(session.user.id, session.user.email ?? "Account");
      else setName(null);
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

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper-raised/95 backdrop-blur">
      {/* Sep 21, 2026 fix ("mobile theke view korle menu er likha gulo
          dekhaibe jaina" — on mobile, the menu's text overlapped the page
          below it): the fixed height used to live on <header> itself. That
          capped the WHOLE header — including the mobile dropdown <nav>
          below this row, a sibling further down — at exactly 72px, so the
          dropdown's actual content just overflowed straight past that box
          and visually sat on top of whatever came right after the header in
          the page (the hero section), rather than pushing it down. Moving
          the fixed height onto just this top bar row lets <header> grow to
          fit the dropdown when it's open, same as it already grows for the
          desktop-vs-mobile row wrapping at narrower widths. */}
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-baseline gap-1 font-display text-xl font-bold text-ink shrink-0">
          durqo<span className="text-brand">.</span>
        </Link>

        <nav className="ml-auto hidden gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-md px-3 py-2 text-sm font-medium transition",
                  active ? "text-ink" : "text-ink-soft hover:text-ink"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {name ? (
            <>
              <div className="relative hidden sm:block" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-ink-soft hover:text-ink"
                >
                  <User size={15} />
                  Hi, {name}
                  <ChevronDown size={14} className={clsx("transition-transform", userMenuOpen && "rotate-180")} />
                </button>
                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-rule bg-paper-raised py-1.5 shadow-lg"
                  >
                    <Link
                      href="/dashboard/buyer"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-ink-soft hover:bg-paper-sunk hover:text-ink"
                    >
                      Buyer Dashboard
                    </Link>
                    <Link
                      href="/dashboard/seller"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-ink-soft hover:bg-paper-sunk hover:text-ink"
                    >
                      Seller Dashboard
                    </Link>
                  </div>
                )}
              </div>
              <button type="button" onClick={handleLogOut} className="hidden rounded-md border border-rule-strong px-4 py-2 text-sm font-semibold text-ink hover:border-brand-strong sm:inline-block">
                Log out
              </button>
            </>
          ) : name === null ? (
            <>
              <Link href="/login" className="hidden rounded-md border border-rule-strong px-4 py-2 text-sm font-semibold text-ink hover:border-brand-strong sm:inline-block">
                Log in
              </Link>
              <Link href="/register" className="hidden rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover sm:inline-block">
                Register
              </Link>
            </>
          ) : null}
          <Link href="/dashboard/buyer/wishlist" aria-label="Wishlist" className="relative grid h-9 w-9 place-items-center rounded-md border border-rule-strong text-ink-soft hover:border-brand-strong hover:text-ink">
            <Heart size={17} />
            {wishlistCount > 0 && (
              <span className="mono absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-strong px-1 text-[0.62rem] font-semibold leading-none text-white ring-2 ring-paper-raised">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>
          <Link href="/cart" aria-label="Cart" className="relative grid h-9 w-9 place-items-center rounded-md bg-brand text-white hover:bg-brand-hover">
            <ShoppingCart size={17} />
            {cartCount > 0 && (
              <span className="mono absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[0.62rem] font-semibold leading-none text-white ring-2 ring-paper-raised">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
          <button
            aria-label="Menu"
            className="grid h-9 w-9 place-items-center rounded-md border border-rule-strong text-ink md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={17} /> : <Menu size={17} />}
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
