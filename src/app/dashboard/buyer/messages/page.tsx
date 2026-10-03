import { Suspense } from "react";
import MessagesPanel from "@/components/dashboard/MessagesPanel";
import { BUYER_NAV } from "@/lib/dashboard-nav";

export default function BuyerMessagesPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-5 py-10 text-sm text-ink-faint sm:px-7">Loading&hellip;</div>}>
      <MessagesPanel title="Buyer Dashboard" nav={BUYER_NAV} switchHref="/dashboard/seller" switchLabel="Go to Seller Dashboard" />
    </Suspense>
  );
}
