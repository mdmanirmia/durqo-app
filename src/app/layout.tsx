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
export const metadata: Metadata = {
  title: "Durqo — Buy and Sell Digital Businesses",
  description:
    "Discover reviewed websites, SaaS products, apps, e-commerce brands and other digital businesses for sale, or list your business on Durqo.",
  openGraph: {
    title: "Buy What's Already Working | Durqo",
    description: "Explore reviewed digital businesses with clear performance data, or list your own business for sale.",
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
