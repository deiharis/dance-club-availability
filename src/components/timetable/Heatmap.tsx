"use client";

import React from "react";
import { DAY_LABELS } from "@/lib/timetable";

interface HeatmapCell {
  day: string;
  slot: string;
  freeCount: number;
  percentage: number;
}

export default function Heatmap({
  data,
  days,
  slots,
}: {
  data: HeatmapCell[];
  days: readonly string[];
  slots: { slot: string; time: string }[];
}) {
  function getCell(day: string, slot: string) {
    return data.find((d) => d.day === day && d.slot === slot);
  }

  function getColor(percentage: number) {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-green-600/70";
    if (percentage >= 40) return "bg-yellow-500/60";
    if (percentage >= 20) return "bg-orange-500/60";
    return "bg-red-500/60";
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-3 py-2 w-20">
              Slot
            </th>
            {days.map((day) => (
              <th
                key={day}
                className="text-center text-gray-400 text-xs font-medium uppercase tracking-wide px-2 py-2"
              >
                {DAY_LABELS[day].slice(0, 3)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slotInfo) => (
            <tr key={slotInfo.slot}>
              <td className="px-3 py-1">
                <span className="text-gray-300 text-xs font-medium">
                  {slotInfo.slot}
                </span>
              </td>
              {days.map((day) => {
                const cell = getCell(day, slotInfo.slot);
                const percentage = cell?.percentage ?? 0;
                return (
                  <td key={day} className="px-1 py-1">
                    <div
                      title={`${DAY_LABELS[day]} ${slotInfo.slot}: ${percentage}% free`}
                      className={`h-7 rounded ${getColor(percentage)} flex items-center justify-center transition-all hover:opacity-80 cursor-default`}
                    >
                      <span className="text-white text-xs font-medium">
                        {percentage}%
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4">
        <span className="text-gray-500 text-xs">Free %:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500/60" />
          <span className="text-gray-500 text-xs">0–20</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-orange-500/60" />
          <span className="text-gray-500 text-xs">20–40</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-yellow-500/60" />
          <span className="text-gray-500 text-xs">40–60</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-600/70" />
          <span className="text-gray-500 text-xs">60–80</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span className="text-gray-500 text-xs">80–100</span>
        </div>
      </div>
    </div>
  );
}