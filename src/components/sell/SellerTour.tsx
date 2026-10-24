"use client";

import { useEffect, useState } from "react";
import {
  Calculator,
  FileCheck2,
  MessageSquare,
  CreditCard,
  ArrowLeftRight,
  Wallet,
  Check,
  BadgeCheck,
  Landmark,
  Smartphone,
  Clock,
} from "lucide-react";

// Oct 24, 2026 (/sell: "sell korar step gulo o dite paro transfer room,
// then kivabe payout korbe ki ki methods etc ... sob kisu motion type"):
// the seller's whole journey as an auto-playing product tour, same
// technique as the homepage DealTour (src/components/home/DealTour.tsx).
// It's an illustration of the flow, not a recording of a real deal, so the
// UI inside the window uses skeleton bars instead of invented names or
// amounts. Every rule stated here mirrors the published policy pages:
// /transfer-room (Transfer Room opens once payment is received and
// verified; 7-day inspection; buyer approves), /seller-payouts (KYC before
// the first withdrawal, fee already netted, estimated 3-5 business days,
// six methods with the bKash/Rocket/Nagad caps, Escrow.com pays directly).
const STEPS = [
  { icon: Calculator, url: "durqo.com/valuation", title: "Get a free valuation", body: "Enter your revenue, profit and business type to see an estimated value range." },
  { icon: FileCheck2, url: "durqo.com/dashboard/seller/listings/new", title: "Submit your listing", body: "Add your numbers, proof and assets. Our team reviews every listing before it goes live." },
  { icon: MessageSquare, url: "durqo.com/dashboard/messages", title: "Talk to buyers", body: "Interested buyers message you directly. Answer questions and share details." },
  { icon: CreditCard, url: "durqo.com/checkout", title: "Buyer pays", body: "The buyer pays by card, Escrow.com or in BDT. The Transfer Room opens once the payment is received and verified." },
  { icon: ArrowLeftRight, url: "durqo.com/transfer-room", title: "Hand over in the Transfer Room", body: "Mark each asset Submitted. The buyer marks it Received, inspects within 7 days and approves the transfer." },
  { icon: Wallet, url: "durqo.com/dashboard/seller/payouts", title: "Withdraw your earnings", body: "Once the sale is completed, request a payout to your bank, PayPal, Wise, bKash, Nagad or Rocket." },
] as const;

const SCENE_MS = 3600;

function Skel({ w, className = "" }: { w: string; className?: string }) {
  return <span className={`block h-2 rounded-full bg-[#E2E8F0] ${className}`} style={{ width: w }} />;
}

function SceneValuation() {
  const fields = ["Monthly revenue", "Monthly profit", "Business type"];
  return (
    <div className="flex h-full flex-col">
      <div className="dq-pop mb-3 text-[0.62rem] font-semibold uppercase tracking-wider text-[#64748B]">Free valuation</div>
      <div className="flex flex-col gap-2">
        {fields.map((f, i) => (
          <div key={f} className="dq-pop flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5" style={{ animationDelay: `${80 + i * 90}ms` }}>
            <span className="text-[0.68rem] font-semibold text-[#64748B]">{f}</span>
            <Skel w="70px" className="h-2.5 bg-[#CBD5E1]" />
          </div>
        ))}
      </div>
      <div className="dq-tour-toast mt-3 rounded-xl bg-[#E3F7EF] p-3" style={{ animationDelay: "700ms" }}>
        <div className="text-[0.58rem] font-semibold uppercase tracking-wider text-[#047857]">Estimated valuation range</div>
        <div className="mt-2 flex items-center gap-2">
          <Skel w="38%" className="h-3 bg-[#10B981]/60" />
          <span className="text-[0.7rem] text-[#047857]">to</span>
          <Skel w="38%" className="h-3 bg-[#10B981]/60" />
        </div>
      </div>
    </div>
  );
}

