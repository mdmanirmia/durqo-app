"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eye, LifeBuoy, Mail } from "lucide-react";
import Container from "./ui/Container";
import { FacebookIcon, InstagramIcon } from "./icons/SocialIcons";

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return <h4 className="mono mb-4 text-xs font-semibold uppercase tracking-wider text-white/45">{children}</h4>;
}

// Sep 6, 2026: "Every deal held in escrow" / "Payments secured by Stripe"
// were removed — Stripe Checkout currently runs on test-mode keys only (see
// build-plan-and-decisions.md, Stripe Checkout + Payments/Escrow sections),
// so neither claim describes a fully live, real-money service yet. Replaced
// with two claims that are true today: every listing goes through Durqo's
// real review process, and support is available across the whole deal.
const TRUST_BAR = [
  { icon: Eye, label: "Transparent deal process" },
  { icon: LifeBuoy, label: "Support from listing to transfer" },
];

// Every href below points to a route that actually exists in this app —
// no Fees/Seller Guide/Cookie Policy links, since those pages don't exist
// yet and a footer link to nothing is worse than a shorter footer.
//
// Sep 11, 2026: added a "Resources" column linking to the 5 new guide/FAQ
// pages (How to Buy, How to Sell, Buyer FAQ, Seller FAQ, Payment &
// Withdrawal — see those pages' own top-of-file comments for the accuracy
// trail behind their content). The desktop grid widened from 4 to 5
// columns to fit it; the brand column still spans 2 of 2 on mobile so the
// existing mobile wrap behavior is unchanged, just one row longer.
export default function Footer() {
  // Sep 2026 About-page redesign: the About page's own Final CTA already
  // closes with the same "browse marketplace / sell a business" pair this
  // strip's "Explore the marketplace" link and its two trust claims lead
  // into — right above this very footer, so the strip would be a redundant,
  // slightly-broader-than-intended claim sandwiched between two CTAs.
  // Hiding it only on /about (not touching it anywhere else on the site)
  // keeps this a page-specific presentation choice rather than a sitewide
  // copy change — this is the "small, safe shared-component adjustment"
  // allowance called out for this page, mirroring how Header.tsx already
  // uses usePathname() for its own per-route active-nav state.
  //
  // Sep 6, 2026 Terms-page rebuild: same reasoning extended to /terms — a
  // legal document should flow straight from its final section into the
  // Footer, not into a promotional "Explore the marketplace" strip.
  const pathname = usePathname();
  const showTrustBar = pathname !== "/about" && pathname !== "/terms";

  return (
    <footer className="mt-16 bg-brand-strong text-white/80">
      {showTrustBar && (
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
      )}

      <Container className="py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            {/* Sep 2026: matched to Header's logo treatment exactly (lowercase
                "durqo", font-display, no extra tracking) — this footer mark
                previously read "DURQO" with tracking-tight, a different
                logo from the Header's "durqo." in effect, even though both
                were meant to be the same wordmark. */}
            <Link href="/" className="flex items-baseline gap-1 font-display text-xl font-bold text-white">
              durqo<span className="text-brand">.</span>
            </Link>
            <p className="mt-3 max-w-[30ch] text-sm leading-relaxed text-white/55">
              A trusted marketplace for buying and selling digital businesses.
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
            <ColumnHeading>Resources</ColumnHeading>
            <ul className="flex flex-col gap-2.5 text-sm text-white/65">
              <li><Link href="/how-to-buy" className="hover:text-white">How to buy</Link></li>
              <li><Link href="/how-to-sell" className="hover:text-white">How to sell</Link></li>
              <li><Link href="/buyer-faq" className="hover:text-white">Buyer FAQ</Link></li>
              <li><Link href="/seller-faq" className="hover:text-white">Seller FAQ</Link></li>
              <li><Link href="/payments" className="hover:text-white">Payment &amp; Withdrawal</Link></li>
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
          <div className="flex items-center gap-4">
            <a
              href="https://www.facebook.com/Durqo"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Durqo on Facebook"
              className="text-white/60 transition hover:text-white"
            >
              <FacebookIcon size={16} />
            </a>
            <a
              href="https://www.instagram.com/durqomarketplace/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Durqo on Instagram"
              className="text-white/60 transition hover:text-white"
            >
              <InstagramIcon size={16} />
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
