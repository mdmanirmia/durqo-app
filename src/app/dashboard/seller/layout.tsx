import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/require-session";

// Section 15: every authenticated seller-dashboard page is private and
// per-account — noindex,nofollow.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Gates every page under /dashboard/seller — overview, orders, messages,
// verification, and crucially the "Add New Business" form and listing-edit
// pages under listings/* — behind a real session. See requireSession() for
// why this lives in a layout rather than each page. Before this, an
// unauthenticated visitor could open /dashboard/seller/listings/new and
// fill out the entire multi-step listing form, only to be told to log in
// at the very last step (on submit); now they're redirected to /login
// before the form ever renders.
export default async function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return <>{children}</>;
}
