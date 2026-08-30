import Link from "next/link";
import { Lock, ShieldCheck, Mail, ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mono mb-4 flex items-center gap-2 text-xs uppercase tracking-wider text-white/45">
      <span className="h-1.5 w-1.5 rounded-sm bg-brand" />
      {children}
    </h4>
  );
}

const TRUST_BAR = [
  { icon: Lock, label: "Every deal held in escrow" },
  { icon: ShieldCheck, label: "Payments secured by Stripe" },
];

export default function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden bg-gradient-to-b from-brand-strong to-[#0b1030] text-white/80">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand/10 blur-[110px]" />
      <div aria-hidden className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-brand-strong/20 blur-[100px]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
      />

      {/* trust bar */}
      <div className="relative border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-7">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
            {TRUST_BAR.map(({ icon: Icon, label }) => (
              <span key={label} className="mono flex items-center gap-2 text-xs text-white/70">
                <Icon size={14} className="text-brand" />
                {label}
              </span>
            ))}
          </div>
          <Link href="/buy" className="group inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 transition hover:text-white">
            Explore the marketplace
            <ArrowUpRight size={13} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-7">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="font-display text-2xl font-bold tracking-tight text-white">
              durqo<span className="text-brand">.</span>
            </Link>
            <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-white/55">
              The verified marketplace for buying and selling online businesses — every listing checked, every deal escrowed.
            </p>
            <a href="mailto:support@durqo.com" className="mt-5 inline-flex items-center gap-2 text-sm text-white/65 transition hover:text-white">
              <Mail size={15} className="text-brand" />
              support@durqo.com
            </a>
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
