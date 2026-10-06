import { NextResponse } from "next/server";
import { CORE_TEAMS, MEMBER_TEAMS, DANCER_TEAMS, DANCER_ROLES } from "@/lib/teams";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { notifySuperAdmins } from "@/lib/notify";
import { db } from "@/lib/db";
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
    let attached = 0; // existing accounts (e.g. Core members) added to their dance team
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
    // Rows for people who already have an account but are listed with a dance team.
    const toAttach: { name: string; email: string; reg: string; team: string; isFFCS: boolean }[] = [];

    for (const row of rows) {
      const c = readCommon(row);
      // A sheet with a "Dance Team" column but no "Category" column is a dancer sheet. (Before
      // this, those rows silently became Normal Members.)
      const rawCategory = pick(row, "Category");
      const team = pick(row, "Team", "Dance Team") || null;
      const category = rawCategory ? mapCategory(rawCategory) : team ? "DANCER" : "MEMBER";
      // Form columns: Core Position / Member Position / Dancer Role / Dance Team. Dancers get
      // "Team Leader" or "Normal Dancer" (readDancer accepts "Lead", "Team Leader", etc.).
      const position =
        category === "DANCER"
          ? readDancer(row).position
          : pick(row, "Position", "Core Position", "Member Position", "Dancer Role") || null;

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
        // Already has an account (e.g. a Core member who also dances): keep the account and its
        // role exactly as they are; just put them in their dance team (handled after the loop).
        if (team && DANCER_TEAMS.includes(team)) {
          toAttach.push({ name: c.fullName, email: c.email, reg: c.registerNumber, team, isFFCS: c.isFFCS });
        } else {
          skipped++;
          errors.push(`Skipped ${c.fullName}: already exists`);
        }
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

    // Existing accounts listed with a dance team: one lookup, then set the team only if they have
    // none. Category, position and login are never changed (a Core member stays Core).
    if (toAttach.length > 0) {
      const found = await db.member.findMany({
        where: {
          OR: [
            { email: { in: toAttach.map((a) => a.email), mode: "insensitive" } },
            { registerNumber: { in: toAttach.map((a) => a.reg), mode: "insensitive" } },
          ],
        },
        select: { id: true, email: true, registerNumber: true, team: true },
      });
      for (const a of toAttach) {
        const m = found.find((x) => x.email.toLowerCase() === a.email || x.registerNumber.toUpperCase() === a.reg);
        if (!m) {
          skipped++;
          errors.push(`Skipped ${a.name}: already exists`);
        } else if (m.team === a.team) {
          skipped++;
          errors.push(`Skipped ${a.name}: already in ${a.team}`);
        } else if (m.team) {
          skipped++;
          errors.push(`Skipped ${a.name}: already in ${m.team} (a member can be in one team)`);
        } else {
          await db.member.update({
            where: { id: m.id },
            // Mark FFCS if the sheet says so; never un-mark an existing enrolment.
            data: { team: a.team, ...(a.isFFCS ? { isFFCS: true } : {}) },
          });
          attached++;
          errors.push(`Added existing member ${a.name} to ${a.team} (account and role kept)`);
        }
      }
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

    if (created + attached > 0) {
      await notifySuperAdmins({
        actorMemberId: caller.member?.id,
        type: "MEMBERS_ADDED",
        message: `${caller.member?.fullName ?? "A committee member"} imported ${created} member${created === 1 ? "" : "s"}${attached ? `, added ${attached} existing member${attached === 1 ? "" : "s"} to their dance team` : ""}${skipped ? ` (${skipped} skipped)` : ""}.`,
        link: "/members",
      });
    }

    return NextResponse.json({ created, attached, skipped, errors });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process file. Make sure it is a valid Excel file." },
      { status: 500 }
    );
  }
}
