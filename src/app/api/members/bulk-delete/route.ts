import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { notifySuperAdmins } from "@/lib/notify";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/members/bulk-delete  { ids: string[] }  - Members page "Delete selected".
// Committee only (SuperAdmin and Core). Deletes each member's login; the database removes their
// member record, timetable, reports, attendance etc. with it (onDelete: Cascade), exactly like the
// single Delete button. The SuperAdmin's account and your own are never deleted, even if selected.
export async function POST(req: Request) {
  const caller = await getCaller();
  if (!caller) return unauthorized();
  if (!caller.isCommittee) return forbidden();

  let ids: unknown;
  try {
    ({ ids } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 1000 || !ids.every((x) => typeof x === "string")) {
    return NextResponse.json({ error: "Select between 1 and 1000 members" }, { status: 400 });
  }

  try {
    const targets = await db.member.findMany({
      where: { id: { in: ids as string[] } },
      select: { id: true, userId: true, user: { select: { role: true } } },
    });
    const allowed = targets.filter((m) => m.user.role !== "SUPERADMIN" && m.id !== caller.member?.id);
    const protectedCount = targets.length - allowed.length;

    const { count } = await db.user.deleteMany({ where: { id: { in: allowed.map((m) => m.userId) } } });

    if (count > 0) {
      await notifySuperAdmins({
        actorMemberId: caller.member?.id,
        type: "MEMBERS_ADDED", // the committee "members changed" feed
        message: `${caller.member?.fullName ?? "A committee member"} deleted ${count} member${count === 1 ? "" : "s"} at once.`,
        link: "/members",
      }).catch(() => {});
    }

    return NextResponse.json({ deleted: count, protected: protectedCount, notFound: ids.length - targets.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong. Nothing was deleted." }, { status: 500 });
  }
}
