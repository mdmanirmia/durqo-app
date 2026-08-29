"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Requires NEXT_PUBLIC_SUPABASE_URL and
// NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local — see .env.example.
// Until those are set, callers should fall back to mock data (see
// src/lib/mock-data.ts) rather than throw, so the app still runs.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
