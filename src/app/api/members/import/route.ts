import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";

function mapCategory(value: string): "CORE" | "MEMBER" | "DANCER" | "FFCS_ONLY" {
  const v = value.trim().toLowerCase();
  if (v.includes("core")) return "CORE";
  if (v.includes("dancer")) return "DANCER";
  if (v.includes("ffcs only") || v === "ffcs_only") return "FFCS_ONLY";
  if (v.includes("ffcs")) return "FFCS_ONLY";
  return "MEMBER";
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

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
      const position = row["Position"]?.toString().trim() || "Member";

      if (!fullName || !registerNumber || !email || !department) {
        skipped++;
        errors.push(`Skipped row — missing required fields (${fullName || "unnamed"})`);
        continue;
      }

      const existingUser = await db.user.findUnique({ where: { email } });
      const existingMember = await db.member.findUnique({
        where: { registerNumber },
      });

      if (existingUser || existingMember) {
        skipped++;
        errors.push(`Skipped ${fullName} — already exists`);
        continue;
      }

      // Default password = register number (member should change it later)
      const hashedPassword = await bcrypt.hash(registerNumber, 12);

      await db.user.create({
        data: {
          email,
          password: hashedPassword,
          role: category === "CORE" ? "ADMIN" : "MEMBER",
          member: {
            create: {
              fullName,
              registerNumber,
              email,
              phone,
              department,
              academicYear,
              category,
              position,
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
      { error: "Failed to process file. Make sure it's a valid Excel file." },
      { status: 500 }
    );
  }
}