"use client";

import React, { useEffect, useState } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

// Chart colours. Violet is the console accent; amber/orange tie into Dance Floor.
export const C = {
  violet: "#8b5cf6",
  violetLight: "#a78bfa",
  indigo: "#6366f1",
  fuchsia: "#d946ef",
  pink: "#ec4899",
  teal: "#14b8a6",
  emerald: "#10b981",
  amber: "#f59e0b",
  orange: "#f97316",
  red: "#ef4444",
  grid: "#27272a",
  axis: "#71717a",
};

export const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#111014",
    border: "1px solid #3f3f46",
    borderRadius: 8,
    fontSize: 12,
    color: "#fff",
  },
  labelStyle: { color: "#fff", fontWeight: 600 },
  itemStyle: { color: "#d4d4d8" },
  cursor: { fill: "rgba(255,255,255,0.04)" },
};

export const ANIM = { isAnimationActive: true, animationDuration: 900, animationEasing: "ease-out" as const };

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Number that counts up from 0 when it appears.
export function CountUp({
  value,
  suffix = "",
  decimals = 0,
  duration = 900,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reducedMotion()) {
      setN(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setN(value * (1 - Math.pow(1 - t, 3))); // ease-out
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return (
    <>
      {n.toFixed(decimals)}
      {suffix}
    </>
  );
}

// KPI card: accent line on top, small caps label, big animated number.
export function Kpi({
  label,
  value,
  suffix,
  decimals,
  hint,
  tone = "violet",
  text,
  delay = 0,
}: {
  label: string;
  value?: number;
  suffix?: string;
  decimals?: number;
  hint?: string;
  tone?: "violet" | "amber" | "emerald" | "red";
  text?: string; // shown instead of a number (e.g. "Mon T4")
  delay?: number;
}) {
  const line = {
    violet: "bg-violet-500/70",
    amber: "bg-amber-400/80",
    emerald: "bg-emerald-400/70",
    red: "bg-red-400/70",
  }[tone];
  return (
    <div
      className="anim-fade-up relative overflow-hidden rounded-xl border border-white/15 bg-gradient-to-b from-white/[0.05] to-transparent p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={`absolute inset-x-0 top-0 h-0.5 ${line}`} />
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-white">
        {text ?? <CountUp value={value ?? 0} suffix={suffix} decimals={decimals} />}
      </p>
      {hint && <p className="mt-1 truncate text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

// Titled card for a chart.
export function ChartCard({
  title,
  subtitle,
  children,
  className = "",
  delay = 0,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <section
      className={`anim-fade-up rounded-xl border border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent p-5 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <h2 className="text-sm font-bold text-white">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-center text-sm text-zinc-500">{children}</p>;
}

// Circular progress gauge with the value in the middle.
export function Gauge({
  value,
  label,
  color = C.violet,
  size = 150,
}: {
  value: number;
  label: string;
  color?: string;
  size?: number;
}) {
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <RadialBarChart
        width={size}
        height={size}
        innerRadius="72%"
        outerRadius="100%"
        data={[{ value }]}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar dataKey="value" cornerRadius={10} fill={color} background={{ fill: "#27272a" }} {...ANIM} />
      </RadialBarChart>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-bold tabular-nums text-white">
          <CountUp value={value} suffix="%" />
        </p>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      </div>
    </div>
  );
}

// Horizontal bar with a label and value; the bar grows in from 0 on mount.
export function MeterRow({
  label,
  sub,
  value,
  max = 100,
  suffix = "%",
  color = C.violet,
  index = 0,
}: {
  label: string;
  sub?: string;
  value: number;
  max?: number;
  suffix?: string;
  color?: string;
  index?: number;
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(max === 0 ? 0 : (value / max) * 100), 60 + index * 40);
    return () => clearTimeout(t);
  }, [value, max, index]);
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">{label}</p>
        {sub && <p className="text-xs text-zinc-500">{sub}</p>}
      </div>
      <div className="flex w-44 shrink-0 items-center gap-3 sm:w-56">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${w}%`, backgroundColor: color }}
          />
        </div>
        <span className="w-12 text-right text-xs font-semibold tabular-nums text-zinc-300">
          {value}
          {suffix}
        </span>
      </div>
    </div>
  );
}
