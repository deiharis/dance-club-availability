import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { normalizeDepartment } from "@/lib/departments";

export const dynamic = "force-dynamic";

export async function GET() {
  const caller = await getCaller();
  if (!caller) return unauthorized();
  if (!caller.isCommittee && !caller.isLead) return forbidden();

  try {
    // Committee sees everyone; a Dance Lead only their own team's dancers.
    const members = await db.member.findMany({
      where: caller.isCommittee
        ? undefined
        : { category: "DANCER", team: caller.member?.team ?? "__none__" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(members);
  } catch (error) {
    console.error("GET /api/members error:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const caller = await getCaller();
  if (!caller) return unauthorized();
  if (!caller.isCommittee && !caller.isLead) return forbidden();

  try {
    const body = await req.json();

    const {
      fullName,
      registerNumber,
      email,
      phone,
      department,
      academicYear,
      category,
      isFFCS,
      position,
      team,
      password,
      skillLevel,
    } = body;

    if (!fullName || !registerNumber || !email || !department || !password || !category) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    // A Dance Lead may only create dancers in their own team.
    if (!caller.isCommittee && !(category === "DANCER" && caller.canManage(team))) {
      return forbidden();
    }

    // CORE and MEMBER require a position (from their team list)
    if ((category === "CORE" || category === "MEMBER") && !position) {
      return NextResponse.json(
        { error: "Please select a position" },
        { status: 400 }
      );
    }

    // DANCER requires both a team and a role
    if (category === "DANCER") {
      if (!team) {
        return NextResponse.json(
          { error: "Please select a dance team" },
          { status: 400 }
        );
      }
      if (!position) {
        return NextResponse.json(
          { error: "Please select a dancer role (Team Leader or Normal Dancer)" },
          { status: 400 }
        );
      }
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "A member with this email already exists" },
        { status: 400 }
      );
    }

    const existingMember = await db.member.findUnique({ where: { registerNumber } });
    if (existingMember) {
      return NextResponse.json(
        { error: "A member with this register number already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const finalIsFFCS = category === "FFCS_ONLY" ? true : Boolean(isFFCS);

    // Role logic:
    // CORE → ADMIN
    // DANCER + Team Leader → ADMIN
    // Everything else → MEMBER
    let role: "ADMIN" | "MEMBER" = "MEMBER";
    if (category === "CORE") role = "ADMIN";
    if (category === "DANCER" && position === "Team Leader") role = "ADMIN";

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        mustChangePassword: true, // the admin/Lead typed a temporary password
        member: {
          create: {
            fullName,
            registerNumber,
            email,
            phone: phone || null,
            // One canonical spelling, whatever was typed ("btech cse core" -> "B.Tech CSE (Core)")
            department: normalizeDepartment(department).label || department,
            academicYear: parseInt(academicYear),
            category,
            isFFCS: finalIsFFCS,
            position: position || null,
            team: category === "DANCER" ? team : null,
            skillLevel: skillLevel === "PROFESSIONAL" ? "PROFESSIONAL" : "AMATEUR",
          },
        },
      },
      include: { member: true },
    });

    return NextResponse.json(user.member, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}