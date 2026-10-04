import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    // Only CORE and MEMBER can request OD
    if (member.category !== "CORE" && member.category !== "MEMBER") {
      return NextResponse.json([], { status: 200 });
    }

    const reports = await db.report.findMany({
      where: {
        memberId: member.id,
        status: "APPROVED",
      },
      orderBy: { workDate: "desc" },
      include: {
        odRequest: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}