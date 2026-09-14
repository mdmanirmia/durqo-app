import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1mb — listing edit forms upload proof-of-income /
      // GA / GSC / SEMrush / Ahrefs screenshots straight through a Server
      // Action (see src/lib/actions/listing-edit.ts), which easily exceeds
      // that for a multi-file gallery.
      bodySizeLimit: "20mb",
    },
  },

  // Sep 8, 2026 technical-SEO pass (Section 2): canonical domain is
  // https://www.durqo.com — everything else 308-redirects there, path and
  // query string preserved via the `:path*` capture. This is a code-level
  // safety net inside the app itself; Vercel's own Domains settings should
  // still be checked/configured to do the same at the edge (faster, and
  // works even if this app layer is ever bypassed by a CDN/cache) — see the
  // final report for what to verify there.
  //
  // Next.js runs after Vercel has already terminated TLS, so "was this
  // request originally HTTP" isn't a real distinction at this layer for
  // Vercel's own domains (Vercel force-upgrades to HTTPS before the app
  // ever sees the request) — the `x-forwarded-proto: http` rule below is
  // just defense in depth for any other host/proxy in front of this app
  // that forwards that header.
  async redirects() {
    return [
      // Apex domain -> www, regardless of scheme.
      {
        source: "/:path*",
        has: [{ type: "host", value: "durqo.com" }],
        destination: "https://www.durqo.com/:path*",
        permanent: true,
      },
      // www over http -> www over https.
      {
        source: "/:path*",
        has: [
          { type: "host", value: "www.durqo.com" },
          { type: "header", key: "x-forwarded-proto", value: "http" },
        ],
        destination: "https://www.durqo.com/:path*",
        permanent: true,
      },
      // Sep 14, 2026: /pay-in-taka's content was expanded (buyer AND seller
      // BDT flows, full SEO/comparison spec) and moved to a new canonical
      // URL. This handles the non-trailing-slash form. The trailing-slash
      // form ("/pay-in-taka/") needs a separate fix in src/proxy.ts instead:
      // with this app's default `trailingSlash: false`, Next's own built-in
      // slash-normalization redirect fires BEFORE this redirects() config is
      // ever consulted, so a rule added here for "/pay-in-taka/" is dead
      // code — it turned the migration into a 2-hop chain in testing
      // (/pay-in-taka/ -> /pay-in-taka -> here), which the spec for this
      // migration explicitly rules out ("must not create a redirect
      // chain"). See src/proxy.ts for the single-hop fix for that case.
      {
        source: "/pay-in-taka",
        destination: "/buy-and-sell-digital-businesses-in-bdt",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
