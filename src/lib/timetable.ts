export const SLOTS = [
  { slot: "T1",    time: "08:00 AM – 08:50 AM" },
  { slot: "T2",    time: "08:55 AM – 09:45 AM" },
  { slot: "T3",    time: "09:50 AM – 10:40 AM" },
  { slot: "T4",    time: "10:45 AM – 11:35 AM" },
  { slot: "T5",    time: "11:40 AM – 12:30 PM" },
  { slot: "T6",    time: "12:35 PM – 01:25 PM" },
  { slot: "Lunch", time: "01:25 PM – 02:00 PM" },
  { slot: "T7",    time: "02:00 PM – 02:50 PM" },
  { slot: "T8",    time: "02:55 PM – 03:45 PM" },
  { slot: "T9",    time: "03:50 PM – 04:40 PM" },
  { slot: "T10",   time: "04:45 PM – 05:35 PM" },
  { slot: "T11",   time: "05:40 PM – 06:30 PM" },
  { slot: "T12",   time: "06:35 PM – 07:25 PM" },
];

export const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
] as const;

export const DAY_LABELS: Record<string, string> = {
  MONDAY:    "Monday",
  TUESDAY:   "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY:  "Thursday",
  FRIDAY:    "Friday",
};

export type SlotStatus = "FREE" | "CLASS";

export function nextStatus(current: SlotStatus): SlotStatus {
  return current === "FREE" ? "CLASS" : "FREE";
}

export function getStatusStyle(status: SlotStatus): string {
  if (status === "CLASS") return "bg-red-500/20 border-red-500/40 text-red-400";
  return "bg-green-500/10 border-green-500/30 text-green-400";
}

export function getStatusLabel(status: SlotStatus): string {
  return status === "CLASS" ? "Class" : "Free";
}
// "Has this member filled in their timetable?" One rule, used everywhere (dashboard tile, the
// Timetable "No timetable" tab, committee Analytics, Dance Floor Availability).
// A missing row already means FREE, so only a CLASS row proves the timetable was filled in.
// Members with no rows, or with only FREE rows (e.g. a cell clicked to Class and back, or rows
// saved by an older version), have NOT filled it in. Reads only; never changes saved rows.
export const HAS_TIMETABLE = { timetableEntries: { some: { status: "CLASS" as const } } };
export const NO_TIMETABLE = { timetableEntries: { none: { status: "CLASS" as const } } };
export const hasFilledTimetable = (entries: { status: string }[]) => entries.some((e) => e.status === "CLASS");
