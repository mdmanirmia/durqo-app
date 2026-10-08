"use client";

import { useState } from "react";
import {
  Images,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

// A verified-data section's proof-of-upload trigger: a refined outline
// button (Sep 2026 premium redesign, v2 — a lighter touch than a solid
// green pill, matching the sidebar's outline buttons) that opens a
// lightbox with the seller's uploaded proof screenshots. Buyers can view
// these — they are not admin-only. Callers now place this inside the same
// card as the data it documents (its own footer strip), so it carries no
// outer margin of its own. `images` are real uploaded URLs from Supabase
// Storage, when there are any; otherwise this falls back to a labeled
// placeholder frame (used for the bundled mock listings, which predate
// real uploads).
//
// Oct 8, 2026 ("listing er image gulo full dekha jassena"): the frame used
// to be a fixed 16:9 box with overflow hidden, and the <img> sat in a grid
// cell where h-full didn't resolve, so tall screenshots (phone captures of
// Search Console / GA) were cropped top and bottom. The frame is now sized
// to the viewport (up to ~75vh) and the image is constrained with
// max-h/max-w + object-contain, so every image shows in full whatever its
// shape. The modal is wider, and an "Open full size" link opens the
// original file in a new tab for zooming in on small numbers.
export default function ProofGalleryButton({
  label,
  images,
  count = 3,
}: {
  label: string;
  images?: string[];
  count?: number;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const hasRealImages = !!images && images.length > 0;
  const total = hasRealImages ? images!.length : count;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIndex(0);
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-rule-strong bg-paper-raised px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-strong hover:text-ink"
      >
        <Images size={15} /> View {label} Images
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-3 sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-4xl rounded-xl bg-paper-raised p-3 shadow-[0_24px_48px_-16px_rgba(15,23,41,0.4)] sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-base font-semibold">
                Image {index + 1}
                {total > 1 && (
                  <span className="ml-1.5 text-sm font-normal text-ink-faint">
                    of {total}
                  </span>
                )}
              </h4>
              <div className="flex items-center gap-2">
                {hasRealImages && (
                  <a
                    href={images![index]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-rule-strong px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-brand hover:text-brand"
                  >
                    <ExternalLink size={13} /> Open full size
                  </a>
                )}
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-full border border-rule-strong text-ink-soft hover:border-brand hover:text-brand"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div
              className={`relative flex items-center justify-center overflow-hidden rounded-lg border border-rule bg-paper-sunk text-center text-sm text-ink-faint ${
                hasRealImages
                  ? "h-[min(75vh,820px)] px-12"
                  : "aspect-video px-6"
              }`}
            >
              {hasRealImages ? (
                // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URLs, not a local /public asset
                <img
                  key={images![index]}
                  src={images![index]}
                  alt={`${label} screenshot ${index + 1}`}
                  className="block max-h-full max-w-full object-contain"
                />
              ) : (
                <span>
                  {label} screenshot {index + 1} of {total} - uploaded by seller
                  for verification
                </span>
              )}
              {total > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() => setIndex((i) => (i - 1 + total) % total)}
                    className="absolute left-2 grid h-8 w-8 place-items-center rounded-full bg-paper-raised/90 text-ink-soft shadow hover:text-brand"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() => setIndex((i) => (i + 1) % total)}
                    className="absolute right-2 grid h-8 w-8 place-items-center rounded-full bg-paper-raised/90 text-ink-soft shadow hover:text-brand"
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
                    className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-brand" : "bg-rule-strong"}`}
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
