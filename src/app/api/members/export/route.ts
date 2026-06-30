import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

function getCategoryLabel(category: string) {
  if (category === "CORE") return "Core Members";
  if (category === "FFCS") return "FFCS";
  return "Normal Members";
}

export async function GET() {
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
      "Position": m.position,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");

    // Auto-width columns
    worksheet["!cols"] = [
      { wch: 22 }, // Full Name
      { wch: 18 }, // Register Number
      { wch: 28 }, // Email
      { wch: 14 }, // Phone
      { wch: 14 }, // Department
      { wch: 14 }, // Academic Year
      { wch: 16 }, // Category
      { wch: 20 }, // Position
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