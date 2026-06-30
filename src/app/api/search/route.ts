import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("query") || "";
    const category = searchParams.get("category") || "";
    const department = searchParams.get("department") || "";
    const academicYear = searchParams.get("academicYear") || "";
    const day = searchParams.get("day") || "";

    // Multiple slots come as a comma separated list, e.g. "T1,T3,T8"
    const slotsParam = searchParams.get("slots") || "";
    const slots = slotsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const where: Record<string, unknown> = {};

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

    // Member must be FREE during EVERY selected slot on the selected day.
    // We exclude anyone who has a CLASS entry on ANY of the selected slots.
    if (day && slots.length > 0) {
      where.NOT = {
        timetableEntries: {
          some: {
            day,
            slot: { in: slots },
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