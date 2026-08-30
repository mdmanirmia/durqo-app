// Shared category -> lucide icon mapping, used by both the homepage category
// grid and ListingCard's banner (so a listing's card visually matches its
// category regardless of whether the seller has uploaded real photos yet).
import {
  Globe,
  ShoppingBag,
  PlaySquare,
  Users,
  Mail,
  Layers,
  Package,
  Puzzle,
  Smartphone,
  Gamepad2,
  Bitcoin,
  Briefcase,
  Handshake,
  Link2,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  websites: Globe,
  "e-commerce": ShoppingBag,
  "youtube-channels": PlaySquare,
  "social-media-accounts": Users,
  newsletters: Mail,
  saas: Layers,
  "amazon-stores-kdp": Package,
  "plugins-themes-extensions": Puzzle,
  "apps-tools": Smartphone,
  games: Gamepad2,
  "crypto-blockchain": Bitcoin,
  "digital-agencies": Briefcase,
  "service-business": Handshake,
  domains: Link2,
};

export function categoryIcon(categoryId: string): LucideIcon {
  return CATEGORY_ICONS[categoryId] ?? Globe;
}
