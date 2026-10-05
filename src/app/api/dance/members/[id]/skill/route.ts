import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";

export const dynamic = "force-dynamic";

// Roster settings for someone in a dance team: skill level and/or FFCS enrolment.
// Body: { skillLevel?: "PROFESSIONAL" | "AMATEUR", isFFCS?: boolean }.
// SuperAdmin: any team. Dance Lead: their own team only.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const caller = await getCaller();
    if (!caller) return unauthorized();

    const { skillLevel, isFFCS } = await req.json();
    if (skillLevel !== undefined && skillLevel !== "PROFESSIONAL" && skillLevel !== "AMATEUR") {
      return NextResponse.json({ error: "Invalid skill level" }, { status: 400 });
    }
    if (isFFCS !== undefined && typeof isFFCS !== "boolean") {
      return NextResponse.json({ error: "Invalid FFCS value" }, { status: 400 });
    }
    if (skillLevel === undefined && isFFCS === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const target = await db.member.findUnique({ where: { id: params.id } });
    // Anyone in a dance team, including Core members who also dance.
    if (!target || !target.team) {
      return NextResponse.json({ error: "This member is not in a dance team" }, { status: 404 });
    }
    if (!caller.canManage(target.team)) return forbidden();
    // "FFCS Only" members are FFCS by definition.
    if (isFFCS === false && target.category === "FFCS_ONLY") {
      return NextResponse.json({ error: "FFCS Only members are always FFCS enrolled" }, { status: 400 });
    }

    const updated = await db.member.update({
      where: { id: params.id },
      data: { skillLevel, isFFCS },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
