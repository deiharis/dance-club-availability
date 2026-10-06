import { NextResponse } from "next/server";
import { DANCER_TEAMS } from "@/lib/teams";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { notifySuperAdmins } from "@/lib/notify";
import { db } from "@/lib/db";
import {
  readRows,
  pick,
  readCommon,
  readDancer,
  alreadyExists,
  findExistingMember,
  createMemberAccount,
} from "@/lib/member-import";

export const dynamic = "force-dynamic";
// Large team sheets: ask Vercel for up to 60 s so an import is never cut off part-way.
export const maxDuration = 60;

// POST /api/dance/roster/import  (form fields: file, team)
// SuperAdmin only, one team at a time: the team picked on the Roster page. Rows the sheet lists
// under ANOTHER team are skipped, so one shared Google Form sheet can be imported tab by tab
// without anyone landing in the wrong team. Rows with no team go into the picked team.
// New people become DANCERs with the register number as a temporary password; existing accounts
// with no team (e.g. Core members) are just added to the team.
export async function POST(req: Request) {
  const caller = await getCaller();
  if (!caller) return unauthorized();
  if (!caller.isSuper) return forbidden();

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const team = String(form.get("team") ?? "");

    if (!DANCER_TEAMS.includes(team)) {
      return NextResponse.json({ error: "Unknown team" }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const rows = await readRows(file);
    let created = 0;
    let attached = 0; // existing accounts (e.g. Core members) added to the team
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
        skipped++;
        errors.push(`Skipped ${c.fullName}: listed under "${sheetTeam}" (import that team from its own tab)`);
        continue;
      }
      // Someone who already has an account (e.g. a Core member who also dances): keep their
      // account and committee role, and just put them in this team as a Normal Dancer.
      const existing = await findExistingMember(c.email, c.registerNumber);
      if (existing) {
        if (existing.team === team) {
          skipped++;
          errors.push(`Skipped ${existing.fullName}: already in ${team}`);
        } else if (existing.team) {
          skipped++;
          errors.push(`Skipped ${existing.fullName}: already in ${existing.team} (a member can be in one team)`);
        } else {
          // Join the team; mark FFCS if the sheet says so (never un-marks an existing enrolment).
          await db.member.update({
            where: { id: existing.id },
            data: { team, ...(c.isFFCS ? { isFFCS: true } : {}) },
          });
          attached++;
          errors.push(`Added existing member ${existing.fullName} to ${team} (account kept)`);
        }
        continue;
      }
      if (await alreadyExists(c.email, c.registerNumber)) {
        // A login exists without a member profile; leave it alone.
        skipped++;
        errors.push(`Skipped ${c.fullName}: an account with this email already exists`);
        continue;
      }

      await createMemberAccount({ ...c, category: "DANCER", team, ...d });
      created++;
    }

    if (created + attached > 0) {
      await notifySuperAdmins({
        actorMemberId: caller.member?.id,
        type: "MEMBERS_ADDED",
        message: `${caller.member?.fullName ?? "The Super Admin"} imported ${created + attached} dancer${created + attached === 1 ? "" : "s"} into ${team}${attached ? ` (${attached} existing member${attached === 1 ? "" : "s"})` : ""}${skipped ? `, ${skipped} skipped` : ""}.`,
        link: "/members",
      });
    }

    return NextResponse.json({ created, attached, skipped, errors });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to read the file. Make sure it is an Excel (.xlsx) file." },
      { status: 500 }
    );
  }
}
