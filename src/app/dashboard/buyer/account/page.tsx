import DashboardShell from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/dashboard-nav";

const fieldCls =
  "rounded-md border border-rule-strong bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand-strong focus:outline-none";

export default function BuyerAccountPage() {
  return (
    <DashboardShell title="Buyer Dashboard" nav={BUYER_NAV} switchHref="/dashboard/seller" switchLabel="Go to Seller Dashboard">
      <h2 className="mb-4 text-xl">Account details</h2>
      <form className="max-w-lg rounded-xl border border-rule bg-paper-raised p-6">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-ink-soft">Full name</label>
              <input defaultValue="" placeholder="Your name" className={fieldCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-ink-soft">Location</label>
              <input placeholder="City, Country" className={fieldCls} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink-soft">Email</label>
            <input type="email" placeholder="you@email.com" className={fieldCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink-soft">New password</label>
            <input type="password" placeholder="Leave blank to keep current password" className={fieldCls} />
          </div>
          <button type="button" className="w-fit rounded-md bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover">
            Save changes
          </button>
        </div>
      </form>
    </DashboardShell>
  );
}
