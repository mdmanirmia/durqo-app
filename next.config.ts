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
};

export default nextConfig;
