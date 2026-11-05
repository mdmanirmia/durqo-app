import { Suspense } from "react";
import MessagesPanel from "@/components/dashboard/MessagesPanel";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SELLER_NAV } from "@/lib/dashboard-nav";

export default function SellerMessagesPage() {
  return (
    <Suspense
      fallback={
        // Nov 4, 2026: the loading state keeps the dashboard frame, so the
        // header and menu don't disappear for a moment when opening Messages.
        <DashboardShell title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
          <p className="text-sm text-ink-faint">Loading&hellip;</p>
        </DashboardShell>
      }
    >
      <MessagesPanel title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard" />
    </Suspense>
  );
}
