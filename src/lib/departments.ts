// Department names are typed by hand (forms, Excel, Google Form), so the same programme
// shows up spelled many ways: "BBA Hons", "Btech cse", "CSE Core". normalizeDepartment() maps
// a spelling onto ONE official VIT Chennai programme (lib/programmes.ts) when that is SAFE.
// Anything ambiguous ("Computer Science": B.Tech CSE or B.Sc CS?), incomplete ("Law", "B.Sc"),
// not a programme at all ("Outreach", "VITBS"), or not offered at VIT Chennai comes back with
// ok = false and NO label: it is never guessed. Callers keep the original text, and the member
// is asked to pick their programme (lib/programme-issues.ts).

import { OFFICIAL_PROGRAMMES, NEEDS_FIXING, OTHER_GROUP, groupOf, otherText, asOther } from "@/lib/programmes";

export interface Dept {
  ok: boolean; // false = needs a person to fix it
  label: string; // official programme, "Other: <text>", or "" when not ok
  group: string; // "B.Tech", "Law", ... "Other (not listed)", or "Needs fixing"
  degree: string; // rough degree level, e.g. "B.Tech"
  branch: string; // e.g. "CSE (Core)"
  issue?: "empty" | "not-a-programme" | "ambiguous"; // why it needs fixing
}

// Every official programme name (for datalists, Google Form copy, etc.).
export const DEPARTMENT_SUGGESTIONS = Array.from(OFFICIAL_PROGRAMMES);

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
  if (/deakin/.test(rest)) return "CSE (Cyber Security, Deakin 2+2)";
  if (/cyber ?security|information security/.test(rest)) return "CSE (Cyber Security)";
  if (/quantum/.test(rest)) return "CSE (Quantum Computing)";
  if (/cyber physical/.test(rest)) return "CSE (Cyber Physical Systems)";
  if (/business analytics/.test(rest)) return eng ? "CSE (Business Analytics)" : "Business Analytics";
  if (/\becm\b|electronics and computer/.test(rest)) return "ECM";
  if (/\bvlsi\b/.test(rest)) return "Electronics (VLSI Design & Technology)";
  if (/electric vehicle/.test(rest)) return "Mechanical (Electric Vehicles)";
  if (/fashion tech|\bft\b/.test(rest)) return "Fashion Technology";
  if (/construction/.test(rest)) return "Construction Technology & Management";
  if (/big data/.test(rest)) return "CSE (Big Data Analytics)";
  if (/\bai\b.*data science/.test(rest)) return "AI & Data Science";
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
  if (/\bcivil\b/.test(rest) && /\bl and t\b|\blnt\b/.test(rest)) return "Civil (L&T)";
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
  if (!/llb|\bll ?m\b|\blaw\b|\bvitsol\b/.test(c)) return null;
  if (/\bll ?m\b/.test(c)) {
    const spec = /corporate/.test(c)
      ? "LL.M Corporate Law"
      : /intellectual|\bipr?\b/.test(c)
      ? "LL.M Intellectual Property Law"
      : /international/.test(c)
      ? "LL.M International Law & Development"
      : "LL.M";
    return { ok: true, degree: "LL.M", branch: "", label: spec, group: "" };
  }
  const hons = /\bhons\b|\bhonou?rs\b/.test(c) ? " (Hons)" : "";
  if (/\bbba ?llb\b|\bbballb\b|\bbba\b/.test(c)) return { ok: true, degree: "BBA LLB", branch: "", label: `BBA LLB${hons}`, group: "" };
  if (/\bb ?a ?llb\b|\bballb\b|\bb ?a\b/.test(c)) return { ok: true, degree: "BA LLB", branch: "", label: `BA LLB${hons}`, group: "" };
  if (/llb/.test(c)) return { ok: true, degree: "LLB", branch: "", label: `LLB${hons}`, group: "" };
  return { ok: true, degree: "Law", branch: "", label: "Law", group: "" }; // "Law" / "VITSOL": programme not given
}

