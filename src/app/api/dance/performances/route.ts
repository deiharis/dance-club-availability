import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { DANCER_TEAMS } from "@/lib/teams";

export const dynamic = "force-dynamic";

// Create a performance for a team and pick its dancers.
// A Lead can only create for their own team, and only pick dancers from it.
export async function POST(req: Request) {
  try {
    const caller = await getCaller();
    if (!caller) return unauthorized();

    const { name, team, eventDate, venue, dancerIds } = await req.json();

    if (!name?.trim() || !eventDate) {
      return NextResponse.json(
        { error: "Name and date are required" },
        { status: 400 }
      );
    }
    if (!DANCER_TEAMS.includes(team)) {
      return NextResponse.json({ error: "Invalid team" }, { status: 400 });
    }
    if (!caller.canManage(team)) return forbidden();

    const when = new Date(eventDate);
    if (isNaN(when.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const ids: string[] = Array.isArray(dancerIds) ? dancerIds : [];
    const teamDancers = await db.member.findMany({
      where: { category: "DANCER", team, id: { in: ids } },
      select: { id: true },
    });
    if (teamDancers.length !== new Set(ids).size) {
      return NextResponse.json(
        { error: "Every selected dancer must be in this team" },
        { status: 400 }
      );
    }

    const performance = await db.performance.create({
      data: {
        name: name.trim(),
        team,
        eventDate: when,
        venue: venue?.trim() || null,
        dancers: { connect: teamDancers },
      },
    });
    return NextResponse.json(performance, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
