"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";
import { trackSellerArticleView, trackSellerCtaClick } from "@/lib/analytics";

const SLUG = "sell-your-online-business-bangladesh";

// Sep 27, 2026: fires once when this seller-acquisition content page is
// viewed, marking the "Article View" step of the funnel this page exists to
// feed - Ad Click -> Article View -> Sell CTA Click -> Listing Started ->
// Listing Submitted -> Listing Approved (see claude/bangladesh-seller-
// acquisition-page-and-ad-copy-addendum.md). A separate tiny client
// component rather than a hook inline in page.tsx, so page.tsx itself can
// stay a Server Component for its Metadata export while still getting an
// onMount client effect.
export function ArticleViewTracker() {
  useEffect(() => {
    trackSellerArticleView({ slug: SLUG });
  }, []);
  return null;
}

type TrackedCtaProps = React.ComponentProps<typeof Button> & {
  href: string;
  /**
   * Short, stable label for which of this page's several CTAs was clicked
   * (e.g. "hero_primary", "final_secondary") - not the button's visible
   * text, so relabeling a button's copy later doesn't silently rename its
   * GA4 event.
   */
  cta: string;
};

// Thin wrapper around the shared Button component that also fires
// seller_cta_click right before the click's own navigation - the funnel
// step between Article View and Listing Started.
export default function TrackedCta({ cta, ...rest }: TrackedCtaProps) {
  return (
    <Button
      {...rest}
      onClick={() => {
        trackSellerCtaClick({ slug: SLUG, cta });
      }}
    />
  );
}
