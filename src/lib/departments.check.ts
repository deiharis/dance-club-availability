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
  // Law: must never become plain "BBA" (2026-10 dancer sheet)
  ["BBA LLB", "BBA LLB"],
  ["BBALLB", "BBA LLB"],
  ["BBA.LLB", "BBA LLB"],
  ["Law (BBA.LLB)", "BBA LLB"],
  ["BBA LLB (Hons)", "BBA LLB (Hons)"],
  ["BBA LLB(hons)", "BBA LLB (Hons)"],
  ["BA LLB", "BA LLB"],
  ["BA LLB HONS", "BA LLB (Hons)"],
  ["BA LLB (hons)", "BA LLB (Hons)"],
  ["Law (B.A LLB)", "BA LLB"],
  ["Ba.llb ( law)", "BA LLB"],
  ["Law", "Law"],
  ["VITSOL", "Law"],
  // Commerce
  ["Bcom (Hons)", "B.Com (Hons)"],
  // Specialisations that must not collapse into Core / plain Mechanical
  ["Btech CSE (quantum computing)", "B.Tech CSE (Quantum Computing)"],
  ["B.Tech CSE (Cyber Physical Systems)", "B.Tech CSE (Cyber Physical Systems)"],
  ["M.tech Integrated CSE (Business Analytics)", "M.Tech Integrated CSE (Business Analytics)"],
  ["Mtech integrated CSE (Business Analytics)", "M.Tech Integrated CSE (Business Analytics)"],
  ["B. Tech Mechanical Engineering (Electric Vehicles)", "B.Tech Mechanical (Electric Vehicles)"],
  ["B.Tech Electronics Engineering (VLSI Design and technology)", "B.Tech Electronics (VLSI Design & Technology)"],
  ["B.tech (fashion tech)", "B.Tech Fashion Technology"],
  // ECM spellings
  ["B.Tech ECM", "B.Tech ECM"],
  ["B Tech ECM", "B.Tech ECM"],
  ["B.Tech. ECM", "B.Tech ECM"],
  ["B.tech Electronics and Computer Engineering", "B.Tech ECM"],
  ["Electronics and Computer Engineering", "B.Tech ECM"],
  // Other B.Sc / M.Sc
  ["Bsc.visual communication", "B.Sc Visual Communication"],
  ["B.Sc Animation and Multimedia", "B.Sc Animation & Multimedia"],
  ["M.Sc.data science", "M.Sc Data Science"],
  // Existing labels must stay exactly as they are
  ["B.Tech CSE (Core)", "B.Tech CSE (Core)"],
  ["BBA (Hons)", "BBA (Hons)"],
  ["B.Sc Fashion Design", "B.Sc Fashion Design"],
  ["B.Tech Mechanical", "B.Tech Mechanical"],
  ["B.Tech EEE", "B.Tech EEE"],
];

for (const [input, expected] of cases) {
  assert.equal(normalizeDepartment(input).label, expected, `"${input}"`);
}
assert.equal(normalizeDepartment("BBA Honours").degree, "BBA");
assert.equal(normalizeDepartment("btech cse core").degree, "B.Tech");
console.log(`OK: ${cases.length} department spellings normalise as expected`);
