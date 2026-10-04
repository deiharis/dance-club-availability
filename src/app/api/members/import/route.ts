import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import {
  CORE_TEAMS,
  MEMBER_TEAMS,
  DANCER_TEAMS,
  DANCER_ROLES,
} from "@/lib/teams";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { normalizeDepartment } from "@/lib/departments";

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

function validateTeam(category: string, team: string): boolean {
  if (category === "DANCER") return DANCER_TEAMS.includes(team);
  return true;
}

export async function POST(req: Request) {
  const caller = await getCaller();
  if (!caller) return unauthorized();
  if (!caller.isCommittee) return forbidden();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet);

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    // First non-empty value among several possible column names. This lets the same
    // import read both our own Excel template and a Google Form response sheet.
    const pick = (row: Record<string, unknown>, ...keys: string[]) => {
      for (const k of keys) {
        const v = row[k];
        if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
      }
      return "";
    };

    for (const row of rows) {
      const fullName = pick(row, "Full Name");
      // Capitals, so the temporary password (the register number) is always the same case.
      const registerNumber = pick(row, "Register Number").toUpperCase();
      const email = pick(row, "Email", "Email Address").toLowerCase();
      const phone = pick(row, "Phone") || null;
      const rawDepartment = pick(row, "Department");
      const department = normalizeDepartment(rawDepartment).label || rawDepartment;
      const academicYear = parseInt(pick(row, "Academic Year")) || 1;
      const category = mapCategory(pick(row, "Category") || "Normal Members");
      const isFFCS =
        category === "FFCS_ONLY" || pick(row, "FFCS Enrolled").toLowerCase() === "yes";
      // Form columns: Core Position / Member Position / Dancer Role / Dance Team
      const position =
        pick(row, "Position", "Core Position", "Member Position", "Dancer Role") || null;
      const team = pick(row, "Team", "Dance Team") || null;

      if (!fullName || !registerNumber || !email || !department) {
        skipped++;
        errors.push(`Skipped row — missing required fields (${fullName || "unnamed"})`);
        continue;
      }

      if (category !== "FFCS_ONLY" && !position) {
        errors.push(`Warning: ${fullName} has no position/role — imported anyway`);
      }

      // Validate position for non-FFCS_ONLY members
      if (category !== "FFCS_ONLY" && position && !validatePosition(category, position)) {
        errors.push(`Warning: "${position}" is not a valid position for ${category} — imported anyway`);
      }

      // Validate team for dancers
      if (category === "DANCER" && team && !validateTeam(category, team)) {
        errors.push(`Warning: "${team}" is not a valid dance team — imported anyway`);
      }

      // Case-insensitive on both, so "24bce1234" and "24BCE1234" count as the same person.
      const existingUser = await db.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      });
      const existingMember = await db.member.findFirst({
        where: { registerNumber: { equals: registerNumber, mode: "insensitive" } },
      });

      if (existingUser || existingMember) {
        skipped++;
        errors.push(`Skipped ${fullName} — already exists`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(registerNumber, 12);

      // Role logic
      let role: "ADMIN" | "MEMBER" = "MEMBER";
      if (category === "CORE") role = "ADMIN";
      if (category === "DANCER" && position === "Team Leader") role = "ADMIN";

      await db.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          mustChangePassword: true, // temporary password = register number
          member: {
            create: {
              fullName,
              registerNumber,
              email,
              phone,
              department,
              academicYear,
              category,
              isFFCS,
              position: category !== "FFCS_ONLY" ? position : null,
              team: category === "DANCER" ? team : null,
            },
          },
        },
      });

      created++;
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