import { Suspense } from "react";
import MessagesPanel from "@/components/dashboard/MessagesPanel";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { BUYER_NAV } from "@/lib/dashboard-nav";

export default function BuyerMessagesPage() {
  return (
    <Suspense
      fallback={
        // Nov 4, 2026: the loading state keeps the dashboard frame, so the
        // header and menu don't disappear for a moment when opening Messages.
        <DashboardShell title="Buyer Dashboard" nav={BUYER_NAV} switchHref="/dashboard/seller" switchLabel="Go to Seller Dashboard">
          <p className="text-sm text-ink-faint">Loading&hellip;</p>
        </DashboardShell>
      }
    >
      <MessagesPanel title="Buyer Dashboard" nav={BUYER_NAV} switchHref="/dashboard/seller" switchLabel="Go to Seller Dashboard" />
    </Suspense>
  );
}
