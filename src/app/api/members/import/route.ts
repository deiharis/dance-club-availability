import { NextResponse } from "next/server";
import { CORE_TEAMS, MEMBER_TEAMS, DANCER_TEAMS, DANCER_ROLES } from "@/lib/teams";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { notifySuperAdmins } from "@/lib/notify";
import {
  readRows,
  pick,
  readCommon,
  readDancer,
  existingAccounts,
  inBatches,
  createMemberAccount,
} from "@/lib/member-import";

// A big sheet takes a while; ask Vercel for up to 60 s so it is never cut off part-way.
export const maxDuration = 60;

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

    // Who already has an account: one lookup for the whole file instead of two per row.
    const all = rows.map((r) => readCommon(r));
    const existing = await existingAccounts(
      all.map((c) => c.email).filter(Boolean),
      all.map((c) => c.registerNumber).filter(Boolean)
    );
    // Someone listed twice in the same sheet is only added once.
    const seenEmails = new Set<string>();
    const seenRegs = new Set<string>();
    const toCreate: Parameters<typeof createMemberAccount>[0][] = [];

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
      if (existing.emails.has(c.email) || existing.registerNumbers.has(c.registerNumber)) {
        skipped++;
        errors.push(`Skipped ${c.fullName}: already exists`);
        continue;
      }
      if (seenEmails.has(c.email) || seenRegs.has(c.registerNumber)) {
        skipped++;
        errors.push(`Skipped ${c.fullName}: listed twice in this file`);
        continue;
      }
      seenEmails.add(c.email);
      seenRegs.add(c.registerNumber);

      toCreate.push({
        ...c,
        category,
        position,
        team,
        skillLevel: category === "DANCER" ? readDancer(row).skillLevel : undefined,
      });
    }

    // Create the accounts 4 at a time. One bad row is reported and does not stop the rest.
    await inBatches(toCreate, 4, async (m) => {
      try {
        await createMemberAccount(m);
        created++;
      } catch (error) {
        console.error(error);
        skipped++;
        errors.push(`Could not add ${m.fullName} (${m.email}): check this row and import it again`);
      }
    });

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
