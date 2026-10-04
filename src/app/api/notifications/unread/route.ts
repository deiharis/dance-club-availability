import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// How many unread notifications the logged-in member has (used for the sidebar badge).
export async function GET() {
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

    const count = await db.notification.count({
      where: { memberId: member.id, read: false },
    });
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
