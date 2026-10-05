import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { DANCER_TEAMS } from "@/lib/teams";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { xlsxResponse } from "@/lib/member-import";

export const dynamic = "force-dynamic";

// The column headings the roster import reads back, so an export can be edited and re-imported.
const COLUMNS = [
  "Full Name",
  "Register Number",
  "Email",
  "Phone",
  "Department",
  "Academic Year",
  "Dance Team",
  "Dancer Role",
  "Skill Level",
  "FFCS Enrolled", // Yes / No (same column as the Google Form)
];

// GET /api/dance/roster/export?team=Laasya            -> the team's dancers with attendance
// GET /api/dance/roster/export?team=Laasya&template=1 -> empty template with one example row
// SuperAdmin only, one team at a time (the team picked on the Roster page).
export async function GET(req: Request) {
  const caller = await getCaller();
  if (!caller) return unauthorized();
  if (!caller.isSuper) return forbidden();

  const params = new URL(req.url).searchParams;
  const team = params.get("team") ?? "";
  if (!DANCER_TEAMS.includes(team)) {
    return NextResponse.json({ error: "Unknown team" }, { status: 400 });
  }

  try {
    if (params.get("template") === "1") {
      const sheet = XLSX.utils.json_to_sheet([
        {
          "Full Name": "Example Dancer (delete this row)",
          "Register Number": "24BCE1234",
          Email: "example@vitstudent.ac.in",
          Phone: "9876543210",
          Department: "B.Tech CSE (Core)",
          "Academic Year": 2,
          "Dance Team": team,
          "Dancer Role": "Normal Dancer",
          "Skill Level": "Amateur",
          "FFCS Enrolled": "No",
        },
      ], { header: COLUMNS });
      sheet["!cols"] = COLUMNS.map((c) => ({ wch: Math.max(14, c.length + 4) }));
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, "Dancers");
      return xlsxResponse(
        XLSX.write(book, { type: "buffer", bookType: "xlsx" }),
        `${team.replace(/\s+/g, "-").toLowerCase()}-import-template.xlsx`
      );
    }

    const dancers = await db.member.findMany({
      where: { team },
      orderBy: { fullName: "asc" },
      include: { attendance: { select: { status: true, rehearsal: { select: { team: true } } } } },
    });

    const rows = dancers.map((d) => {
      // Only this team's rehearsals count (a dancer may have moved teams).
      const marks = d.attendance.filter((a) => a.rehearsal.team === team);
      const present = marks.filter((a) => a.status === "PRESENT").length;
      const absent = marks.filter((a) => a.status === "ABSENT").length;
      const excused = marks.filter((a) => a.status === "EXCUSED").length;
      return {
        "Full Name": d.fullName,
        "Register Number": d.registerNumber,
        Email: d.email,
        Phone: d.phone ?? "",
        Department: d.department,
        "Academic Year": d.academicYear,
        "Dance Team": d.team ?? "",
        // Members who also dance are always Normal Dancers; their position is a committee role.
        "Dancer Role": d.category === "DANCER" ? d.position ?? "Normal Dancer" : "Normal Dancer",
        "Club Role": d.category === "DANCER" ? "Dancer" : `${d.category === "CORE" ? "Core" : d.category === "FFCS_ONLY" ? "FFCS only" : "Normal member"}${d.position ? ` (${d.position})` : ""}`,
        "Skill Level": d.skillLevel === "PROFESSIONAL" ? "Professional" : "Amateur",
        "FFCS Enrolled": d.isFFCS || d.category === "FFCS_ONLY" ? "Yes" : "No",
        "Attendance %": present + absent === 0 ? "" : Math.round((present / (present + absent)) * 100),
        Present: present,
        Absent: absent,
        Excused: excused,
      };
    });

    const sheet = XLSX.utils.json_to_sheet(rows, {
      header: [...COLUMNS, "Club Role", "Attendance %", "Present", "Absent", "Excused"],
    });
    sheet["!cols"] = [24, 18, 30, 14, 28, 13, 18, 16, 14, 14, 30, 13, 9, 9, 9].map((wch) => ({ wch }));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, team.slice(0, 31));

    return xlsxResponse(
      XLSX.write(book, { type: "buffer", bookType: "xlsx" }),
      `${team.replace(/\s+/g, "-").toLowerCase()}-dancers-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
