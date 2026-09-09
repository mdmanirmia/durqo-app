import type { Metadata } from "next";

// Self-hosted fonts (bundled via npm, no runtime fetch to Google's CDN needed).
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import "@fontsource/public-sans/600.css";
import "@fontsource/public-sans/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";

import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollRevealInit from "@/components/ScrollReveal";

// Sep 6, 2026: title/description/OG copy rewritten to drop unsupported
// claims ("verified marketplace", implied escrow/expert-vetting) and use
// "reviewed" for the real, described listing-review process rather than
// "verified" (reserved for actual completed seller identity checks) —
// consistent with the homepage's own accuracy pass the same day.
//
// Sep 8, 2026 (technical SEO pass): this object is now the *site-wide
// fallback* only — every indexable route below sets its own explicit
// `metadata`/`generateMetadata` with a complete title (every one of them
// already ends in "| Durqo" itself, per the spec's exact title strings),
// so nothing here actually gets inherited by a real page today. It still
// matters for any future route that forgets to set its own metadata, so
// it stays accurate and complete rather than being deleted.
//
// Deliberately NOT using a `title.template` here: Next.js applies a
// parent's template to every child page's plain-string title, and since
// this app's own page titles already include their own "| Durqo" suffix
// (matching the spec's exact strings), a template would double it into
// "... | Durqo | Durqo" — caught during this pass's own build-and-curl
// verification and fixed by dropping the template rather than rewriting
// every page's title.
//
// `metadataBase` makes every page's relative OG/Twitter image URLs
// resolve to an absolute `https://www.durqo.com/...` URL instead of a
// relative one search engines and social crawlers can't use. `icons`/
// `manifest` are read on every page since Next merges those two fields
// from the nearest ancestor that sets them.
export const metadata: Metadata = {
  metadataBase: new URL("https://www.durqo.com"),
  title: "Durqo — Buy and Sell Digital Businesses",
  description:
    "Discover reviewed websites, SaaS products, apps, e-commerce brands and other digital businesses for sale, or list your business on Durqo.",
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Durqo",
    title: "Buy What's Already Working | Durqo",
    description: "Explore reviewed digital businesses with clear performance data, or list your own business for sale.",
    images: [
      {
        url: "/og/durqo-home.jpg",
        width: 1200,
        height: 630,
        alt: "Durqo marketplace for buying and selling digital businesses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy What's Already Working | Durqo",
    description: "Explore reviewed digital businesses with clear performance data, or list your own business for sale.",
    images: ["/og/durqo-home.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ScrollRevealInit />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