function SceneSubmit() {
  return (
    <div className="flex h-full flex-col">
      <div className="dq-pop mb-3 flex items-center justify-between">
        <span className="text-[0.62rem] font-semibold uppercase tracking-wider text-[#64748B]">New listing</span>
        <span className="relative inline-grid text-[0.55rem] font-bold">
          <span className="dq-tour-status-a [grid-area:1/1] rounded-full bg-[#FBF3DD] px-2 py-0.5 text-[#92730F]" style={{ animationDelay: "1300ms" }}>
            PENDING REVIEW
          </span>
          <span className="dq-tour-status-b [grid-area:1/1] flex items-center gap-1 rounded-full bg-[#E3F7EF] px-2 py-0.5 text-[#047857]" style={{ animationDelay: "1300ms" }}>
            <Check size={10} strokeWidth={3} /> PUBLISHED
          </span>
        </span>
      </div>
      <div className="dq-pop rounded-xl border border-[#E2E8F0] bg-white p-3" style={{ animationDelay: "80ms" }}>
        <Skel w="55%" className="mb-2 h-3 bg-[#CBD5E1]" />
        <Skel w="92%" className="mb-1.5" />
        <Skel w="80%" />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {["Proof of income", "Analytics", "Assets"].map((l, i) => (
          <div key={l} className="dq-pop rounded-lg border border-[#E2E8F0] bg-white p-2" style={{ animationDelay: `${200 + i * 90}ms` }}>
            <div className="mb-1.5 flex items-center gap-1 text-[0.5rem] font-semibold uppercase tracking-wide text-[#94A3B8]">
              <Check size={9} strokeWidth={3} className="text-[#10B981]" /> {l}
            </div>
            <Skel w="70%" className="h-2 bg-[#CBD5E1]" />
          </div>
        ))}
      </div>
      <div className="dq-tour-toast mt-3 flex items-center gap-2 rounded-xl bg-[#0B1324] px-3 py-2.5 text-[0.68rem] font-semibold text-white" style={{ animationDelay: "800ms" }}>
        <BadgeCheck size={14} className="text-[#10B981]" /> Reviewed by the Durqo team
      </div>
    </div>
  );
}

