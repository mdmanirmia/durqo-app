import "server-only";
import Stripe from "stripe";

// SERVER-ONLY Stripe client, authenticated with the platform's secret key.
// Never import this from a "use client" component or anything that could
// end up in the client bundle — the `server-only` import above makes that a
// build-time error, not just a convention.
//
// Returns null until STRIPE_SECRET_KEY is set (same guarded-factory pattern
// as src/lib/supabase/client.ts / server.ts / admin.ts) so the app still
// builds and runs before the key is configured — callers should surface a
// clear error rather than crash when this comes back null.
export function createStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;

  return new Stripe(secretKey);
}
