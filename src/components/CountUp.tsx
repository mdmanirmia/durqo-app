"use client";

import { useEffect, useRef } from "react";

// Oct 19, 2026 (homepage motion): animates the number inside a pre-formatted
// stat string ("23", "$123.6K", "1,204") from 0 up to its value the first
// time it scrolls into view, keeping any prefix/suffix, decimal places and
// thousands separators. The server-rendered text is always the final value,
// so crawlers, no-JS visitors and reduced-motion users just see the number.
// Writes the DOM text directly from requestAnimationFrame (no React state per
// frame).
export default function CountUp({ value, duration = 1400 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const m = value.match(/^(\D*)([\d,]*\.?\d+)(.*)$/);
    if (!m) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const [, prefix, numText, suffix] = m;
    const target = Number(numText.replace(/,/g, ""));
    if (!Number.isFinite(target) || target === 0) return;
    const decimals = numText.includes(".") ? numText.split(".")[1].length : 0;
    const useGrouping = numText.includes(",");
    const fmt = (n: number) =>
      prefix +
      n.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping,
      }) +
      suffix;

    let raf = 0;
    el.textContent = fmt(0);
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = fmt(target * eased);
          if (t < 1) raf = requestAnimationFrame(tick);
          else el.textContent = value;
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = value;
    };
  }, [value, duration]);

  return <span ref={ref}>{value}</span>;
}
