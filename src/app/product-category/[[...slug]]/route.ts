import { legacyGoneResponse } from "@/lib/legacy-gone";

// Legacy WordPress/WooCommerce category-archive URLs — see legacy-gone.ts.
export async function GET() {
  return legacyGoneResponse();
}

export async function HEAD() {
  return legacyGoneResponse();
}
