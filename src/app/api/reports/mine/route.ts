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

    const userId = (session.user as any).id;

    const member = await db.member.findUnique({
      where: { userId },
    });

    if (!member) {
      return NextResponse.json([], { status: 200 });
    }

    const reports = await db.report.findMany({
      where: { memberId: member.id },
      orderBy: { submittedAt: "desc" },
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