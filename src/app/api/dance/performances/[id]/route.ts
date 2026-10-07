import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { notifyMembers, notifyTeam, dateLabel, teamLink, todayIST, cancelledBy } from "@/lib/notify";

export const dynamic = "force-dynamic";

async function load(id: string) {
  const caller = await getCaller();
  if (!caller) return { res: unauthorized() };

  const performance = await db.performance.findUnique({ where: { id } });
  if (!performance) {
    return {
      res: NextResponse.json({ error: "Performance not found" }, { status: 404 }),
    };
  }
  if (!caller.canManage(performance.team)) return { res: forbidden() };
  return { performance, caller };
}

// Replace the dancer list. Body: { dancerIds: string[] }
// ponytail: only the dancer list is editable; to change name/date/venue, delete and recreate.
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const r = await load(params.id);
    if ("res" in r) return r.res;

    const { dancerIds } = await req.json();
    const ids: string[] = Array.isArray(dancerIds) ? dancerIds : [];

    const teamDancers = await db.member.findMany({
      where: { team: r.performance.team, id: { in: ids } },
      select: { id: true },
    });
    if (teamDancers.length !== new Set(ids).size) {
      return NextResponse.json(
        { error: "Every selected dancer must be in this team" },
        { status: 400 }
      );
    }

    // Tell only the dancers who were just added (not the ones already in it).
    const before = await db.performance.findUnique({
      where: { id: params.id },
      select: { dancers: { select: { id: true } } },
    });
    const already = new Set((before?.dancers ?? []).map((d) => d.id));
    const added = teamDancers.map((d) => d.id).filter((id) => !already.has(id));

    await db.performance.update({
      where: { id: params.id },
      data: { dancers: { set: teamDancers } },
    });

    if (added.length > 0) {
      const p = r.performance;
      await notifyMembers({
        memberIds: added,
        type: "PERFORMANCE_ADDED",
        message: `You have been added to ${p.name} on ${dateLabel(p.eventDate)}${p.venue ? ` at ${p.venue}` : ""}.`,
        link: teamLink("/dance/performances", p.team),
      });
    }
    return NextResponse.json({ saved: teamDancers.length });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Cancel (delete) a performance. If it had not happened yet, everyone in THAT team (plus SuperAdmins,
// minus whoever cancelled) is notified here on the server. Deleting a past one notifies nobody.
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const r = await load(params.id);
    if ("res" in r) return r.res;

    const p = r.performance;
    await db.performance.delete({ where: { id: params.id } });

    if (p.eventDate >= todayIST()) {
      await notifyTeam({
        team: p.team,
        actorMemberId: r.caller.member?.id,
        type: "PERFORMANCE_CANCELLED",
        message: `Performance cancelled: "${p.name}" scheduled for ${dateLabel(p.eventDate)}${p.venue ? ` at ${p.venue}` : ""} has been cancelled by ${cancelledBy(r.caller)}.`,
        link: teamLink("/dance/performances", p.team),
      });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
