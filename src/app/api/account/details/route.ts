import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCaller, unauthorized } from "@/lib/dance";
import { normalizeDepartment } from "@/lib/departments";
import { normalizePhone } from "@/lib/phone";
import { otherText } from "@/lib/programmes";
import { resolveProgrammeIssue } from "@/lib/programme-issues";

export const dynamic = "force-dynamic";

// PATCH { phone, academicYear, department }  - "My details" (app/account).
// Every logged-in member edits ONLY their own record, and only these personal fields. Name,
// register number, email (their login), category, position, team and FFCS are managed by the
// committee or their Team Leader. Choosing a valid programme clears any "fix your programme" notice.
export async function PATCH(req: Request) {
  const caller = await getCaller();
  if (!caller?.member) return unauthorized();

  let body: { phone?: unknown; academicYear?: unknown; department?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const rawPhone = String(body.phone ?? "").trim();
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  if (rawPhone && !/^[6-9]\d{9}$/.test(phone ?? "")) {
    return NextResponse.json({ error: "Enter a 10-digit Indian mobile number" }, { status: 400 });
  }

  const academicYear = parseInt(String(body.academicYear ?? ""));
  if (!(academicYear >= 1 && academicYear <= 5)) {
    return NextResponse.json({ error: "Academic year must be 1 to 5" }, { status: 400 });
  }

  const d = normalizeDepartment(String(body.department ?? ""));
  if (!d.ok) {
    return NextResponse.json({ error: "Choose your programme from the list, or pick Other and type it" }, { status: 400 });
  }
  // "Other" must be a real course, not a club team typed again ("Other: Outreach").
  const typed = otherText(d.label);
  if (typed !== null && normalizeDepartment(typed).issue === "not-a-programme") {
    return NextResponse.json({ error: `"${typed}" is a club team, not an academic programme` }, { status: 400 });
  }

  try {
    const updated = await db.member.update({
      where: { id: caller.member.id },
      data: { phone, academicYear, department: d.label },
      select: { phone: true, academicYear: true, department: true },
    });
    await resolveProgrammeIssue(caller.member.id, updated.department);
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
