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

export const metadata: Metadata = {
  title: "Durqo — Buy and sell online businesses",
  description:
    "Durqo is the verified marketplace for buying and selling websites, SaaS, domains, YouTube channels, social accounts and newsletters.",
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
