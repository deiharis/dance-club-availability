// Self-check for lib/availability.ts. Run: npx tsx src/lib/availability.check.ts
import assert from "node:assert/strict";
import { computeAvailability, cellKey, ACTIVE_SLOTS, type AvailabilityDancer } from "./availability";

const d = (id: string, busy: string[], extra: Partial<AvailabilityDancer> = {}): AvailabilityDancer => ({
  id,
  fullName: id,
  skillLevel: "AMATEUR",
  isLead: false,
  hasTimetable: busy.length > 0,
  busy,
  ...extra,
});

// Three dancers: A has class Monday T1 and T2, B has class Monday T1, C never set a timetable.
const a = computeAvailability([
  d("A", [cellKey("MONDAY", "T1"), cellKey("MONDAY", "T2")]),
  d("B", [cellKey("MONDAY", "T1")]),
  d("C", []),
]);

assert.equal(a.total, 3);
assert.equal(a.noTimetable, 1);
assert.equal(a.cells.length, 5 * ACTIVE_SLOTS.length, "Mon-Fri x T1-T12, no Lunch");

const mon1 = a.cells.find((c) => c.day === "MONDAY" && c.slot === "T1")!;
assert.equal(mon1.free, 1);
assert.equal(mon1.pct, 33.3);
assert.deepEqual(mon1.freeIds, ["C"]);
assert.deepEqual(mon1.busyIds.sort(), ["A", "B"]);

// Hardest slot is Monday T1; best day is not Monday.
assert.equal(a.difficult[0].day, "MONDAY");
assert.equal(a.difficult[0].slot, "T1");
assert.notEqual(a.bestDay!.day, "MONDAY");
assert.equal(a.bestCell!.free, 3);

// Suggestions are on 3 different days.
assert.equal(new Set(a.suggestions.map((s) => s.day)).size, 3);

// Ranking: B (1 class) above A (2 classes); C (no timetable) last despite being "100% free".
assert.deepEqual(a.ranking.map((r) => r.id), ["B", "A", "C"]);
assert.equal(a.ranking[2].pct, 100);

// Overall: 3 busy dancer-slots out of 3 x 60.
assert.equal(a.overall, Math.round(((180 - 3) / 180) * 1000) / 10);

// A team that is free all week has no difficult slots.
assert.equal(computeAvailability([d("X", [])]).difficult.length, 0);

// Empty team does not crash.
const e = computeAvailability([]);
assert.equal(e.bestCell, null);
assert.equal(e.suggestions.length, 0);

console.log("OK: availability maths behaves as expected");
