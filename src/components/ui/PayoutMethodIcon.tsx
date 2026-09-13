import { Landmark, Smartphone, CreditCard, Wallet, type LucideIcon } from "lucide-react";

// Small colored icon chip for a payout method — 2026-09-13 dashboard audit
// polish pass ("brand icons on payout method pills" deferred item). Real
// brand marks (bKash/Nagad/Rocket/PayPal/Wise logos) aren't bundled here —
// embedding third-party trademarks needs their own asset review — so this
// uses a generic icon tinted with each brand's approximate primary color
// instead, which gets most of the "instantly recognizable at a glance" value
// without shipping someone else's logo.
const METHOD_ICON: Record<string, { icon: LucideIcon; className: string }> = {
  bank_transfer: { icon: Landmark, className: "bg-paper-sunk text-ink-soft" },
  bkash: { icon: Smartphone, className: "bg-[#E2136E]/10 text-[#E2136E]" },
  rocket: { icon: Smartphone, className: "bg-[#8C3494]/10 text-[#8C3494]" },
  nagad: { icon: Smartphone, className: "bg-[#F7941D]/10 text-[#F7941D]" },
  paypal: { icon: CreditCard, className: "bg-[#003087]/10 text-[#003087]" },
  wise: { icon: CreditCard, className: "bg-[#163300]/10 text-[#163300]" },
};

export default function PayoutMethodIcon({ method, size = 14 }: { method: string; size?: number }) {
  const entry = METHOD_ICON[method] ?? { icon: Wallet, className: "bg-paper-sunk text-ink-faint" };
  const Icon = entry.icon;
  return (
    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${entry.className}`}>
      <Icon size={size} />
    </span>
  );
}
