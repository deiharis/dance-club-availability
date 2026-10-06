// The official list of VIT Chennai programmes (source: chennai.vit.ac.in/admissions/programmes-offered,
// checked 2026-10; plus CSE (Cyber Physical Systems) and Integrated M.Tech CSE (Business Analytics),
// which are still running for current students). The course dropdowns, the import clean-up and
// Analytics all use these exact names, so one programme is never counted as several.
//
// A member whose course is genuinely not listed picks "Other" and types it; that is stored as
// "Other: <what they typed>" so it is clearly a confirmed answer, not an unmatched spelling.

export type ProgrammeGroup = { group: string; programmes: { name: string; full?: string }[] };

export const PROGRAMME_GROUPS: ProgrammeGroup[] = [
  {
    group: "B.Tech",
    programmes: [
      { name: "B.Tech Biotechnology" },
      { name: "B.Tech Civil" },
      { name: "B.Tech Civil (L&T)", full: "in collaboration with L&T" },
      { name: "B.Tech CSE (Core)", full: "Computer Science and Engineering" },
      { name: "B.Tech CSE (AI & ML)" },
      { name: "B.Tech CSE (AI & Robotics)" },
      { name: "B.Tech CSE (Cyber Security)" },
      { name: "B.Tech CSE (Cyber Security, Deakin 2+2)", full: "dual degree with Deakin University" },
      { name: "B.Tech CSE (Cyber Physical Systems)" },
      { name: "B.Tech CSE (Data Science)" },
      { name: "B.Tech CSE (Quantum Computing)" },
      { name: "B.Tech ECSE", full: "Electrical and Computer Science Engineering" },
      { name: "B.Tech EEE", full: "Electrical and Electronics Engineering" },
      { name: "B.Tech ECE", full: "Electronics and Communication Engineering" },
      { name: "B.Tech ECM", full: "Electronics and Computer Engineering" },
      { name: "B.Tech Electronics (VLSI Design & Technology)" },
      { name: "B.Tech Fashion Technology" },
      { name: "B.Tech Mechanical" },
      { name: "B.Tech Mechanical (Electric Vehicles)" },
      { name: "B.Tech Mechatronics & Automation" },
    ],
  },
  {
    group: "Integrated (5-year)",
    programmes: [
      { name: "M.Tech Integrated CSE (Data Science)" },
      { name: "M.Tech Integrated CSE (Business Analytics)" },
      { name: "M.Tech Integrated Software Engineering" },
      { name: "M.Tech Integrated Construction Technology & Management" },
      { name: "Integrated M.Sc Applied Psychology" },
    ],
  },
  {
    group: "Law",
    programmes: [{ name: "BA LLB (Hons)" }, { name: "BBA LLB (Hons)" }],
  },
  {
    group: "Business",
    programmes: [{ name: "BBA (Hons)" }, { name: "B.Com (Hons)" }],
  },
  {
    group: "Science & Design",
    programmes: [
      { name: "B.Sc Computer Science" },
      { name: "B.Sc Economics (Hons)" },
      { name: "B.Sc Fashion Design" },
      { name: "B.Sc Multimedia & Animation" },
      { name: "B.Sc Visual Communication" },
    ],
  },
  {
    group: "Postgraduate",
    programmes: [
      { name: "M.Tech AI & Data Science" },
      { name: "M.Tech AI & ML" },
      { name: "M.Tech CSE" },
      { name: "M.Tech CSE (AI & ML)" },
      { name: "M.Tech CSE (Big Data Analytics)" },
      { name: "M.Tech Electric Mobility" },
      { name: "M.Tech Embedded Systems" },
      { name: "M.Tech Mechatronics" },
      { name: "M.Tech Structural Engineering" },
      { name: "M.Tech VLSI Design" },
      { name: "M.Tech CAD/CAM" },
      { name: "MBA" },
      { name: "MCA" },
      { name: "M.Sc Chemistry" },
      { name: "M.Sc Data Science" },
      { name: "M.Sc Physics" },
      { name: "LL.M Corporate Law" },
      { name: "LL.M Intellectual Property Law" },
      { name: "LL.M International Law & Development" },
    ],
  },
];

export const OFFICIAL_PROGRAMMES = new Set(PROGRAMME_GROUPS.flatMap((g) => g.programmes.map((p) => p.name)));
const GROUP_OF = new Map(PROGRAMME_GROUPS.flatMap((g) => g.programmes.map((p) => [p.name, g.group] as const)));

export const OTHER_GROUP = "Other (not listed)";
export const NEEDS_FIXING = "Needs fixing";
const OTHER_PREFIX = /^\s*other\s*:\s*/i;

export const groupOf = (programme: string) => GROUP_OF.get(programme) ?? OTHER_GROUP;

// "Other: B.Des Interior Design" -> "B.Des Interior Design"; anything else -> null.
export function otherText(value: string): string | null {
  return OTHER_PREFIX.test(value) ? value.replace(OTHER_PREFIX, "").trim() : null;
}
export const asOther = (text: string) => `Other: ${text.trim()}`;
