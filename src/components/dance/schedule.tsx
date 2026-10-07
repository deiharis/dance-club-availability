import { CalendarX2 } from "lucide-react";

// Shared bits of the Rehearsals and Performances lists. Dates are "YYYY-MM-DD" (the Indian
// calendar day); `today` comes from the server (todayIST) so a phone's clock or time zone cannot
// shift what counts as upcoming.

const parse = (d: string) => new Date(d + "T00:00:00Z");

export function DateTile({ date, muted = false }: { date: string; muted?: boolean }) {
  const d = parse(date);
  return (
    <div
      className={`flex w-14 shrink-0 flex-col items-center rounded-2xl border py-1.5 ${
        muted ? "border-white/5 bg-white/[0.02] opacity-60" : "border-orange-400/25 bg-orange-500/[0.08]"
      }`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-300">
        {d.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" })}
      </span>
      <span className="text-xl font-light leading-none text-white">{d.getUTCDate()}</span>
      <span className="mt-0.5 text-[10px] text-orange-100/50">{d.toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" })}</span>
    </div>
  );
}

// "Today" / "Tomorrow" / "In 5 days" for the next two weeks; nothing further out or in the past.
export function WhenBadge({ date, today }: { date: string; today: string }) {
  const days = Math.round((parse(date).getTime() - parse(today).getTime()) / 86_400_000);
  if (days < 0 || days > 14) return null;
  const label = days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        days === 0 ? "bg-orange-500 text-white shadow-[0_0_14px_-2px_rgba(249,115,22,0.8)]" : "bg-orange-500/15 text-orange-200"
      }`}
    >
      {label}
    </span>
  );
}

export function CancelledNote({ by, at }: { by: string | null; at: string }) {
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-300/80">
      <CalendarX2 size={12} aria-hidden="true" />
      Cancelled{by ? ` by ${by}` : ""} on {parse(at).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" })}
    </p>
  );
}

export const stageCard =
  "rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";
export const stageInput =
  "w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-orange-100/30 focus:border-orange-400/70 focus:outline-none [color-scheme:dark]";
export const stageButton =
  "press rounded-full bg-orange-500 text-sm font-medium text-white shadow-[0_0_24px_-6px_rgba(249,115,22,0.7)] hover:bg-orange-400 disabled:opacity-50";
export const ghostButton =
  "press inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-orange-100/70 hover:border-orange-400/40 hover:text-white";
