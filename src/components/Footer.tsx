import Link from "next/link";
import { Lock, ShieldCheck, Mail } from "lucide-react";
import Container from "./ui/Container";

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return <h4 className="mono mb-4 text-xs font-semibold uppercase tracking-wider text-white/45">{children}</h4>;
}

const TRUST_BAR = [
  { icon: Lock, label: "Every deal held in escrow" },
  { icon: ShieldCheck, label: "Payments secured by Stripe" },
];

// Every href below points to a route that actually exists in this app —
// no Fees/Seller Guide/Cookie Policy links, since those pages don't exist
// yet and a footer link to nothing is worse than a shorter footer.
export default function Footer() {
  return (
    <footer className="mt-16 bg-brand-strong text-white/80">
      <div className="border-b border-white/10">
        <Container className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
            {TRUST_BAR.map(({ icon: Icon, label }) => (
              <span key={label} className="mono flex items-center gap-2 text-xs text-white/70">
                <Icon size={14} className="text-brand" />
                {label}
              </span>
            ))}
          </div>
          <Link href="/buy" className="text-xs font-semibold text-white/80 hover:text-white">
            Explore the marketplace →
          </Link>
        </Container>
      </div>

      <Container className="py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-bold tracking-tight text-white">
              DURQO<span className="text-brand">.</span>
            </Link>
            <p className="mt-3 max-w-[30ch] text-sm leading-relaxed text-white/55">
              The verified marketplace for buying and selling digital businesses.
            </p>
            <a href="mailto:support@durqo.com" className="mt-5 inline-flex items-center gap-2 text-sm text-white/65 hover:text-white">
              <Mail size={15} className="text-brand" />
              support@durqo.com
            </a>
          </div>

          <div>
            <ColumnHeading>Marketplace</ColumnHeading>
            <ul className="flex flex-col gap-2.5 text-sm text-white/65">
              <li><Link href="/buy" className="hover:text-white">Browse listings</Link></li>
              <li><Link href="/sell" className="hover:text-white">Sell a business</Link></li>
            </ul>
          </div>

          <div>
            <ColumnHeading>Company</ColumnHeading>
            <ul className="flex flex-col gap-2.5 text-sm text-white/65">
              <li><Link href="/about" className="hover:text-white">About Durqo</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>

          <div>
            <ColumnHeading>Legal</ColumnHeading>
            <ul className="flex flex-col gap-2.5 text-sm text-white/65">
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/45">
          <p>&copy; {new Date().getFullYear()} Durqo. All rights reserved.</p>
          <p>St. John&rsquo;s, NL, Canada</p>
        </div>
      </Container>
    </footer>
  );
}
