"use client";

import { fmtUSD } from "@/lib/format";

// Confirmation step shown before a buyer is redirected to Escrow.com's own
// hosted page — same purpose as SslcommerzConfirmModal.tsx (make sure the
// buyer understands what's about to happen before they leave Durqo), but
// simpler: there's no currency conversion to show, since Escrow.com charges
// the full USD listing price directly, with no deposit cap and no
// off-platform remainder — the whole point of real escrow is that Durqo
// doesn't need that workaround here the way it does for Stripe/SSLCommerz
// (see src/lib/payment-terms.ts). What this modal does need to set
// expectations on: the buyer will need to set up (or sign into) an
// Escrow.com account to complete payment there, and Escrow.com charges its
// own separate service fee on top of the listing price (shown on their
// site before payment, not duplicated/estimated here to avoid drift).
export interface EscrowQuote {
  fullPriceUsd: number;
  listingTitle: string;
}

export default function EscrowConfirmModal({
  status,
  quote,
  error,
  confirming,
  onConfirm,
  onCancel,
}: {
  status: "loading" | "ready" | "error";
  quote: EscrowQuote | null;
  error: string | null;
  confirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={confirming ? undefined : onCancel} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="escrow-confirm-heading"
        className="absolute left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-rule bg-paper-raised p-6 shadow-[0_16px_40px_-16px_rgba(15,23,41,0.35)]"
      >
        <h3 id="escrow-confirm-heading" className="text-lg font-semibold text-ink">
          Pay with Escrow.com
        </h3>
        <p className="mt-1 text-xs text-ink-faint">Secure, licensed third-party escrow — for the full purchase price</p>

        {status === "loading" && (
          <p className="mt-6 text-sm text-ink-soft">Preparing your transaction&hellip;</p>
        )}

        {status === "error" && (
          <>
            <p className="mt-6 text-sm text-danger">{error ?? "Couldn't start this checkout. Please try again."}</p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md border border-rule-strong px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-paper-sunk"
              >
                Close
              </button>
            </div>
          </>
        )}

        {status === "ready" && quote && (
          <>
            <div className="mt-5 rounded-lg border border-rule bg-paper p-4">
              <div className="mono flex items-baseline justify-between">
                <span className="text-sm text-ink-soft">Full purchase price</span>
                <span className="text-xl font-semibold text-brand-strong">{fmtUSD(quote.fullPriceUsd)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-faint">Held securely by Escrow.com until you confirm receipt — no remaining balance to settle separately.</p>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              You&rsquo;ll be redirected to Escrow.com to complete this purchase. If you don&rsquo;t already have an
              Escrow.com account, they&rsquo;ll create one for you and email you instructions to set a password.
              Escrow.com charges its own service fee on top of the {fmtUSD(quote.fullPriceUsd)} price — you&rsquo;ll
              see the exact amount on their site before you pay. Funds are released to the seller only after you
              confirm you&rsquo;ve received the business.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                disabled={confirming}
                className="rounded-md border border-rule-strong px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-paper-sunk disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={confirming}
                className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
              >
                {confirming ? "Redirecting…" : `Continue to Escrow.com`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
