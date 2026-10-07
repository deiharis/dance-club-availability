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

// The grid copies initialEntries into state once. Without this key, a page that swaps which
// members it lists without a full reload (e.g. the "No timetable" / "All members" tabs, or moving
// between /timetable/[memberId] pages) would reuse a grid and show the PREVIOUS member's timetable.
// Keying by member makes React start a fresh grid whenever the member changes.
export default function TimetableGrid(props: TimetableGridProps) {
  return <Grid key={props.memberId} {...props} />;
}

function Grid({
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
    <div className="relative w-full min-w-0">

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
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

      {/* Grid — scroll only happens INSIDE this container */}
      <div className="w-full min-w-0 overflow-x-auto rounded-lg border border-gray-800/50">
        <table className="border-collapse w-full">
          <thead>
            <tr>
              <th className="text-left text-gray-400 text-[10px] font-medium uppercase tracking-wide px-2 py-1.5 w-16 sticky left-0 bg-surface z-10">
                Day
              </th>
              {SLOTS.map((slotInfo) => {
                const isLunch = slotInfo.slot === "Lunch";
                return (
                  <th
                    key={slotInfo.slot}
                    className="text-center px-1 py-1.5 min-w-[58px]"
                  >
                    <span className={`text-[11px] font-medium block ${
                      isLunch ? "text-gray-500" : "text-gray-300"
                    }`}>
                      {slotInfo.slot}
                    </span>
                    <span className="text-gray-600 text-[9px] block leading-tight whitespace-nowrap">
                      {slotInfo.time}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => (
              <tr key={day} className="border-t border-gray-800/50">
                {/* Day label */}
                <td className="px-2 py-1 sticky left-0 bg-surface z-10">
                  <span className="text-gray-200 text-xs font-medium">
                    {DAY_LABELS[day].slice(0, 3)}
                  </span>
                </td>

                {/* Slot cells */}
                {SLOTS.map((slotInfo) => {
                  const isLunch = slotInfo.slot === "Lunch";

                  if (isLunch) {
                    return (
                      <td key={slotInfo.slot} className="px-0.5 py-0.5">
                        <div className="h-7 rounded border border-gray-800/50 bg-gray-800/30 flex items-center justify-center">
                          <span className="text-gray-500 text-[9px]">
                            Lunch
                          </span>
                        </div>
                      </td>
                    );
                  }

                  const status = getStatus(day, slotInfo.slot);
                  const key = `${day}_${slotInfo.slot}`;
                  const isSaving = saving === key;

                  return (
                    <td key={slotInfo.slot} className="px-0.5 py-0.5">
                      <button
                        onClick={() => handleCellClick(day, slotInfo.slot)}
                        onMouseEnter={(e) =>
                          handleMouseEnter(e, day, slotInfo)
                        }
                        onMouseLeave={handleMouseLeave}
                        disabled={readonly || isSaving}
                        className={`w-full h-7 rounded border transition-all text-[10px] font-medium ${
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-surface border border-gray-700 rounded-lg px-3 py-2 pointer-events-none shadow-xl"
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