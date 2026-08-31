import clsx from "clsx";
import { LucideIcon } from "lucide-react";

type Tone = "neutral" | "brand" | "gold" | "danger" | "dark";

const TONE: Record<Tone, string> = {
  neutral: "bg-paper-sunk text-ink-soft border-rule",
  brand: "bg-brand-soft text-brand-hover border-transparent",
  gold: "bg-gold-soft text-[#92730F] border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
  dark: "bg-brand-strong text-white border-transparent",
};

export function Badge({
  children,
  tone = "neutral",
  icon: Icon,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "mono inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-wide",
        TONE[tone],
        className
      )}
    >
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}

// Listing/order lifecycle status → tone + label, shared everywhere a status
// pill is rendered (marketplace cards, dashboards, admin tables) so the
// same status never reads two different ways in two different places.
const STATUS_MAP: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_review: { label: "In Review", tone: "gold" },
  published: { label: "Live", tone: "brand" },
  sold: { label: "Sold", tone: "dark" },
  archived: { label: "Archived", tone: "neutral" },
  requested: { label: "Requested", tone: "neutral" },
  awaiting_payment: { label: "Awaiting Payment", tone: "gold" },
  in_escrow: { label: "In Escrow", tone: "brand" },
  completed: { label: "Completed", tone: "dark" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const entry = STATUS_MAP[status] ?? { label: status, tone: "neutral" as Tone };
  return (
    <Badge tone={entry.tone} className={className}>
      {entry.label}
    </Badge>
  );
}
