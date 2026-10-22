// Oct 22, 2026 (card coloring pass): one accent color per category, used for
// the listing card's tinted header, icon and border and the marketplace
// filter's category icons so the grid reads at a
// glance. Unknown categories fall back to the brand green.
export const CATEGORY_ACCENTS: Record<string, string> = {
  websites: "#2563EB",
  "e-commerce": "#D97706",
  "youtube-channels": "#DC2626",
  "social-media-accounts": "#DB2777",
  saas: "#7C3AED",
  "ai-apps-tools": "#0D9488",
  "apps-tools": "#0284C7",
  "startup-business": "#EA580C",
  "plugins-themes-extensions": "#4F46E5",
  domains: "#0891B2",
  "amazon-stores-kdp": "#CA8A04",
  "service-business": "#059669",
  "digital-agencies": "#9333EA",
  games: "#E11D48",
  newsletters: "#C2410C",
  "crypto-blockchain": "#6D28D9",
};
