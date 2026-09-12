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
  ...rest
}: {
  children: React.ReactNode;
  tone?: Tone;
  icon?: LucideIcon;
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={clsx(
        "mono inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-wide",
        TONE[tone],
        className
      )}
      {...rest}
    >
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}

// Listing/order lifecycle status → tone + label, shared everywhere a status
// pill is rendered (marketplace cards, dashboards, admin tables) so the
// same status never reads two different ways in two different places.
//
// 2026-09-12 dashboard audit fix: AdminOrdersTable had drifted its own
// separate STATUS_LABEL map for the order-status <select> (with clearer,
// newer wording — e.g. "Held by Escrow.com", "Payment Released to Seller")
// while this StatusBadge right next to it still showed the older generic
// labels ("In Escrow", "Completed") — the exact "same status reads two
// different ways in two different places" bug this map's own comment
// exists to prevent. Reconciled here to the clearer wording everywhere;
// AdminOrdersTable now imports statusLabel() below instead of keeping its
// own copy.
const STATUS_MAP: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_review: { label: "In Review", tone: "gold" },
  published: { label: "Live", tone: "brand" },
  sold: { label: "Sold", tone: "dark" },
  archived: { label: "Archived", tone: "neutral" },
  requested: { label: "Payment Requested", tone: "neutral" },
  awaiting_payment: { label: "Awaiting Payment", tone: "gold" },
  in_escrow: { label: "Held by Escrow.com", tone: "brand" },
  in_durqo: { label: "Payment Received", tone: "brand" },
  completed: { label: "Payment Released", tone: "dark" },
  cancelled: { label: "Payment Cancelled", tone: "danger" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const entry = STATUS_MAP[status] ?? { label: status, tone: "neutral" as Tone };
  return (
    <Badge tone={entry.tone} className={className}>
      {entry.label}
    </Badge>
  );
}

export function statusLabel(status: string): string {
  return STATUS_MAP[status]?.label ?? status;
}

// Small colored-dot tone for a status, without the full Badge pill —
// used where a status breakdown is already labelled (e.g. Admin Overview's
// "Listings by status" / "Orders by status" lists) and just needs a quick
// visual cue for which rows need attention.
const TONE_DOT: Record<Tone, string> = {
  neutral: "bg-ink-faint",
  brand: "bg-brand",
  gold: "bg-[#C99A1B]",
  danger: "bg-danger",
  dark: "bg-brand-strong",
};

export function statusDotClass(status: string): string {
  const tone = STATUS_MAP[status]?.tone ?? "neutral";
  return TONE_DOT[tone];
}
