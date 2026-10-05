import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DANCER_TEAMS } from "@/lib/teams";

// Who is calling? null = not logged in. Reads the member from the DB (not the JWT)
// so team/position changes apply instantly.
//
// Dance teams: `member.team` is the dance team for ANY category (Core, Normal, FFCS-only
// members can dance too). `category = DANCER` means a pure dancer (no committee role).
// Only pure dancers can be Team Leaders; everyone else in a team is a Normal Dancer.
export async function getCaller() {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user) return null;

  const member = await db.member.findUnique({ where: { userId: user.id } });
  const role = user.role as string;
  const isSuper = role === "SUPERADMIN";
  const isLead =
    member?.category === "DANCER" && member.position === "Team Leader";
  // Committee = SuperAdmin or a non-dancer admin (Core). Dance Leads are NOT committee.
  const isCommittee =
    isSuper || (role === "ADMIN" && member?.category !== "DANCER");

  // Advisory (a Core position): may LOOK at every dance team like the SuperAdmin, never edit.
  const isAdvisory =
    role === "ADMIN" && member?.category === "CORE" && member.position === "Advisory";

  return {
    userId: user.id as string,
    role,
    member,
    isSuper,
    isLead,
    isCommittee,
    isAdvisory,
    // READ access to every dance team (team tabs, rosters, insights). Editing is canManage only.
    seesAllTeams: isSuper || isAdvisory,
    inTeam: !!member?.team,
    // Dance teams: ONLY the SuperAdmin manages every team; a Lead only their own. Core/committee
    // rights do NOT extend to dance teams (a Core member in a team is just a Normal Dancer there).
    canManage: (team: string | null) =>
      isSuper || (isLead && !!team && member?.team === team),
  };
}

export type Caller = NonNullable<Awaited<ReturnType<typeof getCaller>>>;

export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });
export const forbidden = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 });

// Call at the top of every /api/dance/* route. Needs a linked member.
export async function getDanceUser() {
  const caller = await getCaller();
  if (!caller?.member) return null;
  return { ...caller, member: caller.member };
}

// Everyone in dance team X: pure dancers AND members who also dance. Use this instead of
// `{ category: "DANCER", team }` so committee members in a team are never left out.
export const inDanceTeam = (team: string): Prisma.MemberWhereInput => ({ team });

// Which team a Dance Floor page shows. SuperAdmin / Advisory: the ?team= tab, else their own team
// if they dance, else the first team. Everyone else (Core included): their own team, never ?team=.
export function pageTeam(
  dance: { seesAllTeams: boolean; member: { team: string | null } },
  requested?: string
): string | null {
  if (!dance.seesAllTeams) return dance.member.team;
  if (requested && DANCER_TEAMS.includes(requested)) return requested;
  return dance.member.team ?? DANCER_TEAMS[0];
}

// ── Report routing ───────────────────────────────────────────────────────────
// A report is reviewed by the submitter's Team Leader when it is about dance (topic DANCE, or
// an older report with no topic from a pure dancer) and the submitter is not a Lead themself.
// Every other report goes to the committee.
export const leadReviewedWhere: Prisma.ReportWhereInput = {
  AND: [
    { OR: [{ area: "DANCE" }, { area: null, member: { category: "DANCER" } }] },
    { NOT: { member: { category: "DANCER", position: "Team Leader" } } },
  ],
};

export function isLeadReviewed(
  report: { area: string | null },
  member: { category: string; position: string | null }
) {
  const dance = report.area === "DANCE" || (report.area === null && member.category === "DANCER");
  const lead = member.category === "DANCER" && member.position === "Team Leader";
  return dance && !lead;
}
