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

    const role = session.user.role;
    if (role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only fetch members who are enrolled in FFCS
    const members = await db.member.findMany({
      where: { isFFCS: true },
      orderBy: { fullName: "asc" },
      include: {
        ffcsGrades: {
          orderBy: { createdAt: "desc" },
          include: {
            gradedBy: {
              select: { email: true },
            },
          },
        },
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const userId = session.user.id;

    if (role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { memberId, subject, grade, remarks } = await req.json();

    if (!memberId || !subject || !grade) {
      return NextResponse.json(
        { error: "Member, subject and grade are required" },
        { status: 400 }
      );
    }

    const validGrades = ["S", "A", "B", "C", "D", "E"];
    if (!validGrades.includes(grade)) {
      return NextResponse.json(
        { error: "Invalid grade value" },
        { status: 400 }
      );
    }

    const newGrade = await db.fFCSGrade.create({
      data: {
        memberId,
        subject,
        grade,
        remarks: remarks || null,
        gradedById: userId,
      },
    });

    return NextResponse.json(newGrade, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}