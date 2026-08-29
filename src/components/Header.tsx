"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, ShoppingCart, Menu, X } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/buy", label: "Buy" },
  { href: "/sell", label: "Sell" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper-raised/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-7 px-5 py-4 sm:px-7">
        <Link href="/" className="flex items-baseline gap-1 font-display text-2xl font-semibold text-ink shrink-0">
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
                  "rounded-full border-b-2 px-3 py-2 text-sm font-medium transition",
                  active ? "border-brand text-ink" : "border-transparent text-ink-soft hover:text-ink"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link href="/dashboard/admin" className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink-faint hover:text-ink sm:inline-block">
            Admin
          </Link>
          <Link href="/login" className="hidden rounded-full border border-rule-strong px-4 py-2 text-sm font-semibold text-ink hover:border-brand-strong sm:inline-block">
            Log in
          </Link>
          <Link href="/register" className="hidden rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 sm:inline-block">
            Register
          </Link>
          <Link href="/dashboard/buyer/wishlist" aria-label="Wishlist" className="grid h-9 w-9 place-items-center rounded-full border border-rule-strong text-ink-soft hover:border-brand-strong hover:text-ink">
            <Heart size={17} />
          </Link>
          <Link href="/cart" aria-label="Cart" className="grid h-9 w-9 place-items-center rounded-full bg-brand text-white hover:bg-brand/90">
            <ShoppingCart size={17} />
          </Link>
          <button
            aria-label="Menu"
            className="grid h-9 w-9 place-items-center rounded-full border border-rule-strong text-ink md:hidden"
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
          <div className="mt-2 flex gap-2">
            <Link href="/login" className="flex-1 rounded-full border border-rule-strong px-4 py-2 text-center text-sm font-semibold">Log in</Link>
            <Link href="/register" className="flex-1 rounded-full bg-brand px-4 py-2 text-center text-sm font-semibold text-white">Register</Link>
          </div>
          <Link href="/dashboard/admin" className="mt-2 block px-2 py-1 text-center text-xs font-medium text-ink-faint" onClick={() => setOpen(false)}>
            Admin
          </Link>
        </nav>
      )}
    </header>
  );
}