function SceneMessages() {
  const bubbles = [
    { mine: false, w: ["70%", "45%"] },
    { mine: true, w: ["65%"] },
    { mine: false, w: ["55%"] },
    { mine: true, w: ["75%", "40%"] },
  ];
  return (
    <div className="flex h-full flex-col">
      <div className="dq-pop mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#E2E8F0]" />
        <div className="flex-1">
          <Skel w="90px" className="mb-1 h-2.5 bg-[#CBD5E1]" />
          <span className="text-[0.55rem] font-semibold text-[#047857]">Interested buyer</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {bubbles.map((b, i) => (
          <div
            key={i}
            className={`dq-pop max-w-[78%] rounded-2xl px-3 py-2.5 ${b.mine ? "self-end rounded-br-md bg-[#0B1324]" : "self-start rounded-bl-md bg-white ring-1 ring-[#E2E8F0]"}`}
            style={{ animationDelay: `${150 + i * 350}ms`, width: "78%" }}
          >
            {b.w.map((w, j) => (
              <Skel key={j} w={w} className={`${j ? "mt-1.5" : ""} ${b.mine ? "bg-white/30" : ""}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScenePay() {
  const options = ["Pay by Card", "Pay with Escrow.com", "Pay in BDT"];
  return (
    <div className="flex h-full flex-col">
      <div className="dq-pop mb-3 text-[0.62rem] font-semibold uppercase tracking-wider text-[#64748B]">Buyer checkout</div>
      <div className="flex flex-col gap-2">
        {options.map((o, i) => (
          <div
            key={o}
            className={`dq-pop flex items-center justify-between rounded-xl border bg-white px-3 py-2.5 ${i === 0 ? "dq-tour-select" : "border-[#E2E8F0]"}`}
            style={{ animationDelay: i === 0 ? `${80 + i * 80}ms, 700ms` : `${80 + i * 80}ms` }}
          >
            <span className="text-[0.72rem] font-semibold text-[#111827]">{o}</span>
            <span className={`grid h-4 w-4 place-items-center rounded-full border ${i === 0 ? "dq-tour-radio" : "border-[#CBD5E1]"}`} />
          </div>
        ))}
      </div>
      <div className="dq-tour-toast mt-3 flex items-center gap-2 rounded-xl bg-[#0B1324] px-3 py-2.5 text-[0.68rem] font-semibold text-white">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-[#10B981]">
          <Check size={12} className="text-[#0B1324]" strokeWidth={3} />
        </span>
        Payment received and verified
      </div>
      <div className="dq-tour-toast mt-2 flex items-center gap-2 rounded-xl border border-dashed border-[#10B981] bg-[#E3F7EF] px-3 py-2 text-[0.62rem] font-semibold text-[#047857]" style={{ animationDelay: "1500ms" }}>
        <ArrowLeftRight size={12} /> Transfer Room is now open
      </div>
    </div>
  );
}

function SceneTransfer() {
  const items = ["Domain", "Hosting & source code", "Admin & social accounts"];
  return (
    <div className="flex h-full flex-col">
      <div className="dq-pop mb-3 flex items-center justify-between">
        <span className="text-[0.62rem] font-semibold uppercase tracking-wider text-[#64748B]">Transfer Room</span>
        <span className="flex items-center gap-1 rounded-full bg-[#EEF1F4] px-2 py-0.5 text-[0.55rem] font-bold text-[#64748B]">
          <Clock size={10} /> 7-DAY INSPECTION
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((it, i) => (
          <div key={it} className="dq-pop flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5" style={{ animationDelay: `${60 + i * 80}ms` }}>
            <span className="text-[0.7rem] font-semibold text-[#111827]">{it}</span>
            <span className="relative inline-grid text-[0.55rem] font-bold">
              <span className="dq-tour-status-a [grid-area:1/1] rounded-full bg-[#FBF3DD] px-2 py-0.5 text-[#92730F]" style={{ animationDelay: `${450 + i * 280}ms` }}>
                SUBMITTED
              </span>
              <span className="dq-tour-status-b [grid-area:1/1] flex items-center gap-1 rounded-full bg-[#E3F7EF] px-2 py-0.5 text-[#047857]" style={{ animationDelay: `${450 + i * 280}ms` }}>
                <Check size={10} strokeWidth={3} /> RECEIVED
              </span>
            </span>
          </div>
        ))}
      </div>
      <div className="dq-tour-toast mt-3 flex items-center gap-2 rounded-xl bg-[#0B1324] px-3 py-2.5 text-[0.68rem] font-semibold text-white" style={{ animationDelay: "1600ms" }}>
        <span className="grid h-5 w-5 place-items-center rounded-full bg-[#10B981]">
          <Check size={12} className="text-[#0B1324]" strokeWidth={3} />
        </span>
        Buyer approved the transfer
      </div>
    </div>
  );
}

function ScenePayout() {
  const methods = [
    { name: "Bank", icon: Landmark, color: "#0B1324" },
    { name: "PayPal", icon: Wallet, color: "#1D4E9E" },
    { name: "Wise", icon: Wallet, color: "#2F7A2F" },
    { name: "bKash", icon: Smartphone, color: "#E2136E" },
    { name: "Nagad", icon: Smartphone, color: "#EC6C1F" },
    { name: "Rocket", icon: Smartphone, color: "#8C3494" },
  ];
  const flow = ["Requested", "Under review", "Approved", "Processing", "Paid"];
  return (
    <div className="flex h-full flex-col">
      <div className="dq-pop rounded-xl bg-[#0B1324] p-3 text-white">
        <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-white/60">Available to withdraw (fee already deducted)</div>
        <Skel w="45%" className="mt-2 h-3.5 bg-[#10B981]" />
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-1.5">
        {methods.map((m, i) => (
          <div
            key={m.name}
            className={`dq-pop flex items-center gap-1.5 rounded-lg border bg-white px-2 py-1.5 ${i === 0 ? "dq-tour-select" : "border-[#E2E8F0]"}`}
            style={{ animationDelay: i === 0 ? `${120 + i * 60}ms, 900ms` : `${120 + i * 60}ms` }}
          >
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded text-white" style={{ backgroundColor: m.color }}>
              <m.icon size={11} />
            </span>
            <span className="truncate text-[0.62rem] font-semibold text-[#334155]">{m.name}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1">
        {flow.map((f, i) => (
          <span key={f} className="flex min-w-0 flex-1 items-center gap-1">
            <span
              className="dq-pop min-w-0 flex-1 truncate rounded-full bg-[#E3F7EF] px-1.5 py-1 text-center text-[0.5rem] font-bold uppercase tracking-wide text-[#047857]"
              style={{ animationDelay: `${1100 + i * 220}ms` }}
            >
              {f}
            </span>
          </span>
        ))}
      </div>
      <p className="dq-tour-toast mt-2 text-center text-[0.58rem] text-[#64748B]" style={{ animationDelay: "2300ms" }}>
        Normally reviewed within an estimated 3-5 business days
      </p>
    </div>
  );
}

const SCENES = [SceneValuation, SceneSubmit, SceneMessages, ScenePay, SceneTransfer, ScenePayout];

export default function SellerTour() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % STEPS.length), SCENE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const Scene = SCENES[index];
  const step = STEPS[index];
  const StepIcon = step.icon;

  return (
    <div
      className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <ol className="relative flex flex-col gap-1" aria-label="How selling works on Durqo">
        <span className="pointer-events-none absolute bottom-8 left-[2.2rem] top-8 w-[2px] -translate-x-1/2 rounded-full bg-rule" aria-hidden>
          <span
            className="absolute inset-x-0 top-0 rounded-full bg-brand transition-[height] duration-500 ease-out"
            style={{ height: `${(index / (STEPS.length - 1)) * 100}%` }}
          />
        </span>
        {STEPS.map(({ icon: Icon, title, body }, i) => {
          const active = i === index;
          const done = i < index;
          return (
            <li key={title} className="relative">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-current={active ? "step" : undefined}
                className={`relative w-full overflow-hidden rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${
                  active
                    ? "border-brand/25 bg-paper-raised shadow-[0_18px_40px_-26px_rgba(11,19,36,0.4)] lg:translate-x-1.5"
                    : "border-transparent hover:bg-paper-raised/60"
                }`}
              >
                {active && <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-brand" aria-hidden />}
                <span className="flex items-start gap-3.5">
                  <span
                    className={`relative mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-all duration-300 ${
                      active
                        ? "scale-105 bg-brand text-white shadow-[0_8px_18px_-8px_rgba(16,185,129,0.7)]"
                        : done
                          ? "bg-brand-soft text-brand"
                          : "border border-rule bg-paper-raised text-ink-faint"
                    }`}
                  >
                    {active && <span className="absolute inset-0 animate-ping rounded-xl bg-brand/25 [animation-duration:1.8s]" aria-hidden />}
                    {done ? <Check size={16} strokeWidth={2.75} /> : <Icon size={17} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={`mono text-[0.68rem] font-semibold ${active ? "text-brand" : "text-ink-faint"}`}>0{i + 1}</span>
                      <span className={`text-[0.95rem] font-semibold transition-colors ${active ? "text-ink" : done ? "text-ink-soft" : "text-ink-faint"}`}>
                        {title}
                      </span>
                    </span>
                    <span className={`grid transition-[grid-template-rows,opacity] duration-300 ${active ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <span className="overflow-hidden">
                        <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{body}</span>
                      </span>
                    </span>
                  </span>
                </span>
                {active && (
                  <span className="absolute inset-x-4 bottom-0 h-0.5 overflow-hidden rounded-full bg-rule">
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
        <div className="dq-glow pointer-events-none absolute -inset-4 rounded-[2rem] bg-brand/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -inset-px rounded-[1.05rem] bg-gradient-to-br from-brand/40 via-transparent to-[#3B82F6]/25" aria-hidden />
        <div className="relative overflow-hidden rounded-2xl border border-rule bg-[#F7F8FA] shadow-[0_40px_80px_-40px_rgba(11,19,36,0.45)]" aria-hidden>
          <div className="flex h-11 items-center gap-2 border-b border-[#E2E8F0] bg-white px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F87171]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FBBF24]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#34D399]" />
            <span className="ml-3 flex h-7 min-w-0 flex-1 items-center overflow-hidden rounded-full bg-[#EEF1F4] px-3 text-[0.68rem] text-[#64748B]">
              <span key={step.url} className="dq-scene-in truncate">
                {step.url}
              </span>
            </span>
            <span className="mono hidden rounded-full bg-[#E3F7EF] px-2.5 py-1 text-[0.6rem] font-bold text-[#047857] sm:inline">
              {index + 1} / {STEPS.length}
            </span>
          </div>
          <div className="h-[2px] bg-[#EEF1F4]">
            <span
              key={`${index}-${paused}-bar`}
              className={`block h-full bg-[#10B981] ${paused ? "w-full" : "dq-progress"}`}
              style={{ animationDuration: `${SCENE_MS}ms` }}
            />
          </div>
          <div className="h-[330px] p-5 sm:p-6">
            <div key={index} className="dq-scene-in h-full">
              <Scene />
            </div>
          </div>
        </div>

        <div
          key={`chip-${index}`}
          className="dq-pop absolute -bottom-7 left-6 flex items-center gap-2.5 rounded-xl border border-rule bg-paper-raised py-2 pl-2 pr-4 shadow-[0_16px_32px_-18px_rgba(11,19,36,0.4)]"
          aria-hidden
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-white">
            <StepIcon size={14} />
          </span>
          <span className="text-xs font-semibold text-ink">{step.title}</span>
        </div>
      </div>
    </div>
  );
}
