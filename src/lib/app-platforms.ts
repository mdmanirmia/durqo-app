// Android & iOS Apps category only (Design & Development New.pdf — the
// "Update the Apps & Tools category to Android & iOS Apps" revision, Sep 5,
// 2026). Which platform(s) the app ships on. Originally a single-select
// (with a distinct "iOS & Android" option) but changed to a multi-select
// checkbox grid (Sep 5, 2026 follow-up — "1 seller can select 2 types") so
// a seller lists both platforms by checking both boxes, same mechanism as
// Business Type/Account Type: a comma-separated string of ids in the
// `platform` column (migration 020, constraint dropped in 021 to allow
// combined values like "ios,android") via the generic TEXT_QUICK_STAT_KEYS
// mechanism.
export const APP_PLATFORMS: { id: string; name: string }[] = [
  { id: "ios", name: "iOS" },
  { id: "android", name: "Android" },
];

export const APP_PLATFORM_MAP: Record<string, string> = Object.fromEntries(APP_PLATFORMS.map((p) => [p.id, p.name]));
