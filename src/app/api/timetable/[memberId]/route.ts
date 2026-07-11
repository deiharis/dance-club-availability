import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    const entries = await db.timetableEntry.findMany({
      where: { memberId: params.memberId },
    });
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    // Admins and SuperAdmins can edit anyone's timetable
    // Members can only edit their own
    if (role === "MEMBER") {
      const member = await db.member.findUnique({ where: { userId } });
      if (!member || member.id !== params.memberId) {
        return NextResponse.json(
          { error: "You can only edit your own timetable" },
          { status: 403 }
        );
      }
    }

    const { day, slot, status } = await req.json();

    const entry = await db.timetableEntry.upsert({
      where: {
        memberId_day_slot: {
          memberId: params.memberId,
          day,
          slot,
        },
      },
      update: { status },
      create: {
        memberId: params.memberId,
        day,
        slot,
        status,
      },
    });

    return NextResponse.json(entry);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}