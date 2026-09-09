import type { Metadata } from "next";

// Section 15: admin pages are private and each already calls requireAdmin()
// itself (src/lib/auth/admin.ts) — this layout adds nothing to that access
// control, it only gives the whole /dashboard/admin/** tree a single
// server-rendered noindex,nofollow robots tag instead of repeating it on
// every admin page.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
