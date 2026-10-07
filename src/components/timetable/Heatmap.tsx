"use client";

import React from "react";
import Link from "next/link";
import { DAY_LABELS } from "@/lib/timetable";

interface HeatCell {
  day: string;
  slot: string;
  freeCount: number;
  percentage: number;
}

// Availability heatmap: days across, slots down. Cells pop in one after another, and the
// best slot gets a ring. (Animation is turned off for reduced-motion users in globals.css.)
export default function Heatmap({
  data,
  days,
  slots,
  highlight,
  cellHref,
}: {
  data: HeatCell[];
  days: readonly string[];
  slots: { slot: string; time: string }[];
  highlight?: { day: string; slot: string } | null;
  cellHref?: (day: string, slot: string) => string; // makes each cell a link (e.g. "who is free then")
}) {
  function getCell(day: string, slot: string) {
    return data.find((d) => d.day === day && d.slot === slot);
  }

  function getColor(percentage: number) {
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 60) return "bg-emerald-600/70";
    if (percentage >= 40) return "bg-yellow-500/60";
    if (percentage >= 20) return "bg-orange-500/60";
    return "bg-red-500/60";
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-20 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Slot
            </th>
            {days.map((day) => (
              <th
                key={day}
                className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-widest text-zinc-500"
              >
                {DAY_LABELS[day].slice(0, 3)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slotInfo, si) => (
            <tr key={slotInfo.slot}>
              <td className="px-3 py-1">
                <span className="text-xs font-medium text-zinc-300" title={slotInfo.time}>
                  {slotInfo.slot}
                </span>
              </td>
              {days.map((day, di) => {
                const cell = getCell(day, slotInfo.slot);
                const percentage = cell?.percentage ?? 0;
                const best = highlight?.day === day && highlight?.slot === slotInfo.slot;
                const label = `${DAY_LABELS[day]} ${slotInfo.slot} (${slotInfo.time}): ${percentage}% free, ${cell?.freeCount ?? 0} members`;
                const cls = `heat-pop flex h-8 items-center justify-center rounded transition-transform hover:scale-110 ${getColor(
                  percentage
                )} ${best ? "ring-2 ring-violet-300 ring-offset-1 ring-offset-[#0a0a0c]" : ""}`;
                const style = { animationDelay: `${di * 60 + si * 28}ms` };
                const body = <span className="text-xs font-semibold text-white">{percentage}%</span>;
                return (
                  <td key={day} className="px-1 py-1">
                    {cellHref ? (
                      <Link href={cellHref(day, slotInfo.slot)} title={`${label}. Click to see who is free.`} aria-label={`${label}. See who is free`} className={`${cls} cursor-pointer`} style={style}>
                        {body}
                      </Link>
                    ) : (
                      <div title={label} className={`${cls} cursor-default`} style={style}>
                        {body}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <span className="text-xs text-zinc-500">Free %</span>
        {[
          ["bg-red-500/60", "0-20"],
          ["bg-orange-500/60", "20-40"],
          ["bg-yellow-500/60", "40-60"],
          ["bg-emerald-600/70", "60-80"],
          ["bg-emerald-500", "80-100"],
        ].map(([c, l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded-sm ${c}`} />
            <span className="text-xs text-zinc-500">{l}</span>
          </div>
        ))}
        {highlight && (
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm ring-2 ring-violet-300" />
            <span className="text-xs text-zinc-500">Best slot</span>
          </div>
        )}
      </div>
    </div>
  );
}
