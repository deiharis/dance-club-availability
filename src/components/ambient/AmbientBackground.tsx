"use client";

import { usePathname } from "next/navigation";

// One fixed, click-through layer of very faint atmosphere over every page. CSS only (styles under
// "Ambient" in globals.css): transforms and opacity, no canvas, no blur filters, no video.
//   intro   (login, incl. the splash)  grain, vignette, slow haze, a few dust motes
//   stage   (Dance Floor)              grain, vignette, haze, slow spotlight sweep, dust motes
//   console (everything else)          grain, vignette, one barely-moving violet glow
// Phones and reduced-motion users get a still version (see globals.css).
type Variant = "intro" | "stage" | "console";

// Fixed positions (not random) so server and browser render the same markup.
const DUST = [
  { x: 8, d: 34, delay: -3, s: 2 },
  { x: 19, d: 41, delay: -22, s: 1.5 },
  { x: 31, d: 37, delay: -11, s: 2.5 },
  { x: 44, d: 46, delay: -30, s: 1.5 },
  { x: 56, d: 39, delay: -7, s: 2 },
  { x: 67, d: 43, delay: -18, s: 1.5 },
  { x: 76, d: 35, delay: -26, s: 2.5 },
  { x: 88, d: 48, delay: -14, s: 2 },
  { x: 94, d: 40, delay: -36, s: 1.5 },
  { x: 50, d: 52, delay: -42, s: 1.5 },
];

export default function AmbientBackground() {
  const path = usePathname() ?? "";
  const variant: Variant = path === "/login" ? "intro" : path.startsWith("/dance") ? "stage" : "console";

  return (
    <div aria-hidden="true" className={`ambient ambient-${variant}`}>
      <div className="ambient-grain" />
      <div className="ambient-vignette" />
      {variant === "console" ? (
        <div className="ambient-glow" />
      ) : (
        <>
          <div className="ambient-haze" />
          {variant === "stage" && <div className="ambient-spot" />}
          <div className="ambient-dust">
            {DUST.map((p, i) => (
              <span
                key={i}
                style={
                  {
                    "--x": `${p.x}%`,
                    "--d": `${p.d}s`,
                    "--delay": `${p.delay}s`,
                    "--s": `${p.s}px`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
