"use client";

// Powers the live admin nav badges (Listings/Verification/Withdrawals) in
// DashboardShell.tsx — see src/app/api/admin/badge-counts/route.ts for why
// this goes through an API route rather than a direct Supabase call like
// every other nav badge helper in this directory.
export interface AdminBadgeCounts {
  listings: number;
  verification: number;
  withdrawals: number;
}

export async function getAdminBadgeCounts(): Promise<AdminBadgeCounts> {
  try {
    const res = await fetch("/api/admin/badge-counts");
    if (!res.ok) return { listings: 0, verification: 0, withdrawals: 0 };
    return await res.json();
  } catch {
    return { listings: 0, verification: 0, withdrawals: 0 };
  }
}
