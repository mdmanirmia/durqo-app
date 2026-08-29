import DashboardShell from "@/components/dashboard/DashboardShell";
import { SELLER_NAV } from "@/lib/dashboard-nav";
import { ShieldCheck } from "lucide-react";

const METHODS = [
  { id: "passport", label: "Passport" },
  { id: "national_id", label: "National ID" },
  { id: "driving_license", label: "Driving License" },
];

export default function VerificationPage() {
  return (
    <DashboardShell title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <h2 className="mb-2 text-xl">Identity verification</h2>
      <p className="mb-6 max-w-[60ch] text-sm text-ink-soft">
        Verified sellers get a badge on every listing and rank higher in search. Choose one document to verify — this only needs to be done once.
      </p>
      <div className="flex max-w-md flex-col gap-3">
        {METHODS.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg border border-rule bg-paper-raised px-4 py-3.5">
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-ink-faint" />
              <span className="font-medium">{m.label}</span>
            </div>
            <button className="rounded-lg border border-rule-strong px-3 py-1.5 text-sm font-semibold hover:border-brand-strong">
              Start verification
            </button>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
