// Department names are typed by hand (forms, Excel, Google Form), so the same programme
// shows up spelled many ways: "BBA Hons", "BBA HONS", "BBA Honours". normalizeDepartment()
// turns any of them into ONE canonical label plus a degree level, so charts, filters and
// searches treat them as the same thing. Used when saving, when searching, and in analytics.

export interface Dept {
  degree: string; // "B.Tech", "BBA", "B.Sc", ... or "Other"
  branch: string; // "CSE (Core)", "Fashion Design", ... or ""
  label: string; // degree + branch, e.g. "B.Tech CSE (Core)"
}

// Suggestions for the Add/Edit form and the Google Form. Free text is still allowed.
export const DEPARTMENT_SUGGESTIONS = [
  "B.Tech CSE (Core)",
  "B.Tech CSE (AI & ML)",
  "B.Tech CSE (AI & Robotics)",
  "B.Tech CSE (Cyber Security)",
  "B.Tech CSE (Data Science)",
  "B.Tech ECSE",
  "B.Tech ECE",
  "B.Tech EEE",
  "B.Tech Mechanical",
  "B.Tech Mechatronics & Automation",
  "B.Tech Civil",
  "B.Tech IT",
  "BBA (Hons)",
  "BBA LLB (Hons)",
  "BA LLB (Hons)",
  "B.Com (Hons)",
  "B.Sc Computer Science",
  "B.Sc Economics",
  "B.Sc Fashion Design",
  "M.Tech Integrated Software Engineering",
  "M.Tech Integrated CSE (Data Science)",
  "Integrated M.Sc Applied Psychology",
];

const ACRONYMS = new Set(["cse", "ece", "eee", "it", "ai", "ml", "bba", "mba", "bca", "mca", "ecse", "ecm", "vlsi", "llb"]);

// lowercase, "&" -> "and", punctuation -> single spaces
const clean = (s: string) =>
  s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");