// First pass: read degree + branch from free text (may produce names that are not official).
function parseDepartment(raw: string): Dept {
  const c = clean(raw ?? "");
  if (!c) return { ok: false, degree: "Other", branch: "", label: "", group: "", issue: "empty" };

  const law = lawDegree(c);
  if (law) return law;
  if (/\bb ?com\b/.test(c)) {
    const hons = /\bhons\b|\bhonou?rs\b/.test(c);
    return { ok: true, degree: "B.Com", branch: "", label: hons ? "B.Com (Hons)" : "B.Com", group: "" };
  }

  for (const d of DEGREES) {
    if (!d.test(c)) continue;
    const rest = c.replace(d.strip, " ").replace(/\s+/g, " ").trim();
    const branch = d.degree === "BBA" ? "" : branchOf(rest, d.degree);
    const label =
      d.degree === "BBA"
        ? /\bhons\b|\bhonou?rs\b/.test(c) ? "BBA (Hons)" : "BBA"
        : branch ? `${d.degree} ${branch}` : d.degree;
    return { ok: true, degree: d.degree, branch, label, group: "" };
  }

  // No degree recognised: still fix case and spacing so "cse" and "CSE " match.
  const branch = branchOf(c, "");
  // Branches that only exist as B.Tech: "Mechanical", "ECE", "CSE (AI & Robotics)" with no degree
  // written still mean B.Tech.
  if (BTECH_ONLY.test(branch)) return { ok: true, degree: "B.Tech", branch, label: `B.Tech ${branch}`, group: "" };
  // A committee team or just a school typed instead of a programme ("Outreach", "Events",
  // "VITBS"). No label, so imports and "Tidy data" keep the original text for someone to fix;
  // Analytics shows these as "Department needs fixing".
  if (NOT_A_PROGRAMME.test(c))
    return { ok: false, degree: "Not specified", branch: "", label: "", group: "", issue: "not-a-programme" };
  return { ok: true, degree: "Other", branch, label: branch, group: "" };
}

// Safe renames from the first pass onto the official names (VIT Chennai only offers the Hons
// versions of these, so "BBA" really is "BBA (Hons)").
// NOT "BBA": until 2026-10-06 the old rules saved "BBA LLB" as plain "BBA", so a stored "BBA" may be a
// law student. It is ambiguous; the member chooses (BBA (Hons) or BBA LLB (Hons)).
const ALIASES: Record<string, string> = {
  "BBA LLB": "BBA LLB (Hons)",
  "BA LLB": "BA LLB (Hons)",
  "B.Com": "B.Com (Hons)",
  "B.Sc Economics": "B.Sc Economics (Hons)",
  "B.Sc Animation & Multimedia": "B.Sc Multimedia & Animation",
  "M.Tech CSE (Core)": "M.Tech CSE",
  "M.Tech Cad Cam": "M.Tech CAD/CAM",
  "M.Tech Electronics (VLSI Design & Technology)": "M.Tech VLSI Design",
};

const needsFixing = (degree: string, issue: Dept["issue"]): Dept => ({
  ok: false,
  label: "",
  group: NEEDS_FIXING,
  degree,
  branch: "",
  issue,
});

export function normalizeDepartment(raw: string): Dept {
  // A member who chose "Other" and typed their course: a confirmed answer, kept as they wrote it.
  const typed = otherText(raw ?? "");
  if (typed !== null) {
    return typed.length >= 2
      ? { ok: true, label: asOther(typed), group: OTHER_GROUP, degree: "Other", branch: typed }
      : needsFixing("Other", "empty");
  }

  const p = parseDepartment(raw);
  if (!p.ok) return needsFixing(p.degree, p.issue);
  const official = ALIASES[p.label] ?? p.label;
  // Anything that is not exactly an official programme is ambiguous ("Computer Science", "Law",
  // "B.Sc", "M.Tech Integrated CSE") or not offered here, so the member must choose.
  if (!OFFICIAL_PROGRAMMES.has(official)) return needsFixing(p.degree, "ambiguous");
  return { ok: true, label: official, group: groupOf(official), degree: p.degree, branch: p.branch };
}
