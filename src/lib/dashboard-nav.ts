import { DashboardNavItem } from "@/components/dashboard/DashboardShell";

export const BUYER_NAV: DashboardNavItem[] = [
  { href: "/dashboard/buyer", label: "Overview", icon: "home" },
  { href: "/dashboard/buyer/orders", label: "Orders", badge: 2, icon: "clipboardList" },
  { href: "/dashboard/buyer/transfers", label: "Asset Transfers", icon: "arrowLeftRight" },
  { href: "/dashboard/buyer/wishlist", label: "Wishlist", badge: 3, icon: "heart" },
  { href: "/dashboard/buyer/messages", label: "Messages", icon: "messageCircle" },
  // Sep 10, 2026: mirrors the seller's own "Comments" tab — the buyer's
  // side of the same FAQ/Q&A thread (see /dashboard/buyer/comments/page.tsx).
  { href: "/dashboard/buyer/comments", label: "Comments", icon: "helpCircle" },
  { href: "/dashboard/buyer/account", label: "Account Details", icon: "user" },
];

export const SELLER_NAV: DashboardNavItem[] = [
  { href: "/dashboard/seller", label: "My Listings", badge: 3, icon: "home" },
  { href: "/dashboard/seller/listings/new", label: "Add New Business", icon: "plusCircle" },
  { href: "/dashboard/seller/orders", label: "Orders", badge: 1, icon: "clipboardList" },
  { href: "/dashboard/seller/transfers", label: "Asset Transfers", icon: "arrowLeftRight" },
  { href: "/dashboard/seller/questions", label: "Comments", icon: "helpCircle" },
  { href: "/dashboard/seller/messages", label: "Messages", icon: "messageCircle" },
  { href: "/dashboard/seller/verification", label: "Verification", icon: "shieldCheck" },
  { href: "/dashboard/seller/earnings", label: "Earnings", icon: "wallet" },
];

export const ADMIN_NAV: DashboardNavItem[] = [
  { href: "/dashboard/admin", label: "Overview", icon: "home" },
  { href: "/dashboard/admin/listings", label: "Listings", icon: "tag" },
  { href: "/dashboard/admin/users", label: "Users", icon: "users" },
  { href: "/dashboard/admin/verification", label: "Verification", icon: "shieldCheck" },
  { href: "/dashboard/admin/orders", label: "Orders", icon: "clipboardList" },
  { href: "/dashboard/admin/transfers", label: "Asset Transfers", icon: "arrowLeftRight" },
  { href: "/dashboard/admin/withdrawals", label: "Withdrawals", icon: "wallet" },
];
