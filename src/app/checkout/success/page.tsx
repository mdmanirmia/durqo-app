"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

// Where Stripe Checkout's success_url sends the buyer back after a
// successful payment (see src/app/api/checkout/route.ts). This page is
// purely a confirmation screen — it doesn't itself verify or update
// anything server-side. The actual order-status update (awaiting_payment
// -> in_escrow) happens out-of-band via the Stripe webhook
// (src/app/api/webhooks/stripe/route.ts), which is the only source of
// truth for "did this really get paid" — a buyer's browser landing here
// proves Stripe redirected them, not that the webhook has already run, so
// the copy below deliberately says "confirming" rather than "confirmed".
function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <main className="mx-auto flex max-w-lg flex-col items-center gap-4 px-5 py-20 text-center sm:px-7">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand-strong">
        <CheckCircle2 size={28} />
      </div>
      <h1 className="text-2xl font-semibold">Payment received</h1>
      <p className="text-sm text-ink-soft">
        Thanks — your payment went through and your order is moving into escrow. We&rsquo;ll connect you with the seller
        to coordinate the handover, and you can track progress from your orders page.
      </p>
      {sessionId && <p className="mono text-xs text-ink-faint">Reference: {sessionId.slice(0, 24)}&hellip;</p>}
      <div className="mt-4 flex gap-3">
        <Link href="/dashboard/buyer/orders" className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand/90">
          View my orders
        </Link>
        <Link href="/buy" className="rounded-full border border-rule-strong px-5 py-2.5 text-sm font-semibold text-ink hover:border-brand-strong">
          Keep browsing
        </Link>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-lg px-5 py-20 text-center text-ink-faint">Loading&hellip;</main>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
