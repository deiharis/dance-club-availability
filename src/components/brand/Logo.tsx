"use client";

import React, { useId } from "react";

// Dance Club VIT Chennai mark: a dancer mid-leap (grand jete) inside a spotlight halo.
// The back leg breaks out of the halo, "stepping out of the spotlight". viewBox 0 0 100 100.
// These paths are the single source of truth for the logo (also used by the splash and icon.svg).
export const MARK = {
  halo: "M 82 20 A 42 42 0 1 0 93 46",
  head: { cx: 59, cy: 19, r: 4.6 },
  torso: "M 57.5 27 C 56.5 35 53.5 42 47.5 50",
  legs: "M 11 70 C 25 58 38 52 48 51 C 62 49.5 76 44 90 33",
  arms: "M 26 46 C 33 33 45 28 55 31 C 64 34 70 29 75 21",
};

// Brand palette (see CLAUDE.md "Branding").
export const BRAND = {
  champagne: "#FFE7A8",
  gold: "#FBBF24",
  ember: "#F97316",
  black: "#0A0A0C",
  ivory: "#F6F3EE",
  ink: "#1C1917",
  violet: "#8B5CF6",
};

type Variant = "gold" | "white" | "ink";

export function LogoMark({
  size = 40,
  variant = "gold",
  halo = true,
  className = "",
  title = "Dance Club VIT Chennai",
}: {
  size?: number;
  variant?: Variant;
  halo?: boolean;
  className?: string;
  title?: string;
}) {
  const id = useId().replace(/:/g, "");
  const paint = variant === "gold" ? `url(#g${id})` : variant === "white" ? "#ffffff" : BRAND.ink;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      strokeLinecap="round"
      role="img"
      aria-label={title}
      className={className}
    >
      {variant === "gold" && (
        <defs>
          <linearGradient id={`g${id}`} gradientUnits="userSpaceOnUse" x1="10" y1="10" x2="90" y2="90">
            <stop offset="0" stopColor={BRAND.champagne} />
            <stop offset="0.45" stopColor={BRAND.gold} />
            <stop offset="1" stopColor={BRAND.ember} />
          </linearGradient>
        </defs>
      )}
      {halo && <path d={MARK.halo} stroke={paint} strokeWidth={2.2} />}
      <circle cx={MARK.head.cx} cy={MARK.head.cy} r={MARK.head.r} fill={paint} />
      <path d={MARK.torso} stroke={paint} strokeWidth={5.4} />
      <path d={MARK.legs} stroke={paint} strokeWidth={5} />
      <path d={MARK.arms} stroke={paint} strokeWidth={3.2} />
    </svg>
  );
}

// Mark + "DANCE CLUB / VIT CHENNAI" wordmark, horizontal or stacked.
export function LogoLockup({
  size = 44,
  variant = "gold",
  stacked = false,
  className = "",
}: {
  size?: number;
  variant?: Variant;
  stacked?: boolean;
  className?: string;
}) {
  const main = variant === "ink" ? "text-stone-900" : "text-white";
  const sub = variant === "ink" ? "text-orange-700" : variant === "white" ? "text-white/70" : "text-amber-400";
  return (
    <div className={`flex ${stacked ? "flex-col items-center text-center gap-3" : "items-center gap-3"} ${className}`}>
      <LogoMark size={size} variant={variant} />
      <div className="leading-none">
        <p className={`font-semibold tracking-[0.24em] ${main}`} style={{ fontSize: size * 0.36 }}>
          DANCE CLUB
        </p>
        <p className={`mt-1.5 font-light tracking-[0.5em] ${sub}`} style={{ fontSize: Math.max(9, size * 0.19) }}>
          VIT CHENNAI
        </p>
      </div>
    </div>
  );
}
