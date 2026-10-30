"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ClipboardCheck, Landmark, Volume2, VolumeX } from "lucide-react";

// Oct 30, 2026 (/durqo-bangladesh: "kono video baniye add korte hobe"): the
// hero's product film. public/video/durqo-bangladesh.mp4 is a ~80s overview (problems, then Durqo's answers),
// code-rendered walkthrough of the page's own published flow (pay in BDT ->
// Transfer Room -> BDT payout); no stock footage, no invented numbers. It
// plays only while on screen and stays paused on its poster for visitors
// who prefer reduced motion. Same day ("video te voice o add kore dite
// paro"): the file now carries an English voiceover. Browsers only autoplay
// muted video, so it starts silent with a "Play with sound" button that
// restarts it from the top with audio.
export default function BdHeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function toggleSound() {
    const v = ref.current;
    if (!v) return;
    if (v.muted) {
      v.muted = false;
      v.currentTime = 0;
      v.play().catch(() => {});
      setMuted(false);
    } else {
      v.muted = true;
      setMuted(true);
    }
  }

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      v.removeAttribute("autoplay");
      v.pause();
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <div className="relative">
      {/* Glow behind the frame */}
      <span className="dq-glow pointer-events-none absolute -inset-6 rounded-[2rem] bg-[radial-gradient(60%_60%_at_30%_30%,rgba(16,185,129,0.35),transparent_70%),radial-gradient(50%_50%_at_80%_80%,rgba(244,42,65,0.18),transparent_70%)] blur-2xl" aria-hidden />

      <div className="dq-border relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B1324] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.85)]">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="mono ml-3 flex min-w-0 flex-1 items-center gap-1.5 truncate rounded-md bg-white/[0.06] px-3 py-1 text-[0.65rem] text-white/50">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-brand" />
            durqo.com/durqo-bangladesh
          </span>
        </div>
        <video
          ref={ref}
          className="block aspect-video w-full"
          src="/video/durqo-bangladesh.mp4?v=5"
          poster="/video/durqo-bangladesh-poster.jpg?v=5"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Overview video: the problems Bangladeshi buyers and sellers face, and how Durqo solves them with BDT payments, the Transfer Room and BDT payouts."
        />
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={!muted}
          className="group absolute bottom-3 left-3 flex min-h-9 items-center gap-2 rounded-full border border-white/20 bg-[#0B1324]/75 py-1.5 pl-1.5 pr-3.5 text-xs font-semibold text-white backdrop-blur transition hover:border-brand hover:bg-[#0B1324]/90"
        >
          <span className={`relative grid h-6 w-6 place-items-center rounded-full ${muted ? "bg-brand" : "bg-white/15"}`}>
            {muted && <span className="absolute inset-0 animate-ping rounded-full bg-brand/60" aria-hidden />}
            {muted ? <Volume2 size={13} className="relative" /> : <VolumeX size={13} />}
          </span>
          {muted ? "Play with sound" : "Mute"}
        </button>
      </div>

      {/* Floating status chips */}
      <div className="dq-float pointer-events-none absolute -left-4 bottom-20 hidden items-center gap-2 rounded-xl border border-white/10 bg-white/95 px-3 py-2 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)] backdrop-blur sm:flex lg:-left-8" aria-hidden>
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft text-brand-strong">
          <CheckCircle2 size={14} />
        </span>
        <span className="text-xs font-semibold text-ink">Paid in BDT</span>
      </div>
      <div className="dq-float-alt pointer-events-none absolute -right-3 top-14 hidden items-center gap-2 rounded-xl border border-white/10 bg-white/95 px-3 py-2 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)] backdrop-blur sm:flex lg:-right-6" aria-hidden>
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#EEF2FF] text-[#4F46E5]">
          <ClipboardCheck size={14} />
        </span>
        <span className="text-xs font-semibold text-ink">7-day inspection</span>
      </div>
      <div className="dq-float pointer-events-none absolute -bottom-5 right-10 hidden items-center gap-2 rounded-xl border border-white/10 bg-white/95 px-3 py-2 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)] backdrop-blur sm:flex" style={{ animationDelay: "1.4s" }} aria-hidden>
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold-soft text-[#92730F]">
          <Landmark size={14} />
        </span>
        <span className="text-xs font-semibold text-ink">Payout in BDT</span>
      </div>
    </div>
  );
}
