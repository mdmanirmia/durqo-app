"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

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
    <main className="py-20">
      <Container className="max-w-lg">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-rule bg-paper-raised px-6 py-10 text-center sm:px-8">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand-strong">
            <CheckCircle2 size={24} />
          </div>
          <h1 className="text-2xl font-semibold text-ink">Payment received</h1>
          <p className="text-sm text-ink-soft">
            Thanks — your payment went through and your order is moving into escrow. We&rsquo;ll connect you with the seller
            to coordinate the handover, and you can track progress from your orders page.
          </p>
          {sessionId && <p className="mono text-xs text-ink-faint">Reference: {sessionId.slice(0, 24)}&hellip;</p>}
          <div className="mt-4 flex gap-3">
            <Button href="/dashboard/buyer/orders" variant="primary">
              View my orders
            </Button>
            <Button href="/buy" variant="secondary">
              Keep browsing
            </Button>
          </div>
        </div>
      </Container>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="py-20">
          <Container className="max-w-lg text-center text-sm text-ink-faint">Loading&hellip;</Container>
        </main>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
