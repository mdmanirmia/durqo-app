"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Mounted once in the root layout. Finds every [data-reveal] element in the
// document and flips it to data-reveal="true" (see globals.css for the
// opacity/translate transition that attribute drives) the first time it
// scrolls into view, then stops observing it — a lightweight, dependency-free
// scroll-reveal effect that works across server-rendered pages without
// needing every section to be its own client component.
//
// Oct 19, 2026: re-runs on every route change (pathname dependency). It used
// to run only once, when the root layout first mounted, so after a
// client-side navigation the new page's [data-reveal] elements were never
// observed and stayed invisible. Only elements not yet revealed are picked up.
export default function ScrollRevealInit() {
  const pathname = usePathname();

  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]:not([data-reveal="true"])');
    if (els.length === 0) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.setAttribute("data-reveal", "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-reveal", "true");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
