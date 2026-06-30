"use client";

import React, { useState, useCallback } from "react";
import {
  SLOTS,
  DAYS,
  DAY_LABELS,
  SlotStatus,
  nextStatus,
  getStatusStyle,
  getStatusLabel,
} from "@/lib/timetable";

interface TimetableEntry {
  day: string;
  slot: string;
  status: SlotStatus;
}

interface TimetableGridProps {
  memberId: string;
  initialEntries: TimetableEntry[];
  readonly?: boolean;
}

export default function TimetableGrid({
  memberId,
  initialEntries,
  readonly = false,
}: TimetableGridProps) {
  const [entries, setEntries] = useState<Record<string, SlotStatus>>(() => {
    const map: Record<string, SlotStatus> = {};
    initialEntries.forEach((e) => {
      map[`${e.day}_${e.slot}`] = e.status;
    });
    return map;
  });

  const [tooltip, setTooltip] = useState<{
    day: string;
    slot: string;
    time: string;
    status: SlotStatus;
    x: number;
    y: number;
  } | null>(null);

  const [saving, setSaving] = useState<string | null>(null);

  const getStatus = useCallback(
    (day: string, slot: string): SlotStatus => {
      return entries[`${day}_${slot}`] ?? "FREE";
    },
    [entries]
  );

  async function handleCellClick(day: string, slot: string) {
    if (readonly || slot === "Lunch") return;

    const current = getStatus(day, slot);
    const next = nextStatus(current);
    const key = `${day}_${slot}`;

    setEntries((prev) => ({ ...prev, [key]: next }));
    setSaving(key);

    try {
      await fetch(`/api/timetable/${memberId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day, slot, status: next }),
      });
    } catch (error) {
      setEntries((prev) => ({ ...prev, [key]: current }));
    } finally {
      setSaving(null);
    }
  }

  function handleMouseEnter(
    e: React.MouseEvent,
    day: string,
    slotInfo: { slot: string; time: string }
  ) {
    const status = getStatus(day, slotInfo.slot);
    setTooltip({
      day,
      slot: slotInfo.slot,
      time: slotInfo.time,
      status,
      x: e.clientX,
      y: e.clientY,
    });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  return (
    <div className="relative">

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-500/10 border border-green-500/30" />
          <span className="text-gray-400 text-xs">Free</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-500/20 border border-red-500/40" />
          <span className="text-gray-400 text-xs">Class</span>
        </div>
        {!readonly && (
          <span className="text-gray-600 text-xs ml-2">
            Click a cell to toggle status
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-3 py-2 w-28">
                Slot
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="text-center text-gray-400 text-xs font-medium uppercase tracking-wide px-3 py-2"
                >
                  {DAY_LABELS[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slotInfo) => {
              const isLunch = slotInfo.slot === "Lunch";

              return (
                <tr key={slotInfo.slot}>
                  {/* Slot label */}
                  <td className="px-3 py-1.5">
                    <div>
                      <span className={`text-xs font-medium ${
                        isLunch ? "text-gray-500" : "text-gray-300"
                      }`}>
                        {slotInfo.slot}
                      </span>
                      <p className="text-gray-600 text-xs">{slotInfo.time}</p>
                    </div>
                  </td>

                  {/* Day cells */}
                  {DAYS.map((day) => {
                    if (isLunch) {
                      return (
                        <td key={day} className="px-1.5 py-1">
                          <div className="h-8 rounded border border-gray-800/50 bg-gray-800/30 flex items-center justify-center">
                            <span className="text-gray-500 text-xs">
                              Lunch Break
                            </span>
                          </div>
                        </td>
                      );
                    }

                    const status = getStatus(day, slotInfo.slot);
                    const key = `${day}_${slotInfo.slot}`;
                    const isSaving = saving === key;

                    return (
                      <td key={day} className="px-1.5 py-1">
                        <button
                          onClick={() => handleCellClick(day, slotInfo.slot)}
                          onMouseEnter={(e) =>
                            handleMouseEnter(e, day, slotInfo)
                          }
                          onMouseLeave={handleMouseLeave}
                          disabled={readonly || isSaving}
                          className={`w-full h-8 rounded border transition-all text-xs font-medium ${
                            getStatusStyle(status)
                          } ${
                            readonly
                              ? "cursor-default"
                              : "cursor-pointer hover:opacity-80 active:scale-95"
                          } ${isSaving ? "opacity-50" : ""}`}
                        >
                          {status === "CLASS" ? "Class" : ""}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-[#1a1d27] border border-gray-700 rounded-lg px-3 py-2 pointer-events-none shadow-xl"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="text-white text-xs font-medium">
            {DAY_LABELS[tooltip.day]} — {tooltip.slot}
          </p>
          <p className="text-gray-400 text-xs">{tooltip.time}</p>
          <p className={`text-xs font-medium mt-1 ${
            tooltip.status === "CLASS" ? "text-red-400" : "text-green-400"
          }`}>
            {getStatusLabel(tooltip.status)}
          </p>
        </div>
      )}

    </div>
  );
}