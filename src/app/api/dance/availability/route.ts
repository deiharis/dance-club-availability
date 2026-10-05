import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DANCER_TEAMS } from "@/lib/teams";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { computeAvailability, cellKey, type AvailabilityDancer, type AvailabilityResponse } from "@/lib/availability";

export const dynamic = "force-dynamic";

// GET /api/dance/availability?team=X  - timetable analytics for ONE dance team.
// Team Leader: always their own team (?team= is ignored). SuperAdmin: any team. Advisory: any
// team, read-only (this route only reads). Everyone else, including Normal Dancers and Core
// members who dance as Normal Dancers: 403.
export async function GET(req: Request) {
  const caller = await getCaller();
  if (!caller) return unauthorized();

  const asked = new URL(req.url).searchParams.get("team");
  const team = caller.seesAllTeams ? asked ?? caller.member?.team ?? DANCER_TEAMS[0] : caller.member?.team ?? "";
  if (!DANCER_TEAMS.includes(team)) {
    return NextResponse.json({ error: "Unknown team" }, { status: 400 });
  }
  // canManage(team) = SuperAdmin, or a Lead of exactly this team.
  if (!caller.seesAllTeams && !(caller.isLead && caller.canManage(team))) return forbidden();

  try {
    const members = await db.member.findMany({
      where: { team },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        skillLevel: true,
        category: true,
        position: true,
        timetableEntries: { select: { day: true, slot: true, status: true } },
      },
    });

    const dancers: AvailabilityDancer[] = members.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      skillLevel: m.skillLevel,
      isLead: m.category === "DANCER" && m.position === "Team Leader",
      hasTimetable: m.timetableEntries.length > 0,
      busy: m.timetableEntries.filter((e) => e.status === "CLASS").map((e) => cellKey(e.day, e.slot)),
    }));

    const body: AvailabilityResponse = { team, dancers, all: computeAvailability(dancers) };
    return NextResponse.json(body);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
