// Runnable self-check for normalizePhone.   Run:  npx tsx src/lib/phone.check.ts
import assert from "node:assert/strict";
import { normalizePhone } from "./phone";

const cases: [string | null | undefined, string | null][] = [
  ["9876543210", "9876543210"],
  ["+91 98765 43210", "9876543210"],
  ["+91-9876543210", "9876543210"],
  ["919876543210", "9876543210"],
  ["09876543210", "9876543210"],
  ["98765-43210", "9876543210"],
  [" 98765 43210 ", "9876543210"],
  ["12345", "12345"], // not a mobile number: kept as typed
  ["", null],
  [null, null],
];
for (const [input, expected] of cases) assert.equal(normalizePhone(input), expected, `"${input}"`);
console.log(`OK: ${cases.length} phone formats normalise as expected`);
