import type { MetadataRoute } from "next";

// Section 4 of the Sep 8, 2026 technical-SEO pass: a minimal web app
// manifest so the Android home-screen / PWA install icon uses Durqo's real
// mark instead of a generic browser icon. This is metadata only — it adds
// no visible UI and doesn't opt the site into any PWA/installability
// behavior beyond what the manifest itself declares.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Durqo",
    short_name: "Durqo",
    description: "Buy and sell digital businesses on Durqo.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#081121",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
