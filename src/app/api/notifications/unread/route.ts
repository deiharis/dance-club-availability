import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sectionWhere, parseSection } from "@/lib/notify";

export const dynamic = "force-dynamic";

// Unread count for the logged-in member, used for sidebar badges.
// Optional ?section=COMMITTEE or ?section=DANCE counts just that feed.
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await db.member.findUnique({
      where: { userId: (session.user as any).id },
      select: { id: true },
    });
    if (!member) return NextResponse.json({ count: 0 });

    const section = parseSection(new URL(req.url).searchParams.get("section"));
    const count = await db.notification.count({
      where: { memberId: member.id, read: false, ...sectionWhere(section) },
    });
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
