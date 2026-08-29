import { DashboardNavItem } from "@/components/dashboard/DashboardShell";

export const BUYER_NAV: DashboardNavItem[] = [
  { href: "/dashboard/buyer", label: "Overview" },
  { href: "/dashboard/buyer/orders", label: "Orders", badge: 2 },
  { href: "/dashboard/buyer/wishlist", label: "Wishlist", badge: 3 },
  { href: "/dashboard/buyer/messages", label: "Messages" },
  { href: "/dashboard/buyer/account", label: "Account Details" },
];

export const SELLER_NAV: DashboardNavItem[] = [
  { href: "/dashboard/seller", label: "My Listings", badge: 3 },
  { href: "/dashboard/seller/listings/new", label: "Add New Business" },
  { href: "/dashboard/seller/orders", label: "Orders", badge: 1 },
  { href: "/dashboard/seller/messages", label: "Messages" },
  { href: "/dashboard/seller/verification", label: "Verification" },
];
