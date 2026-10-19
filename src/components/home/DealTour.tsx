"use client";

import { useEffect, useState } from "react";
import {
  Search,
  LineChart,
  CreditCard,
  ArrowLeftRight,
  Wallet,
  Check,
  BadgeCheck,
  MousePointer2,
  Globe,
  Layers,
  Smartphone,
  PlaySquare,
} from "lucide-react";

// Oct 19, 2026 ("ARO KI PHOTO OR VIDEO OR MOTION ... TUMI E SOB KISU
// KORBA"): an animated product tour that plays like a short video of one
// deal on Durqo, built in code instead of a video file so it stays sharp,
// light and accessible. It is an illustration of the flow, not a recording
// of a real deal, so the UI inside the window uses skeleton bars rather
// than invented listing names, prices or revenue figures.
//
// Copy follows the established accuracy rules for this flow: the Transfer
// Room opens only after the required payment has been received and
// verified; the buyer's inspection starts once every asset is marked
// Received; the payout becomes eligible when the buyer approves. Stripe /
// SSLCommerz are never described as escrow, and nothing is called "secure"
// as a guarantee.
const STEPS = [
  { icon: Search, title: "Browse reviewed listings", body: "Every listing is reviewed by our team before it goes live." },
  { icon: LineChart, title: "Check the real numbers", body: "Revenue, traffic and proof images, with connected analytics where available." },
  { icon: CreditCard, title: "Pay your way", body: "Card, Escrow.com, or in BDT with bKash, Nagad, Rocket, card or bank." },
  { icon: ArrowLeftRight, title: "Transfer Room", body: "Opens once the full payment is received and verified. Each asset is handed over and confirmed." },
  { icon: Wallet, title: "Seller gets paid", body: "The payout becomes eligible when the buyer approves the transfer." },
] as const;

const SCENE_MS = 4800;

function Skel({ w, className = "" }: { w: string; className?: string }) {
  return <span className={`block h-2 rounded-full bg-[#E2E8F0] ${className}`} style={{ width: w }} />;
}

