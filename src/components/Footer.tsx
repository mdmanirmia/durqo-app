import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mono mb-4 flex items-center gap-2 text-xs uppercase tracking-wider text-white/50">
      <span className="h-1.5 w-1.5 rounded-sm bg-brand" />
      {children}
    </h4>
  );
}

export default function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden bg-gradient-to-b from-brand-strong to-[#0b1030] text-white/80">
      <div aria-hidden className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand/10 blur-[110px]" />
      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-7">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-display text-2xl font-semibold text-white">
              durqo<span className="text-brand">.</span>
            </Link>
            <p className="mt-3 max-w-[32ch] text-sm text-white/55">
              The verified marketplace for buying and selling online businesses.
            </p>
          </div>

          <div>
            <ColumnHeading>Quick links</ColumnHeading>
            <ul className="flex flex-col gap-2.5 text-sm text-white/65">
              <li><Link href="/buy" className="transition hover:text-white">How to Buy</Link></li>
              <li><Link href="/faq/buyer" className="transition hover:text-white">Buyer&rsquo;s FAQ</Link></li>
              <li><Link href="/sell" className="transition hover:text-white">How to Sell</Link></li>
              <li><Link href="/faq/seller" className="transition hover:text-white">Seller&rsquo;s FAQ</Link></li>
              <li><Link href="/contact" className="transition hover:text-white">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <ColumnHeading>Features</ColumnHeading>
            <ul className="flex flex-col gap-2.5 text-sm text-white/65">
              <li><Link href="/buy" className="transition hover:text-white">Buy a business</Link></li>
              <li><Link href="/sell" className="transition hover:text-white">Sell a business</Link></li>
              <li><Link href="/sell#valuation" className="transition hover:text-white">Get a free valuation</Link></li>
              <li><Link href="/affiliate" className="transition hover:text-white">Affiliate program</Link></li>
            </ul>
          </div>

          <div>
            <ColumnHeading>Categories</ColumnHeading>
            <ul className="flex flex-col gap-2.5 text-sm text-white/65">
              {CATEGORIES.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href={`/buy?category=${c.id}`} className="transition hover:text-white">{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/45">
          <p>&copy; {new Date().getFullYear()} Durqo. All rights reserved.</p>
          <p>St. John&rsquo;s, NL, Canada</p>
        </div>
      </div>
    </footer>
  );
}
