"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

// One-click copy-to-clipboard icon button. First added on the admin
// Valuation Leads table (Oct 2, 2026, "email gulo jeno copy kora jai sei
// besbostah koro"), moved here Oct 6, 2026 so the admin Users table can
// reuse it for emails. navigator.clipboard can reject in rare contexts
// (non-HTTPS, permissions); that's caught and ignored, since the value is
// still visible to select and copy by hand.
export default function CopyButton({
  value,
  label,
  size = 11,
}: {
  value: string;
  label: string;
  size?: number;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard unavailable - nothing to do; the text is still visible.
        }
      }}
      title={copied ? "Copied" : `Copy ${label}`}
      aria-label={`Copy ${label}`}
      className="shrink-0 rounded p-0.5 text-ink-faint hover:bg-paper-sunk hover:text-brand-strong"
    >
      {copied ? <Check size={size} className="text-brand-strong" /> : <Copy size={size} />}
    </button>
  );
}
