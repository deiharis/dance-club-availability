// Runnable self-check for normalizeDepartment, using the real values that were in the database.
// Run:  npx tsx src/lib/departments.check.ts     (prints OK, or throws on the first mismatch)
import assert from "node:assert/strict";
import { normalizeDepartment } from "./departments";

const cases: [string, string][] = [
  ["B.TECH - CSE CORE", "B.Tech CSE (Core)"],
  ["B TECH : CSE-CORE", "B.Tech CSE (Core)"],
  ["btech cse core", "B.Tech CSE (Core)"],
  ["B.Tech Computer Science core", "B.Tech CSE (Core)"],
  ["M. Tech integrated Software Engineering", "M.Tech Integrated Software Engineering"],
  ["mtech integrated cse datascience", "M.Tech Integrated CSE (Data Science)"],
  ["BSC ", "B.Sc"],
  ["B. Sc fashion design ", "B.Sc Fashion Design"],
  ["Bsc.Economics", "B.Sc Economics"],
  ["BSC COMPUTER SCIENCE, SCOPE", "B.Sc Computer Science"],
  ["BBA Hons", "BBA (Hons)"],
  ["BBA HONS", "BBA (Hons)"],
  ["BBA Honours", "BBA (Hons)"],
  ["B.TECH CSE (DATA SCIENCE)", "B.Tech CSE (Data Science)"],
  ["B.TECH -CSE CYBER SECURITY", "B.Tech CSE (Cyber Security)"],
  ["B.TECH - CSE (AI & Robotics)", "B.Tech CSE (AI & Robotics)"],
  ["B.tech- mechatronics and automation", "B.Tech Mechatronics & Automation"],
  ["Btech Mechatronics and Automation", "B.Tech Mechatronics & Automation"],
  ["Integrated Msc Applied Psychology", "Integrated M.Sc Applied Psychology"],
  ["B.TECH - ECSE", "B.Tech ECSE"],
  ["", ""],
];

for (const [input, expected] of cases) {
  assert.equal(normalizeDepartment(input).label, expected, `"${input}"`);
}
assert.equal(normalizeDepartment("BBA Honours").degree, "BBA");
assert.equal(normalizeDepartment("btech cse core").degree, "B.Tech");
console.log(`OK: ${cases.length} department spellings normalise as expected`);
