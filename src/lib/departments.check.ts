// Runnable self-check for normalizeDepartment: real spellings from the database and imports,
// mapped onto the OFFICIAL VIT Chennai programme names (lib/programmes.ts).
// "" means "needs fixing": ambiguous or not a programme, so the member must choose. Never guessed.
// Run:  npx tsx src/lib/departments.check.ts     (prints OK, or throws on the first mismatch)
import assert from "node:assert/strict";
import { normalizeDepartment } from "./departments";
import { OFFICIAL_PROGRAMMES } from "./programmes";

const cases: [string, string][] = [
  // ── Safe: standardised automatically, nobody is bothered ──
  ["B.TECH - CSE CORE", "B.Tech CSE (Core)"],
  ["B TECH : CSE-CORE", "B.Tech CSE (Core)"],
  ["btech cse core", "B.Tech CSE (Core)"],
  ["Btech cse", "B.Tech CSE (Core)"],
  ["B.Tech Computer Science core", "B.Tech CSE (Core)"],
  ["B.Tech Computer Science Engineering", "B.Tech CSE (Core)"],
  ["CSE Core", "B.Tech CSE (Core)"],
  ["Csc Core", "B.Tech CSE (Core)"],
  ["B.TECH CSE (DATA SCIENCE)", "B.Tech CSE (Data Science)"],
  ["B.TECH -CSE CYBER SECURITY", "B.Tech CSE (Cyber Security)"],
  ["CSE (Cyber Security)", "B.Tech CSE (Cyber Security)"],
  ["B.TECH - CSE (AI & Robotics)", "B.Tech CSE (AI & Robotics)"],
  ["CSE (AI & Robotics)", "B.Tech CSE (AI & Robotics)"],
  ["Btech CSE (quantum computing)", "B.Tech CSE (Quantum Computing)"],
  ["B.Tech CSE (Cyber Physical Systems)", "B.Tech CSE (Cyber Physical Systems)"],
  ["B.tech- mechatronics and automation", "B.Tech Mechatronics & Automation"],
  ["Mechatronics & Automation", "B.Tech Mechatronics & Automation"],
  ["Mechanical", "B.Tech Mechanical"],
  ["B. Tech Mechanical Engineering (Electric Vehicles)", "B.Tech Mechanical (Electric Vehicles)"],
  ["ECE", "B.Tech ECE"],
  ["B.TECH - ECSE", "B.Tech ECSE"],
  ["B.Tech ECM", "B.Tech ECM"],
  ["B Tech ECM", "B.Tech ECM"],
  ["B.tech Electronics and Computer Engineering", "B.Tech ECM"],
  ["Electronics and Computer Engineering", "B.Tech ECM"],
  ["B.Tech Electronics Engineering (VLSI Design and technology)", "B.Tech Electronics (VLSI Design & Technology)"],
  ["B.tech (fashion tech)", "B.Tech Fashion Technology"],
  ["B.Tech Ft", "B.Tech Fashion Technology"],
  ["Biotechnology", "B.Tech Biotechnology"],
  ["M. Tech integrated Software Engineering", "M.Tech Integrated Software Engineering"],
  ["mtech integrated cse datascience", "M.Tech Integrated CSE (Data Science)"],
  ["M.tech Integrated CSE (Business Analytics)", "M.Tech Integrated CSE (Business Analytics)"],
  ["Integrated Msc Applied Psychology", "Integrated M.Sc Applied Psychology"],
  ["BBA Hons", "BBA (Hons)"],
  ["BBA HONS", "BBA (Hons)"],
  ["BBA Honours", "BBA (Hons)"],
  ["BBA LLB", "BBA LLB (Hons)"],
  ["BBALLB", "BBA LLB (Hons)"],
  ["Law (BBA.LLB)", "BBA LLB (Hons)"],
  ["BBA LLB(hons)", "BBA LLB (Hons)"],
  ["BA LLB", "BA LLB (Hons)"],
  ["BA LLB HONS", "BA LLB (Hons)"],
  ["Law (B.A LLB)", "BA LLB (Hons)"],
  ["Ba.llb ( law)", "BA LLB (Hons)"],
  ["Bcom (Hons)", "B.Com (Hons)"],
  ["B. Sc fashion design ", "B.Sc Fashion Design"],
  ["Bsc.Economics", "B.Sc Economics (Hons)"],
  ["BSC COMPUTER SCIENCE, SCOPE", "B.Sc Computer Science"],
  ["Bsc.visual communication", "B.Sc Visual Communication"],
  ["B.Sc Animation and Multimedia", "B.Sc Multimedia & Animation"],
  ["M.Sc.data science", "M.Sc Data Science"],
  ["MBA", "MBA"],
  ["LL.M Corporate Law", "LL.M Corporate Law"],
  // Official names stay exactly as they are
  ["B.Tech CSE (Core)", "B.Tech CSE (Core)"],
  ["BBA (Hons)", "BBA (Hons)"],
  ["B.Tech EEE", "B.Tech EEE"],
  // A member's own "Other" answer is kept as written
  ["Other: B.Des Interior Design", "Other: B.Des Interior Design"],
  ["other:  Exchange student", "Other: Exchange student"],

  // ── Ambiguous: the member must choose (never guessed) ──
  ["Computer Science", ""], // B.Tech CSE (Core) or B.Sc Computer Science?
  ["Data Science", ""], // B.Tech CSE (Data Science), M.Sc Data Science, Integrated M.Tech?
  ["Law", ""], // BA LLB or BBA LLB?
  ["VITSOL", ""],
  ["BSC ", ""], // which B.Sc?
  ["M.Tech Integrated CSE", ""], // which specialisation?
  ["LLB", ""],
  ["BBA", ""], // the old rules saved "BBA LLB" as "BBA": could be BBA (Hons) or BBA LLB (Hons)
  ["B.Tech IT", ""], // not offered at VIT Chennai
  ["Other:", ""], // chose Other but typed nothing

  // ── Not a programme (committee team / school typed instead): member must fix ──
  ["Outreach", ""],
  ["Events", ""],
  ["Management", ""],
  ["Manegement", ""],
  ["Finance", ""],
  ["Creative", ""],
  ["Creative Department", ""],
  ["Design", ""],
  ["Vitbs", ""],
  ["Business School", ""],
  ["Vfit", ""],
  ["", ""],
];

for (const [input, expected] of cases) {
  const d = normalizeDepartment(input);
  assert.equal(d.label, expected, `"${input}"`);
  assert.equal(d.ok, expected !== "", `"${input}" ok flag`);
  // Every automatic answer must be an official programme (or the member's own Other answer).
  if (d.ok && !d.label.startsWith("Other: ")) assert.ok(OFFICIAL_PROGRAMMES.has(d.label), `"${d.label}" is not official`);
}
assert.equal(normalizeDepartment("Outreach").issue, "not-a-programme");
assert.equal(normalizeDepartment("Computer Science").issue, "ambiguous");
assert.equal(normalizeDepartment("btech cse core").group, "B.Tech");
assert.equal(normalizeDepartment("BBA LLB").group, "Law");
assert.equal(normalizeDepartment("Other: Something").group, "Other (not listed)");
assert.equal(normalizeDepartment("Outreach").group, "Needs fixing");
console.log(`OK: ${cases.length} department spellings map onto the official programme list as expected`);
