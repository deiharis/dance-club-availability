"use client";

import { useEffect, useRef } from "react";

// Flowing golden strand-wave drawn on a canvas (no libraries).
// - Pauses when scrolled out of view, and when the tab is hidden (browser throttles rAF).
// - Draws a single still frame if the user prefers reduced motion.
// ponytail: ~28 polylines per frame; if low-end phones struggle, lower ROWS or skip on small screens.
const ROWS = 28;

export default function WaveBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;

    function resize() {
      const r = canvas!.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(t: number) {
      const time = t / 1000;
      ctx!.clearRect(0, 0, w, h);
      ctx!.globalCompositeOperation = "lighter"; // overlapping strands glow brighter
      const cy = h * 0.5;
      const step = Math.max(6, w / 160);

      for (let r = 0; r < ROWS; r++) {
        const rr = r / (ROWS - 1) - 0.5; // -0.5 .. 0.5 across the ribbon
        ctx!.beginPath();
        for (let x = 0; x <= w + step; x += step) {
          const u = x / w;
          const env = Math.sin(Math.min(u, 1) * Math.PI); // ribbon narrows to nothing at the edges
          const twist = 0.55 + 0.45 * Math.sin(u * 5 + time * 0.6); // strands bunch and spread
          const wave =
            Math.sin(u * 7 - time * 0.9 + rr * 1.4) * 0.55 +
            Math.sin(u * 3.2 + time * 0.5) * 0.45;
          const y = cy + env * wave * h * 0.22 + rr * h * 0.32 * twist * env;
          if (x === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        const mid = 1 - Math.abs(rr) * 2; // 1 in the middle strand, 0 at the outer ones
        ctx!.strokeStyle = `rgba(255, ${170 + Math.round(60 * mid)}, 70, ${0.1 + 0.22 * mid})`;
        ctx!.lineWidth = 0.8;
        ctx!.stroke();
      }
    }

    function loop(t: number) {
      if (visible) draw(t);
      raf = requestAnimationFrame(loop);
    }

    resize();
    if (reduce) {
      draw(2000);
    } else {
      raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw(2000);
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="h-full w-full" aria-hidden="true" />;
}
