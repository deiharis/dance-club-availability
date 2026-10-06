import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCaller, unauthorized } from "@/lib/dance";
import { normalizeDepartment } from "@/lib/departments";
import { otherText } from "@/lib/programmes";
import { resolveProgrammeIssue } from "@/lib/programme-issues";

export const dynamic = "force-dynamic";

// GET  -> the caller's saved course and whether it needs fixing.
// PATCH { department } -> the caller picks their own programme (only ever their own record).
// Accepts an official VIT Chennai programme, or "Other: <text>" for a course that is not listed.
// Once valid, their "fix your programme" notification is removed.
export async function GET() {
  const caller = await getCaller();
  if (!caller?.member) return unauthorized();
  const d = normalizeDepartment(caller.member.department);
  return NextResponse.json({ department: caller.member.department, ok: d.ok, label: d.label });
}

export async function PATCH(req: Request) {
  const caller = await getCaller();
  if (!caller?.member) return unauthorized();

  let department = "";
  try {
    department = String((await req.json()).department ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const d = normalizeDepartment(department);
  if (!d.ok) {
    return NextResponse.json({ error: "Choose your programme from the list, or pick Other and type it" }, { status: 400 });
  }
  // "Other" must be a real course, not a committee team typed again ("Other: Outreach").
  const typed = otherText(d.label);
  if (typed !== null && normalizeDepartment(typed).issue === "not-a-programme") {
    return NextResponse.json({ error: `"${typed}" is a club team, not an academic programme` }, { status: 400 });
  }

  try {
    await db.member.update({ where: { id: caller.member.id }, data: { department: d.label } });
    await resolveProgrammeIssue(caller.member.id, d.label);
    return NextResponse.json({ department: d.label });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