const titleCase = (s: string) =>
  s
    .split(" ")
    .filter(Boolean)
    .map((w) => (ACRONYMS.has(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");

// Matched in order; the first hit wins. `strip` removes the degree words from what is left.
const DEGREES: { degree: string; test: (c: string) => boolean; strip: RegExp }[] = [
  { degree: "M.Tech Integrated", test: (c) => /\bintegrated\b/.test(c) && /\bm ?tech\b/.test(c), strip: /\bintegrated\b|\bm ?tech\b/g },
  { degree: "Integrated M.Sc", test: (c) => /\bintegrated\b/.test(c) && /\bm ?sc\b/.test(c), strip: /\bintegrated\b|\bm ?sc\b/g },
  { degree: "B.Tech", test: (c) => /\bb ?tech\b/.test(c), strip: /\bb ?tech\b/g },
  { degree: "M.Tech", test: (c) => /\bm ?tech\b/.test(c), strip: /\bm ?tech\b/g },
  { degree: "BBA", test: (c) => /\bbba\b/.test(c), strip: /\bbba\b|\bhons\b|\bhonou?rs\b/g },
  { degree: "B.Sc", test: (c) => /\bb ?sc\b/.test(c), strip: /\bb ?sc\b/g },
  { degree: "M.Sc", test: (c) => /\bm ?sc\b/.test(c), strip: /\bm ?sc\b/g },
  { degree: "BCA", test: (c) => /\bbca\b/.test(c), strip: /\bbca\b/g },
  { degree: "MCA", test: (c) => /\bmca\b/.test(c), strip: /\bmca\b/g },
  { degree: "MBA", test: (c) => /\bmba\b/.test(c), strip: /\bmba\b/g },
];

const ENGINEERING = new Set(["B.Tech", "M.Tech", "M.Tech Integrated"]);

// Branch labels that are only offered as a B.Tech at VIT Chennai.
const BTECH_ONLY = /^(CSE \(|ECM$|ECE$|EEE$|ECSE$|Mechanical|Mechatronics|Civil$|Electronics \(VLSI|Biotechnology$)/;
// Not a programme: committee teams and bare school names.
const NOT_A_PROGRAMME =
  /^(outreach|events?|event management|management|manegement|finance|creative|creative department|design|editorial|marketing|media|mid|vitbs|vit bs|business school|vfit|vsmart|school)$/;

// First matching rule wins, so specialisations come before plain CSE.
function branchOf(rest: string, degree: string): string {
  const eng = ENGINEERING.has(degree);
  if (/cyber ?security|information security/.test(rest)) return "CSE (Cyber Security)";
  if (/quantum/.test(rest)) return "CSE (Quantum Computing)";
  if (/cyber physical/.test(rest)) return "CSE (Cyber Physical Systems)";
  if (/business analytics/.test(rest)) return eng ? "CSE (Business Analytics)" : "Business Analytics";
  if (/\becm\b|electronics and computer/.test(rest)) return "ECM";
  if (/\bvlsi\b/.test(rest)) return "Electronics (VLSI Design & Technology)";
  if (/electric vehicle/.test(rest)) return "Mechanical (Electric Vehicles)";
  if (/fashion tech/.test(rest)) return "Fashion Technology";
  if (/visual communication/.test(rest)) return "Visual Communication";
  if (/animation/.test(rest)) return "Animation & Multimedia";
  if (/data ?science/.test(rest)) return eng ? "CSE (Data Science)" : "Data Science";
  if (/\bai\b.*\brobotics\b/.test(rest)) return "CSE (AI & Robotics)";
  if (/\bai\b.*\bml\b|machine learning/.test(rest)) return "CSE (AI & ML)";
  if (/mechatronics/.test(rest)) return "Mechatronics & Automation";
  if (/software engineering/.test(rest)) return "Software Engineering";
  if (/\becse\b/.test(rest)) return "ECSE";
  if (/\bece\b|electronics and communication/.test(rest)) return "ECE";
  if (/\beee\b|electrical and electronics/.test(rest)) return "EEE";
  if (/mechanical|\bmech\b/.test(rest)) return "Mechanical";
  if (/\bcivil\b/.test(rest)) return "Civil";
  if (/\bit\b|information technology/.test(rest)) return "IT";
  if (/fashion design/.test(rest)) return "Fashion Design";
  if (/economics/.test(rest)) return "Economics";
  if (/applied psychology/.test(rest)) return "Applied Psychology";
  if (/\bcs[ce]\b.*\bcore\b|\bcore\b.*\bcs[ce]\b/.test(rest)) return "CSE (Core)"; // incl. the "csc" typo
  if (/\bcse\b|computer science/.test(rest)) return eng ? "CSE (Core)" : "Computer Science";
  return titleCase(rest); // unknown branch: tidy case and spacing at least
}

// Law (VIT School of Law). "BBA LLB", "BBALLB", "Law (BBA.LLB)", "BA LLB (hons)", "Ba.llb ( law)",
// "VITSOL" ... Hons is kept when written.
function lawDegree(c: string): Dept | null {
  if (!/llb|\blaw\b|\bvitsol\b/.test(c)) return null;
  const hons = /\bhons\b|\bhonou?rs\b/.test(c) ? " (Hons)" : "";
  if (/\bbba ?llb\b|\bbballb\b|\bbba\b/.test(c)) return { degree: "BBA LLB", branch: "", label: `BBA LLB${hons}` };
  if (/\bb ?a ?llb\b|\bballb\b|\bb ?a\b/.test(c)) return { degree: "BA LLB", branch: "", label: `BA LLB${hons}` };
  if (/llb/.test(c)) return { degree: "LLB", branch: "", label: `LLB${hons}` };
  return { degree: "Law", branch: "", label: "Law" }; // just "Law" / "VITSOL": programme not given
}

export function normalizeDepartment(raw: string): Dept {
  const c = clean(raw ?? "");
  if (!c) return { degree: "Other", branch: "", label: "" };

  const law = lawDegree(c);
  if (law) return law;
  if (/\bb ?com\b/.test(c)) {
    const hons = /\bhons\b|\bhonou?rs\b/.test(c);
    return { degree: "B.Com", branch: "", label: hons ? "B.Com (Hons)" : "B.Com" };
  }

  for (const d of DEGREES) {
    if (!d.test(c)) continue;
    const rest = c.replace(d.strip, " ").replace(/\s+/g, " ").trim();
    const branch = d.degree === "BBA" ? "" : branchOf(rest, d.degree);
    const label =
      d.degree === "BBA"
        ? /\bhons\b|\bhonou?rs\b/.test(c) ? "BBA (Hons)" : "BBA"
        : branch ? `${d.degree} ${branch}` : d.degree;
    return { degree: d.degree, branch, label };
  }

  // No degree recognised: still fix case and spacing so "cse" and "CSE " match.
  const branch = branchOf(c, "");
  // Branches that only exist as B.Tech: "Mechanical", "ECE", "CSE (AI & Robotics)" with no degree
  // written still mean B.Tech.
  if (BTECH_ONLY.test(branch)) return { degree: "B.Tech", branch, label: `B.Tech ${branch}` };
  // A committee team or just a school typed instead of a programme ("Outreach", "Events",
  // "VITBS"). No label, so imports and "Tidy data" keep the original text for someone to fix;
  // Analytics shows these as "Department needs fixing".
  if (NOT_A_PROGRAMME.test(c)) return { degree: "Not specified", branch: "", label: "" };
  return { degree: "Other", branch, label: branch };
}
