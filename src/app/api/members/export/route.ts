import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";

function getCategoryLabel(category: string) {
  if (category === "CORE") return "Core Members";
  if (category === "DANCER") return "Dancers";
  if (category === "FFCS_ONLY") return "FFCS Only";
  return "Normal Members";
}

export async function GET() {
  const caller = await getCaller();
  if (!caller) return unauthorized();
  if (!caller.isCommittee) return forbidden();

  try {
    const members = await db.member.findMany({
      orderBy: { fullName: "asc" },
    });

    const rows = members.map((m) => ({
      "Full Name": m.fullName,
      "Register Number": m.registerNumber,
      "Email": m.email,
      "Phone": m.phone ?? "",
      "Department": m.department,
      "Academic Year": m.academicYear,
      "Category": getCategoryLabel(m.category),
      "FFCS Enrolled": m.isFFCS ? "Yes" : "No",
      "Position": m.position ?? "",
      "Team": m.team ?? "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");

    worksheet["!cols"] = [
      { wch: 24 },
      { wch: 20 },
      { wch: 30 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 36 },
      { wch: 28 },
    ];

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="members-${new Date()
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