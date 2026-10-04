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
];

// GET /api/dance/roster/export?team=Laasya            -> the team's dancers with attendance
// GET /api/dance/roster/export?team=Laasya&template=1 -> empty template with one example row
// A Lead always gets their own team; the committee picks with ?team=.
export async function GET(req: Request) {
  const caller = await getCaller();
  if (!caller) return unauthorized();

  const params = new URL(req.url).searchParams;
  const team = caller.isCommittee ? params.get("team") ?? "" : caller.member?.team ?? "";
  if (!DANCER_TEAMS.includes(team)) {
    return NextResponse.json({ error: "Unknown team" }, { status: 400 });
  }
  if (!caller.canManage(team)) return forbidden();

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
      where: { category: "DANCER", team },
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
        "Dancer Role": d.position ?? "Normal Dancer",
        "Skill Level": d.skillLevel === "PROFESSIONAL" ? "Professional" : "Amateur",
        "Attendance %": present + absent === 0 ? "" : Math.round((present / (present + absent)) * 100),
        Present: present,
        Absent: absent,
        Excused: excused,
      };
    });

    const sheet = XLSX.utils.json_to_sheet(rows, {
      header: [...COLUMNS, "Attendance %", "Present", "Absent", "Excused"],
    });
    sheet["!cols"] = [24, 18, 30, 14, 28, 13, 18, 16, 14, 13, 9, 9, 9].map((wch) => ({ wch }));
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
