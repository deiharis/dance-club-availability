"use client";

import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { MARK, BRAND } from "./Logo";
import { brandFont } from "@/lib/fonts";

// Intro shown before the login page, about 3 seconds:
//   0.0s  dark stage fades in
//   0.2s  a spotlight beam opens from the top
//   0.4s  the halo draws itself, then the dancer's legs, torso and arms
//   1.4s  the head pops in, a warm glow blooms behind the mark
//   1.5s  "DANCE CLUB" settles from wide letter spacing; a gold rhythm line sweeps out
//   2.1s  "VIT CHENNAI" fades up
//   2.9s  everything dissolves (fade, slight zoom, blur) into the login page
// Shown once per browser session. Click, any key or "Skip" ends it early. Add ?intro=1 to the
// URL to force it (handy for testing or showing someone).
// With reduced motion there is no movement: the finished logo fades in, holds, and fades out.
const KEY = "dc-intro-seen";
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Runs while the HTML is still being parsed, BEFORE React loads, so a returning visitor never
// sees the server-drawn splash flash up. It adds .intro-seen to <html>; globals.css hides the
// splash (and shows the login form) when that class is present.
const EARLY_CHECK = `(function(){try{var f=new URLSearchParams(location.search).get('intro')==='1';if(!f&&sessionStorage.getItem('${KEY}')==='1'){document.documentElement.classList.add('intro-seen')}}catch(e){}})();`;

function forced() {
  try {
    return new URLSearchParams(window.location.search).get("intro") === "1";
  } catch {
    return false;
  }
}

export default function Splash({ onDone }: { onDone?: () => void }) {
  const [phase, setPhase] = useState<"show" | "leave" | "gone">("show");

  const finish = useCallback(() => {
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
    setPhase("gone");
  }, []);

  const leave = useCallback(() => {
    setPhase((p) => (p === "show" ? "leave" : p));
    onDone?.();
  }, [onDone]);

  // Before the first paint: skip entirely if already seen this session.
  useIsoLayoutEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
    } catch {}
    if (seen && !forced()) {
      setPhase("gone");
      onDone?.();
      return;
    }
    document.documentElement.classList.remove("intro-seen");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Reduced motion: no movement, but still long enough to read the logo.
    const leaveAt = reduce ? 1800 : 2900;
    const t = setTimeout(leave, leaveAt);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After the exit animation, remove the overlay.
  useEffect(() => {
    if (phase !== "leave") return;
    const t = setTimeout(finish, 550);
    return () => clearTimeout(t);
  }, [phase, finish]);

  // Any key skips.
  useEffect(() => {
    if (phase !== "show") return;
    const onKey = () => leave();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, leave]);

  if (phase === "gone") return null;

  return (
    <>
    <script dangerouslySetInnerHTML={{ __html: EARLY_CHECK }} />
    <div
      onClick={leave}
      className={`splash ${brandFont.className} ${phase === "leave" ? "splash-leave" : ""} fixed inset-0 z-[100] flex cursor-pointer items-center justify-center overflow-hidden bg-[#0a0a0c]`}
      aria-label="Dance Club VIT Chennai"
      role="img"
    >
      <div className="splash-beam" aria-hidden="true" />
      <div className="splash-glow" aria-hidden="true" />

      <div className="relative flex flex-col items-center px-6">
        <svg className="splash-mark" width="148" height="148" viewBox="0 0 100 100" fill="none" strokeLinecap="round" aria-hidden="true">
          <defs>
            <linearGradient id="splash-gold" gradientUnits="userSpaceOnUse" x1="10" y1="10" x2="90" y2="90">
              <stop offset="0" stopColor={BRAND.champagne} />
              <stop offset="0.45" stopColor={BRAND.gold} />
              <stop offset="1" stopColor={BRAND.ember} />
            </linearGradient>
          </defs>
          <path className="splash-draw splash-d1" pathLength={1} d={MARK.halo} stroke="url(#splash-gold)" strokeWidth={2.2} />
          <path className="splash-draw splash-d2" pathLength={1} d={MARK.legs} stroke="url(#splash-gold)" strokeWidth={5} />
          <path className="splash-draw splash-d3" pathLength={1} d={MARK.torso} stroke="url(#splash-gold)" strokeWidth={5.4} />
          <path className="splash-draw splash-d4" pathLength={1} d={MARK.arms} stroke="url(#splash-gold)" strokeWidth={3.2} />
          <circle className="splash-head" cx={MARK.head.cx} cy={MARK.head.cy} r={MARK.head.r} fill="url(#splash-gold)" />
        </svg>

        <p className="splash-word mt-7 text-2xl font-semibold text-white sm:text-3xl">DANCE CLUB</p>
        <div className="splash-line mt-4" aria-hidden="true" />
        <p className="splash-sub mt-4 text-[11px] font-light tracking-[0.55em] text-amber-300 sm:text-xs">VIT CHENNAI</p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          leave();
        }}
        className="absolute bottom-6 right-6 rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/50 transition hover:border-white/30 hover:text-white"
      >
        Skip
      </button>
    </div>
    </>
  );
}
