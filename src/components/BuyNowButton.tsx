"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { CreditCard, ShieldCheck, Landmark, ChevronRight, type LucideIcon } from "lucide-react";
import { isRealListingId } from "@/lib/is-demo-listing";
import SslcommerzConfirmModal, { type SslcommerzQuote } from "@/components/SslcommerzConfirmModal";
import EscrowConfirmModal, { type EscrowQuote } from "@/components/EscrowConfirmModal";
import { trackBeginCheckout } from "@/lib/analytics";

// 2026-09-20 redesign ("price and seller card ta ei rokom sundor kore color
// and design kora jai kina dekho" — a reference screenshot of a "Choose how
// to pay" list: icon + label + one-line description + chevron, with the
// local-currency option visually highlighted): each payment method used to
// be a plain full-width outlined button reading "Buy Now — X". Replaced with
// this icon-row treatment so the three options read as a single considered
// list instead of three near-identical buttons. `highlighted` gives the
// SSLCommerz/BDT row the light brand-tinted background from the reference
// (it's the option most Bangladeshi buyers actually want, so it's the one
// that visually stands out) — every other visual/behavioral detail
// (disabled states, click handlers, modals below) is unchanged.
function PaymentOptionRow({
  icon: Icon,
  label,
  description,
  highlighted,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  highlighted?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        highlighted
          ? "border-brand/30 bg-brand-soft/70 hover:border-brand"
          : "border-rule-strong bg-transparent hover:border-brand/50 hover:bg-brand-soft/30"
      )}
    >
      <span
        className={clsx(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper-raised",
          highlighted ? "text-brand-hover" : "text-ink-soft group-hover:text-brand-hover"
        )}
      >
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{label}</span>
        {/* Not truncated (unlike the label above) — at the sidebar's actual
            width the longer descriptions ("Complete the transaction
            through Escrow.com", "bKash, Nagad, Rocket or bank via
            SSLCommerz") don't fit on one line, and an ellipsis mid-sentence
            reads worse than just wrapping to a second line. */}
        <span className="block text-xs leading-snug text-ink-faint">{description}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-ink-faint" />
    </button>
  );
}

