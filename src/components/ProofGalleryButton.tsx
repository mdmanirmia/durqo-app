"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

// Mirrors the real durqo.com listing page: a solid green pill button under
// each verified-data section that opens a lightbox with the seller's
// uploaded proof screenshots. Buyers can view these — they are not
// admin-only. `images` are real uploaded URLs from Supabase Storage, when
// there are any; otherwise this falls back to a labeled placeholder frame
// (used for the bundled mock listings, which predate real uploads).
export default function ProofGalleryButton({ label, images, count = 3 }: { label: string; images?: string[]; count?: number }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const hasRealImages = !!images && images.length > 0;
  const total = hasRealImages ? images!.length : count;

  return (
    <>
      {/* Text-only outline button (Sep 2026 listing-page redesign, section
          10: "text-only outline buttons for supporting images" replaces the
          previous solid emerald pill) — this component is exclusive to the
          listing detail page, so restyling it here doesn't touch any other
          page. No longer carries its own top margin: every caller now
          places this inside the same card as the data it documents (Proof
          of Income, GA/GSC/SEMrush/Ahrefs panels, Copyright Notes), so
          spacing is controlled by that container instead. */}
      <button
        type="button"
        onClick={() => {
          setIndex(0);
          setOpen(true);
        }}
        className="min-h-11 rounded-[10px] border border-[#E2E7E4] bg-white px-4 text-sm font-semibold text-[#0C1830] transition-colors hover:border-[#0C1830]"
      >
        View {label} Images
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C1830]/70 p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-[0_24px_48px_-16px_rgba(12,24,48,0.4)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-base font-semibold text-[#101828]">Image {index + 1}</h4>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full border border-[#E2E7E4] text-[#667085] hover:border-[#0EAE7A] hover:text-[#0EAE7A]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative grid aspect-video place-items-center overflow-hidden rounded-[10px] border border-[#E2E7E4] bg-[#F6F7F5] px-6 text-center text-sm text-[#98A2B3]">
              {hasRealImages ? (
                // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URLs, not a local /public asset
                <img src={images![index]} alt={`${label} screenshot ${index + 1}`} className="h-full w-full object-contain" />
              ) : (
                <span>{label} screenshot {index + 1} of {total} — uploaded by seller for verification</span>
              )}
              {total > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() => setIndex((i) => (i - 1 + total) % total)}
                    className="absolute left-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#667085] shadow hover:text-[#0EAE7A]"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() => setIndex((i) => (i + 1) % total)}
                    className="absolute right-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#667085] shadow hover:text-[#0EAE7A]"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>

            {total > 1 && (
              <div className="mt-3 flex items-center justify-center gap-1.5">
                {Array.from({ length: total }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to image ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-[#0EAE7A]" : "bg-[#E2E7E4]"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
