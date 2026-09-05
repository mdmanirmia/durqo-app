// Social Media Accounts category only (Design & Development New.pdf, Sep 5,
// 2026 request) — which platform(s) an account is on, shown as a checkbox
// list on the seller form (a listing can bundle accounts across more than
// one platform) and joined into a single "Account Type" Quick Stat on the
// public listing page. Mirrors the shape of business-types.ts.
export const ACCOUNT_TYPES: { id: string; name: string }[] = [
  { id: "facebook", name: "Facebook" },
  { id: "instagram", name: "Instagram" },
  { id: "tiktok", name: "TikTok" },
  { id: "twitter-x", name: "Twitter/X" },
  { id: "others", name: "Others" },
];

export const ACCOUNT_TYPE_MAP: Record<string, string> = Object.fromEntries(
  ACCOUNT_TYPES.map((t) => [t.id, t.name])
);
