import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";

export const dynamic = "force-dynamic";

// A Dance Lead sets skill level for dancers in their own team. Committee: any team.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const caller = await getCaller();
    if (!caller) return unauthorized();

    const { skillLevel } = await req.json();
    if (skillLevel !== "PROFESSIONAL" && skillLevel !== "AMATEUR") {
      return NextResponse.json({ error: "Invalid skill level" }, { status: 400 });
    }

    const target = await db.member.findUnique({ where: { id: params.id } });
    // Anyone in a dance team has a skill level, including Core members who also dance.
    if (!target || !target.team) {
      return NextResponse.json({ error: "This member is not in a dance team" }, { status: 404 });
    }
    if (!caller.canManage(target.team)) return forbidden();

    const updated = await db.member.update({
      where: { id: params.id },
      data: { skillLevel },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
