"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SELLER_NAV } from "@/lib/dashboard-nav";

interface Ga4Property {
  propertyId: string;
  propertyDisplayName: string;
  accountDisplayName: string;
}

// Shown after the OAuth callback when the seller's Google account has more
// than one GA4 property visible — lets them pick which one this listing
// should sync from. See /api/google-analytics/pending-properties and
// /api/google-analytics/select-property.
export default function GaPropertyPicker() {
  const router = useRouter();
  const params = useSearchParams();
  const listingId = params.get("listingId");

  const [properties, setProperties] = useState<Ga4Property[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    if (!listingId) {
      Promise.resolve().then(() => setError("Missing listing."));
      return;
    }
    fetch(`/api/google-analytics/pending-properties?listingId=${listingId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setProperties(data.properties ?? []);
      })
      .catch(() => setError("Couldn't load your Google Analytics properties."));
  }, [listingId]);

  async function choose(property: Ga4Property) {
    if (!listingId) return;
    setSelecting(true);
    setError(null);
    try {
      const res = await fetch("/api/google-analytics/select-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, property }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Couldn't connect that property.");
      router.push("/dashboard/seller?ga_connected=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't connect that property.");
      setSelecting(false);
    }
  }

  return (
    <DashboardShell title="Seller Dashboard" nav={SELLER_NAV} switchHref="/dashboard/buyer" switchLabel="Go to Buyer Dashboard">
      <h2 className="mb-1 text-xl">Choose a Google Analytics property</h2>
      <p className="mb-6 text-sm text-ink-faint">
        Your Google account has access to more than one GA4 property — pick the one for this listing&rsquo;s website.
      </p>

      {error && (
        <p className="mb-4 flex items-center gap-2 rounded-md border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
          <AlertCircle size={15} /> {error}
        </p>
      )}

      {properties === null && !error ? (
        <p className="text-sm text-ink-faint">Loading&hellip;</p>
      ) : properties && properties.length === 0 ? (
        <p className="text-sm text-ink-faint">No properties found.</p>
      ) : (
        <div className="flex max-w-lg flex-col gap-2">
          {properties?.map((p) => (
            <button
              key={p.propertyId}
              type="button"
              disabled={selecting}
              onClick={() => choose(p)}
              className="flex items-center justify-between rounded-md border border-rule-strong px-4 py-3 text-left text-sm hover:border-brand-strong disabled:opacity-60"
            >
              <span>
                <span className="block font-medium text-ink">{p.propertyDisplayName}</span>
                <span className="block text-xs text-ink-faint">{p.accountDisplayName}</span>
              </span>
              <CheckCircle2 size={16} className="text-ink-faint" />
            </button>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
