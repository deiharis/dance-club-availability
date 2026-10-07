// Checks for the "Finish setting up" steps and the notification day headings.
// Run: npx tsx src/lib/onboarding.check.ts   (prints "onboarding checks passed")
import assert from "node:assert/strict";
import { onboardingSteps } from "./onboarding";
import { dayGroup } from "./notify";

const base = { phone: "9876543210", department: "B.Tech CSE (Core)", category: "MEMBER", team: null };
const open = (steps: ReturnType<typeof onboardingSteps>) => steps.filter((s) => !s.done).map((s) => s.key);

assert.deepEqual(open(onboardingSteps(base, true)), [], "complete member has nothing left");
assert.deepEqual(open(onboardingSteps(base, false)), ["timetable"]);
assert.deepEqual(open(onboardingSteps({ ...base, phone: "  " }, true)), ["phone"], "blank phone counts as missing");
assert.deepEqual(open(onboardingSteps({ ...base, phone: null, department: "Computer Science" }, true)), ["programme", "phone"]);
assert.equal(onboardingSteps({ ...base, category: "DANCER", team: "Xemius" }, false)[1].href, "/dance/timetable");
assert.equal(onboardingSteps(base, false)[1].href, "/timetable");

// Day headings use the Indian calendar day (UTC+5:30).
const now = new Date("2026-10-08T00:30:00+05:30"); // 12:30 am on 8 Oct in India
assert.equal(dayGroup(new Date("2026-10-08T00:05:00+05:30"), now), "Today");
assert.equal(dayGroup(new Date("2026-10-07T22:47:00+05:30"), now), "Yesterday", "10:47 pm the day before");
assert.equal(dayGroup(new Date("2026-10-03T12:00:00+05:30"), now), "This week");
assert.equal(dayGroup(new Date("2026-09-20T12:00:00+05:30"), now), "Earlier");

console.log("onboarding checks passed");
process.exit(0);
