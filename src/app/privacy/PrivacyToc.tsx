"use client";

import { useEffect, useId, useRef, useState } from "react";

type TocItem = { id: string; num: string; title: string };

// Sep 6, 2026 Privacy-page rebuild — same accessible pattern as
// src/app/terms/TermsToc.tsx (scroll-spy sticky sidebar on desktop, a real
// disclosure <button> on mobile). Kept as its own file rather than sharing
// TermsToc directly: this task is scoped to /privacy only, and a shared
// component would mean touching the Terms page's import to adopt it, which
// isn't part of this change.
export default function PrivacyToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const top = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
          setActiveId(top.target.id);
        }
      },
      { rootMargin: "-112px 0px -70% 0px", threshold: 0 }
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && !buttonRef.current?.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Desktop: sticky sidebar with scroll-spy active indicator */}
      <nav aria-label="Table of contents" className="hidden lg:block">
        <div className="sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col gap-0.5 overflow-y-auto border-l border-rule pl-4">
          <p className="mono mb-2 text-xs uppercase tracking-wide text-ink-faint">On this page — {items.length} sections</p>
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={active ? "location" : undefined}
                className={`rounded-md px-2 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-brand-soft font-semibold text-brand-strong"
                    : "text-ink-soft hover:bg-paper-sunk hover:text-brand-hover"
                }`}
              >
                {item.num}. {item.title}
              </a>
            );
          })}
        </div>
      </nav>

      {/* Mobile: accessible disclosure listing every section */}
      <div className="lg:hidden">
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={mobileOpen}
          aria-controls={panelId}
          onClick={() => setMobileOpen((v) => !v)}
          className="flex min-h-11 w-full items-center justify-between rounded-lg border border-rule bg-paper-raised px-4 py-3 text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          On this page — {items.length} sections
          <span aria-hidden className={`text-ink-faint transition-transform ${mobileOpen ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>
        {mobileOpen && (
          <div
            id={panelId}
            ref={panelRef}
            className="mt-2 flex flex-col gap-0.5 rounded-lg border border-rule bg-paper-raised p-2 shadow-sm"
          >
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={item.id === activeId ? "location" : undefined}
                onClick={() => setMobileOpen(false)}
                className={`min-h-11 rounded-md px-3 py-2.5 text-sm ${
                  item.id === activeId ? "bg-brand-soft font-semibold text-brand-strong" : "text-ink-soft"
                }`}
              >
                {item.num}. {item.title}
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
