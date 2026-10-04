import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { DANCER_TEAMS } from "@/lib/teams";
import { notifyTeam, dateLabel, teamLink } from "@/lib/notify";

export const dynamic = "force-dynamic";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// Create a rehearsal. A Lead can only create for their own team.
export async function POST(req: Request) {
  try {
    const caller = await getCaller();
    if (!caller) return unauthorized();

    const { title, team, date, startTime, endTime, venue } = await req.json();

    if (!title?.trim() || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Title, date, start time and end time are required" },
        { status: 400 }
      );
    }
    if (!DANCER_TEAMS.includes(team)) {
      return NextResponse.json({ error: "Invalid team" }, { status: 400 });
    }
    if (!caller.canManage(team)) return forbidden(); // SuperAdmin, or this team's Lead

    if (!TIME.test(startTime) || !TIME.test(endTime) || endTime <= startTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }
    const when = new Date(date);
    if (isNaN(when.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const rehearsal = await db.rehearsal.create({
      data: {
        title: title.trim(),
        team,
        date: when,
        startTime,
        endTime,
        venue: venue?.trim() || null,
      },
    });
    await notifyTeam({
      team,
      actorMemberId: caller.member?.id,
      type: "REHEARSAL_ADDED",
      message: `New rehearsal for ${team}: ${rehearsal.title}, ${dateLabel(rehearsal.date)}, ${startTime} - ${endTime}${
        rehearsal.venue ? ` at ${rehearsal.venue}` : ""
      }.`,
      link: teamLink("/dance/rehearsals", team),
    });

    return NextResponse.json(rehearsal, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
