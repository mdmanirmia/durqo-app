"use client";

import { createClient } from "@/lib/supabase/client";
import { sanitizeFileName } from "@/lib/sanitize-filename";

// Buyer identity/funds verification (KYC policy, Sep 2026) — mirrors
// verification.client.ts's seller-verification upload flow exactly, but
// against the separate `buyer-verification` bucket
// (053_kyc_name_match_and_buyer_verification.sql). An admin flags a
// specific order (requestBuyerVerification, dashboard/admin/actions.ts);
// the buyer uploads their documents straight to their own owner-scoped
// folder here, then hands the resulting paths to
// submit_buyer_verification() (a SECURITY DEFINER RPC, not a plain table
// write — this table has no client insert/update policy at all).
const STORAGE_BUCKET = "buyer-verification";

export async function uploadBuyerVerificationDocuments(files: File[]): Promise<string[]> {
  const supabase = createClient();
  if (!supabase) throw new Error("Backend not connected");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const paths: string[] = [];
  for (const file of files) {
    const path = `${user.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file);
    if (error) throw new Error(`Upload failed: ${error.message}`);
    paths.push(path);
  }
  return paths;
}

export async function submitBuyerVerification(orderId: string, documentPaths: string[]): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Backend not connected" };

  const { error } = await supabase.rpc("submit_buyer_verification", { p_order_id: orderId, p_document_paths: documentPaths });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
