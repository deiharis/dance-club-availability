import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";

export const dynamic = "force-dynamic";

// PATCH /api/dance/members/:id/team  -> takes a NON-dancer (Core, Normal, FFCS-only member)
// out of their dance team. Their account and committee role stay exactly as they are.
// Pure dancers always need a team, so they are removed by deleting the dancer instead.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const caller = await getCaller();
    if (!caller) return unauthorized();

    const target = await db.member.findUnique({ where: { id: params.id } });
    if (!target || !target.team) {
      return NextResponse.json({ error: "This member is not in a dance team" }, { status: 404 });
    }
    if (!caller.canManage(target.team)) return forbidden();
    if (target.category === "DANCER") {
      return NextResponse.json(
        { error: "Dancers always belong to a team. Remove the dancer instead." },
        { status: 400 }
      );
    }

    await db.member.update({ where: { id: params.id }, data: { team: null } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
