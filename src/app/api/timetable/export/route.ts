import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { SLOTS, DAYS, DAY_LABELS } from "@/lib/timetable";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";

const ACTIVE_SLOTS = SLOTS.filter((s) => s.slot !== "Lunch");

export async function GET() {
  const caller = await getCaller();
  if (!caller) return unauthorized();
  if (!caller.isCommittee) return forbidden();

  try {
    const members = await db.member.findMany({
      orderBy: { fullName: "asc" },
    });
    const allEntries = await db.timetableEntry.findMany();

    const rows = members.map((member) => {
      const row: Record<string, string> = {
        "Full Name": member.fullName,
        "Register Number": member.registerNumber,
        "Department": member.department,
      };

      for (const day of DAYS) {
        for (const slotInfo of ACTIVE_SLOTS) {
          const entry = allEntries.find(
            (e) =>
              e.memberId === member.id &&
              e.day === day &&
              e.slot === slotInfo.slot
          );
          const status = entry?.status === "CLASS" ? "Class" : "Free";
          row[`${DAY_LABELS[day]} ${slotInfo.slot}`] = status;
        }
      }

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Availability");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="availability-${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}