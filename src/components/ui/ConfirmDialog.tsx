"use client";

// Shared confirmation modal for destructive/high-stakes actions across the
// admin dashboard (reject a listing, block a user, reject a verification or
// withdrawal request) and the buyer dashboard (cancel an order) — 2026-09-13
// dashboard audit follow-up. Before this, every one of those actions fired
// immediately on click with no "are you sure" step, so a misclick could
// reject a seller's listing or cancel an order with no chance to back out.
// Visual style matches the existing EscrowConfirmModal/SslcommerzConfirmModal
// pattern (centered card over a dim backdrop) so this reads as the same kind
// of dialog the app already uses elsewhere, not a new one-off.
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={busy ? undefined : onCancel} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-heading"
        className="absolute left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-rule bg-paper-raised p-6 shadow-[0_16px_40px_-16px_rgba(15,23,41,0.35)]"
      >
        <h3 id="confirm-dialog-heading" className="text-lg font-semibold text-ink">
          {title}
        </h3>
        {body && <div className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</div>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-rule-strong px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-paper-sunk disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
              danger ? "bg-danger hover:bg-danger/90" : "bg-brand hover:bg-brand-hover"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
