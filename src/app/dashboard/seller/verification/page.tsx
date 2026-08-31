"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Clock, CheckCircle2, XCircle, Upload } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SELLER_NAV } from "@/lib/dashboard-nav";
import { getMyVerification, uploadVerificationDocuments, type VerificationStatus } from "@/lib/data/verification.client";
import { submitVerification } from "./actions";

const METHODS = [
  { id: "passport", label: "Passport" },
  { id: "national_id", label: "National ID" },
  { id: "driving_license", label: "Driving License" },
] as const;

export default function VerificationPage() {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [methodId, setMethodId] = useState<(typeof METHODS)[number]["id"] | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyVerification().then((v) => {
      if (!cancelled) setStatus(v?.status ?? "unverified");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit() {
    if (!methodId) return setError("Choose a document type first.");
    if (files.length === 0) return setError("Upload at least one document.");
    setError(null);
    setSubmitting(true);
    try {
      const paths = await uploadVerificationDocuments(files);
      await submitVerification(methodId, paths);
      setStatus("pending");
      setFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <h2 className="mb-2 text-xl">Identity verification</h2>
      <p className="mb-6 max-w-[60ch] text-sm text-ink-soft">
        Verified sellers get a badge on every listing and rank higher in search. Choose one document to verify — this only needs to be done once.
      </p>

      {status === null && <p className="text-sm text-ink-faint">Loading&hellip;</p>}

      {status === "pending" && (
        <div className="flex max-w-md items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <Clock size={20} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <div className="font-semibold text-amber-900">Under review</div>
            <p className="mt-1 text-sm text-amber-800">
              Your documents were submitted and are being reviewed by our team. We&rsquo;ll email you as soon as a decision is made — usually within 1–2 business days.
            </p>
          </div>
        </div>
      )}

      {status === "verified" && (
        <div className="flex max-w-md items-start gap-3 rounded-xl border border-brand/30 bg-brand-soft px-5 py-4">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-brand-strong" />
          <div>
            <div className="font-semibold text-brand-strong">Verified</div>
            <p className="mt-1 text-sm text-ink-soft">Your identity has been verified. The verified badge now shows on your listings.</p>
          </div>
        </div>
      )}

      {(status === "unverified" || status === "rejected") && (
        <div className="max-w-md">
          {status === "rejected" && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
              <XCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
              <div>
                <div className="font-semibold text-red-800">Not approved</div>
                <p className="mt-1 text-sm text-red-700">Your last submission wasn&rsquo;t approved. Please double-check the document is clear and legible, then resubmit below.</p>
              </div>
            </div>
          )}

          <p className="mono mb-2 text-[0.68rem] uppercase tracking-wide text-ink-faint">1. Choose a document</p>
          <div className="mb-5 flex flex-col gap-3">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethodId(m.id)}
                className={`flex items-center justify-between rounded-lg border px-4 py-3.5 text-left transition ${
                  methodId === m.id ? "border-brand-strong bg-brand-soft" : "border-rule bg-paper-raised hover:border-rule-strong"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className={methodId === m.id ? "text-brand-strong" : "text-ink-faint"} />
                  <span className="font-medium">{m.label}</span>
                </div>
                <span
                  className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                    methodId === m.id ? "border-brand-strong bg-brand-strong" : "border-rule-strong"
                  }`}
                />
              </button>
            ))}
          </div>

          <p className="mono mb-2 text-[0.68rem] uppercase tracking-wide text-ink-faint">2. Upload document photos</p>
          <label className="mb-1 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-rule-strong bg-paper-raised px-4 py-8 text-center hover:border-brand-strong">
            <Upload size={20} className="text-ink-faint" />
            <span className="text-sm font-medium text-ink">Click to upload one or more photos</span>
            <span className="text-xs text-ink-faint">Front &amp; back if applicable — JPG, PNG or PDF</span>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </label>
          {files.length > 0 && (
            <ul className="mb-4 mt-2 flex flex-col gap-1 text-sm text-ink-soft">
              {files.map((f) => (
                <li key={f.name}>{f.name}</li>
              ))}
            </ul>
          )}

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-brand-strong px-5 py-2.5 text-sm font-semibold text-paper-raised hover:bg-brand disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit for review"}
          </button>
        </div>
      )}
    </DashboardShell>
  );
}
