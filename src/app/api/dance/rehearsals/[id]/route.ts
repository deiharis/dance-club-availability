import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { notifyTeam, dateLabel, teamLink, todayIST, cancelledBy } from "@/lib/notify";

export const dynamic = "force-dynamic";

// Cancel (delete) a rehearsal. SuperAdmin: any team; a Team Leader: only their own team.
// If it had not happened yet, everyone in THAT team (plus SuperAdmins, minus whoever cancelled)
// is notified here on the server, whatever screen triggered it. Deleting a past rehearsal is
// just tidying up, so nobody is notified.
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const caller = await getCaller();
    if (!caller) return unauthorized();

    const rehearsal = await db.rehearsal.findUnique({ where: { id: params.id } });
    if (!rehearsal) {
      return NextResponse.json({ error: "Rehearsal not found" }, { status: 404 });
    }
    if (!caller.canManage(rehearsal.team)) return forbidden();

    await db.rehearsal.delete({ where: { id: params.id } });

    const today = todayIST();
    if (rehearsal.date >= today) {
      const isToday = rehearsal.date.getTime() === today.getTime();
      const when = isToday ? "today" : `on ${dateLabel(rehearsal.date)}`;
      await notifyTeam({
        team: rehearsal.team,
        actorMemberId: caller.member?.id,
        type: "REHEARSAL_CANCELLED",
        message: `Rehearsal cancelled: "${rehearsal.title}" ${when}, ${rehearsal.startTime} - ${rehearsal.endTime}${
          rehearsal.venue ? ` at ${rehearsal.venue}` : ""
        }, has been cancelled by ${cancelledBy(caller)}.`,
        link: teamLink("/dance/rehearsals", rehearsal.team),
      });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
