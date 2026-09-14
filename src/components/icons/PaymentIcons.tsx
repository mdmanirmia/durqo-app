// Sep 14, 2026: real brand mark for the footer's "Secure payments" badge row
// (see Footer.tsx). Stripe explicitly publishes this mark for merchants to
// use (stripe.com/newsroom/brand-assets offers a "Powered by Stripe" kit for
// exactly this purpose) — path traced from the Simple Icons project
// (github.com/simple-icons/simple-icons, CC0-licensed SVG paths, this one
// sourced from stripe.com/newsroom/information), not a third-party logo
// mirror of unclear rights.
//
// bKash / Nagad / Rocket (Dutch-Bangla Bank) / Escrow.com are deliberately
// NOT included here: no official downloadable brand-kit page was found for
// any of them, and their Wikipedia logo files are explicitly tagged
// "non-free" ("any other uses... may be copyright infringement" — see
// en.wikipedia.org/wiki/File:BKash_logo.svg). Footer.tsx keeps those four as
// generic lucide icon + text badges rather than embedding a trademarked
// logo pulled from a logo-mirror site with no license grant. If Durqo gets
// the real files from bKash/Nagad/Rocket/Escrow.com directly (e.g. via the
// SSLCommerz or Escrow.com merchant portal), drop them in here the same way.
type IconProps = { size?: number; className?: string };

export function StripeIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <title>Stripe</title>
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
    </svg>
  );
}
