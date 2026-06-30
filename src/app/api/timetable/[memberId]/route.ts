import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    const entries = await db.timetableEntry.findMany({
      where: { memberId: params.memberId },
    });
    return NextResponse.json(entries);
  } catch (error) {
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
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}