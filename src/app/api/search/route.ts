import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { normalizeDepartment } from "@/lib/departments";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const caller = await getCaller();
  if (!caller) return unauthorized();
  if (!caller.isCommittee) return forbidden();

  try {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("query") || "";
    const category = searchParams.get("category") || "";
    const isFFCS = searchParams.get("isFFCS") || "";
    const department = searchParams.get("department") || "";
    const academicYear = searchParams.get("academicYear") || "";
    const position = searchParams.get("position") || "";
    const team = searchParams.get("team") || "";
    const day = searchParams.get("day") || "";
    const slotsParam = searchParams.get("slots") || "";
    const slots = slotsParam.split(",").map((s) => s.trim()).filter(Boolean);

    const where: Record<string, unknown> = {};

    if (query) {
      where.OR = [
        { fullName: { contains: query, mode: "insensitive" } },
        { registerNumber: { contains: query, mode: "insensitive" } },
        { position: { contains: query, mode: "insensitive" } },
      ];
    }

    if (category) {
      const validCategories = ["CORE", "MEMBER", "DANCER", "FFCS_ONLY"];
      if (validCategories.includes(category)) {
        where.category = category;
      }
    }

    if (isFFCS === "true") {
      where.isFFCS = true;
    }

    if (department) {
      // Match ignoring case, dots, dashes and spaces, against both the stored text and its
      // canonical form, so "btech", "B.Tech" and "cse core" all find "B.Tech CSE (Core)".
      const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const q = key(department);
      const stored = await db.member.findMany({ distinct: ["department"], select: { department: true } });
      const matches = stored
        .map((s) => s.department)
        .filter((d) => key(d).includes(q) || key(normalizeDepartment(d).label).includes(q));
      where.department = { in: matches.length ? matches : ["__no_match__"] };
    }

    if (academicYear) {
      where.academicYear = parseInt(academicYear);
    }

    // Position filter — applies to CORE and MEMBER categories
    if (position) {
      where.position = position;
    }

    // Team filter — applies to DANCER category
    if (team) {
      where.team = team;
    }

    // Skill level — meaningful for dancers (the page only offers it for the Dancer category)
    const skillLevel = searchParams.get("skillLevel") || "";
    if (skillLevel === "PROFESSIONAL" || skillLevel === "AMATEUR") {
      where.skillLevel = skillLevel;
    }

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