"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Check, Loader2, AlertTriangle } from "lucide-react";
import { SLOTS, DAYS, DAY_LABELS, SlotStatus, nextStatus, getStatusStyle, getStatusLabel } from "@/lib/timetable";
import { useToast } from "@/components/ui/feedback";

interface TimetableEntry {
  day: string;
  slot: string;
  status: SlotStatus;
}

interface TimetableGridProps {
  memberId: string;
  initialEntries: TimetableEntry[];
  readonly?: boolean;
  onChange?: (classKeys: string[]) => void; // "MONDAY_T1" keys of the class slots, after each change
}

const CLASS_SLOTS = DAYS.length * SLOTS.filter((s) => s.slot !== "Lunch").length;

// The grid copies initialEntries into state once. Without this key, a page that swaps which
// members it lists without a full reload (e.g. the "No timetable" / "All members" tabs, or moving
// between /timetable/[memberId] pages) would reuse a grid and show the PREVIOUS member's timetable.
// Keying by member makes React start a fresh grid whenever the member changes.
export default function TimetableGrid(props: TimetableGridProps) {
  return <Grid key={props.memberId} {...props} />;
}

function Grid({ memberId, initialEntries, readonly = false, onChange }: TimetableGridProps) {
  const toast = useToast();
  const [entries, setEntries] = useState<Record<string, SlotStatus>>(() => {
    const map: Record<string, SlotStatus> = {};
    initialEntries.forEach((e) => {
      map[`${e.day}_${e.slot}`] = e.status;
    });
    return map;
  });
  const [tooltip, setTooltip] = useState<{ day: string; slot: string; time: string; status: SlotStatus; x: number; y: number } | null>(null);
  // Cells waiting for the server, and whether the last save failed (shown next to the legend).
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [failed, setFailed] = useState(false);
  // Mouse drag-to-paint: the status the drag is painting, null when no drag is in progress.
  const paint = useRef<SlotStatus | null>(null);
  // Set when a mouse press already switched the cell, so the click that follows does not switch it back.
  const pressed = useRef(false);

  const getStatus = useCallback((day: string, slot: string): SlotStatus => entries[`${day}_${slot}`] ?? "FREE", [entries]);
  const classCount = Object.values(entries).filter((s) => s === "CLASS").length;

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onChange?.(Object.keys(entries).filter((k) => entries[k] === "CLASS"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  useEffect(() => {
    // Runs after the click that follows the release, so a drag that ends off its starting cell
    // (no click there) cannot leave "pressed" set and swallow the next keyboard toggle.
    const stop = () => {
      paint.current = null;
      setTimeout(() => (pressed.current = false), 0);
    };
    window.addEventListener("pointerup", stop);
    return () => window.removeEventListener("pointerup", stop);
  }, []);

  async function save(day: string, slot: string, next: SlotStatus, previous: SlotStatus) {
    const key = `${day}_${slot}`;
    setEntries((prev) => ({ ...prev, [key]: next }));
    setPending((p) => new Set(p).add(key));
    try {
      const res = await fetch(`/api/timetable/${memberId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day, slot, status: next }),
      });
      // fetch only throws on a network failure; a refused or failed save comes back as !ok.
      if (!res.ok) throw new Error(res.status === 403 ? "You can't edit this timetable." : "The server did not save it.");
      setFailed(false);
    } catch (error) {
      setEntries((prev) => ({ ...prev, [key]: previous }));
      setFailed(true);
      toast.error(`Could not save ${DAY_LABELS[day]} ${slot}`, error instanceof Error ? error.message : undefined);
    } finally {
      setPending((p) => {
        const n = new Set(p);
        n.delete(key);
        return n;
      });
    }
  }

  function handlePointerDown(e: React.PointerEvent, day: string, slot: string) {
    if (readonly) return;
    const current = getStatus(day, slot);
    // Touch keeps a simple tap (dragging there scrolls the grid sideways).
    if (e.pointerType === "mouse" && e.button === 0) {
      e.preventDefault();
      paint.current = nextStatus(current);
      pressed.current = true;
      save(day, slot, paint.current, current);
    }
  }

  function handleClick(day: string, slot: string) {
    if (readonly) return;
    // Mouse presses were already handled on pointerdown; this covers taps and the keyboard.
    if (pressed.current) {
      pressed.current = false;
      return;
    }
    const current = getStatus(day, slot);
    save(day, slot, nextStatus(current), current);
  }

  function handlePointerEnter(e: React.PointerEvent, day: string, slotInfo: { slot: string; time: string }) {
    const status = getStatus(day, slotInfo.slot);
    if (paint.current && paint.current !== status) save(day, slotInfo.slot, paint.current, status);
    if (e.pointerType === "mouse") setTooltip({ day, slot: slotInfo.slot, time: slotInfo.time, status: paint.current ?? status, x: e.clientX, y: e.clientY });
  }

  return (
    <div className="relative w-full min-w-0">
      {/* Legend + save status */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm border border-green-500/30 bg-green-500/10" />
          <span className="text-xs text-gray-400">Free</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm border border-red-500/40 bg-red-500/20" />
          <span className="text-xs text-gray-400">Class</span>
        </div>
        <span className="text-xs tabular-nums text-gray-500">
          {classCount} class / {CLASS_SLOTS - classCount} free
        </span>
        {!readonly && (
          <span className="ml-auto flex items-center gap-1.5 text-xs" aria-live="polite">
            {pending.size > 0 ? (
              <>
                <Loader2 size={12} className="animate-spin text-gray-400" aria-hidden="true" />
                <span className="text-gray-400">Saving</span>
              </>
            ) : failed ? (
              <>
                <AlertTriangle size={12} className="text-amber-400" aria-hidden="true" />
                <span className="text-amber-300">Last change not saved</span>
              </>
            ) : (
              <span className="hidden text-gray-600 sm:inline">Click a cell to switch it, or drag across cells to fill several</span>
            )}
            {pending.size === 0 && !failed && <Check size={12} className="text-gray-600 sm:hidden" aria-hidden="true" />}
          </span>
        )}
      </div>

      {/* Grid: scroll only happens INSIDE this container */}
      <div className="w-full min-w-0 select-none overflow-x-auto rounded-lg border border-gray-800/50">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-16 bg-surface px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Day
              </th>
              {SLOTS.map((slotInfo) => (
                <th key={slotInfo.slot} className="min-w-[58px] px-1 py-1.5 text-center">
                  <span className={`block text-[11px] font-medium ${slotInfo.slot === "Lunch" ? "text-gray-500" : "text-gray-300"}`}>{slotInfo.slot}</span>
                  <span className="block whitespace-nowrap text-[9px] leading-tight text-gray-600">{slotInfo.time}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => (
              <tr key={day} className="border-t border-gray-800/50">
                <th scope="row" className="sticky left-0 z-10 bg-surface px-2 py-1 text-left">
                  <span className="text-xs font-medium text-gray-200">{DAY_LABELS[day].slice(0, 3)}</span>
                </th>
                {SLOTS.map((slotInfo) => {
                  if (slotInfo.slot === "Lunch") {
                    return (
                      <td key={slotInfo.slot} className="px-0.5 py-0.5">
                        <div className="flex h-7 items-center justify-center rounded border border-gray-800/50 bg-gray-800/30">
                          <span className="text-[9px] text-gray-500">Lunch</span>
                        </div>
                      </td>
                    );
                  }
                  const status = getStatus(day, slotInfo.slot);
                  const isSaving = pending.has(`${day}_${slotInfo.slot}`);
                  return (
                    <td key={slotInfo.slot} className="px-0.5 py-0.5">
                      <button
                        type="button"
                        onPointerDown={(e) => handlePointerDown(e, day, slotInfo.slot)}
                        onClick={() => handleClick(day, slotInfo.slot)}
                        onPointerEnter={(e) => handlePointerEnter(e, day, slotInfo)}
                        onPointerLeave={() => setTooltip(null)}
                        aria-disabled={readonly || undefined}
                        aria-pressed={readonly ? undefined : status === "CLASS"}
                        aria-label={`${DAY_LABELS[day]} ${slotInfo.slot}, ${slotInfo.time}: ${getStatusLabel(status)}`}
                        className={`h-7 w-full rounded border text-[10px] font-medium transition-[opacity,transform,background-color] duration-120 ease-brand ${getStatusStyle(status)} ${
                          readonly ? "cursor-default" : "cursor-pointer hover:opacity-80 active:scale-95"
                        } ${isSaving ? "opacity-60" : ""}`}
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

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-gray-700 bg-surface px-3 py-2 shadow-xl"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="text-xs font-medium text-white">
            {DAY_LABELS[tooltip.day]}, {tooltip.slot}
          </p>
          <p className="text-xs text-gray-400">{tooltip.time}</p>
          <p className={`mt-1 text-xs font-medium ${tooltip.status === "CLASS" ? "text-red-400" : "text-green-400"}`}>{getStatusLabel(tooltip.status)}</p>
        </div>
      )}
    </div>
  );
}
