import { NextResponse } from "next/server";
import { DANCER_TEAMS } from "@/lib/teams";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { notifySuperAdmins } from "@/lib/notify";
import { readRows, pick, readCommon, readDancer, alreadyExists, createMemberAccount } from "@/lib/member-import";

export const dynamic = "force-dynamic";

// POST /api/dance/roster/import  (form fields: file, team)
// Adds dancers to ONE team. A Lead's file always goes into their own team, whatever the sheet
// says; the committee chooses the team on the Roster page. Everyone imported is a DANCER with
// the register number as a temporary password (changed at first login).
export async function POST(req: Request) {
  const caller = await getCaller();
  if (!caller) return unauthorized();

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const team = caller.isCommittee ? String(form.get("team") ?? "") : caller.member?.team ?? "";

    if (!DANCER_TEAMS.includes(team)) {
      return NextResponse.json({ error: "Unknown team" }, { status: 400 });
    }
    if (!caller.canManage(team)) return forbidden();
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const rows = await readRows(file);
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const c = readCommon(row);
      const d = readDancer(row);

      if (!c.fullName || !c.registerNumber || !c.email || !c.department) {
        skipped++;
        errors.push(`Skipped row: missing name, register number, email or department (${c.fullName || "unnamed"})`);
        continue;
      }
      if (/example/i.test(c.fullName) && /example@/i.test(c.email)) {
        skipped++;
        errors.push("Skipped the template's example row");
        continue;
      }
      const sheetTeam = pick(row, "Dance Team", "Team");
      if (sheetTeam && sheetTeam.toLowerCase() !== team.toLowerCase()) {
        errors.push(`Note: ${c.fullName} was listed under "${sheetTeam}" but was added to ${team}`);
      }
      if (await alreadyExists(c.email, c.registerNumber)) {
        skipped++;
        errors.push(`Skipped ${c.fullName}: an account with this email or register number already exists`);
        continue;
      }

      await createMemberAccount({ ...c, category: "DANCER", team, ...d });
      created++;
    }

    if (created > 0) {
      await notifySuperAdmins({
        actorMemberId: caller.member?.id,
        type: "MEMBERS_ADDED",
        message: `${caller.member?.fullName ?? "A Dance Lead"} imported ${created} dancer${created === 1 ? "" : "s"} into ${team}${skipped ? ` (${skipped} skipped)` : ""}.`,
        link: "/members",
      });
    }

    return NextResponse.json({ created, skipped, errors });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to read the file. Make sure it is an Excel (.xlsx) file." },
      { status: 500 }
    );
  }
}
