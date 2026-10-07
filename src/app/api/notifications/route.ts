import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sectionWhere, parseSection } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const member = await db.member.findUnique({ where: { userId } });
    if (!member) {
      return NextResponse.json([], { status: 200 });
    }

    const notifications = await db.notification.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const member = await db.member.findUnique({ where: { userId } });
    if (!member) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Mark notifications as read. Body { id } marks that one (opened from a feed); otherwise
    // optional { section: "COMMITTEE" | "DANCE" } limits it to one feed, and no body marks everything.
    // memberId in every filter: you can only ever mark your own notifications.
    const body = await req.json().catch(() => ({}));
    const one = typeof body?.id === "string" ? { id: body.id } : sectionWhere(parseSection(body?.section));
    await db.notification.updateMany({
      where: { memberId: member.id, read: false, ...one },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}