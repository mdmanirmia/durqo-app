import { Wallet, ShieldCheck, Landmark } from "lucide-react";

// Oct 30, 2026: a small animated "how the money moves" strip for the
// /durqo-bangladesh payments section. Mirrors the page's own published
// facts: the buyer pays in BDT, Durqo holds the payment through the
// Transfer Room until the transfer is approved, then the seller can request
// a BDT payout. Decorative motion only; respects reduced motion via the
// shared .dq-flow-dot rules in globals.css.
const STOPS = [
  { icon: Wallet, title: "Buyer pays in BDT", sub: "bKash, Nagad, Rocket, bank or card", tone: "bg-brand-soft text-brand-strong" },
  { icon: ShieldCheck, title: "Held through the Transfer Room", sub: "Until the buyer approves the transfer", tone: "bg-brand text-white" },
  { icon: Landmark, title: "Seller paid out in BDT", sub: "Bank, bKash, Nagad or Rocket", tone: "bg-gold-soft text-[#92730F]" },
];

export default function MoneyFlow() {
  return (
    <div className="relative rounded-2xl border border-rule bg-paper-raised p-5 sm:p-7">
      <div className="relative grid gap-6 sm:grid-cols-3 sm:gap-4">
        {/* Track + travelling dots (desktop: horizontal) */}
        <div className="pointer-events-none absolute left-[16%] right-[16%] top-7 hidden h-0.5 overflow-hidden rounded-full bg-rule sm:block" aria-hidden>
          <span className="dq-flow-dot absolute top-1/2 h-2 w-8 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-brand to-transparent" />
          <span className="dq-flow-dot absolute top-1/2 h-2 w-8 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-brand to-transparent" style={{ animationDelay: "1.3s" }} />
        </div>
        {STOPS.map(({ icon: Icon, title, sub, tone }, i) => (
          <div key={title} data-reveal style={{ "--reveal-delay": `${i * 160}ms` } as React.CSSProperties} className="relative flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
            <span className={`dq-icon-pop relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl ring-8 ring-paper-raised ${tone}`}>
              <Icon size={22} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
