export const CORE_TEAMS = [
  "Creative Team Head",
  "Finance Team Head",
  "Outreach Team Head",
  "Events Team Head",
  "Management Team Head",
  "Editorial Team Head",
  "Chairperson",
  "Vice Chairperson",
  "Secretary",
  "Co-Secretary",
  "Advisory",
];

export const MEMBER_TEAMS = [
  "Creative Team Member",
  "Finance Team Member",
  "Outreach Team Member",
  "Events Team Member",
  "Management Team Member",
  "Editorial Team Member",
];

export const DANCER_TEAMS = [
  "Laasya",
  "Xemius",
  "Powerhouse",
  "Majestic Swaggers",
  "Contemporary",
  "Taal",
  "Z Crew",
];

export const DANCER_ROLES = [
  "Team Leader",
  "Normal Dancer",
];

export function getTeamsForCategory(category: string): string[] {
  if (category === "CORE") return CORE_TEAMS;
  if (category === "MEMBER") return MEMBER_TEAMS;
  if (category === "DANCER") return DANCER_TEAMS;
  return [];
}

export function requiresTeam(category: string): boolean {
  return ["CORE", "MEMBER", "DANCER"].includes(category);
}