// Android & iOS Apps category only (Design & Development New.pdf — the
// "Update the Apps & Tools category to Android & iOS Apps" revision, Sep 5,
// 2026) — which platform(s) the app ships on. Unlike Business Type/Account
// Type (comma-separated multi-select ids sharing one column), this is a
// single-select field: "iOS & Android" is its own distinct option, not a
// shorthand for checking both the "iOS" and "Android" boxes at once. Stored
// as a single plain-text value in the new `platform` column (migration 020)
// via the generic TEXT_QUICK_STAT_KEYS mechanism, rendered as a <select>
// rather than a checkbox grid on both listing forms.
export const APP_PLATFORMS: { id: string; name: string }[] = [
  { id: "ios", name: "iOS" },
  { id: "android", name: "Android" },
  { id: "ios-android", name: "iOS & Android" },
];

export const APP_PLATFORM_MAP: Record<string, string> = Object.fromEntries(APP_PLATFORMS.map((p) => [p.id, p.name]));
