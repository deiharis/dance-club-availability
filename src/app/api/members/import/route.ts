import { NextResponse } from "next/server";
import { CORE_TEAMS, MEMBER_TEAMS, DANCER_TEAMS, DANCER_ROLES } from "@/lib/teams";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { notifySuperAdmins } from "@/lib/notify";
import { readRows, pick, readCommon, readDancer, alreadyExists, createMemberAccount } from "@/lib/member-import";

function mapCategory(value: string): "CORE" | "MEMBER" | "DANCER" | "FFCS_ONLY" {
  const v = value.trim().toLowerCase();
  if (v.includes("core")) return "CORE";
  if (v.includes("dancer")) return "DANCER";
  if (v === "ffcs only" || v === "ffcs_only") return "FFCS_ONLY";
  if (v.includes("ffcs")) return "FFCS_ONLY";
  return "MEMBER";
}

function validatePosition(category: string, position: string): boolean {
  if (category === "CORE") return CORE_TEAMS.includes(position);
  if (category === "MEMBER") return MEMBER_TEAMS.includes(position);
  if (category === "DANCER") return DANCER_ROLES.includes(position);
  return true; // FFCS_ONLY has no position requirement
}

// Committee import: any category, from our template or a Google Form response sheet.
export async function POST(req: Request) {
  const caller = await getCaller();
  if (!caller) return unauthorized();
  if (!caller.isCommittee) return forbidden();

  try {
    const file = (await req.formData()).get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const rows = await readRows(file);
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const c = readCommon(row);
      const category = mapCategory(pick(row, "Category") || "Normal Members");
      // Form columns: Core Position / Member Position / Dancer Role / Dance Team
      const position = pick(row, "Position", "Core Position", "Member Position", "Dancer Role") || null;
      const team = pick(row, "Team", "Dance Team") || null;

      if (!c.fullName || !c.registerNumber || !c.email || !c.department) {
        skipped++;
        errors.push(`Skipped row: missing required fields (${c.fullName || "unnamed"})`);
        continue;
      }
      if (category !== "FFCS_ONLY" && !position) {
        errors.push(`Warning: ${c.fullName} has no position/role, imported anyway`);
      }
      if (category !== "FFCS_ONLY" && position && !validatePosition(category, position)) {
        errors.push(`Warning: "${position}" is not a valid position for ${category}, imported anyway`);
      }
      if (category === "DANCER" && team && !DANCER_TEAMS.includes(team)) {
        errors.push(`Warning: "${team}" is not a valid dance team, imported anyway`);
      }
      if (await alreadyExists(c.email, c.registerNumber)) {
        skipped++;
        errors.push(`Skipped ${c.fullName}: already exists`);
        continue;
      }

      await createMemberAccount({
        ...c,
        category,
        position,
        team,
        skillLevel: category === "DANCER" ? readDancer(row).skillLevel : undefined,
      });
      created++;
    }

    if (created > 0) {
      await notifySuperAdmins({
        actorMemberId: caller.member?.id,
        type: "MEMBERS_ADDED",
        message: `${caller.member?.fullName ?? "A committee member"} imported ${created} member${created === 1 ? "" : "s"}${skipped ? ` (${skipped} skipped)` : ""}.`,
        link: "/members",
      });
    }

    return NextResponse.json({ created, skipped, errors });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process file. Make sure it is a valid Excel file." },
      { status: 500 }
    );
  }
}
