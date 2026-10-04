import React from "react";

// Small building blocks for Working Committee pages, so the queue-style pages
// (reports, OD, events, grades) share one look.

export const panel =
  "rounded-xl border border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent";

export const control =
  "w-full rounded-md border border-zinc-700 bg-black/40 px-3 py-2.5 text-sm text-white placeholder-zinc-600";

export const controlLabel = "mb-1.5 block text-[11px] font-medium text-zinc-400";

export const sectionTitle = "text-[10px] font-semibold uppercase tracking-widest text-violet-400";

// Segmented status tabs with a count on each, e.g. Pending (3) / Approved (12) / All.
export function Tabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { key: T; label: string; count?: number }[];
}) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-800 bg-black/30 p-1">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              on ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            {o.label}
            {o.count !== undefined && (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] tabular-nums ${
                  on ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-300"
                }`}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

const TONES = {
  amber: "bg-amber-500/15 text-amber-300",
  green: "bg-emerald-500/15 text-emerald-300",
  red: "bg-red-500/15 text-red-300",
  violet: "bg-violet-500/15 text-violet-300",
} as const;

export function StatusChip({
  tone,
  icon,
  children,
}: {
  tone: keyof typeof TONES;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-semibold ${TONES[tone]}`}>
      {icon}
      {children}
    </span>
  );
}

// Left edge colour of a queue card, by status.
export const stripe = {
  amber: "border-l-2 border-l-amber-400/70",
  green: "border-l-2 border-l-emerald-400/70",
  red: "border-l-2 border-l-red-400/70",
};

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
      <div className="mt-1 text-sm text-zinc-100">{children}</div>
    </div>
  );
}

export function Avatar({ name, size = 9 }: { name: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded bg-zinc-800 text-xs font-semibold text-zinc-300"
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export const dateIN = (d: string | Date, opts?: Intl.DateTimeFormatOptions) =>
  new Date(d).toLocaleDateString("en-IN", opts ?? { day: "numeric", month: "short", year: "numeric" });
