import DashboardShell from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/dashboard-nav";

export default function BuyerAccountPage() {
  return (
    <DashboardShell title="Buyer Dashboard" nav={BUYER_NAV} switchHref="/dashboard/seller" switchLabel="Go to Seller Dashboard">
      <h2 className="mb-4 text-xl">Account details</h2>
      <form className="flex max-w-lg flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink-soft">Full name</label>
            <input defaultValue="" placeholder="Your name" className="rounded-lg border border-rule-strong bg-paper-raised px-3 py-2.5" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink-soft">Location</label>
            <input placeholder="City, Country" className="rounded-lg border border-rule-strong bg-paper-raised px-3 py-2.5" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-soft">Email</label>
          <input type="email" placeholder="you@email.com" className="rounded-lg border border-rule-strong bg-paper-raised px-3 py-2.5" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-soft">New password</label>
          <input type="password" placeholder="Leave blank to keep current password" className="rounded-lg border border-rule-strong bg-paper-raised px-3 py-2.5" />
        </div>
        <button type="button" className="w-fit rounded-lg bg-brand-strong px-6 py-2.5 text-sm font-semibold text-paper-raised hover:bg-brand">
          Save changes
        </button>
      </form>
    </DashboardShell>
  );
}
