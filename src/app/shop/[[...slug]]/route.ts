import { legacyGoneResponse } from "@/lib/legacy-gone";

// Legacy WordPress/WooCommerce shop-index URLs — see legacy-gone.ts.
export async function GET() {
  return legacyGoneResponse();
  }

export async function HEAD() {
  return legacyGoneResponse();
  }
