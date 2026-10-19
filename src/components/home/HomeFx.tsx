"use client";

import { useEffect, useRef } from "react";

// Oct 19, 2026 ("aro valo kore motion and dynamic"): the homepage's
// pointer/scroll-driven effects in one small client component, so the page
// itself stays a server component.
//
// - Scroll progress: a thin brand line fixed to the top of the viewport.
// - Parallax: any [data-parallax="<speed>"] element drifts vertically at that
//   fraction of the scroll distance. Uses the CSS `translate` property, so it
//   stacks with an element's own transform animation (glow pulse, ring spin).
// - Tilt: any [data-tilt] element leans toward the pointer in 3D with a soft
//   glare (fine pointers only).
//
// Everything writes CSS variables / styles directly inside rAF (no React
// state, no re-renders) and is skipped entirely for prefers-reduced-motion.
export default function HomeFx() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const bar = barRef.current;
    const parallax = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
        // Parallax only matters while the hero is near the viewport.
        if (y < window.innerHeight * 1.5) {
          for (const el of parallax) {
            const speed = Number(el.dataset.parallax) || 0;
            el.style.translate = `0 ${(y * speed).toFixed(1)}px`;
          }
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    // 3D tilt with glare.
    const cleanups: Array<() => void> = [];
    if (window.matchMedia?.("(pointer: fine)").matches) {
      document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
        let tr = 0;
        const move = (e: PointerEvent) => {
          cancelAnimationFrame(tr);
          tr = requestAnimationFrame(() => {
            const r = el.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            el.style.setProperty("--rx", `${((0.5 - py) * 6).toFixed(2)}deg`);
            el.style.setProperty("--ry", `${((px - 0.5) * 8).toFixed(2)}deg`);
            el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
            el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
            el.dataset.tiltOn = "1";
          });
        };
        const leave = () => {
          cancelAnimationFrame(tr);
          el.style.setProperty("--rx", "0deg");
          el.style.setProperty("--ry", "0deg");
          delete el.dataset.tiltOn;
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          cancelAnimationFrame(tr);
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        });
      });
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return (
    <div
      ref={barRef}
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px] origin-left bg-brand motion-reduce:hidden"
      style={{ transform: "scaleX(0)" }}
    />
  );
}
