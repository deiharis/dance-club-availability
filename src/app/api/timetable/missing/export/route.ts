import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { NO_TIMETABLE } from "@/lib/timetable";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { xlsxResponse } from "@/lib/member-import";

export const dynamic = "force-dynamic";

// GET /api/timetable/missing/export  - Excel list (Full Name, Register Number) of everyone who
// has NOT filled in their timetable. Uses NO_TIMETABLE, the exact rule behind the Timetable page's
// "No timetable" tab and the dashboard tile, so the file always matches that list.
// Read-only: nothing is changed. Committee only, like the Timetable page.
export async function GET() {
  const caller = await getCaller();
  if (!caller) return unauthorized();
  if (!caller.isCommittee) return forbidden();

  try {
    const members = await db.member.findMany({
      where: NO_TIMETABLE,
      orderBy: { fullName: "asc" },
      select: { fullName: true, registerNumber: true },
    });

    const sheet = XLSX.utils.json_to_sheet(
      members.map((m) => ({ "Full Name": m.fullName, "Register Number": m.registerNumber })),
      { header: ["Full Name", "Register Number"] }
    );
    sheet["!cols"] = [{ wch: 32 }, { wch: 18 }];
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "No timetable");

    return xlsxResponse(
      XLSX.write(book, { type: "buffer", bookType: "xlsx" }),
      `no-timetable-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