function SceneBrowse() {
  const cards = [
    { icon: Globe, label: "WEBSITES" },
    { icon: Layers, label: "SAAS" },
    { icon: PlaySquare, label: "YOUTUBE" },
    { icon: Smartphone, label: "APPS" },
  ];
  return (
    <div className="relative">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 flex-1 items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[0.7rem] text-[#94A3B8]">
          <Search size={12} /> Search businesses
        </div>
        <span className="rounded-lg bg-[#0B1324] px-3 py-2 text-[0.65rem] font-semibold text-white">Filters</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {cards.map(({ icon: Icon, label }, i) => (
          <div
            key={label}
            className={`dq-pop rounded-xl border bg-white p-3 ${i === 1 ? "dq-tour-pick border-[#E2E8F0]" : "border-[#E2E8F0]"}`}
            style={{ animationDelay: i === 1 ? `${i * 140}ms, 2200ms` : `${i * 140}ms` }}
          >
            <div className="mb-2 flex items-center gap-1.5 text-[0.58rem] font-semibold tracking-wide text-[#94A3B8]">
              <Icon size={12} className="text-[#64748B]" /> {label}
            </div>
            <Skel w="75%" className="mb-1.5 h-2.5 bg-[#CBD5E1]" />
            <Skel w="92%" className="mb-1" />
            <Skel w="60%" />
            <div className="mt-2.5 flex items-center justify-between border-t border-[#EEF1F4] pt-2">
              <Skel w="36%" className="h-2.5 bg-[#CBD5E1]" />
              <span className="rounded-md bg-[#0B1324] px-1.5 py-0.5 text-[0.5rem] font-semibold text-white">View</span>
            </div>
          </div>
        ))}
      </div>
      <MousePointer2 size={22} className="dq-tour-cursor absolute text-[#0B1324]" fill="#fff" aria-hidden />
    </div>
  );
}

function SceneData() {
  return (
    <div>
      <div className="dq-pop mb-3 flex items-center justify-between">
        <div>
          <Skel w="140px" className="mb-1.5 h-3 bg-[#CBD5E1]" />
          <Skel w="90px" />
        </div>
        <span className="dq-pop flex items-center gap-1 rounded-full bg-[#E3F7EF] px-2 py-1 text-[0.6rem] font-bold text-[#047857]" style={{ animationDelay: "900ms" }}>
          <BadgeCheck size={12} /> GA verified
        </span>
      </div>
      <div className="dq-pop rounded-xl border border-[#E2E8F0] bg-white p-3" style={{ animationDelay: "150ms" }}>
        <div className="mb-2 flex items-center justify-between text-[0.6rem] font-semibold text-[#64748B]">
          <span>Revenue, last 12 months</span>
          <span className="text-[#94A3B8]">Monthly</span>
        </div>
        <svg viewBox="0 0 240 70" className="dq-tour-draw h-20 w-full" fill="none" aria-hidden>
          <path d="M0 69.5H240" stroke="#EEF1F4" />
          <path d="M0 35H240" stroke="#EEF1F4" strokeDasharray="3 4" />
          <polyline
            pathLength={1}
            points="0,58 22,54 44,56 66,46 88,48 110,38 132,40 154,30 176,26 198,28 220,16 240,10"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {["Revenue/mo", "Profit/mo", "Traffic"].map((l, i) => (
          <div key={l} className="dq-pop rounded-lg border border-[#E2E8F0] bg-white p-2" style={{ animationDelay: `${400 + i * 120}ms` }}>
            <div className="mb-1 text-[0.5rem] font-semibold uppercase tracking-wide text-[#94A3B8]">{l}</div>
            <Skel w="70%" className="h-2.5 bg-[#CBD5E1]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ScenePay() {
  const options = [
    { title: "Pay by Card", sub: "Through Stripe" },
    { title: "Pay with Escrow.com", sub: "Escrow.com holds the funds" },
    { title: "Pay in BDT", sub: "bKash, Nagad, Rocket, card or bank" },
  ];
  return (
    <div className="relative">
      <div className="dq-pop mb-3 flex items-center justify-between">
        <span className="text-[0.62rem] font-semibold uppercase tracking-wider text-[#64748B]">Choose how to pay</span>
        <Skel w="70px" className="h-3 bg-[#CBD5E1]" />
      </div>
      <div className="flex flex-col gap-2">
        {options.map((o, i) => (
          <div
            key={o.title}
            className={`dq-pop flex items-center justify-between rounded-xl border bg-white px-3 py-2.5 ${i === 2 ? "dq-tour-select" : "border-[#E2E8F0]"}`}
            style={{ animationDelay: i === 2 ? `${150 + i * 140}ms, 1200ms` : `${150 + i * 140}ms` }}
          >
            <div>
              <div className="text-[0.72rem] font-semibold text-[#111827]">{o.title}</div>
              <div className="text-[0.6rem] text-[#94A3B8]">{o.sub}</div>
            </div>
            <span className={`grid h-4 w-4 place-items-center rounded-full border ${i === 2 ? "dq-tour-radio" : "border-[#CBD5E1]"}`} />
          </div>
        ))}
      </div>
      <div className="dq-tour-toast mt-3 flex items-center gap-2 rounded-xl bg-[#0B1324] px-3 py-2.5 text-[0.68rem] font-semibold text-white">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-[#10B981]">
          <Check size={12} className="text-[#0B1324]" strokeWidth={3} />
        </span>
        Payment received and verified
      </div>
    </div>
  );
}

function SceneTransfer() {
  const items = ["Domain", "Hosting & source code", "Admin & social accounts"];
  return (
    <div>
      <div className="dq-pop mb-3 flex items-center justify-between">
        <span className="text-[0.62rem] font-semibold uppercase tracking-wider text-[#64748B]">Transfer Room</span>
        <span className="rounded-full bg-[#FBF3DD] px-2 py-0.5 text-[0.55rem] font-bold text-[#92730F]">IN PROGRESS</span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((it, i) => (
          <div key={it} className="dq-pop flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5" style={{ animationDelay: `${120 + i * 140}ms` }}>
            <span className="text-[0.7rem] font-semibold text-[#111827]">{it}</span>
            <span className="relative inline-grid text-[0.55rem] font-bold">
              <span className="dq-tour-status-a [grid-area:1/1] rounded-full bg-[#FBF3DD] px-2 py-0.5 text-[#92730F]" style={{ animationDelay: `${900 + i * 450}ms` }}>
                SUBMITTED
              </span>
              <span className="dq-tour-status-b [grid-area:1/1] flex items-center gap-1 rounded-full bg-[#E3F7EF] px-2 py-0.5 text-[#047857]" style={{ animationDelay: `${900 + i * 450}ms` }}>
                <Check size={10} strokeWidth={3} /> RECEIVED
              </span>
            </span>
          </div>
        ))}
      </div>
      <div className="dq-tour-toast mt-3 rounded-xl border border-dashed border-[#10B981] bg-[#E3F7EF] px-3 py-2 text-[0.62rem] font-semibold text-[#047857]" style={{ animationDelay: "2600ms" }}>
        All assets received. Buyer inspection has started.
      </div>
    </div>
  );
}

function ScenePayout() {
  return (
    <div className="flex flex-col items-center py-2 text-center">
      <span className="dq-pop dq-tour-ring grid h-16 w-16 place-items-center rounded-full bg-[#10B981] text-white">
        <Check size={30} strokeWidth={3} />
      </span>
      <div className="dq-pop mt-4 text-sm font-bold text-[#111827]" style={{ animationDelay: "200ms" }}>
        Buyer approved the transfer
      </div>
      <div className="dq-pop mt-1 text-[0.7rem] text-[#64748B]" style={{ animationDelay: "320ms" }}>
        The seller&rsquo;s payout is now eligible
      </div>
      <div className="dq-pop mt-4 w-full rounded-xl border border-[#E2E8F0] bg-white p-3 text-left" style={{ animationDelay: "500ms" }}>
        <div className="mb-2 text-[0.58rem] font-semibold uppercase tracking-wider text-[#94A3B8]">Withdraw to</div>
        <div className="flex flex-wrap gap-1.5">
          {["Bank", "bKash", "Nagad", "Rocket", "PayPal", "Wise"].map((m, i) => (
            <span key={m} className="dq-pop rounded-md border border-[#E2E8F0] px-2 py-1 text-[0.62rem] font-semibold text-[#334155]" style={{ animationDelay: `${650 + i * 80}ms` }}>
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const SCENES = [SceneBrowse, SceneData, ScenePay, SceneTransfer, ScenePayout];

export default function DealTour() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % STEPS.length), SCENE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const Scene = SCENES[index];

  return (
    <div
      className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <ol className="flex flex-col gap-1.5" aria-label="How a deal works on Durqo">
        {STEPS.map(({ icon: Icon, title, body }, i) => {
          const active = i === index;
          return (
            <li key={title}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-current={active ? "step" : undefined}
                className={`relative w-full overflow-hidden rounded-xl border px-4 py-3.5 text-left transition-colors ${
                  active ? "border-rule bg-paper-raised shadow-[0_16px_32px_-24px_rgba(11,19,36,0.35)]" : "border-transparent hover:bg-paper-raised/60"
                }`}
              >
                <span className="flex items-start gap-3.5">
                  <span
                    className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors ${
                      active ? "bg-brand text-white" : "bg-paper-sunk text-ink-soft"
                    }`}
                  >
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="mono mr-2 text-[0.68rem] font-semibold text-ink-faint">0{i + 1}</span>
                    <span className={`text-[0.95rem] font-semibold ${active ? "text-ink" : "text-ink-soft"}`}>{title}</span>
                    <span
                      className={`grid transition-[grid-template-rows,opacity] duration-500 ${
                        active ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <span className="overflow-hidden">
                        <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{body}</span>
                      </span>
                    </span>
                  </span>
                </span>
                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-rule">
                    <span
                      key={`${index}-${paused}`}
                      className={`block h-full bg-brand ${paused ? "w-full" : "dq-progress"}`}
                      style={{ animationDuration: `${SCENE_MS}ms` }}
                    />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="relative">
        <div className="dq-glow pointer-events-none absolute -inset-6 rounded-[2rem] bg-brand/15 blur-3xl" aria-hidden />
        <div className="relative overflow-hidden rounded-2xl border border-rule bg-[#F7F8FA] shadow-[0_40px_80px_-40px_rgba(11,19,36,0.45)]" aria-hidden>
          <div className="flex h-10 items-center gap-2 border-b border-[#E2E8F0] bg-white px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F87171]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FBBF24]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#34D399]" />
            <span className="ml-3 flex h-6 flex-1 items-center rounded-full bg-[#EEF1F4] px-3 text-[0.65rem] text-[#64748B]">
              durqo.com
            </span>
          </div>
          <div className="h-[340px] p-5 sm:p-6">
            <div key={index} className="h-full">
              <Scene />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
