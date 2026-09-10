"use client";

import { fmtUSD, fmtBDT } from "@/lib/format";

// Shown only on the SSLCommerz (bKash/Rocket/Nagad/Bank) path — this is
// the Bangladeshi-buyer, BDT-payment rail; Stripe charges USD directly and
// has no conversion step to confirm, so Stripe checkout skips this modal
// entirely. Sep 2026: added because the buyer was being redirected
// straight to SSLCommerz's hosted page with no on-site indication of the
// BDT amount, the rate used, or (for listings over the online deposit cap)
// how the remaining balance is handled — this closes that gap by asking
// the buyer to confirm those specifics before they ever leave Durqo. Used
// by both CartView.tsx and BuyNowButton.tsx against the same
// /api/sslcommerz/quote response shape.
//
// Sep 9 2026 follow-up: reworded per the merchant's exact required copy —
// at or under the $ONLINE_DEPOSIT_CAP threshold the buyer pays the full
// price and the purchase completes once that payment verifies; above it,
// only the BDT equivalent of the cap is charged now and Durqo follows up
// by email with instructions for the remaining balance (wire/card), with
// completion held until that balance is received and verified. Dropped
// "Durqo's conversion margin" wording — the margin is still applied
// server-side (src/lib/currency.ts) but is never named in buyer-facing
// copy.
//
// Sep 10 2026 follow-up: the remaining-balance line only ever showed the USD
// figure, but that balance is still paid via a BDT rail for these buyers —
// added the BDT equivalent (computed client-side from `remainderUsd *
// rate`, the same today's-rate already shown above, rather than a second
// API round trip) so the number they'll actually be asked to pay isn't a
// surprise in the follow-up email.
export interface SslcommerzQuote {
  fullPriceUsd: number;
  onlineChargeUsd: number;
  remainderUsd: number;
  depositCap: number;
  bdtAmount: number;
  rate: number;
  rateSource: "live" | "fallback";
}

export default function SslcommerzConfirmModal({
  status,
  quote,
  error,
  confirming,
  onConfirm,
  onCancel,
}: {
  status: "loading" | "ready" | "error";
  quote: SslcommerzQuote | null;
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
        aria-labelledby="sslcommerz-confirm-heading"
        className="absolute left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-rule bg-paper-raised p-6 shadow-[0_16px_40px_-16px_rgba(15,23,41,0.35)]"
      >
        <h3 id="sslcommerz-confirm-heading" className="text-lg font-semibold text-ink">
          Pay with SSLCommerz
        </h3>
        <p className="mt-1 text-xs text-ink-faint">bKash · Rocket · Nagad · Bank — for buyers paying in Bangladeshi Taka</p>

        {status === "loading" && (
          <p className="mt-6 text-sm text-ink-soft">Checking today&rsquo;s exchange rate&hellip;</p>
        )}

        {status === "error" && (
          <>
            <p className="mt-6 text-sm text-danger">{error ?? "Couldn't calculate this order's total. Please try again."}</p>
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
                <span className="text-sm text-ink-soft">Amount to pay now</span>
                <span className="text-xl font-semibold text-brand-strong">{fmtBDT(quote.bdtAmount)}</span>
              </div>
              <p className="mono mt-1 text-xs text-ink-faint">&asymp; {fmtUSD(quote.onlineChargeUsd)} USD</p>
              <p className="mt-3 text-xs text-ink-soft">
                Exchange rate used: <span className="mono">1 USD = {fmtBDT(quote.rate)}</span> (today&rsquo;s exchange
                rate).
              </p>
            </div>

            {quote.remainderUsd > 0 ? (
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                This listing is priced at {fmtUSD(quote.fullPriceUsd)}. You&rsquo;re paying the BDT equivalent of{" "}
                {fmtUSD(quote.depositCap)} now through SSLCommerz. Once this payment is confirmed, Durqo will email
                you with instructions for paying the remaining {fmtUSD(quote.remainderUsd)} (&asymp;{" "}
                {fmtBDT(Math.round(quote.remainderUsd * quote.rate * 100) / 100)}, at today&rsquo;s rate) by bank
                wire transfer, credit card, or debit card — your purchase will be completed only after that balance
                has been received and verified.
              </p>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                Your purchase will be completed after this payment has been received and verified.
              </p>
            )}

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
                {confirming ? "Redirecting…" : `Confirm & pay ${fmtBDT(quote.bdtAmount)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
