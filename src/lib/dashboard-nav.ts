import { DashboardNavItem } from "@/components/dashboard/DashboardShell";

export const BUYER_NAV: DashboardNavItem[] = [
  { href: "/dashboard/buyer", label: "Overview", icon: "home" },
  // Orders/Wishlist badges used to be hardcoded placeholder numbers (2 and
  // 3) that never reflected the signed-in buyer's actual data — every buyer
  // saw the same two numbers forever, regardless of how many orders or
  // wishlist items they actually had. Fixed 2026-09-12 (site owner report:
  // dashboard badges not clearing/updating) — both are now live counts
  // computed in DashboardShell.tsx (see ORDERS_HREFS / WISHLIST_HREF
  // there), so no `badge` literal is set here anymore.
  { href: "/dashboard/buyer/orders", label: "Orders", icon: "clipboardList" },
  { href: "/dashboard/buyer/transfers", label: "Asset Transfers", icon: "arrowLeftRight" },
  { href: "/dashboard/buyer/wishlist", label: "Wishlist", icon: "heart" },
  { href: "/dashboard/buyer/messages", label: "Messages", icon: "messageCircle" },
  // Sep 10, 2026: mirrors the seller's own "Comments" tab — the buyer's
  // side of the same FAQ/Q&A thread (see /dashboard/buyer/comments/page.tsx).
  { href: "/dashboard/buyer/comments", label: "Comments", icon: "helpCircle" },
  { href: "/dashboard/buyer/account", label: "Account Details", icon: "user" },
];

export const SELLER_NAV: DashboardNavItem[] = [
  // Same fix as BUYER_NAV above — My Listings/Orders were hardcoded to 3
  // and 1 for every seller, never actually counting that seller's own
  // listings/orders. Now live counts from DashboardShell.tsx.
  { href: "/dashboard/seller", label: "My Listings", icon: "home" },
  { href: "/dashboard/seller/listings/new", label: "Add New Business", icon: "plusCircle" },
  { href: "/dashboard/seller/orders", label: "Orders", icon: "clipboardList" },
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
