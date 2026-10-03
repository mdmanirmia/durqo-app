import { Suspense } from "react";
import MessagesPanel from "@/components/dashboard/MessagesPanel";
import { SELLER_NAV } from "@/lib/dashboard-nav";

export default function SellerMessagesPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-5 py-10 text-sm text-ink-faint sm:px-7">Loading&hellip;</div>}>
      <MessagesPanel title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard" />
    </Suspense>
  );
}
