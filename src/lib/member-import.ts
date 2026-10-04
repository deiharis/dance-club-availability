import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { normalizeDepartment } from "@/lib/departments";
import { normalizePhone } from "@/lib/phone";

// Shared by the committee import (api/members/import) and the Dance Floor roster import
// (api/dance/roster/import), so both read sheets, clean data and create accounts the same way.

export type Row = Record<string, unknown>;

// Rows of the first sheet, keyed by the header row.
export async function readRows(file: File): Promise<Row[]> {
  const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer" });
  return XLSX.utils.sheet_to_json<Row>(workbook.Sheets[workbook.SheetNames[0]]);
}

// First non-empty value among several possible column names. This lets one import read
// our own Excel template and a Google Form response sheet alike.
export function pick(row: Row, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

// The columns every import reads identically, already cleaned up.
export function readCommon(row: Row) {
  const rawDepartment = pick(row, "Department");
  return {
    fullName: pick(row, "Full Name", "Name"),
    // Capitals, so the temporary password (the register number) is always the same case.
    registerNumber: pick(row, "Register Number").toUpperCase(),
    email: pick(row, "Email", "Email Address").toLowerCase(),
    phone: normalizePhone(pick(row, "Phone")),
    department: normalizeDepartment(rawDepartment).label || rawDepartment,
    academicYear: parseInt(pick(row, "Academic Year")) || 1,
    isFFCS: pick(row, "FFCS Enrolled").toLowerCase() === "yes",
  };
}

// Dancer columns. Role: anything mentioning "lead" is a Team Leader, otherwise Normal Dancer.
// Skill: anything mentioning "pro" is Professional, otherwise Amateur.
export function readDancer(row: Row) {
  const role = pick(row, "Dancer Role", "Role", "Position");
  const skill = pick(row, "Skill Level", "Skill");
  return {
    position: /lead/i.test(role) ? "Team Leader" : "Normal Dancer",
    skillLevel: (/pro/i.test(skill) ? "PROFESSIONAL" : "AMATEUR") as "PROFESSIONAL" | "AMATEUR",
  };
}

// Case-insensitive on both, so "24bce1234" and "24BCE1234" count as the same person.
export async function alreadyExists(email: string, registerNumber: string) {
  const [user, member] = await Promise.all([
    db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } }),
    db.member.findFirst({ where: { registerNumber: { equals: registerNumber, mode: "insensitive" } } }),
  ]);
  return !!(user || member);
}

// Creates the login and member. The temporary password is the register number, and the
// member must choose their own at first login.
export async function createMemberAccount(m: {
  fullName: string;
  registerNumber: string;
  email: string;
  phone: string | null;
  department: string;
  academicYear: number;
  category: "CORE" | "MEMBER" | "DANCER" | "FFCS_ONLY";
  isFFCS: boolean;
  position: string | null;
  team: string | null;
  skillLevel?: "PROFESSIONAL" | "AMATEUR";
}) {
  // Same rule as api/members: Core and Dance Team Leaders are admins.
  const role =
    m.category === "CORE" || (m.category === "DANCER" && m.position === "Team Leader") ? "ADMIN" : "MEMBER";

  await db.user.create({
    data: {
      email: m.email,
      password: await bcrypt.hash(m.registerNumber, 12),
      role,
      mustChangePassword: true,
      member: {
        create: {
          fullName: m.fullName,
          registerNumber: m.registerNumber,
          email: m.email,
          phone: m.phone,
          department: m.department,
          academicYear: m.academicYear,
          category: m.category,
          isFFCS: m.category === "FFCS_ONLY" ? true : m.isFFCS,
          position: m.category !== "FFCS_ONLY" ? m.position : null,
          team: m.category === "DANCER" ? m.team : null,
          skillLevel: m.skillLevel ?? "AMATEUR",
        },
      },
    },
  });
}

// Excel download response.
export function xlsxResponse(buffer: Buffer, filename: string) {
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
