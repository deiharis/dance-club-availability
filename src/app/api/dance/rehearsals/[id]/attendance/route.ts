import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { AttendanceStatus } from "@prisma/client";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { notifyTeam, dateLabel, teamLink } from "@/lib/notify";

export const dynamic = "force-dynamic";

const STATUSES = ["PRESENT", "ABSENT", "EXCUSED"];

// Save attendance for one rehearsal. Body: { records: [{ memberId, status }] }.
// Only the team's Lead (or committee) may do this, and only for that team's dancers.
export async function PUT(
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
    if (rehearsal.cancelledAt) {
      return NextResponse.json({ error: "This rehearsal was cancelled, so there is no attendance to mark" }, { status: 400 });
    }

    const { records } = await req.json();
    if (!Array.isArray(records)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const dancers = await db.member.findMany({
      where: { team: rehearsal.team },
      select: { id: true },
    });
    const ids = new Set(dancers.map((d) => d.id));

    const valid = records.filter(
      (r: any) => ids.has(r?.memberId) && STATUSES.includes(r?.status)
    );
    if (valid.length !== records.length) {
      return NextResponse.json(
        { error: "A record has an invalid dancer or status" },
        { status: 400 }
      );
    }

    // Only the first save notifies; later corrections to the same sheet stay quiet.
    const firstSave = (await db.attendance.count({ where: { rehearsalId: params.id } })) === 0;

    await db.$transaction(
      valid.map((r: { memberId: string; status: AttendanceStatus }) =>
        db.attendance.upsert({
          where: {
            rehearsalId_memberId: { rehearsalId: params.id, memberId: r.memberId },
          },
          update: { status: r.status },
          create: {
            rehearsalId: params.id,
            memberId: r.memberId,
            status: r.status,
          },
        })
      )
    );

    if (firstSave && valid.length > 0) {
      await notifyTeam({
        team: rehearsal.team,
        actorMemberId: caller.member?.id,
        type: "ATTENDANCE_MARKED",
        message: `Attendance was marked for ${rehearsal.title} (${dateLabel(rehearsal.date)}).`,
        link: teamLink("/dance/attendance", rehearsal.team),
      });
    }

    return NextResponse.json({ saved: valid.length });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
