"use client";

import { createClient } from "@/lib/supabase/client";

const STORAGE_BUCKET = "seller-verification";

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface MyVerification {
  status: VerificationStatus;
  method: string | null;
  submittedAt: string | null;
}

export async function getMyVerification(): Promise<MyVerification | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("verification_status, verification_method, verification_submitted_at")
    .eq("id", user.id)
    .single();

  if (!data) return null;
  return {
    status: (data.verification_status as VerificationStatus) ?? "unverified",
    method: data.verification_method,
    submittedAt: data.verification_submitted_at,
  };
}

// Uploads each file straight to the private seller-verification bucket
// under the signed-in user's own uid — the only path RLS lets them write
// to (see supabase/migrations/007_seller_verification.sql). Returns the
// storage paths so the caller can hand them to the submitVerification
// Server Action, which records the submission and sends the notification
// emails server-side.
export async function uploadVerificationDocuments(files: File[]): Promise<string[]> {
  const supabase = createClient();
  if (!supabase) throw new Error("Backend not connected");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const paths: string[] = [];
  for (const file of files) {
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file);
    if (error) throw new Error(`Upload failed: ${error.message}`);
    paths.push(path);
  }
  return paths;
}
