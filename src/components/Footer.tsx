import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-rule bg-paper-sunk">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-7">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-display text-2xl font-semibold text-ink">
              durqo<span className="text-gold">.</span>
            </Link>
            <p className="mt-3 max-w-[32ch] text-sm text-ink-soft">
              The verified marketplace for buying and selling online businesses.
            </p>
          </div>

          <div>
            <h4 className="mono mb-3 text-xs uppercase tracking-wider text-ink-faint">Quick links</h4>
            <ul className="flex flex-col gap-2 text-sm text-ink-soft">
              <li><Link href="/buy" className="hover:text-brand-strong">How to Buy</Link></li>
              <li><Link href="/faq/buyer" className="hover:text-brand-strong">Buyer&rsquo;s FAQ</Link></li>
              <li><Link href="/sell" className="hover:text-brand-strong">How to Sell</Link></li>
              <li><Link href="/faq/seller" className="hover:text-brand-strong">Seller&rsquo;s FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-brand-strong">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mono mb-3 text-xs uppercase tracking-wider text-ink-faint">Features</h4>
            <ul className="flex flex-col gap-2 text-sm text-ink-soft">
              <li><Link href="/buy" className="hover:text-brand-strong">Buy a business</Link></li>
              <li><Link href="/sell" className="hover:text-brand-strong">Sell a business</Link></li>
              <li><Link href="/sell#valuation" className="hover:text-brand-strong">Get a free valuation</Link></li>
              <li><Link href="/affiliate" className="hover:text-brand-strong">Affiliate program</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mono mb-3 text-xs uppercase tracking-wider text-ink-faint">Categories</h4>
            <ul className="flex flex-col gap-2 text-sm text-ink-soft">
              {CATEGORIES.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href={`/buy?category=${c.id}`} className="hover:text-brand-strong">{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-6 text-xs text-ink-faint">
          <p>&copy; {new Date().getFullYear()} Durqo. All rights reserved.</p>
          <p>St. John&rsquo;s, NL, Canada</p>
        </div>
      </div>
    </footer>
  );
}
