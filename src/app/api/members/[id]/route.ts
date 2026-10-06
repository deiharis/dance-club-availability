import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { normalizeDepartment } from "@/lib/departments";
import { danceTeamFor } from "@/lib/teams";
import { normalizePhone } from "@/lib/phone";
import { needsProgrammeFix, notifyProgrammeIssues, resolveProgrammeIssue } from "@/lib/programme-issues";

export const dynamic = "force-dynamic";

// Loads the target member and works out what the caller may do with it.
// Committee: anyone. Dance Lead: dancers in their own team. Nobody but the
// SuperAdmin may touch the SuperAdmin account.
async function load(id: string) {
  const caller = await getCaller();
  if (!caller) return { res: unauthorized() };

  const member = await db.member.findUnique({
    where: { id },
    include: { user: { select: { role: true } } },
  });
  if (!member) {
    return {
      res: NextResponse.json({ error: "Member not found" }, { status: 404 }),
    };
  }

  const targetIsSuper = member.user.role === "SUPERADMIN";
  const canManage =
    (caller.isSuper || !targetIsSuper) &&
    (caller.isCommittee ||
      (caller.isLead &&
        member.category === "DANCER" &&
        caller.canManage(member.team)));
  const isSelf = caller.member?.id === member.id;

  return { caller, member, targetIsSuper, canManage, isSelf };
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const r = await load(params.id);
    if ("res" in r) return r.res;
    if (!r.canManage && !r.isSelf) return forbidden();

    const { user, ...member } = r.member;
    // Tells the Edit page whether to show the SuperAdmin's "Reset password" panel.
    return NextResponse.json({ ...member, canResetPassword: r.caller.isSuper && !r.isSelf });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const r = await load(params.id);
    if ("res" in r) return r.res;
    if (!r.canManage) return forbidden();

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

    // A Dance Lead can only keep a dancer inside their own team.
    if (!r.caller.isCommittee && !(category === "DANCER" && r.caller.canManage(team))) {
      return forbidden();
    }

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

    // Role logic same as POST. The SuperAdmin role is never recalculated.
    if (!r.targetIsSuper) {
      let newRole: "ADMIN" | "MEMBER" = "MEMBER";
      if (category === "CORE") newRole = "ADMIN";
      if (category === "DANCER" && position === "Team Leader") newRole = "ADMIN";

      await db.user.update({
        where: { id: r.member.userId },
        data: { role: newRole },
      });
    }

    // Login email and member email change together (before, only the member copy changed, so the
    // person could no longer log in with the new address). Lower-case, like everywhere else.
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    const cleanReg = String(registerNumber ?? "").trim().toUpperCase();
    if (!cleanEmail || !cleanReg || !String(fullName ?? "").trim()) {
      return NextResponse.json({ error: "Name, register number and email are required" }, { status: 400 });
    }
    const [emailTaken, regTaken] = await Promise.all([
      db.user.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" }, id: { not: r.member.userId } },
        select: { id: true },
      }),
      db.member.findFirst({
        where: { registerNumber: { equals: cleanReg, mode: "insensitive" }, id: { not: params.id } },
        select: { id: true },
      }),
    ]);
    if (emailTaken) return NextResponse.json({ error: "Another account already uses that email" }, { status: 409 });
    if (regTaken) return NextResponse.json({ error: "Another member already has that register number" }, { status: 409 });
    if (cleanEmail !== r.member.email.toLowerCase()) {
      await db.user.update({ where: { id: r.member.userId }, data: { email: cleanEmail } });
    }

    const updated = await db.member.update({
      where: { id: params.id },
      data: {
        fullName: String(fullName).trim(),
        registerNumber: cleanReg,
        email: cleanEmail,
        phone: normalizePhone(phone),
        department: normalizeDepartment(department).label || department,
        academicYear: parseInt(academicYear),
        category,
        isFFCS: finalIsFFCS,
        position: position || null,
        team: danceTeamFor(category, team), // any category may also dance in a team
      },
    });

    if (needsProgrammeFix(updated.department)) await notifyProgrammeIssues();
    else await resolveProgrammeIssue(updated.id, updated.department);

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
    const r = await load(params.id);
    if ("res" in r) return r.res;
    if (!r.canManage || r.targetIsSuper || r.isSelf) return forbidden();

    await db.user.delete({ where: { id: r.member.userId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
