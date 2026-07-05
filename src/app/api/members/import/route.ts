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

    for (const row of rows) {
      const fullName = row["Full Name"]?.toString().trim();
      const registerNumber = row["Register Number"]?.toString().trim();
      const email = row["Email"]?.toString().trim();
      const phone = row["Phone"]?.toString().trim() || null;
      const department = row["Department"]?.toString().trim();
      const academicYear = parseInt(row["Academic Year"]) || 1;
      const category = mapCategory(row["Category"]?.toString() || "Normal Members");
      const isFFCS =
        category === "FFCS_ONLY" ||
        row["FFCS Enrolled"]?.toString().trim().toLowerCase() === "yes";
      const position = row["Position"]?.toString().trim() || null;
      const team = row["Team"]?.toString().trim() || null;

      if (!fullName || !registerNumber || !email || !department) {
        skipped++;
        errors.push(`Skipped row — missing required fields (${fullName || "unnamed"})`);
        continue;
      }

      // Validate position for non-FFCS_ONLY members
      if (category !== "FFCS_ONLY" && position && !validatePosition(category, position)) {
        errors.push(`Warning: "${position}" is not a valid position for ${category} — imported anyway`);
      }

      // Validate team for dancers
      if (category === "DANCER" && team && !validateTeam(category, team)) {
        errors.push(`Warning: "${team}" is not a valid dance team — imported anyway`);
      }

      const existingUser = await db.user.findUnique({ where: { email } });
      const existingMember = await db.member.findUnique({ where: { registerNumber } });

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