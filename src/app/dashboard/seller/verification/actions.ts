"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

const METHODS = ["passport", "national_id", "driving_license"] as const;
type Method = (typeof METHODS)[number];

const METHOD_LABEL: Record<Method, string> = {
  passport: "Passport",
  national_id: "National ID",
  driving_license: "Driving License",
};

// Called after the browser has already uploaded the document(s) straight
// to the private seller-verification Storage bucket (see
// verification.client.ts) — this just records the submission. It can
// NEVER set status to "verified" itself: that only ever happens from
// setVerificationStatus() in dashboard/admin/actions.ts, using the
// service-role client, after a human reviews the uploaded documents.
export async function submitVerification(method: Method, documentPaths: string[]) {
  if (!METHODS.includes(method)) throw new Error("Invalid verification method");
  if (documentPaths.length === 0) throw new Error("At least one document is required");

  const supabase = await createClient();
  if (!supabase) throw new Error("Backend not connected");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

  const { error } = await supabase
    .from("profiles")
    .update({
      verification_status: "pending",
      verification_method: method,
      verification_document_paths: documentPaths,
      verification_submitted_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/seller/verification");

  // Best-effort notification emails — seller gets a confirmation, every
  // admin gets a heads-up to go review it. Failures here never block the
  // submission itself (sendEmail already swallows its own errors).
  const sellerName = profile?.full_name || "A seller";
  const sellerEmail = user.email;

  const hdrs = await headers();
  const host = hdrs.get("host");
  const origin = host ? `${host.includes("localhost") ? "http" : "https"}://${host}` : "https://www.steeltechproductsltd.com";

  const admin = createAdminClient();
  let adminEmails: string[] = [];
  if (admin) {
    const { data: adminProfiles } = await admin.from("profiles").select("id").eq("role", "admin");
    const adminIds = new Set((adminProfiles ?? []).map((p) => p.id as string));
    if (adminIds.size) {
      const { data: usersList } = await admin.auth.admin.listUsers();
      adminEmails = (usersList?.users ?? [])
        .filter((u) => adminIds.has(u.id) && !!u.email)
        .map((u) => u.email as string);
    }
  }

  if (sellerEmail) {
    await sendEmail(
      sellerEmail,
      "We've received your verification documents",
      `<p>Hi ${sellerName},</p>
       <p>Thanks for submitting your ${METHOD_LABEL[method]} for identity verification. Our team will review it and email you the outcome — this usually takes 1–2 business days.</p>
       <p>— Durqo</p>`
    );
  }
  if (adminEmails.length) {
    await sendEmail(
      adminEmails,
      `New seller verification request — ${sellerName}`,
      `<p>${sellerName} (${sellerEmail ?? "no email on file"}) submitted a ${METHOD_LABEL[method]} for identity verification.</p>
       <p><a href="${origin}/dashboard/admin/verification">Review it in the admin dashboard</a>.</p>`
    );
  }

  return { ok: true };
}