// "Buy Now" — skips the cart entirely and starts a checkout session for
// just this one listing, via Stripe (/api/checkout), SSLCommerz's
// Bangladesh payment gateway (/api/sslcommerz/init), or Escrow.com
// (/api/escrow/init), buyer's choice. Locked once the listing is sold (or
// is a demo/mock listing with nothing real in the database to buy). Sep 9,
// 2026: gained the SSLCommerz option alongside the already-live Stripe one,
// matching the same choice CartView now offers. No country detection/
// gating — the label itself ("bKash/Rocket/Nagad/Bank") is the filter: only
// makes sense to a Bangladeshi buyer, so that's who picks it. See the
// longer note in CartView.tsx.
//
// Mirrors CartView.tsx's SSLCommerz flow: instead of redirecting straight
// to the gateway, it first fetches a quote (/api/sslcommerz/quote?listingId=)
// and shows SslcommerzConfirmModal so the buyer sees the exact BDT amount,
// the USD->BDT rate, and (for a listing over the online deposit cap) how
// the remainder is handled, before ever leaving Durqo. Stripe has no such
// step — it charges USD directly, so it still redirects immediately.
//
// Sep 10, 2026: the "Buy Now — Escrow (coming soon)" placeholder button is
// now live, using the exact same quote-then-confirm-then-redirect shape as
// the SSLCommerz option, via EscrowConfirmModal.tsx / api/escrow/quote
// /api/escrow/init. Only difference in the confirm step: no currency
// conversion to show (Escrow.com charges the full USD price directly), and
// the copy sets expectations that the buyer will finish payment on
// Escrow.com's own hosted page, possibly signing into (or being issued) an
// Escrow.com account along the way.
export default function BuyNowButton({
  listingId,
  title,
  price,
  sold,
}: {
  listingId: string;
  // Sep 16, 2026: optional — only used to enrich the GA4 begin_checkout
  // event below with a real item name/value. The listing detail page (the
  // only real caller) always has these on hand already; omitting them just
  // means the event fires with a generic item_name instead of failing.
  title?: string;
  price?: number;
  sold?: boolean;
}) {
  const router = useRouter();
  const [stripeBusy, setStripeBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDemo = !isRealListingId(listingId);
  const locked = isDemo || sold;

  // "Pay Later" — a 4th checkout option, live for every signed-in buyer
  // (site owner's explicit decision, 2026-09-12, made after being told this
  // means a listing can be marked "sold" and a real Transfer Room opened
  // with no payment actually collected). Creates a real order + Transfer
  // Room with no payment gateway involved at all. See
  // api/pay-later/init/route.ts for the server-side kill switch
  // (PAY_LATER_ENABLED env var) the site owner can flip off without a
  // redeploy if this needs to come down.
  const [payLaterBusy, setPayLaterBusy] = useState(false);

  // SSLCommerz confirm-modal state — "closed" means no modal is shown.
  const [sslStatus, setSslStatus] = useState<"closed" | "loading" | "ready" | "error">("closed");
  const [sslQuote, setSslQuote] = useState<SslcommerzQuote | null>(null);
  const [sslError, setSslError] = useState<string | null>(null);
  const [sslConfirming, setSslConfirming] = useState(false);

  // Escrow.com confirm-modal state — same "closed means hidden" shape as
  // the SSLCommerz one above. Sep 10, 2026: replaces the disabled "coming
  // soon" placeholder that used to sit here. "success" added Sep 15, 2026
  // when the confirm step stopped redirecting to Escrow.com (see
  // EscrowConfirmModal.tsx's top-of-file comment) and started just
  // reporting that the transaction was created and to check email instead.
  const [escrowStatus, setEscrowStatus] = useState<"closed" | "loading" | "ready" | "error" | "success">("closed");
  const [escrowQuote, setEscrowQuote] = useState<EscrowQuote | null>(null);
  const [escrowError, setEscrowError] = useState<string | null>(null);
  const [escrowConfirming, setEscrowConfirming] = useState(false);
  const [escrowBuyerEmail, setEscrowBuyerEmail] = useState<string | null>(null);

  async function handleStripe() {
    if (stripeBusy || locked || sslStatus !== "closed" || escrowStatus !== "closed") return;
    setStripeBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Couldn't start checkout. Please try again.");
        setStripeBusy(false);
        return;
      }
      trackBeginCheckout({
        value: price ?? 0,
        paymentChannel: "stripe",
        items: [{ item_id: listingId, item_name: title ?? "Listing", price }],
      });
      // Deliberately don't reset `stripeBusy` — the browser is about to
      // navigate away to Stripe's hosted page.
      window.location.href = data.url;
    } catch {
      setError("Couldn't start checkout. Please try again.");
      setStripeBusy(false);
    }
  }

  async function openSslModal() {
    if (stripeBusy || locked || escrowStatus !== "closed") return;
    setError(null);
    setSslStatus("loading");
    setSslQuote(null);
    setSslError(null);
    try {
      const res = await fetch(`/api/sslcommerz/quote?listingId=${encodeURIComponent(listingId)}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setSslError(data.error ?? "Couldn't calculate this order's total. Please try again.");
        setSslStatus("error");
        return;
      }
      setSslQuote(data);
      setSslStatus("ready");
    } catch {
      setSslError("Couldn't calculate this order's total. Please try again.");
      setSslStatus("error");
    }
  }

  function closeSslModal() {
    if (sslConfirming) return;
    setSslStatus("closed");
    setSslQuote(null);
    setSslError(null);
  }

  async function confirmSsl() {
    if (sslConfirming) return;
    setSslConfirming(true);
    try {
      const res = await fetch("/api/sslcommerz/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.url) {
        setSslError(data.error ?? "Something went wrong. Please try again.");
        setSslStatus("error");
        setSslConfirming(false);
        return;
      }
      trackBeginCheckout({
        value: sslQuote?.fullPriceUsd ?? price ?? 0,
        paymentChannel: "sslcommerz",
        items: [{ item_id: listingId, item_name: title ?? "Listing", price }],
      });
      // Deliberately not resetting `sslConfirming` on success — this
      // component is about to be torn down by the navigation.
      window.location.href = data.url;
    } catch {
      setSslError("Something went wrong. Please try again.");
      setSslStatus("error");
      setSslConfirming(false);
    }
  }

  async function handlePayLater() {
    if (payLaterBusy || locked || stripeBusy || sslStatus !== "closed" || escrowStatus !== "closed") return;
    setPayLaterBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pay-later/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.orderId) {
        setError(data.error ?? "Couldn't complete this. Please try again.");
        setPayLaterBusy(false);
        return;
      }
      router.push(`/dashboard/transfer/${data.orderId}`);
    } catch {
      setError("Couldn't complete this. Please try again.");
      setPayLaterBusy(false);
    }
  }

  async function openEscrowModal() {
    if (stripeBusy || locked || sslStatus !== "closed") return;
    setError(null);
    setEscrowStatus("loading");
    setEscrowQuote(null);
    setEscrowError(null);
    try {
      const res = await fetch(`/api/escrow/quote?listingId=${encodeURIComponent(listingId)}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setEscrowError(data.error ?? "Couldn't calculate this order's total. Please try again.");
        setEscrowStatus("error");
        return;
      }
      setEscrowQuote(data);
      setEscrowStatus("ready");
    } catch {
      setEscrowError("Couldn't calculate this order's total. Please try again.");
      setEscrowStatus("error");
    }
  }

  function closeEscrowModal() {
    if (escrowConfirming) return;
    setEscrowStatus("closed");
    setEscrowQuote(null);
    setEscrowError(null);
    setEscrowBuyerEmail(null);
  }

  async function confirmEscrow() {
    if (escrowConfirming) return;
    setEscrowConfirming(true);
    try {
      const res = await fetch("/api/escrow/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setEscrowError(data.error ?? "Something went wrong. Please try again.");
        setEscrowStatus("error");
        setEscrowConfirming(false);
        return;
      }
      trackBeginCheckout({
        value: escrowQuote?.fullPriceUsd ?? price ?? 0,
        paymentChannel: "escrow_com",
        items: [{ item_id: listingId, item_name: title ?? "Listing", price }],
      });
      // No redirect anymore — see EscrowConfirmModal.tsx's top-of-file
      // comment. The transaction is created; Escrow.com's own email to the
      // buyer is what carries them the rest of the way.
      setEscrowBuyerEmail(typeof data.buyerEmail === "string" ? data.buyerEmail : null);
      setEscrowStatus("success");
      setEscrowConfirming(false);
    } catch {
      setEscrowError("Something went wrong. Please try again.");
      setEscrowStatus("error");
      setEscrowConfirming(false);
    }
  }

  if (sold || isDemo) {
    return (
      <button
        type="button"
        disabled
        title={sold ? "This listing has already been sold." : "This is a sample listing — buying opens up once real listings are live."}
        className="rounded-xl bg-brand-strong py-2.5 text-sm font-semibold text-paper-raised shadow-[0_1px_2px_rgba(15,23,42,0.08)] opacity-60"
      >
        {sold ? "Sold" : "Sample listing"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Choose how to pay</div>
      <div className="flex flex-col gap-2">
        <PaymentOptionRow
          icon={CreditCard}
          label={stripeBusy ? "Starting checkout…" : "Pay by Card"}
          description="Secure payment through Stripe"
          onClick={handleStripe}
          disabled={stripeBusy || sslStatus !== "closed" || escrowStatus !== "closed"}
        />
        <PaymentOptionRow
          icon={ShieldCheck}
          label="Pay with Escrow.com"
          description="Complete the transaction through Escrow.com"
          onClick={openEscrowModal}
          disabled={stripeBusy || sslStatus !== "closed" || escrowStatus !== "closed"}
        />
        <PaymentOptionRow
          icon={Landmark}
          label="Pay in BDT"
          description="bKash, Nagad, Rocket or bank via SSLCommerz"
          highlighted
          onClick={openSslModal}
          disabled={stripeBusy || sslStatus !== "closed" || escrowStatus !== "closed"}
        />
      </div>
      {/* Sep 13, 2026: hidden from every buyer per the site owner's explicit
          decision, made right after a content audit surfaced that this
          button was live for any signed-in user with zero payment enforced
          (marks the listing sold + opens a real Transfer Room for $0). The
          server-side kill switch (PAY_LATER_ENABLED=false in Vercel) is the
          actual security fix — hiding the button here just stops a
          legitimate buyer from hitting a dead/erroring option. Restore both
          together (this block + PAY_LATER_ENABLED=true) if this is ever
          wanted again; handlePayLater() and the route are left intact. */}
      {error && <span className="text-xs text-red-600">{error}</span>}

      {sslStatus !== "closed" && (
        <SslcommerzConfirmModal
          status={sslStatus}
          quote={sslQuote}
          error={sslError}
          confirming={sslConfirming}
          onConfirm={confirmSsl}
          onCancel={closeSslModal}
        />
      )}

      {escrowStatus !== "closed" && (
        <EscrowConfirmModal
          status={escrowStatus}
          quote={escrowQuote}
          error={escrowError}
          confirming={escrowConfirming}
          buyerEmail={escrowBuyerEmail}
          onConfirm={confirmEscrow}
          onCancel={closeEscrowModal}
        />
      )}
    </div>
  );
}
