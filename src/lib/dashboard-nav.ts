import { DashboardNavItem } from "@/components/dashboard/DashboardShell";

export const BUYER_NAV: DashboardNavItem[] = [
  { href: "/dashboard/buyer", label: "Overview" },
  { href: "/dashboard/buyer/orders", label: "Orders", badge: 2 },
  { href: "/dashboard/buyer/wishlist", label: "Wishlist", badge: 3 },
  { href: "/dashboard/buyer/messages", label: "Messages" },
  // Sep 10, 2026: mirrors the seller's own "Comments" tab — the buyer's
  // side of the same FAQ/Q&A thread (see /dashboard/buyer/comments/page.tsx).
  { href: "/dashboard/buyer/comments", label: "Comments" },
  { href: "/dashboard/buyer/account", label: "Account Details" },
];

export const SELLER_NAV: DashboardNavItem[] = [
  { href: "/dashboard/seller", label: "My Listings", badge: 3 },
  { href: "/dashboard/seller/listings/new", label: "Add New Business" },
  { href: "/dashboard/seller/orders", label: "Orders", badge: 1 },
  { href: "/dashboard/seller/questions", label: "Comments" },
  { href: "/dashboard/seller/messages", label: "Messages" },
  { href: "/dashboard/seller/verification", label: "Verification" },
  { href: "/dashboard/seller/earnings", label: "Earnings" },
];

export const ADMIN_NAV: DashboardNavItem[] = [
  { href: "/dashboard/admin", label: "Overview" },
  { href: "/dashboard/admin/listings", label: "Listings" },
  { href: "/dashboard/admin/users", label: "Users" },
  { href: "/dashboard/admin/verification", label: "Verification" },
  { href: "/dashboard/admin/orders", label: "Orders" },
  { href: "/dashboard/admin/withdrawals", label: "Withdrawals" },
];
