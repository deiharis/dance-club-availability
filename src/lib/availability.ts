import { SLOTS, DAYS, DAY_LABELS } from "@/lib/timetable";

// Team availability from timetables. Pure (no database), so the API computes it on the server
// and the Availability page re-runs it in the browser when filtering by skill level.
// Rule from lib/timetable.ts: a missing TimetableEntry means FREE; only CLASS rows make a
// dancer busy. Lunch is not a real slot, so it is left out.

export const ACTIVE_SLOTS = SLOTS.filter((s) => s.slot !== "Lunch");
export const cellKey = (day: string, slot: string) => `${day}|${slot}`;

export type AvailabilityDancer = {
  id: string;
  fullName: string;
  skillLevel: "PROFESSIONAL" | "AMATEUR";
  isLead: boolean;
  hasTimetable: boolean; // false = never filled in, so counted as free everywhere
  busy: string[]; // cellKey(day, slot) for every CLASS slot
};

export type AvailabilityCell = {
  day: string;
  slot: string;
  time: string;
  free: number;
  total: number;
  pct: number; // one decimal, e.g. 78.6
  freeIds: string[];
  busyIds: string[];
};

export type Availability = {
  total: number;
  noTimetable: number;
  overall: number; // % of all dancer-slots that are free
  cells: AvailabilityCell[]; // every day x slot, in timetable order
  byDay: { day: string; label: string; pct: number }[];
  bySlot: { slot: string; time: string; pct: number }[];
  bestDay: { day: string; label: string; pct: number } | null;
  bestCell: AvailabilityCell | null;
  difficult: AvailabilityCell[]; // up to 5 slots with the fewest dancers free (someone has class)
  suggestions: AvailabilityCell[]; // best slot on 3 different days
  ranking: {
    id: string;
    fullName: string;
    skillLevel: "PROFESSIONAL" | "AMATEUR";
    isLead: boolean;
    hasTimetable: boolean;
    freeSlots: number;
    pct: number;
  }[];
};

const round1 = (x: number) => Math.round(x * 10) / 10;
const pctOf = (part: number, whole: number) => (whole === 0 ? 0 : round1((part / whole) * 100));
const avg = (xs: number[]) => (xs.length === 0 ? 0 : round1(xs.reduce((s, x) => s + x, 0) / xs.length));

// Higher free count first; ties go to the earlier day, then the earlier slot.
const order = (c: AvailabilityCell) => DAYS.indexOf(c.day as (typeof DAYS)[number]) * 100 + ACTIVE_SLOTS.findIndex((s) => s.slot === c.slot);
const byMostFree = (a: AvailabilityCell, b: AvailabilityCell) => b.free - a.free || order(a) - order(b);

export function computeAvailability(dancers: AvailabilityDancer[]): Availability {
  const total = dancers.length;
  const busySets = dancers.map((d) => new Set(d.busy));

  const cells: AvailabilityCell[] = [];
  for (const day of DAYS) {
    for (const s of ACTIVE_SLOTS) {
      const key = cellKey(day, s.slot);
      const freeIds: string[] = [];
      const busyIds: string[] = [];
      dancers.forEach((d, i) => (busySets[i].has(key) ? busyIds : freeIds).push(d.id));
      cells.push({ day, slot: s.slot, time: s.time, free: freeIds.length, total, pct: pctOf(freeIds.length, total), freeIds, busyIds });
    }
  }

  const byDay = DAYS.map((day) => ({
    day,
    label: DAY_LABELS[day],
    pct: avg(cells.filter((c) => c.day === day).map((c) => c.pct)),
  }));
  const bySlot = ACTIVE_SLOTS.map((s) => ({
    slot: s.slot,
    time: s.time,
    pct: avg(cells.filter((c) => c.slot === s.slot).map((c) => c.pct)),
  }));

  const sorted = [...cells].sort(byMostFree);
  // Suggestions: the best slot of each day, best days first, so the Lead gets real alternatives.
  const bestPerDay = DAYS.map((day) => sorted.find((c) => c.day === day)!).sort(byMostFree);

  const slotCount = cells.length;
  const ranking = dancers
    .map((d, i) => {
      const freeSlots = slotCount - ACTIVE_SLOTS.reduce(
        (n, s) => n + DAYS.filter((day) => busySets[i].has(cellKey(day, s.slot))).length,
        0
      );
      return {
        id: d.id,
        fullName: d.fullName,
        skillLevel: d.skillLevel,
        isLead: d.isLead,
        hasTimetable: d.hasTimetable,
        freeSlots,
        pct: pctOf(freeSlots, slotCount),
      };
    })
    // People who never set a timetable look 100% free, which says nothing; list them last.
    .sort((a, b) => Number(b.hasTimetable) - Number(a.hasTimetable) || b.pct - a.pct || a.fullName.localeCompare(b.fullName));

  const empty = total === 0;
  return {
    total,
    noTimetable: dancers.filter((d) => !d.hasTimetable).length,
    overall: avg(cells.map((c) => c.pct)),
    cells,
    byDay,
    bySlot,
    bestDay: empty ? null : [...byDay].sort((a, b) => b.pct - a.pct)[0],
    bestCell: empty ? null : sorted[0],
    // Only slots where someone actually has class; a team free all week has no difficult slots.
    difficult: [...cells].filter((c) => c.free < c.total).sort((a, b) => a.free - b.free || order(a) - order(b)).slice(0, 5),
    suggestions: empty ? [] : bestPerDay.slice(0, 3),
    ranking,
  };
}

// GET /api/dance/availability response.
export type AvailabilityResponse = {
  team: string;
  dancers: AvailabilityDancer[]; // so the page can filter by skill and name who is free per slot
  all: Availability; // computed on the server for the whole team
};
