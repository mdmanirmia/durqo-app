"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

// Oct 30, 2026 (/durqo-bangladesh: "kono video baniye add korte hobe"): the
// hero's product film. public/video/durqo-bangladesh.mp4 is the merchant-supplied overview (Oct 31: "Durqo_Buyers_Sellers_Problems_v10", ~2m24s, 720p web encode); earlier versions were a ~80s overview (problems, then Durqo's answers),
// code-rendered walkthrough of the page's own published flow (pay in BDT ->
// Transfer Room -> BDT payout); no stock footage, no invented numbers. It
// plays only while on screen and stays paused on its poster for visitors
// who prefer reduced motion. Same day ("video te voice o add kore dite
// paro"): the file now carries an English voiceover. Browsers only autoplay
// muted video, so it starts silent with a "Play with sound" button that
// restarts it from the top with audio.
export default function BdHeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  // Oct 31, 2026 ("video ta auto play with sound hobe, just pause korar
  // option thakle"): try to autoplay WITH sound first. Browsers block
  // unmuted autoplay until the visitor has interacted with the site, so if
  // that attempt is refused we fall back to muted autoplay and switch the
  // sound on automatically at the visitor's first click or key press
  // anywhere on the page. A pause/play button sits next to the sound one.
  const userPaused = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);

  // Oct 31, 2026 ("video te pause sign and sound sign dekhate hobena, video
  // te click korle pause hobe, pause hole pause sign thakbe"): no on-screen
  // controls. Clicking the video pauses it and shows a play sign; clicking
  // again resumes it, with sound on.
  function togglePlay() {
    const v = ref.current;
    if (!v) return;
    // Still playing muted (the browser blocked sound): the first click just
    // turns the sound on instead of pausing.
    if (!v.paused && v.muted) {
      v.muted = false;
      setMuted(false);
      return;
    }
    if (v.paused) {
      userPaused.current = false;
      v.muted = false;
      setMuted(false);
      v.play().catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  }

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      v.removeAttribute("autoplay");
      v.pause();
      return () => {
        v.removeEventListener("play", onPlay);
        v.removeEventListener("pause", onPause);
      };
    }

    // Try playing with sound; fall back to muted if the browser refuses.
    const start = () => {
      if (userPaused.current) return;
      v.muted = false;
      v.play()
        .then(() => setMuted(false))
        .catch(() => {
          v.muted = true;
          setMuted(true);
          v.play().catch(() => {});
        });
    };

    // First real interaction anywhere unlocks sound.
    const unlock = (e: Event) => {
      if (wrap.current && e.target instanceof Node && wrap.current.contains(e.target)) return;
      if (v.muted && !userPaused.current) {
        v.muted = false;
        setMuted(false);
        if (v.paused) v.play().catch(() => {});
      }
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) start();
        else v.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => {
      io.disconnect();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, []);

  return (
    <div className="relative">
      {/* Glow behind the frame */}
      <span className="dq-glow pointer-events-none absolute -inset-6 rounded-[2rem] bg-[radial-gradient(60%_60%_at_30%_30%,rgba(16,185,129,0.35),transparent_70%),radial-gradient(50%_50%_at_80%_80%,rgba(244,42,65,0.18),transparent_70%)] blur-2xl" aria-hidden />

      <div ref={wrap} className="dq-border relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B1324] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.85)]">
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
          className="block aspect-video w-full cursor-pointer"
          src="/video/durqo-bangladesh.mp4?v=11"
          poster="/video/durqo-bangladesh-poster.jpg?v=11"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onClick={togglePlay}
          aria-label="Overview video: the problems Bangladeshi buyers and sellers face, and how Durqo solves them with BDT payments, the Transfer Room and BDT payouts."
        />
        {paused && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Play video"
            className="absolute inset-x-0 bottom-0 top-[42px] grid place-items-center bg-black/30"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-[#0B1324] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)] transition hover:scale-105 sm:h-20 sm:w-20">
              <Play size={30} className="ml-1" fill="currentColor" />
            </span>
          </button>
        )}
      </div>

    </div>
  );
}
