"use client";

// A short, pleasant two-tone chime for an incoming message (2026-09-12
// request). Synthesized with the Web Audio API rather than shipping an
// audio file — nothing to host or license, and it stays crisp at any
// system volume. Two overlapping notes a musical fifth apart (C6 -> G6)
// read as a gentle "ping" the way a lot of native chat apps' notification
// sounds do; a single tone reads more like an alert/error beep.
//
// Browsers block audio from playing before the page has ever seen a user
// gesture (click/keydown/touch). A signed-in dashboard visitor has almost
// always already clicked something by the time any message could arrive,
// so this rarely matters in practice — but the AudioContext is still only
// created lazily on the first call (never at module load), and every call
// is wrapped in try/catch so a blocked or unsupported browser just silently
// skips the sound instead of throwing out of a realtime event handler.
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

function playTone(ctx: AudioContext, freq: number, startTime: number, duration: number, peakGain: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  // A quick linear attack then an exponential decay reads as a soft
  // "ping" rather than a hard click (attack) or an abrupt cutoff (decay) —
  // exponentialRampToValueAtTime can't target exactly 0, hence 0.0001.
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    // A context created (or left over from a previous page) while the tab
    // was backgrounded can be "suspended" — resume() is a no-op if it's
    // already running, so this is safe to call unconditionally.
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    playTone(ctx, 1046.5, now, 0.22, 0.16); // C6
    playTone(ctx, 1568.0, now + 0.09, 0.28, 0.13); // G6 — slightly delayed and softer
  } catch {
    // Never let a notification sound break the realtime handler it's
    // called from.
  }
}
