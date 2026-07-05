import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const member = await db.member.findUnique({
      where: { id: params.id },
    });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    return NextResponse.json(member);
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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
    } = body;

    const validCategories = ["CORE", "MEMBER", "DANCER", "FFCS_ONLY"];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    if ((category === "CORE" || category === "MEMBER") && !position) {
      return NextResponse.json(
        { error: "Please select a position" },
        { status: 400 }
      );
    }

    if (category === "DANCER") {
      if (!team) {
        return NextResponse.json(
          { error: "Please select a dance team" },
          { status: 400 }
        );
      }
      if (!position) {
        return NextResponse.json(
          { error: "Please select a dancer role" },
          { status: 400 }
        );
      }
    }

    const finalIsFFCS = category === "FFCS_ONLY" ? true : Boolean(isFFCS);

    // Role logic same as POST
    let newRole: "ADMIN" | "MEMBER" = "MEMBER";
    if (category === "CORE") newRole = "ADMIN";
    if (category === "DANCER" && position === "Team Leader") newRole = "ADMIN";

    const member = await db.member.findUnique({ where: { id: params.id } });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    await db.user.update({
      where: { id: member.userId },
      data: { role: newRole },
    });

    const updated = await db.member.update({
      where: { id: params.id },
      data: {
        fullName,
        registerNumber,
        email,
        phone: phone || null,
        department,
        academicYear: parseInt(academicYear),
        category,
        isFFCS: finalIsFFCS,
        position: position || null,
        team: category === "DANCER" ? team : null,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const member = await db.member.findUnique({ where: { id: params.id } });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    await db.user.delete({ where: { id: member.userId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}