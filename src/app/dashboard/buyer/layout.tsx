import { requireSession } from "@/lib/auth/require-session";

// Gates every page under /dashboard/buyer (overview, wishlist, orders,
// messages, account) behind a real session — see requireSession() for why
// this lives in a layout rather than each page. An unauthenticated visitor
// is redirected to /login before any of these pages render.
export default async function BuyerDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return <>{children}</>;
}
