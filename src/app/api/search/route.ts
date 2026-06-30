import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("query") || "";
    const category = searchParams.get("category") || "";
    const department = searchParams.get("department") || "";
    const academicYear = searchParams.get("academicYear") || "";
    const day = searchParams.get("day") || "";
    const slot = searchParams.get("slot") || "";

    // Build the base filter
    const where: any = {};

    if (query) {
      where.OR = [
        { fullName: { contains: query, mode: "insensitive" } },
        { registerNumber: { contains: query, mode: "insensitive" } },
        { position: { contains: query, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (department) {
      where.department = { contains: department, mode: "insensitive" };
    }

    if (academicYear) {
      where.academicYear = parseInt(academicYear);
    }

    // If filtering by availability, only include members who are FREE
    // at that day+slot (or have no entry at all, meaning default FREE)
    if (day && slot) {
      where.NOT = {
        timetableEntries: {
          some: {
            day,
            slot,
            status: "CLASS",
          },
        },
      };
    }

    const members = await db.member.findMany({
      where,
      orderBy: { fullName: "asc" },
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